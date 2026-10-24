# YapHook

Message and embed builder for [Yapin'](https://yapin.gg) webhooks, in the spirit of
[Discohook](https://github.com/discohook/discohook). Live at **https://yaphook.dev**.
Questions or ideas? Join the [YapHook server](https://yapin.gg/invite/yaphook).

- Rich embeds: author, title, description, colour, up to 25 fields, image, thumbnail, footer, timestamp
- Multiple messages and multiple webhooks per send
- Live preview with Discord-style markdown (`**bold**`, spoilers, code blocks, `<t:…>` timestamps…)
- JSON editor per message, full backup/import (accepts Discohook backups too)
- Share links (`#data=…`) that never contain webhook URLs
- Autosaves to `localStorage`
- Help built into the app at `/#help`: searchable, deep-linkable (`#help/formatting`,
  `#help/faq-image`), with loadable example messages, a formatting/timestamp reference and a
  troubleshooting list. `?` opens it, `Ctrl`/`⌘`+`Enter` sends.
- Guidance where people get stuck: a three-step checklist that ticks itself off, specific
  explanations for bad webhook URLs and API errors (`src/diagnostics.ts`), and a `?` beside each
  editor card that jumps to the matching help section

It's a fully static site. Yapin's webhook API sends `Access-Control-Allow-Origin: *`, so the
browser posts to `https://www.yapin.gg/api/webhooks/<id>/<token>` directly and there is no backend.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally
```

Production builds include a Content-Security-Policy `<meta>` (see `vite.config.ts`) that
only allows network requests to Yapin's API. If you add another backend, add it to `connect-src`.

## Deploy

Pick **one** host for `yaphook.dev`.

### Cloudflare Workers (recommended if the domain is on Cloudflare)

```sh
npx wrangler login
npm run deploy:cf
```

`wrangler.jsonc` serves `dist/` as static assets and attaches the `yaphook.dev` custom domain
(the zone must be in the same Cloudflare account). Add `www.yaphook.dev` as a second route if you want it.

### GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Source: GitHub Actions.** The workflow in `.github/workflows/deploy.yml`
   builds and deploys on every push to `main`.
3. `public/CNAME` already contains `yaphook.dev`. At your DNS provider, add `A` records for the apex
   pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`
   (optionally `AAAA` to `2606:50c0:8000::153` … `8003::153`).
4. Once the certificate is issued, tick **Enforce HTTPS**. `.dev` domains are HTTPS-only.

### Anywhere else

`npm run build` and serve the `dist/` folder with any static web server.

## Notes on the Yapin API

- Payloads match Discord's webhook format (`content`, `username`, `avatar_url`, `embeds[]`).
- `?wait=true` returns the created message.
- There is no endpoint to edit or delete webhook messages, so YapHook can only send.
