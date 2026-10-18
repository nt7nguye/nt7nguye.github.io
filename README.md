# nt7nguye.com

Astro site. Posts are MDX files in `src/posts/`. Each push to `main` deploys to GitHub Pages.

```bash
npm install
npm run dev
```

## Write a post

Add `src/posts/<slug>.mdx`. The slug is the URL: `/posts/<slug>/`. The `date` sets the order on the home page.

```mdx
---
title: My post
date: 2024-05-01
---

Text in Markdown.
```

## Embeds

Import an embed from `src/embeds/` at the top of the post, then use it like a tag.

```mdx
import Chart from "../embeds/Chart.astro";
import Calculator from "../embeds/Calculator.astro";
import Game2048 from "../embeds/Game2048.astro";

export const rows = [
  { day: "2026-09-01", requests: 120, cost: 90 },
  { day: "2026-09-08", requests: 135, cost: 92 },
];

<Chart data={rows} x="day" y={["requests", "cost"]} title="Traffic and cost" />
<Calculator value="2*1+1%" />
<Game2048 />
```

- `Chart`: SVG line chart, drawn at build time. `x` is a number or ISO date key. `y` is one key or a list of keys.
- Code: use a fenced code block with a language, for example `js`. It is highlighted at build time.
- New embed: add `src/embeds/<Name>.astro`. If it needs JavaScript, put the code in a `mount(root)` function and call it on each instance from a `<script>` tag. See `Calculator.astro`.
