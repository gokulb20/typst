# TypeDraft API

HTTP API server for compiling Typst code to PDF.

## Building

```bash
# From the repository root
cargo build --release -p typedraft-api
```

## Running

```bash
# Default port 8082
./target/release/typedraft-api

# Custom port
TYPEDRAFT_PORT=3000 ./target/release/typedraft-api
```

## Endpoints

### POST /api/compile

Compile Typst code to PDF.

**Request:**
```json
{
  "typst_code": "#set page(paper: \"a4\")\n= Hello World\nThis is a test."
}
```

**Success Response:**
```json
{
  "success": true,
  "pdf_base64": "JVBERi0xLjcK..."
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": [
    {
      "message": "unknown variable: foo",
      "line": 5,
      "column": 10
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "fonts_loaded": 42
}
```

## Example Usage

```bash
# Compile simple document
curl -X POST http://localhost:8082/api/compile \
  -H "Content-Type: application/json" \
  -d '{"typst_code": "= Hello World\nThis is a test document."}' \
  | jq -r '.pdf_base64' | base64 -d > output.pdf

# Open the PDF
open output.pdf
```

## Integration with TypeDraft Frontend

The API returns base64-encoded PDFs for easy embedding in web applications:

```javascript
const response = await fetch('/api/compile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ typst_code: '= Hello' })
});

const { success, pdf_base64, errors } = await response.json();

if (success) {
  // Display in iframe
  const pdfUrl = `data:application/pdf;base64,${pdf_base64}`;
  document.getElementById('preview').src = pdfUrl;
}
```
