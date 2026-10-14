# Benwil Billing (Next.js)

Receipts, payments and renewals for **Benwil Coaching Management Software** — the
Benwil Billing artifact rebuilt as a Next.js app with a Postgres database.

- **Next.js 16** (App Router, TypeScript)
- **Prisma 7** + **PostgreSQL** (via `@prisma/adapter-pg`; no native query engine needed at runtime)
- **Password login** (one admin password, signed HTTP-only session cookie)
- PDF receipts (html2canvas + jsPDF) and CSV export, all in the browser
- Self-hosted Poppins / IBM Plex Mono fonts (no Google Fonts request)

## Quick start

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
npx prisma migrate deploy     # creates the tables (or `npm run db:migrate` in development)
npm run db:seed               # loads business settings (and any records in prisma/seed-data.json)
npm run dev                   # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

### Environment variables

| Name | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. from Supabase, Neon or Vercel Postgres |
| `ADMIN_PASSWORD` | The password typed on the login screen |
| `SESSION_SECRET` | 32+ random characters used to sign the session cookie (`openssl rand -base64 48`) |

### Deploying to Vercel

1. Push the project to GitHub and import it in Vercel.
2. Add the three environment variables above.
3. Run `npx prisma migrate deploy` and `npm run db:seed` once against the production database
   (from your machine with the production `DATABASE_URL`, or as a build step).

## Project layout

```
app/
  layout.tsx              root HTML, fonts, global styles
  login/page.tsx          sign-in screen
  (app)/                  signed-in area (sidebar + data provider)
    page.tsx              Dashboard
    receipts/page.tsx     Receipts list, search, filter, CSV
    receipts/new/         New receipt   (?center=<id>&start=YYYY-MM-DD to bill a period)
    receipts/[id]/        Receipt sheet, payments, PDF, delete
    receipts/[id]/edit/   Edit receipt
    centers/page.tsx      Coaching centers (?new=1 opens the add form)
    settings/page.tsx     Business details printed on receipts
  api/                    Route handlers (all require a session)
    data                  GET  centers + receipts + settings
    centers, centers/[id] POST / PUT
    receipts, receipts/[id], receipts/[id]/payments   POST / PUT / DELETE
    settings              PUT
    login, logout         POST
components/               Shell, DataProvider, ReceiptForm, ReceiptSheet, tables
lib/                      billing math & formatting (shared by client and server), Prisma, auth
prisma/                   schema, initial migration, seed script + seed-data.json
proxy.ts                  auth gate for every page and API route (Next 16 "proxy", formerly middleware)
```

## How it maps to the original artifact

| Artifact | Next.js |
| --- | --- |
| `claude.use("db")` collections `centers`, `receipts`, doc `settings/business` | Postgres tables `Center`, `Receipt`, `Setting` via Prisma |
| Live `onSnapshot` updates | Data reloads after every change and whenever the tab regains focus |
| `claude.use("user")` write permission | Single admin password login |
| `claude.use("downloads")` | Normal browser downloads |
| Totals computed in the browser | Totals are recomputed on the server on every save |

Receipt numbers are unique in the database, and a receipt keeps a snapshot of the
center's name/contact at the time it was issued (`centerSnap`), just like the artifact did.

## Importing records

The artifact's database had no centers or receipts when this project was made, so
`prisma/seed-data.json` only contains the business settings. To import records, add them
to the `centers` and `receipts` arrays in the same shape the artifact stored them and run
`npm run db:seed` again — records are upserted by `id`, so it's safe to re-run.
