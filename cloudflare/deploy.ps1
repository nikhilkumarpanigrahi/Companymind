# ═══════════════════════════════════════════════════════════════
#  CompanyMind — Cloudflare Pages Deployment Script (PowerShell)
#  Deploys the React frontend to Cloudflare Pages via Wrangler
# ═══════════════════════════════════════════════════════════════
$ErrorActionPreference = "Stop"

# ── Configuration ─────────────────────────────────────────────
$PROJECT_NAME = "companymind"
$BUILD_DIR    = "dist"
$BACKEND_URL  = if ($env:BACKEND_URL) { $env:BACKEND_URL } else { "" }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CompanyMind Cloudflare Deployment" -ForegroundColor Cyan
Write-Host "  Project: $PROJECT_NAME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Verify Wrangler is installed ─────────────────────
Write-Host "[1/5] Checking Wrangler CLI..." -ForegroundColor Yellow
try {
    $wranglerVersion = npx wrangler --version 2>&1
    Write-Host "  Wrangler version: $wranglerVersion"
} catch {
    Write-Host "  Wrangler not found. Installing..." -ForegroundColor Red
    npm install -g wrangler
}
Write-Host "  [OK] Wrangler ready" -ForegroundColor Green

# ── Step 2: Verify Wrangler auth ─────────────────────────────
Write-Host "[2/5] Verifying Cloudflare authentication..." -ForegroundColor Yellow
try {
    npx wrangler whoami 2>&1 | Out-Null
    Write-Host "  [OK] Authenticated with Cloudflare" -ForegroundColor Green
} catch {
    Write-Host "  Not logged in. Opening browser for authentication..." -ForegroundColor Yellow
    npx wrangler login
    Write-Host "  [OK] Authenticated with Cloudflare" -ForegroundColor Green
}

# ── Step 3: Build the frontend ───────────────────────────────
Write-Host "[3/5] Building React frontend..." -ForegroundColor Yellow
npm ci --include=dev
npm run build
if (-not (Test-Path "$BUILD_DIR/index.html")) {
    Write-Host "  [FAIL] Build output not found at $BUILD_DIR/index.html" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Frontend built successfully" -ForegroundColor Green

# ── Step 4: Generate _redirects file ─────────────────────────
Write-Host "[4/5] Generating _redirects for API proxy..." -ForegroundColor Yellow
if ($BACKEND_URL) {
    @"
# ── CompanyMind Cloudflare Pages Redirects ───────────────────
# Proxy API requests to the backend server
/api/*  ${BACKEND_URL}/api/:splat  200
/health ${BACKEND_URL}/health      200

# SPA fallback — serve index.html for all other routes
/*      /index.html                200
"@ | Set-Content "$BUILD_DIR/_redirects" -Encoding UTF8
    Write-Host "  API proxy target: $BACKEND_URL" -ForegroundColor White
} else {
    @"
# ── CompanyMind Cloudflare Pages Redirects ───────────────────
# NOTE: Set BACKEND_URL env var to enable API proxying.
#       e.g. BACKEND_URL=https://companymind-web.onrender.com
#
# Without a backend URL, API calls will 404.
# Update the lines below with your actual backend URL:
# /api/*  https://YOUR_BACKEND_URL/api/:splat  200
# /health https://YOUR_BACKEND_URL/health      200

# SPA fallback — serve index.html for all other routes
/*      /index.html                200
"@ | Set-Content "$BUILD_DIR/_redirects" -Encoding UTF8
    Write-Host "  [WARN] No BACKEND_URL set — API proxy not configured" -ForegroundColor Yellow
    Write-Host "         Set `$env:BACKEND_URL before deploying to enable API proxy" -ForegroundColor Yellow
}

# Generate security headers
@"
# ── CompanyMind Cloudflare Pages Headers ─────────────────────
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
"@ | Set-Content "$BUILD_DIR/_headers" -Encoding UTF8
Write-Host "  [OK] _redirects and _headers generated" -ForegroundColor Green

# ── Step 5: Deploy to Cloudflare Pages ───────────────────────
Write-Host "[5/5] Deploying to Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy $BUILD_DIR --project-name $PROJECT_NAME
Write-Host "  [OK] Deployed to Cloudflare Pages" -ForegroundColor Green

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Your site is live at:" -ForegroundColor White
Write-Host "    https://$PROJECT_NAME.pages.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Set environment variables in Cloudflare Dashboard:" -ForegroundColor White
Write-Host "     Pages -> $PROJECT_NAME -> Settings -> Environment Variables" -ForegroundColor Gray
Write-Host "       VITE_API_BASE_URL = https://your-backend-url.com" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. (Optional) Add a custom domain:" -ForegroundColor White
Write-Host "     Pages -> $PROJECT_NAME -> Custom Domains -> Add" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Ensure your backend is deployed and accessible:" -ForegroundColor White
Write-Host "     - Render:  render.yaml (already configured)" -ForegroundColor Gray
Write-Host "     - AWS:     ./aws/deploy.ps1" -ForegroundColor Gray
Write-Host "     - Docker:  docker compose -f docker-compose.prod.yml up -d" -ForegroundColor Gray
Write-Host ""
