#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  CompanyMind — Cloudflare Pages Deployment Script
#  Deploys the React frontend to Cloudflare Pages via Wrangler
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
PROJECT_NAME="companymind"
BUILD_DIR="dist"
BACKEND_URL="${BACKEND_URL:-}"

echo "╔══════════════════════════════════════════════════╗"
echo "║  CompanyMind Cloudflare Deployment               ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Project: ${PROJECT_NAME}                        "
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Verify Wrangler is installed ─────────────────────
echo "📦 Step 1: Checking Wrangler CLI..."
if ! npx wrangler --version &>/dev/null; then
  echo "  Installing Wrangler..."
  npm install -g wrangler
fi
echo "✅ Wrangler ready"

# ── Step 2: Verify Wrangler auth ─────────────────────────────
echo "🔑 Step 2: Verifying Cloudflare authentication..."
if ! npx wrangler whoami &>/dev/null; then
  echo "  Not logged in. Opening browser for authentication..."
  npx wrangler login
fi
echo "✅ Authenticated with Cloudflare"

# ── Step 3: Build the frontend ───────────────────────────────
echo "🔨 Step 3: Building React frontend..."
npm ci --include=dev
npm run build

if [ ! -f "${BUILD_DIR}/index.html" ]; then
  echo "❌ Build output not found at ${BUILD_DIR}/index.html"
  exit 1
fi
echo "✅ Frontend built successfully"

# ── Step 4: Generate _redirects file ─────────────────────────
echo "🔧 Step 4: Generating _redirects for API proxy..."
if [ -n "$BACKEND_URL" ]; then
  cat > "${BUILD_DIR}/_redirects" <<EOF
# ── CompanyMind Cloudflare Pages Redirects ───────────────────
# Proxy API requests to the backend server
/api/*  ${BACKEND_URL}/api/:splat  200
/health ${BACKEND_URL}/health      200

# SPA fallback — serve index.html for all other routes
/*      /index.html                200
EOF
  echo "  API proxy target: ${BACKEND_URL}"
else
  cat > "${BUILD_DIR}/_redirects" <<EOF
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
EOF
  echo "  ⚠️  No BACKEND_URL set — API proxy not configured"
  echo "     Set BACKEND_URL before deploying to enable API proxy"
fi

# Generate security headers
cat > "${BUILD_DIR}/_headers" <<EOF
# ── CompanyMind Cloudflare Pages Headers ─────────────────────
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
EOF
echo "✅ _redirects and _headers generated"

# ── Step 5: Deploy to Cloudflare Pages ───────────────────────
echo "🚀 Step 5: Deploying to Cloudflare Pages..."
npx wrangler pages deploy "$BUILD_DIR" --project-name "$PROJECT_NAME"
echo "✅ Deployed to Cloudflare Pages"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo ""
echo "  Your site is live at:"
echo "    https://${PROJECT_NAME}.pages.dev"
echo ""
echo "  Next steps:"
echo "  1. Set environment variables in Cloudflare Dashboard:"
echo "     Pages → ${PROJECT_NAME} → Settings → Environment Variables"
echo "       VITE_API_BASE_URL = https://your-backend-url.com"
echo ""
echo "  2. (Optional) Add a custom domain:"
echo "     Pages → ${PROJECT_NAME} → Custom Domains → Add"
echo ""
echo "  3. Ensure your backend is deployed and accessible:"
echo "     - Render:  render.yaml (already configured)"
echo "     - AWS:     ./aws/deploy.sh"
echo "     - Docker:  docker compose -f docker-compose.prod.yml up -d"
echo "═══════════════════════════════════════════════════"
