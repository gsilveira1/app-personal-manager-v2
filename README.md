# Personal Manager Client (`app-personal-manager-client`)

Frontend web application for the **Personal Manager** platform within **viviOps**. Built as an **Astro Multi-Page Application (MPA)** with **Selective React Islands** and **Progressive Web App (PWA)** offline capabilities.

---

## 🏛️ Architecture Overview

The client uses an Astro MPA foundation to deliver static HTML shells and selective React hydration:

- **Framework**: [Astro 5+](https://astro.build/) in `output: 'static'` MPA mode with [`@astrojs/react`](https://docs.astro.build/en/guides/integrations-guide/react/).
- **Component Layer**: React 19 interactive islands (`client:load`, `client:idle`, `client:only="react"`).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for client-side stores and session state.
- **Offline & PWA**: [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) with Workbox caching strategies, background sync, and offline indicator (`PWABadge`).
- **Internationalization**: `react-i18next` with multi-language support (pt-BR, en, es).
- **Icons & Visuals**: `lucide-react` & `recharts`.

---

## 📁 Directory Structure

```
app-personal-manager-client/
├── Dockerfile                  # Hardened multi-stage unprivileged production image
├── .dockerignore               # Optimized build context ignore rules
├── astro.config.mjs            # Astro configuration (React, Tailwind, PWA, API proxy)
├── vitest.config.ts            # Vitest unit & component test configuration
├── eslint.config.js            # ESLint flat config with Prettier integration
├── package.json                # NPM scripts and dependencies
├── public/                     # Static assets, icons, and PWA manifest
├── docker/                     # Production Nginx runtime configuration
│   ├── entrypoint/
│   │   └── 05-require-env.sh   # Fast-fail environment validator
│   └── nginx/
│       ├── nginx.conf          # Hardened unprivileged Nginx configuration
│       ├── default.conf.template # Dynamic template with envsubst
│       └── snippets/
│           └── security-headers.conf # OWASP security headers & CSP
└── src/
    ├── layouts/                # Astro layout shells
    │   ├── BaseLayout.astro    # Root HTML document, meta, fonts, PWA badge
    │   └── AuthLayout.astro    # Authentication flow layout wrapper
    ├── pages/                  # Static MPA route entry points (.astro)
    │   ├── index.astro         # App entrypoint
    │   ├── login.astro         # /login route
    │   ├── sign-up.astro       # /sign-up route
    │   ├── dashboards.astro    # /dashboards route
    │   ├── clients.astro       # /clients route
    │   ├── workouts.astro      # /workouts route
    │   ├── schedules.astro     # /schedules route
    │   ├── leads.astro         # /leads route
    │   ├── 404.astro           # Custom 404 error page
    │   └── ...                 # Additional MPA route endpoints
    ├── views/                  # React page view implementations & tests
    ├── components/             # Atomic design component tree (atoms, molecules, organisms)
    ├── hooks/                  # Custom React hooks
    ├── locales/                # i18n translation dictionaries
    ├── services/               # API clients, mappers, and domain services
    ├── states/                 # Zustand stores and state slices
    └── utils/                  # Domain utilities, date helpers, and formatters
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 22.0.0
- npm >= 10.0.0

### Local Development

```bash
# Install dependencies
npm install

# Start development server with proxy to API
npm run dev

# Run Astro typecheck
npm run check

# Run ESLint & Prettier
npm run lint

# Format code
npx prettier --write .
```

### Testing

```bash
# Run unit & component tests (Vitest)
npm test

# Run tests in watch mode
npm run test:watch

# Run coverage report
npm run test:coverage

# Browser E2E journeys live in the viviOps superproject (e2e/client) and run from its root:
#   npm run test:e2e
```

### Production Build & Preview

```bash
# Build static MPA assets into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 🐳 Containerization & Deployment

The application includes a hardened, production-ready container setup:

### Container Security Features:
1. **Multi-Stage Build**: Compiles static Astro MPA assets with `node:22-alpine` and serves them via `nginxinc/nginx-unprivileged:stable-alpine`.
2. **Unprivileged Execution (`USER 101`)**: Runs without root privileges on port `8080`.
3. **Read-Only Root Filesystem Ready**: All temporary files and template substitution outputs are written strictly to `/tmp`.
4. **OWASP Security Headers**: Comprehensive Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), Frame Options, and X-Content-Type-Options.
5. **PWA & Cache Management**:
   - `sw.js`, `manifest.webmanifest`, and root HTML files are served with `Cache-Control: no-cache, must-revalidate`.
   - Fingerprinted assets (`/_astro/*`) are cached immutably for 1 year (`max-age=31536000, immutable`).
6. **Healthcheck Probe**: Dedicated `/healthz` endpoint with automated Docker healthcheck.

### Building & Running the Container

```bash
# Build the Docker image
docker build -t app-personal-manager-client .

# Run the container with API proxy target
docker run -d \
  -p 8080:8080 \
  -e API_UPSTREAM=http://localhost:3001 \
  --name personal-manager-client \
  app-personal-manager-client

# Check container health status
curl -i http://localhost:8080/healthz
```
