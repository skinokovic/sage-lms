# SAGE — Frontend (Login / Create Account)

React + Redux Toolkit frontend for the SAGE School of Business & Management LMS, built to match the provided design tokens (colors, type scale, button spec) and mockups.

## Stack
- React 18 + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite` — no `tailwind.config.js` needed, tokens live in `src/styles/app.css`)
- Redux Toolkit (`authSlice` with `loginUser` / `registerUser` thunks)
- React Router (`/`, `/login`, `/create-account`)
- lucide-react for all UI icons (Google/Facebook marks are inline SVGs, since Lucide has no brand glyphs)
- axios for API calls

## Getting started
```bash
cd sage-frontend
npm install
npm run dev
```
The dev server proxies `/api/*` to `http://localhost:5000` (see `vite.config.js`) — point that at your Express backend, or set `VITE_API_BASE_URL` for a different origin/deployment.

## Wiring up to your backend
`src/api/authApi.js` calls:
- `POST /api/auth/register` — expects `{ user, token }` back
- `POST /api/auth/login` — expects `{ user, token }` back
- `GET /api/auth/me`

Adjust the paths there to match your actual Express routes. The JWT is stored in `localStorage` under `sage_token` and attached to every request automatically via the axios interceptor in `src/api/axiosClient.js`.

## Brand icon
`src/components/Logo.jsx` is the single source of truth for the SAGE mark — a shield crest built as inline SVG (no image file to keep track of, and it inherits the brand colors via CSS variables).
- `<Logo />` — icon + wordmark, used on the auth pages
- `<Logo iconOnly />` — just the crest, for a collapsed navbar or mobile header
- `<Logo variant="light" />` — white version for dark/red backgrounds
- `public/favicon.svg` — the browser tab icon, same crest

Drop `<Logo />` into your real homepage navbar (see the placeholder `Home` component in `App.jsx` for where it goes) and it'll match everywhere automatically.

## Design tokens
Tailwind v4 is configured entirely in CSS — `src/styles/app.css` declares an `@theme` block with every brand color, the radius scale, and the font family, taken directly from the brand sheet:

```css
--color-primary: #b00000;      → bg-primary / text-primary / border-primary
--color-primary-hover: #6f0000 → hover:bg-primary-hover
--color-secondary: #1e3a8a     → bg-secondary / text-secondary
--color-heading: #1f2937       → text-heading
--color-body: #6b7280          → text-body
--color-line: #d9d9d9          → border-line   (input borders)
--color-surface-muted: #f5f5f5 → bg-surface-muted (page background)
--radius-control: 10px         → rounded-control (buttons/inputs)
--radius-card: 20px            → rounded-card
```

Because v4 turns `@theme` entries into real CSS custom properties, these are also usable as plain `var(--color-primary)` anywhere (e.g. inside inline SVG), which is how `Logo.jsx` stays theme-aware without extra props. Change a value once in `app.css` and every component — Tailwind class or inline style — updates.

Button sizing (350×48 primary / 265×48 secondary, 1px border) is applied directly as Tailwind utilities on each button component (`w-full max-w-[350px] h-12 rounded-control border`), rather than a separate `.btn` class.

## Structure
```
src/
  api/            axios client + auth endpoints
  components/     Logo, form fields, buttons, hero panel
  pages/          Login.jsx, CreateAccount.jsx
  store/          Redux Toolkit store + authSlice
  styles/         app.css  (Tailwind import + @theme tokens)
```

## Notes
- Both forms do client-side validation before dispatching, and surface backend error messages via the `auth-form__banner`.
- Fully responsive: the two-column card collapses to a single column under 860px, with the illustration panel moving above the form.
- The hero-panel illustration is an original geometric composition (rings, floating badge, laptop card) rather than a copy of any stock asset, so it's safe to ship and easy to restyle.
