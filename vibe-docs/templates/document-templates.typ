// Vibe Docs - Document Templates
// Reusable document structures for AI-generated content

// ===== PROFESSIONAL DOCUMENT =====
#let professional-doc(
  title: "Document Title",
  author: none,
  date: datetime.today().display(),
  body,
) = {
  set document(title: title, author: if author != none { (author,) } else { () })
  set page(
    paper: "us-letter",
    margin: (x: 1in, y: 1in),
    header: context {
      if counter(page).get().first() > 1 {
        text(size: 10pt, fill: luma(150))[#title]
        h(1fr)
        text(size: 10pt, fill: luma(150))[#counter(page).display()]
      }
    },
  )
  set text(font: "Linux Libertine", size: 11pt)
  set par(justify: true, leading: 0.65em)
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    v(1em)
    text(size: 24pt, weight: "bold")[#it.body]
    v(0.5em)
  }
  show heading.where(level: 2): it => {
    v(0.8em)
    text(size: 16pt, weight: "bold")[#it.body]
    v(0.3em)
  }

  // Title page
  align(center)[
    #v(2in)
    #text(size: 28pt, weight: "bold")[#title]
    #v(1em)
    #if author != none {
      text(size: 14pt)[#author]
      v(0.5em)
    }
    #text(size: 12pt, fill: luma(100))[#date]
  ]
  pagebreak()

  body
}

// ===== MINIMAL DOCUMENT =====
#let minimal-doc(body) = {
  set page(paper: "us-letter", margin: 1in)
  set text(font: "Inter", size: 11pt)
  set par(justify: true)
  body
}

// ===== TECHNICAL DOCUMENT =====
#let technical-doc(
  title: "Technical Document",
  version: "1.0",
  body,
) = {
  set page(
    paper: "us-letter",
    margin: (x: 1in, y: 1in),
    header: [
      #text(size: 9pt, fill: luma(100))[#title — v#version]
      #h(1fr)
      #text(size: 9pt, fill: luma(100))[Page #counter(page).display()]
    ],
  )
  set text(font: "JetBrains Mono", size: 10pt)
  set par(leading: 0.7em)
  show raw: set text(font: "JetBrains Mono", size: 9pt)
  show raw.where(block: true): block.with(
    fill: luma(245),
    inset: 10pt,
    radius: 4pt,
    width: 100%,
  )

  align(center)[
    #v(1in)
    #text(size: 24pt, weight: "bold")[#title]
    #v(0.5em)
    #text(size: 12pt, fill: luma(100))[Version #version]
    #v(2em)
  ]

  body
}

// ===== RESUME TEMPLATE =====
#let resume(
  name: "Your Name",
  contact: (),
  body,
) = {
  set page(paper: "us-letter", margin: 0.5in)
  set text(font: "Inter", size: 10pt)
  set par(leading: 0.5em)

  // Header
  align(center)[
    #text(size: 24pt, weight: "bold")[#name]
    #v(0.3em)
    #text(size: 10pt, fill: luma(100))[
      #contact.join(" • ")
    ]
  ]
  v(1em)
  line(length: 100%, stroke: 0.5pt + luma(200))
  v(0.5em)

  body
}

// ===== HELPER FUNCTIONS =====

// Section with icon placeholder
#let section(title, body) = {
  v(0.8em)
  text(size: 14pt, weight: "bold", fill: rgb("#2563eb"))[#title]
  v(0.3em)
  body
}

// Callout box
#let callout(body, type: "info") = {
  let colors = (
    info: rgb("#dbeafe"),
    warning: rgb("#fef3c7"),
    success: rgb("#dcfce7"),
    error: rgb("#fee2e2"),
  )
  block(
    fill: colors.at(type, default: colors.info),
    inset: 12pt,
    radius: 6pt,
    width: 100%,
  )[#body]
}
