# Ask Remi — How to Publish a New Post

## Adding a post (takes ~10 minutes)
1. Copy `post-template.html`, rename it to your slug (e.g. `budgeting-without-a-spreadsheet.html`). Use lowercase, hyphens, no dates/numbers.
2. Fill in every spot marked `EDIT`: `<title>`, meta description, canonical URL, Open Graph tags, JSON-LD `Article` schema, hero image + alt text, byline, and body.
3. Write your content between `POST BODY START` and `POST BODY END` using only the existing classes (`h2`, `h3`, `p`, `blockquote`, `figure`/`figcaption`, `.video-embed`, `.post-cta`). Don't invent new classes — it keeps every post visually consistent.
4. Add a matching `<article class="card">` block to the grid in `index.html` (copy an existing one, swap the image, title, excerpt, category, and link).
5. Update the three "Related" cards on any older posts if this new one should surface there.

## SEO checklist per post
- [ ] Title tag: 50–60 characters, keyword near the front
- [ ] Meta description: 150–160 characters, includes the keyword naturally, written to earn the click (not just describe)
- [ ] One `<h1>`, then `<h2>`/`<h3>` in order — never skip a level
- [ ] Every image has specific, descriptive `alt` text (not "image1.jpg")
- [ ] Internal link to at least 1–2 other posts, external link to at least 1 primary source
- [ ] URL slug is short, lowercase, hyphenated, matches the title's intent
- [ ] `datePublished` / `dateModified` in the JSON-LD kept current if you edit later
- [ ] Answer the core question in the first 2 sentences of the post — this is what gets pulled into AI-generated search answers as well as Google's featured snippets

## CRO checklist per post
- [ ] One primary CTA per post (the `.post-cta` block) — don't add a second competing offer
- [ ] CTA copy states the specific value ("Get the checklist"), not a generic "Click here"
- [ ] Newsletter form stays visible via the sticky header subscribe button
- [ ] Related posts at the bottom keep readers on-site instead of bouncing

## Performance notes
- Compress images before uploading (aim under 200KB each); the layout already lazy-loads below-the-fold media via the browser's native lazy loading — add `loading="lazy"` to any image you insert below the fold.
- Keep video embeds to one per post; each iframe adds real load weight.
- Fonts are loaded once via Google Fonts and shared across every page — don't add additional font families without a good reason, it slows every page down.

## Design system reference
All colors, type, spacing, and animation timing live in `styles.css` as CSS variables at the top of the file (`:root`). Change the palette or fonts once there and it updates the entire site — never hardcode a color or font inside a page.
