# Audiophile frontend

React, TypeScript and Vite frontend for the Audiophile storefront, customer accounts and admin dashboard.

See the [main project README](../README.md) for features, full-stack setup, account and checkout rules, backend configuration and deployment notes.

## Development

From this folder:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` to the API base URL including `/api`. The local default is `http://localhost:5000/api`. Start the backend separately as described in the main README.

## Verification

```powershell
npm run lint
npm run build
npm test
```

Use Node.js 24 for the checkout tests. They live in `src/Services/checkout.test.ts` and exercise the checkout service with a substituted HTTP client, without sending real orders.

## Organization

- `components`: reusable UI, shopping bag and responsive navigation.
- `context`: shared context definitions/hooks and separate provider components.
- `layout`: storefront layout.
- `pages`: storefront, customer and administrator screens.
- `Services`: Axios client and checkout request handling.
- `types` and `utils`: shared types, session handling and catalogue/bag logic.

Signed-in customers and administrators use a desktop sidebar and mobile dropdown; guests keep the standard navigation. Registration redirects to sign-in. Notifications use React Hot Toast, and loading feedback uses static text.

## Hosting

Build with `npm run build` and publish `dist`. Set `VITE_API_URL` at build time and add a single-page application rewrite for direct route visits. Never put database, JWT or Cloudinary secrets in frontend environment variables.
