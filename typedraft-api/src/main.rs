//! TypeDraft API Server
//!
//! A simple HTTP API for compiling Typst code to PDF.
//!
//! Endpoints:
//! - POST /api/compile - Compile Typst code to PDF
//! - GET /health - Health check

use std::io::{Read, Write};
use std::sync::Arc;

use chrono::{Datelike, Local, Timelike};
use ecow::eco_format;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use tiny_http::{Header, Method, Request, Response, Server};
use typst::diag::{FileError, FileResult, SourceDiagnostic};
use typst::foundations::{Bytes, Datetime, Smart};
use typst::layout::PagedDocument;
use typst::syntax::{FileId, Source, VirtualPath};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, World};
use typst_pdf::{PdfOptions, Timestamp};

/// Default port for the API server
const DEFAULT_PORT: u16 = 8082;

fn main() {
    let port = std::env::var("TYPEDRAFT_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(DEFAULT_PORT);

    let addr = format!("0.0.0.0:{}", port);
    println!("TypeDraft API starting on http://{}", addr);

    let server = Server::http(&addr).expect("Failed to start server");
    println!("Server ready. Endpoints:");
    println!("  POST /api/compile - Compile Typst to PDF");
    println!("  GET  /health      - Health check");

    // Pre-initialize fonts (expensive, do once)
    let base = Arc::new(CompilerBase::new());
    println!("Fonts loaded: {} fonts available", base.fonts.len());

    for request in server.incoming_requests() {
        let base = Arc::clone(&base);
        // Handle request (in production, use thread pool)
        handle_request(request, &base);
    }
}

/// Handle incoming HTTP request
fn handle_request(mut request: Request, base: &CompilerBase) {
    let path = request.url().to_string();
    let method = request.method().clone();

    let response = match (method, path.as_str()) {
        (Method::Get, "/health") => health_check(),
        (Method::Post, "/api/compile") => compile_endpoint(&mut request, base),
        (Method::Options, _) => cors_preflight(),
        _ => not_found(),
    };

    if let Err(e) = request.respond(response) {
        eprintln!("Failed to send response: {}", e);
    }
}

// ============================================================================
// Request/Response types
// ============================================================================

#[derive(Deserialize)]
struct CompileRequest {
    typst_code: String,
}

#[derive(Serialize)]
struct CompileResponse {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pdf_base64: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    errors: Option<Vec<CompileError>>,
}

#[derive(Serialize)]
struct CompileError {
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    line: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    column: Option<usize>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    fonts_loaded: usize,
}

// ============================================================================
// Endpoints
// ============================================================================

fn health_check() -> Response<std::io::Cursor<Vec<u8>>> {
    let resp = HealthResponse {
        status: "ok",
        fonts_loaded: 0, // Would need base reference
    };
    json_response(200, &resp)
}

fn compile_endpoint(request: &mut Request, base: &CompilerBase) -> Response<std::io::Cursor<Vec<u8>>> {
    // Read body
    let mut body = String::new();
    if let Err(e) = request.as_reader().read_to_string(&mut body) {
        return json_response(400, &CompileResponse {
            success: false,
            pdf_base64: None,
            errors: Some(vec![CompileError {
                message: format!("Failed to read request body: {}", e),
                line: None,
                column: None,
            }]),
        });
    }

    // Parse JSON
    let req: CompileRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return json_response(400, &CompileResponse {
                success: false,
                pdf_base64: None,
                errors: Some(vec![CompileError {
                    message: format!("Invalid JSON: {}", e),
                    line: None,
                    column: None,
                }]),
            });
        }
    };

    // Compile
    match compile_to_pdf(&req.typst_code, base) {
        Ok(pdf_bytes) => {
            use std::io::Cursor;

            // Encode as base64
            let pdf_base64 = base64_encode(&pdf_bytes);

            json_response(200, &CompileResponse {
                success: true,
                pdf_base64: Some(pdf_base64),
                errors: None,
            })
        }
        Err(errors) => {
            json_response(200, &CompileResponse {
                success: false,
                pdf_base64: None,
                errors: Some(errors),
            })
        }
    }
}

fn cors_preflight() -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string("")
        .with_status_code(204)
        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
        .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, OPTIONS").unwrap())
        .with_header(Header::from_bytes("Access-Control-Allow-Headers", "Content-Type").unwrap())
}

fn not_found() -> Response<std::io::Cursor<Vec<u8>>> {
    json_response(404, &serde_json::json!({"error": "Not found"}))
}

fn json_response<T: Serialize>(status: u16, body: &T) -> Response<std::io::Cursor<Vec<u8>>> {
    let json = serde_json::to_vec(body).unwrap_or_default();
    Response::from_data(json)
        .with_status_code(status)
        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
}

// ============================================================================
// Typst Compilation
// ============================================================================

/// Compile Typst source code to PDF bytes
fn compile_to_pdf(source_code: &str, base: &CompilerBase) -> Result<Vec<u8>, Vec<CompileError>> {
    // Create a world with the source code
    let world = TypeDraftWorld::new(source_code, base);

    // Compile to document
    let result = typst::compile::<PagedDocument>(&world);

    // Check for errors
    if let Err(errors) = &result.output {
        let compile_errors: Vec<CompileError> = errors
            .iter()
            .map(|diag| {
                let (line, column) = diag.span.id()
                    .and_then(|id| world.source(id).ok())
                    .and_then(|source| {
                        let range = source.range(diag.span)?;
                        let line = source.byte_to_line(range.start)?;
                        let column = source.byte_to_column(range.start)?;
                        Some((line + 1, column + 1))
                    })
                    .unzip();

                CompileError {
                    message: diag.message.to_string(),
                    line,
                    column,
                }
            })
            .collect();
        return Err(compile_errors);
    }

    let document = result.output.unwrap();

    // Convert to PDF
    let timestamp = current_timestamp();
    let options = PdfOptions {
        ident: Smart::Auto,
        timestamp,
        page_ranges: None,
        standards: Default::default(),
        tagged: false,
    };

    match typst_pdf::pdf(&document, &options) {
        Ok(pdf_bytes) => Ok(pdf_bytes),
        Err(errors) => {
            let compile_errors: Vec<CompileError> = errors
                .iter()
                .map(|e| CompileError {
                    message: e.message.to_string(),
                    line: None,
                    column: None,
                })
                .collect();
            Err(compile_errors)
        }
    }
}

fn current_timestamp() -> Option<Timestamp> {
    let now = Local::now();
    let datetime = Datetime::from_ymd_hms(
        now.year(),
        now.month().try_into().ok()?,
        now.day().try_into().ok()?,
        now.hour().try_into().ok()?,
        now.minute().try_into().ok()?,
        now.second().try_into().ok()?,
    )?;
    Timestamp::new_local(datetime, now.offset().local_minus_utc() / 60)
}

fn base64_encode(data: &[u8]) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);

    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = chunk.get(1).copied().unwrap_or(0) as usize;
        let b2 = chunk.get(2).copied().unwrap_or(0) as usize;

        result.push(ALPHABET[b0 >> 2] as char);
        result.push(ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)] as char);

        if chunk.len() > 1 {
            result.push(ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(ALPHABET[b2 & 0x3f] as char);
        } else {
            result.push('=');
        }
    }

    result
}

// ============================================================================
// Minimal World Implementation
// ============================================================================

/// Shared base resources for compilation (fonts, library)
struct CompilerBase {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
}

impl CompilerBase {
    fn new() -> Self {
        // Load embedded fonts from typst-assets
        let fonts: Vec<_> = typst_assets::fonts()
            .flat_map(|data| Font::iter(Bytes::new(data)))
            .collect();

        Self {
            library: LazyHash::new(Library::default()),
            book: LazyHash::new(FontBook::from_fonts(&fonts)),
            fonts,
        }
    }
}

/// A minimal World implementation for compiling from a string
struct TypeDraftWorld<'a> {
    source: Source,
    base: &'a CompilerBase,
}

impl<'a> TypeDraftWorld<'a> {
    fn new(source_code: &str, base: &'a CompilerBase) -> Self {
        let id = FileId::new(None, VirtualPath::new("main.typ"));
        let source = Source::new(id, source_code.into());
        Self { source, base }
    }
}

impl World for TypeDraftWorld<'_> {
    fn library(&self) -> &LazyHash<Library> {
        &self.base.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.base.book
    }

    fn main(&self) -> FileId {
        self.source.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.source.id() {
            Ok(self.source.clone())
        } else {
            Err(FileError::NotFound(id.vpath().as_rootless_path().into()))
        }
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        Err(FileError::NotFound(id.vpath().as_rootless_path().into()))
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.base.fonts.get(index).cloned()
    }

    fn today(&self, offset: Option<i64>) -> Option<Datetime> {
        let now = if let Some(offset) = offset {
            chrono::Utc::now() + chrono::Duration::hours(offset)
        } else {
            chrono::Utc::now()
        };

        Datetime::from_ymd_hms(
            now.year(),
            now.month().try_into().ok()?,
            now.day().try_into().ok()?,
            now.hour().try_into().ok()?,
            now.minute().try_into().ok()?,
            now.second().try_into().ok()?,
        )
    }
}
