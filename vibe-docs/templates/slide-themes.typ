// Vibe Docs - Polylux Slide Themes
// These are reusable theme configurations for AI-generated slides

#import "@preview/polylux:0.3.1": *

// ===== DARK MODERN THEME =====
#let dark-modern-theme = (
  background: rgb("#0f0f1a"),
  text: rgb("#ffffff"),
  accent: rgb("#6366f1"),
  secondary: rgb("#a5b4fc"),
  muted: rgb("#6b7280"),
)

#let setup-dark-modern() = {
  set page(
    paper: "presentation-16-9",
    fill: dark-modern-theme.background,
    margin: (x: 2cm, y: 1.5cm),
  )
  set text(
    fill: dark-modern-theme.text,
    font: "Inter",
    size: 24pt,
  )
  show heading.where(level: 1): set text(size: 56pt, weight: "bold")
  show heading.where(level: 2): set text(size: 40pt, weight: "semibold", fill: dark-modern-theme.accent)
}

// ===== LIGHT CLEAN THEME =====
#let light-clean-theme = (
  background: rgb("#ffffff"),
  text: rgb("#1f2937"),
  accent: rgb("#2563eb"),
  secondary: rgb("#60a5fa"),
  muted: rgb("#9ca3af"),
)

#let setup-light-clean() = {
  set page(
    paper: "presentation-16-9",
    fill: light-clean-theme.background,
    margin: (x: 2cm, y: 1.5cm),
  )
  set text(
    fill: light-clean-theme.text,
    font: "Inter",
    size: 24pt,
  )
  show heading.where(level: 1): set text(size: 56pt, weight: "bold")
  show heading.where(level: 2): set text(size: 40pt, weight: "semibold", fill: light-clean-theme.accent)
}

// ===== GRADIENT THEME =====
#let gradient-theme = (
  start: rgb("#667eea"),
  end: rgb("#764ba2"),
  text: rgb("#ffffff"),
)

#let setup-gradient() = {
  set page(
    paper: "presentation-16-9",
    fill: gradient.linear(gradient-theme.start, gradient-theme.end),
    margin: (x: 2cm, y: 1.5cm),
  )
  set text(
    fill: gradient-theme.text,
    font: "Inter",
    size: 24pt,
  )
  show heading: set text(weight: "bold")
}

// ===== SLIDE LAYOUTS =====

// Title slide
#let title-slide(title, subtitle: none, author: none) = polylux-slide[
  #align(center + horizon)[
    #text(size: 64pt, weight: "bold")[#title]
    #if subtitle != none {
      v(0.5em)
      text(size: 32pt, fill: luma(180))[#subtitle]
    }
    #if author != none {
      v(1em)
      text(size: 20pt, fill: luma(150))[#author]
    }
  ]
]

// Content slide with title
#let content-slide(title, body) = polylux-slide[
  == #title
  #v(0.5em)
  #body
]

// Two-column slide
#let two-column-slide(title, left-content, right-content) = polylux-slide[
  == #title
  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 2em,
    left-content,
    right-content,
  )
]

// Image slide
#let image-slide(title, image-placeholder, caption: none) = polylux-slide[
  == #title
  #v(0.5em)
  #align(center)[
    #image-placeholder
    #if caption != none {
      v(0.5em)
      text(size: 16pt, fill: luma(150))[#caption]
    }
  ]
]

// Quote slide
#let quote-slide(quote, author: none) = polylux-slide[
  #align(center + horizon)[
    #text(size: 36pt, style: "italic")[
      "#quote"
    ]
    #if author != none {
      v(1em)
      text(size: 20pt, fill: luma(150))[— #author]
    }
  ]
]
