# Jack Dee Ultimate Job Search

A mobile-first personal career operating system for Jack Darnell Givens. It discovers current roles, verifies listings, separates job records from analyses and application packages, scores fit and ATS alignment, manages overqualification risk, generates role-specific DOCX application materials, stores versioned packages in Google Drive, and tracks each candidacy through outcome.

## Core lineage

`Job → Analysis → Application Package → Application`

These are separate first-class objects. Historical analyses and document versions are never overwritten by a new scoring run or resume iteration.

## Search strategy

Four lanes are supported:

1. Senior / Executive Program Leadership
2. Standard Project / Program Management
3. Agile Delivery
4. Product Owner

Hard requirements include full-time permanent employment, a $100,000 disclosed salary floor, Atlanta or Dallas hybrid/on-site within 25 miles, or U.S. remote work that permits Georgia or Texas residents. Listings are limited to a seven-day freshness window and are rechecked for active status.

Public remote discovery works through Remotive and Jobicy. Broad Google Jobs discovery is enabled when `SERPAPI_KEY` is configured. This is intentional: the app does not bypass access controls or scrape LinkedIn/Indeed-style sites in violation of provider restrictions.

## Daily schedule

The configured search windows are 7:00 AM and 4:00 PM America/New_York on weekdays. GitHub Actions triggers four UTC candidates to cover daylight-saving changes; the protected API route checks the actual Eastern hour and ignores the off-hour invocation.

## Google Drive

The app uses the existing private folder structure under **Jack Dee Ultimate Job Search Tool**. Production access uses a dedicated Google service account so scheduled server-side jobs do not depend on a browser session or expose a personal OAuth token.

Required setup:

1. Create a Google Cloud service account with Drive API access.
2. Share the `Jack Dee Ultimate Job Search Tool` folder with the service-account email as Editor.
3. Set `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` in Vercel.
4. Keep the provided folder IDs in the Vercel environment variables.

The ChatGPT Google Workspace connector is used during development to organize and inspect the source documents, but its private ChatGPT OAuth token is not exported into this deployed web app.

## AI

Resume evidence extraction, gap interpretation, resume tailoring, and cover-letter generation use Vercel AI Gateway. The production default is `openai/gpt-5.6-sol`, configurable through `AI_MODEL`. Vercel OIDC is preferred so no provider API key needs to be committed or exposed.

All AI prompts enforce a strict truth boundary: unsupported employers, titles, dates, technologies, certifications, degrees, metrics, industries, responsibilities, and accomplishments must not be invented.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Use `USE_LOCAL_STATE=true` only for local development and tests. Production is designed to persist state and documents through the configured private Google Drive integration.

## Production environment

See `.env.example`. At minimum configure:

- `APP_ACCESS_CODE`
- `APP_SESSION_SECRET`
- Google service-account variables and folder IDs
- `CRON_SECRET`
- `JOB_SEARCH_APP_URL`
- `SERPAPI_KEY` for broad Google Jobs discovery

Vercel AI Gateway should be enabled for the project. On Vercel, OIDC can authenticate AI Gateway automatically.

## GitHub Actions secrets

Create repository secrets:

- `JOB_SEARCH_APP_URL`
- `CRON_SECRET`

They drive the DST-safe scheduled search workflow.

## QA gates

The CI workflow runs:

- TypeScript type checking
- ESLint
- Unit and acceptance-oriented tests
- Production Next.js build

The test suite covers compensation, full-time employment, remote eligibility, Dallas/Atlanta radius logic, inactive listings, scoring bounds, overqualification, deterministic file naming, and salary parsing.

No release should be treated as production-ready while CI is failing.

## Security notes

- No resume contents or personal application data belong in this repository.
- All privileged Drive operations run server-side.
- The application is protected by a private access code and signed HTTP-only session cookie.
- Scheduled endpoints require a separate bearer secret.
- External job content is treated as untrusted input.
- Secrets belong in Vercel or GitHub secret storage only.
