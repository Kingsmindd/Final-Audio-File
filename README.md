# Audiophile

A full-stack audio storefront for browsing headphones, speakers and earphones, saving a shopping bag, and placing demo orders. Customers can manage their accounts and view order history; administrators manage products, customers and order fulfilment.

Built as a portfolio project to demonstrate a complete React-to-database workflow, responsive navigation, server-side authorization and reliable checkout handling.

[Live demo](https://final-audio-file.vercel.app/) · [Source code](https://github.com/Kingsmindd/Final-Audio-File)

> This is a portfolio demonstration. Checkout creates test orders; no payment is collected and no delivery is arranged. Use fictional delivery details.

## Demo account

Use this existing customer account to explore the store and customer features:

| Email | Password |
| --- | --- |
| `umehjnr0041@gmail.com` | `demoaccount` |

This is a shared public demo account. Use fictional information when testing; its saved bag and order history may change as other visitors try the application.

## Features

**Shopping**

- Product categories, product details, image galleries and recommendations.
- Guest shopping bags stored in the browser and account bags synchronized through the API.
- Revision checks prevent stale bag changes from overwriting another session.
- Guest and signed-in checkout with prices calculated from stored products.
- Saved checkout request keys let an unchanged request safely retry after a lost response.

**Customer accounts**

- Registration followed by sign-in, profile editing and avatar uploads.
- Password changes require the current password and invalidate older tokens.
- Order history and account-specific shopping bags.
- Desktop sidebar and a compact mobile dropdown with four visible navigation rows and internal scrolling.
- Toast notifications and static loading feedback.

**Administration**

- Product creation, editing, image uploads and deletion.
- Customer management and role controls behind server-side admin checks.
- Order management with enforced lifecycle transitions.
- Dashboard totals distinguish completed sales from outstanding order value.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| API | Node.js, Express 5, TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | JWT, bcrypt, Express Rate Limit |
| Image storage | Cloudinary, Multer |
| Feedback | React Hot Toast |

## Project structure

```text
client/
  src/
    components/   Shared UI and navigation
    context/      Providers, contexts and hooks
    layout/       Storefront layout
    pages/        Storefront, account and admin screens
    Services/     API client, checkout service and checkout tests
    types/        Frontend types
    utils/        Shopping bag, session and catalogue logic
server/
  src/
    config/       Database and Cloudinary configuration
    controller/   Request handlers
    middleware/   Authentication, authorization, limits and uploads
    models/       User, product and order schemas
    routes/       API endpoints
    test/         Backend tests
    types/        Backend types
    validation/   Authentication and checkout validation
```

## Run locally

Use Node.js 24, npm, a MongoDB database and a Cloudinary account for image uploads.

From the repository root, install dependencies and create local configuration files:

```powershell
npm --prefix server ci
npm --prefix client ci
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Fill in your own values in both `.env` files. They are ignored by Git.

| Location | Variable | Purpose |
| --- | --- | --- |
| `server/.env` | `MONGO_URI` | MongoDB connection string with the database name |
| `server/.env` | `JWT_SECRET` | Long, randomly generated signing secret |
| `server/.env` | `CLIENT_URL` | Allowed frontend origin; local default `http://localhost:5173` |
| `server/.env` | `PORT` | API port; local default `5000` |
| `server/.env` | `NODE_ENV` | `development` locally, `production` when hosted |
| `server/.env` | `TRUST_PROXY_HOPS` | `0` locally; `1` for a direct Render API deployment |
| `server/.env` | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `server/.env` | `CLOUDINARY_API_KEY` | Cloudinary API key |
| `server/.env` | `CLOUDINARY_API_SECRET` | Cloudinary API secret, kept on the server |
| `client/.env` | `VITE_API_URL` | API base URL including `/api`; local default `http://localhost:5000/api` |

Start the API and frontend in separate terminals:

```powershell
npm --prefix server run dev
```

```powershell
npm --prefix client run dev
```

Open `http://localhost:5173`. The health endpoint is `http://localhost:5000/api/health`.

The seed script replaces the product catalogue and is blocked when `NODE_ENV=production`. Use only a disposable development database and explicitly pass `npm --prefix server run seed -- --confirm-product-reset`. It does not create administrator accounts. Administrator access is not enabled through public registration.

## Order and account rules

Orders progress through `pending → processing → shipped → delivered`. Pending and processing orders can be cancelled. Delivered and cancelled orders are final. Updates check the previous status atomically, returning `409` when another request has changed it.

Checkout requires a UUIDv4 `Idempotency-Key` header. The API scopes it to the customer or guest, stores a request fingerprint and uses a unique MongoDB index. An identical retry returns the existing order; reusing a key with different details returns `409`. The server creates the required indexes before accepting requests. Product prices, names and order totals come from the database, rather than client-supplied amounts.

JWTs expire after three days and are stored in the browser's local storage. Password changes check the current password, increment the account's session version and return a fresh token to the browser making the change. Older tokens are rejected by the API. Passwords require at least eight characters and at most 72 UTF-8 bytes, matching bcrypt's input limit.

Authentication routes return JSON `429` responses with `Retry-After` when limits are exceeded: 15 failed sign-ins, five registration attempts, or ten password-change attempts per IP in 15 minutes. The current limiter is in memory for one API instance; counters reset when the process restarts.

Completed sales count delivered orders only. Outstanding order value covers pending, processing and shipped orders. Monthly sales use delivery dates, falling back to creation dates for legacy delivered orders without a recorded delivery date.

## Checks and tests

Run from the repository root:

```powershell
npm --prefix client run lint
npm --prefix client run build
npm --prefix client test
npm --prefix server run build
npm --prefix server test
```

The backend suite covers registration without automatic sign-in, validation, password checks, token revocation, checkout replay and conflicts, allowed order transitions, dashboard calculations and HTTP rate limits. The frontend checkout tests cover lost-response retries across page reloads, account isolation and new intentional orders after checkout completes.

Tests substitute database and HTTP boundaries; they do not create real accounts or orders. Real MongoDB index concurrency and complete browser journeys require separate integration testing. Backend test files are excluded from the production build.

## Deployment

- **Frontend:** deploy `client` to Vercel with `npm run build` and output directory `dist`. Set `VITE_API_URL` to the hosted API URL including `/api`. Configure SPA rewrites so direct routes such as `/profile` resolve to `index.html`.
- **API:** deploy `server` to Render with `npm ci && npm run build` and start command `npm start`. Set the server environment variables from `.env.example`, use `NODE_ENV=production`, and set `CLIENT_URL` to the exact deployed frontend origin.
- **Proxy:** use `TRUST_PROXY_HOPS=1` for the direct Render API topology. Configure the actual trusted hop count if introducing another reverse proxy.
- **Database:** use a MongoDB database account permitted to create the required order indexes. Startup stops if those indexes cannot be created.

Deploy matching API and client changes together: checkout requires the retry-key header, and registration now redirects to sign-in. After deployment, check direct-link routing, registration/sign-in, image uploads, checkout, customer order history and admin status updates. Verify mobile navigation in a browser as well.
