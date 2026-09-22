# Tukios Widget Directory

Internal reference tool for browsing Tukios' custom DUDA widgets — search, filter by category,
and see a screenshot before digging into the actual widget code. Standalone (no DUDA Widget
Builder involved); hosted on GitHub and dropped into any page with one script tag.

## Files

- `widget-directory.js` — the whole app (rendering, search, filtering, modal). Self-mounting.
- `widget-directory.css` — all styling. Loaded automatically by the JS.
- `widget-data.json` — the widget entries. **This is the file you edit** to add/update widgets.
- `thumbnail_imgs/` — drop screenshot images here; filenames referenced from `widget-data.json`.
- `index.html` — local preview page. Open it directly in a browser to check changes before pushing.

## Adding or editing a widget

1. Open `widget-data.json`.
2. Copy an existing `{ ... }` entry, or edit one in place. Fields:
   - `id` — unique, lowercase-with-dashes. Internal only, never shown.
   - `thumbnail` — filename only (e.g. `"obit-page.png"`), matching a file in `thumbnail_imgs/`. Leave `""` for a "No Image" placeholder.
   - `name` — widget name.
   - `category` — one of `"template"`, `"popular"`, `"additional"`, `"firm-only"`, or `""` for none.
   - `demoLink` — URL to a live example. Leave `""` to hide the "View Demo" button.
   - `description`, `useCase`, `limitations`, `notes` — free text. Leave `""` for anything not filled in yet.
3. Drop the matching screenshot into `thumbnail_imgs/` using the exact filename from step 2.
4. Open `index.html` locally to confirm it looks right, then push to GitHub.

No build step, no server-side code — plain JSON, so any text editor works.

## Hosting on GitHub + embedding

1. Push this whole folder to a GitHub repo.
2. Point at it via jsDelivr, which mirrors your repo with proper caching and CORS headers:
   `https://cdn.jsdelivr.net/gh/<your-username>/<repo>@main/widget-directory.js`
3. On the demo site page, add:

   ```html
   <div id="tukios-widget-directory"></div>
   <script src="https://cdn.jsdelivr.net/gh/<your-username>/<repo>@main/widget-directory.js"></script>
   ```

That's the entire embed — no `<link>` tag needed. The script pulls its own CSS and JSON from
wherever *it's* hosted, not from the page it's dropped on.

**Two things that matter for this to keep working:**
- Don't add `async` to the script tag — it breaks the self-location lookup the script relies on. `defer`, or no attribute at all, is fine.
- After pushing changes to `widget-data.json` or a new thumbnail, jsDelivr can take a few minutes (occasionally longer) to pick it up on the `@main` tag shown above. That's fine while you're actively populating this; once it's stable, switching to a version tag like `@v1.0.0` gives you reliable long-term caching instead.

## Why one script tag is enough

The script figures out its own URL at load time (`document.currentScript`) and fetches
`widget-data.json` and images relative to *that* — not relative to whatever page it's embedded
on. That's the only reason a single `<script src="...">` works no matter which Tukios site or
demo page it sits on.

## Intentionally left out of v1

- **CSV export** — flagged as "probably never used." Easy to add back later; the old DUDA
  widget's export logic can be adapted directly if that changes.
- **Pagination** — at 50–100 rows, a plain scrollable list/grid performs fine, and search +
  category filters narrow things down faster than paging would anyway.
- **Table & Kanban views** — dropped in favor of just List + Grid, since this is a lookup tool
  for a team, not a client-facing configurable widget.

## Data to double check

A couple of things pulled from your reference sheet that are worth confirming before you fill
in the rest:

- **"Testimonial Slider"** (categorized as Template in your sheet) doesn't have an exact name
  match in your widget list — the list has both "Testimonial Page 1" and "Testimonial Slider 1."
  Left both uncategorized rather than guessing which one it maps to.
- **"Resource Builder"** (Popular, "Local Resources" type pages) wasn't in the visible widget
  name list, but had full data in your reference sheet — included it as a 22nd entry. Remove it
  if it's not actually part of the set you're tracking here.
