# Keel

Static QA workspace with **no backend**. Sign-in, tasks, and profile data live in `localStorage` only.

## Run it

Serve the folder over HTTP (needed for Pendo). From this directory:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Pendo

1. Put a subscription API key in `js/config.js`.
2. Sign in. That initializes visitor and account metadata.
3. Tag pages by URL (`/index.html`, `/home.html`, `/board.html`, `/list.html`, `/insights.html`, `/settings.html`).
4. Tag features with `data-pendo` attributes already on buttons, nav, forms, and cards.

The agent is skipped until a real key replaces `YOUR_PENDO_API_KEY`.
