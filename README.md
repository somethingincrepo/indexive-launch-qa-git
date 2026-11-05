# Disposable durable Indexive QA
Synthetic public QA only. Owner: Something Inc QA. No customer data, secrets, forms or paid addons.

`npm ci && npm run build && npm start -- -p 9465`. Git adapter sources remain in `content`, SEO overrides and Vercel redirects retain ownership. Generated Git routes statically import MDX during the real Next build; markdown HTML is sanitized. MDX permits inert HTML JSX only and rejects executable expressions/imports.

Sanity public project a7yw8mmt/production is read anonymously per request with published perspective, no fallback/cache. Root catchall preserves adapter URL contract; `/pages`, `/blog`, `/health`, `/api` reserved and collision reported by health. `/` is the QA shell. Missing source returns 404; upstream failure throws 500 and health/sitemap return 503. No redeployment required for Sanity rollback.

Set nonsecret PUBLIC_SITE_URL to stable QA origin before build/deploy. Deploy only to a new approved QA project; never product. Keep until observation window accepted, then owner may delete QA project and repository through normal approval.
