#!/usr/bin/env python3
"""
TypeDraft Validation Script
Tests x.ai API's ability to generate valid Typst code.

Usage:
    export XAI_API_KEY="your-api-key"
    python3 validate_xai_typst.py

Or:
    python3 validate_xai_typst.py --api-key "your-api-key"
"""

import json
import os
import re
import sys
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from datetime import datetime

# x.ai API configuration
XAI_API_URL = "https://api.x.ai/v1/chat/completions"
XAI_MODEL = "grok-3-fast"  # Fast model for testing, can upgrade to grok-4

# Test cases with varying complexity
TEST_CASES = [
    {
        "name": "simple_resume",
        "content": """
Name: John Smith
Title: Senior Software Engineer
Email: john@example.com
Phone: (555) 123-4567

Experience:
- Tech Corp (2020-Present): Lead developer for cloud infrastructure
- StartupXYZ (2018-2020): Full-stack developer building web applications

Education:
- BS Computer Science, MIT, 2018

Skills: Python, Rust, TypeScript, AWS, Docker, Kubernetes
        """,
        "template": "resume",
        "instructions": "Clean, modern single-column resume with blue accent color"
    },
    {
        "name": "simple_invoice",
        "content": """
Invoice #1234
Date: December 30, 2024
Due: January 30, 2025

From: Acme Consulting LLC
To: Client Corporation

Services:
- Website redesign: $5,000
- SEO optimization: $2,000
- Monthly maintenance (3 months): $1,500

Subtotal: $8,500
Tax (8%): $680
Total: $9,180

Payment: Bank transfer to Account #12345678
        """,
        "template": "invoice",
        "instructions": "Professional invoice with itemized table and clear totals"
    },
    {
        "name": "one_pager",
        "content": """
Product: TaskFlow AI
Tagline: Your AI-powered productivity assistant

Problem: Knowledge workers spend 2+ hours daily on task management and context switching.

Solution: TaskFlow AI automatically prioritizes tasks, schedules focus time, and reduces meeting overhead by 40%.

Key Features:
- Smart task prioritization using ML
- Calendar optimization
- Meeting summarization
- Slack/Teams integration

Traction:
- 10,000 beta users
- 4.8 star rating
- 85% weekly retention

Team: Ex-Google, Ex-Meta engineers with 20+ years combined experience

Ask: $2M seed round for product development and go-to-market
        """,
        "template": "one-pager",
        "instructions": "Compelling startup one-pager with visual hierarchy, icons or bullet points for features"
    }
]

# System prompt for Typst generation
SYSTEM_PROMPT = """You are an expert Typst document generator. Typst is a modern markup-based typesetting system.

Your task is to generate complete, valid, compilable Typst code based on the user's content and requirements.

Important Typst syntax rules:
1. Page setup: #set page(paper: "a4", margin: 2cm)
2. Text styling: #set text(font: "Arial", size: 11pt)
3. Headings: = Heading 1, == Heading 2, etc.
4. Bold: *bold text*
5. Italic: _italic text_
6. Lists: - bullet item or + numbered item
7. Tables: #table(columns: 3, [A], [B], [C], [1], [2], [3])
8. Colors: #text(fill: blue)[colored text]
9. Alignment: #align(center)[centered content]
10. Spacing: #v(1em) for vertical space, #h(1em) for horizontal

Return ONLY the Typst code, no explanations or markdown code blocks. The code should compile directly."""

def call_xai_api(api_key: str, content: str, template: str, instructions: str) -> dict:
    """Call x.ai API to generate Typst code."""

    user_prompt = f"""Generate a {template} document in Typst format.

Content to include:
{content}

Style instructions: {instructions}

Generate complete, compilable Typst code:"""

    payload = {
        "model": XAI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,  # Lower temperature for more consistent output
        "max_tokens": 4000
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    request = Request(
        XAI_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urlopen(request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
            return {
                "success": True,
                "content": result["choices"][0]["message"]["content"],
                "model": result.get("model", XAI_MODEL),
                "usage": result.get("usage", {})
            }
    except HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        return {
            "success": False,
            "error": f"HTTP {e.code}: {error_body}"
        }
    except URLError as e:
        return {
            "success": False,
            "error": f"URL Error: {e.reason}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def validate_typst_syntax(code: str) -> dict:
    """Basic validation of Typst syntax patterns."""

    issues = []
    warnings = []

    # Check for common Typst patterns
    patterns = {
        "page_setup": r"#set\s+page\s*\(",
        "text_setup": r"#set\s+text\s*\(",
        "has_content": r"[a-zA-Z]{10,}",  # At least some text content
    }

    found_patterns = {}
    for name, pattern in patterns.items():
        found_patterns[name] = bool(re.search(pattern, code))

    # Check for obvious errors
    error_patterns = [
        (r"```", "Contains markdown code fence (```) - should be pure Typst"),
        (r"\\begin\{", "Contains LaTeX syntax (\\begin) - should be Typst"),
        (r"\\end\{", "Contains LaTeX syntax (\\end) - should be Typst"),
    ]

    for pattern, message in error_patterns:
        if re.search(pattern, code):
            issues.append(message)

    # Check bracket balance
    open_parens = code.count("(")
    close_parens = code.count(")")
    if open_parens != close_parens:
        issues.append(f"Unbalanced parentheses: {open_parens} open, {close_parens} close")

    open_brackets = code.count("[")
    close_brackets = code.count("]")
    if open_brackets != close_brackets:
        issues.append(f"Unbalanced brackets: {open_brackets} open, {close_brackets} close")

    # Warnings for missing common elements
    if not found_patterns["page_setup"]:
        warnings.append("No #set page() found - document may use defaults")

    if not found_patterns["text_setup"]:
        warnings.append("No #set text() found - using default font/size")

    # Calculate a confidence score
    score = 100
    score -= len(issues) * 25
    score -= len(warnings) * 5
    score = max(0, score)

    return {
        "valid": len(issues) == 0,
        "score": score,
        "issues": issues,
        "warnings": warnings,
        "patterns_found": found_patterns,
        "line_count": len(code.strip().split("\n")),
        "char_count": len(code)
    }


def clean_typst_code(code: str) -> str:
    """Clean up common issues in generated Typst code."""

    # Remove markdown code fences if present
    code = re.sub(r"^```typst?\n?", "", code, flags=re.MULTILINE)
    code = re.sub(r"\n?```$", "", code, flags=re.MULTILINE)

    # Remove leading/trailing whitespace
    code = code.strip()

    return code


def run_test(api_key: str, test_case: dict, output_dir: str) -> dict:
    """Run a single test case."""

    print(f"\n{'='*60}")
    print(f"Testing: {test_case['name']}")
    print(f"Template: {test_case['template']}")
    print(f"{'='*60}")

    # Call API
    print("Calling x.ai API...")
    result = call_xai_api(
        api_key,
        test_case["content"],
        test_case["template"],
        test_case["instructions"]
    )

    if not result["success"]:
        print(f"API Error: {result['error']}")
        return {
            "name": test_case["name"],
            "success": False,
            "error": result["error"]
        }

    print(f"Got response from {result['model']}")
    if result.get("usage"):
        usage = result["usage"]
        print(f"Tokens: {usage.get('prompt_tokens', '?')} prompt, {usage.get('completion_tokens', '?')} completion")

    # Clean and validate
    raw_code = result["content"]
    clean_code = clean_typst_code(raw_code)
    validation = validate_typst_syntax(clean_code)

    # Save output
    output_file = os.path.join(output_dir, f"{test_case['name']}.typ")
    with open(output_file, "w") as f:
        f.write(clean_code)
    print(f"Saved to: {output_file}")

    # Report validation
    print(f"\nValidation Score: {validation['score']}/100")
    print(f"Lines: {validation['line_count']}, Characters: {validation['char_count']}")

    if validation["issues"]:
        print("\nIssues:")
        for issue in validation["issues"]:
            print(f"  - {issue}")

    if validation["warnings"]:
        print("\nWarnings:")
        for warning in validation["warnings"]:
            print(f"  - {warning}")

    print("\nPatterns found:")
    for pattern, found in validation["patterns_found"].items():
        status = "Yes" if found else "No"
        print(f"  - {pattern}: {status}")

    # Show first few lines of output
    preview_lines = clean_code.split("\n")[:15]
    print(f"\nCode preview (first 15 lines):")
    print("-" * 40)
    for line in preview_lines:
        print(line)
    if len(clean_code.split("\n")) > 15:
        print("... (truncated)")
    print("-" * 40)

    return {
        "name": test_case["name"],
        "success": True,
        "validation": validation,
        "output_file": output_file,
        "model": result["model"],
        "usage": result.get("usage", {})
    }


def main():
    parser = argparse.ArgumentParser(description="Validate x.ai Typst generation")
    parser.add_argument("--api-key", help="x.ai API key (or set XAI_API_KEY env var)")
    parser.add_argument("--test", help="Run specific test (simple_resume, simple_invoice, one_pager)")
    parser.add_argument("--output-dir", default="./output", help="Output directory for generated files")
    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or os.environ.get("XAI_API_KEY")
    if not api_key:
        print("Error: No API key provided.")
        print("Set XAI_API_KEY environment variable or use --api-key flag")
        sys.exit(1)

    # Create output directory
    output_dir = args.output_dir
    os.makedirs(output_dir, exist_ok=True)

    # Select tests to run
    if args.test:
        tests = [t for t in TEST_CASES if t["name"] == args.test]
        if not tests:
            print(f"Error: Unknown test '{args.test}'")
            print(f"Available tests: {', '.join(t['name'] for t in TEST_CASES)}")
            sys.exit(1)
    else:
        tests = TEST_CASES

    print("=" * 60)
    print("TypeDraft x.ai Validation")
    print(f"Model: {XAI_MODEL}")
    print(f"Tests: {len(tests)}")
    print(f"Output: {output_dir}")
    print("=" * 60)

    # Run tests
    results = []
    for test in tests:
        result = run_test(api_key, test, output_dir)
        results.append(result)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]

    print(f"Total tests: {len(results)}")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")

    if successful:
        avg_score = sum(r["validation"]["score"] for r in successful) / len(successful)
        print(f"Average validation score: {avg_score:.1f}/100")

    if failed:
        print("\nFailed tests:")
        for r in failed:
            print(f"  - {r['name']}: {r['error']}")

    print("\nGenerated files:")
    for r in successful:
        print(f"  - {r['output_file']}")

    # Overall assessment
    print("\n" + "=" * 60)
    if len(successful) == len(results) and all(r["validation"]["score"] >= 70 for r in successful):
        print("RESULT: x.ai can generate Typst code successfully!")
        print("Ready to proceed with TypeDraft implementation.")
    elif len(successful) > 0:
        print("RESULT: Partial success - some improvements needed.")
        print("Review generated files and refine prompts.")
    else:
        print("RESULT: All tests failed - check API key and connectivity.")
    print("=" * 60)

    # Save full results
    results_file = os.path.join(output_dir, "validation_results.json")
    with open(results_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "model": XAI_MODEL,
            "results": results
        }, f, indent=2, default=str)
    print(f"\nFull results saved to: {results_file}")


if __name__ == "__main__":
    main()
