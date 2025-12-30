# TypeDraft Validation

This script validates that x.ai's API can generate valid Typst code.

## Quick Start

```bash
# Set your API key
export XAI_API_KEY="your-api-key-here"

# Run all tests
python3 validate_xai_typst.py

# Run a specific test
python3 validate_xai_typst.py --test simple_resume
```

## Test Cases

| Test | Description |
|------|-------------|
| `simple_resume` | Professional resume with experience, education, skills |
| `simple_invoice` | Business invoice with itemized table |
| `one_pager` | Startup pitch one-pager |

## Output

Generated `.typ` files are saved to `./output/` directory.

To compile them (requires Typst installed):
```bash
typst compile output/simple_resume.typ output/simple_resume.pdf
```

## What It Validates

1. **API connectivity** - Can we reach x.ai?
2. **Code generation** - Does it return Typst code?
3. **Syntax patterns** - Does it include proper Typst constructs?
4. **Common errors** - No LaTeX syntax, no markdown fences, balanced brackets

## Interpreting Results

- **Score 80-100**: Excellent, code should compile
- **Score 60-79**: Good, minor fixes may be needed
- **Score 40-59**: Issues present, review carefully
- **Score 0-39**: Significant problems, prompts need refinement
