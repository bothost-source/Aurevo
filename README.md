# Aurevo — streaming platform frontend

A React (Vite) frontend for the movies + music + music-videos streaming
product described in the project plan, styled as a dark glass UI with
Aurevo-original components inspired by the interaction patterns you shared
(floating pill nav with a glowing active tab, a ring-to-checkmark download
button, a password field with a live strength meter, and a glassy 3D
featured-movie carousel).

## What's real vs. placeholder

**Built and working:**
- Full page structure: Home, Movies, Music, Music Videos, Search, Account,
  Settings, Plan & billing, Developer API, Sign in, Sign up
- The glass design system (`src/styles/tokens.css`)
- `GlassNavigation` — floating capsule nav, glowing indicator slides between tabs
- `MovieCarousel` — glassy 3D carousel, center card + receding side cards, transport bar
- `DownloadButton` — idle ring → live progress arc → checkmark, with cancel
- `PasswordField` — show/hide toggle + entropy-based strength meter
- `ApiKeyPool` / `fetchWithKeyPool` (`src/services/apiKeyPool.js`) — round-robins
  requests across *multiple* API keys per provider so one key's rate limit
  isn't a single point of failure, with automatic benching of 429/401 keys

**Placeholder — needs your credentials to go live:**
- `src/services/providers/movieProvider.server.js` and
  `youtubeProvider.server.js` are written to run on a server/serverless
  function (never in the browser bundle) and need real base URLs + keys in
  `.env.server` (see `.env.example`)
- Auth (`src/context/AuthContext.jsx`) simulates sign-in/sign-up — wire it to
  real Firebase Authentication (Google Sign-In + your own username/password
  backend)
- Payments page has no live Stripe/Paystack checkout wired up yet
- All movie/music/video content is mock data (`src/services/mockData.js`)

## A note on the reference videos

A few of the clips you sent were screen-recordings of other developers'
original demos (distinct mascots, brand names, and visible source code, plus
one that used real studio movie posters). I built Aurevo's own versions of
the underlying interactions instead of copying those assets — everything
here is original to this project.

## Run it locally

```bash
npm install
npm run dev
```

Then visit the local URL Vite prints (defaults to http://localhost:5173).

## Next steps, roughly in order

1. Confirm the real movie/TV metadata provider (name, auth scheme, response
   shape) and adjust `movieProvider.server.js` to match.
2. Stand up two or three small backend endpoints (`/api/v1/movies`,
   `/api/v1/music-videos`, `/api/v1/auth/...`) that call the `*.server.js`
   adapters — this repo currently has no backend, only the adapters.
3. Wire Firebase Auth into `AuthContext.jsx`.
4. Wire Stripe/Paystack checkout into `Payments.jsx`.
5. Replace the gradient placeholder art in `Cards.jsx` and `Home.jsx` with
   real, licensed poster/artwork URLs from your provider.
