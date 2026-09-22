# thumbnail_imgs/

Drop widget screenshot files here. Each `widget-data.json` entry's `"thumbnail"` field
should be the exact filename of the matching image in this folder (no path, no leading slash) —
e.g. `"thumbnail": "obit-page.png"` looks for `thumbnail_imgs/obit-page.png`.

Any reasonable web image format works (`.png`, `.jpg`, `.webp`). If a filename doesn't
match a file here, the widget just shows a "No Image" placeholder instead of a broken image icon —
so it's safe to reference a thumbnail before you've actually added the file yet.
