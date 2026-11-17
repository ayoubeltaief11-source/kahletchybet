# VORTEX BET â€” project kahlatchyBET

Premium sportsbook + casino **demonstration platform**. Virtual credits (CR) only.
No real money, no payment provider, no real gambling.

## Run locally
    npm install
    npm run dev
Open http://localhost:3000

Seeded accounts (created on first request):
- player@vortexbet.demo / Player123!
- admin@vortexbet.demo / ChangeMe123!  (change ADMIN_PASSWORD in .env.local)

## Environment
Copy `.env.example` to `.env.local` and fill in. All variables are server-only.
Without POSTGRES_URL the app uses a local file store in `.data/` (development only).
With POSTGRES_URL it uses PostgreSQL and creates all tables automatically.

## Production build
    npm run build
    npm start

## Deploy free on Vercel
1. Create a free account at https://vercel.com (sign in with GitHub or email).
2. Create a free Postgres database at https://neon.tech and copy the connection string.
3. In the project folder run:  npx vercel
4. In the Vercel dashboard open Settings -> Environment Variables and add:
   POSTGRES_URL, SESSION_SECRET, FOOTBALL_ODDS_API_KEY, ODDS_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
5. Run:  npx vercel --prod
6. Your public URL appears in the terminal and in the dashboard. HTTPS is automatic.

## Custom domain
Vercel -> Project -> Settings -> Domains -> Add. Then at your registrar create:
- A record   @    -> 76.76.21.21
- CNAME      www  -> cname.vercel-dns.com
HTTPS certificates are issued automatically once DNS resolves.

## Routes
/                home
/sports          sports index      /sports/football ...
/casino          lobby              /casino/slots ...
/wallet          demo wallet
/dashboard       user dashboard
/login /register authentication
/admin           administrator console (server-protected)
/legal/*         terms, privacy, responsible play, integration guide

## Security
scrypt password hashing, httpOnly session cookies with hashed tokens stored server-side,
server-enforced admin role checks, zod validation, rate limiting on auth routes,
atomic balance mutations that can never go negative, secrets never exposed to the client.

## Casino integration model
No game is fabricated. The catalogue holds licensed-title slots. Add a real HTTPS launch URL,
provider game ID, thumbnail and allowed domains in Admin -> Game integrations, set status to
"connected", and the tile launches the provider session in demo mode.