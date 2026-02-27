# CompanyMind — Cloudflare Pages Deployment

Deploy the CompanyMind React frontend to [Cloudflare Pages](https://pages.cloudflare.com/) with edge caching, automatic HTTPS, and global CDN distribution.

---

## Architecture

```
┌────────────────────┐         ┌──────────────────────┐
│  Cloudflare Pages  │── /api/*│  Backend Server      │
│  (React Frontend)  │────────▶│  (Render / AWS / VPS)│
│  Global CDN        │  proxy  │  Express.js API      │
└────────────────────┘         └──────────┬───────────┘
                                          │
                               ┌──────────┴───────────┐
                               │                      │
                        ┌──────▼──────┐       ┌───────▼──────┐
                        │  MongoDB    │       │  Embedding   │
                        │  Atlas      │       │  Service     │
                        └─────────────┘       └──────────────┘
```

Cloudflare Pages hosts the static React SPA. API requests (`/api/*`) are proxied to your backend server via Cloudflare's `_redirects` file.

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A deployed backend (Render, AWS, Docker, etc.)

---

## Quick Deploy

### Option A: Script (recommended)

**Windows (PowerShell):**
```powershell
$env:BACKEND_URL = "https://companymind-web.onrender.com"
.\cloudflare\deploy.ps1
```

**Linux / macOS:**
```bash
BACKEND_URL=https://companymind-web.onrender.com ./cloudflare/deploy.sh
```

The script will:
1. Verify Wrangler is installed and authenticated
2. Build the React frontend (`npm run build`)
3. Generate `_redirects` and `_headers` in `dist/`
4. Deploy to Cloudflare Pages

### Option B: Manual

```bash
# 1. Install & authenticate Wrangler
npm install -g wrangler
wrangler login

# 2. Build the frontend
npm ci --include=dev
npm run build

# 3. Copy redirect/header templates into the build output
cp cloudflare/_redirects dist/_redirects
cp cloudflare/_headers dist/_headers

# 4. Edit dist/_redirects — replace YOUR_BACKEND_URL with your actual backend URL

# 5. Deploy
wrangler pages deploy dist --project-name companymind
```

### Option C: Git Integration (CI/CD)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Pages** → **Create a project**
2. Connect your GitHub/GitLab repository
3. Configure build settings:

   | Setting | Value |
   |---------|-------|
   | **Framework preset** | None |
   | **Build command** | `npm ci --include=dev && npm run build` |
   | **Build output directory** | `dist` |
   | **Root directory** | `/` |

4. Add environment variables:

   | Variable | Value |
   |----------|-------|
   | `NODE_VERSION` | `20` |
   | `VITE_API_BASE_URL` | `https://your-backend-url.com` |

5. Deploy — Cloudflare will build & deploy on every push.

---

## Environment Variables

Set these in **Cloudflare Dashboard → Pages → companymind → Settings → Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Your backend URL (e.g., `https://companymind-web.onrender.com`) |
| `NODE_VERSION` | No | Node.js version for builds (default: 18, recommended: 20) |

> **Note:** `VITE_*` variables are embedded at build time, not runtime. You must redeploy after changing them.

---

## Custom Domain

1. Go to **Pages → companymind → Custom Domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `search.yourcompany.com`)
4. Cloudflare will configure DNS automatically if the domain is on Cloudflare

---

## File Reference

```
cloudflare/
├── wrangler.toml     # Wrangler configuration for Cloudflare Pages
├── deploy.ps1        # Windows PowerShell deployment script
├── deploy.sh         # Linux/macOS bash deployment script
├── _redirects        # Template: API proxy rules + SPA fallback
├── _headers          # Template: Security headers + cache control
└── README.md         # This file
```

| File | Purpose |
|------|---------|
| `_redirects` | Proxies `/api/*` and `/health` to the backend; SPA fallback for React Router |
| `_headers` | Security headers (X-Frame-Options, CSP, etc.) and immutable caching for Vite assets |
| `deploy.ps1` / `deploy.sh` | One-command deployment scripts that build, generate configs, and deploy |
| `wrangler.toml` | Wrangler project configuration |

---

## How the Proxy Works

Cloudflare Pages supports [proxied redirects](https://developers.cloudflare.com/pages/configuration/redirects/) using status code `200`. When a user's browser calls `/api/search?q=hello`, Cloudflare fetches the response from your backend and returns it transparently:

```
Browser  →  /api/search?q=hello
         →  Cloudflare Pages (CDN edge)
         →  200 proxy to https://your-backend.com/api/search?q=hello
         →  Response returned to browser
```

This means:
- **No CORS issues** — the browser sees same-origin requests
- **Edge caching** — Cloudflare can cache static assets globally
- **Zero config HTTPS** — automatic SSL for both Pages and custom domains

---

## Comparison with Other Deployment Options

| Feature | Cloudflare Pages | Render | AWS ECS | Docker Compose |
|---------|-----------------|--------|---------|----------------|
| Frontend hosting | ✅ Global CDN | ✅ Single region | ✅ Single region | ✅ Self-hosted |
| Backend hosting | ❌ External | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| Auto HTTPS | ✅ | ✅ | ⚙️ ALB needed | ❌ Manual |
| CI/CD | ✅ Git integration | ✅ Git integration | ⚙️ Manual | ❌ Manual |
| Free tier | ✅ Generous | ✅ Limited | ⚙️ 12-month trial | N/A |
| Global edge | ✅ 300+ PoPs | ❌ | ❌ | ❌ |

---

## Troubleshooting

**API calls returning 404?**
- Ensure `_redirects` is in the `dist/` folder (not the project root)
- Verify your `BACKEND_URL` is correct and the backend is running
- Check that the `_redirects` proxy lines are uncommented

**Build failing?**
- Ensure `NODE_VERSION` is set to `18` or `20` in Cloudflare environment variables
- Run `npm run build` locally first to verify it works

**Stale deployment?**
- `VITE_*` variables are baked in at build time — redeploy after changing them
- Clear Cloudflare cache: **Dashboard → Caching → Purge Everything**
