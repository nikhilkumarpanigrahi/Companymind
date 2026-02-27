# ═══════════════════════════════════════════════════════════════
#  CompanyMind — Share Localhost via Cloudflare Tunnel
#  Creates a free quick tunnel (no Cloudflare account needed!)
#
#  Usage:
#    .\cloudflare\tunnel.ps1              # Tunnel Vite dev server (port 5173)
#    .\cloudflare\tunnel.ps1 -Port 8080   # Tunnel Express backend only
# ═══════════════════════════════════════════════════════════════
param(
    [int]$Port = 5173
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CompanyMind — Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "  Sharing localhost:$Port" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Verify cloudflared is installed ──────────────────────────
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    # Try common install path after winget install
    $fallback = "$env:ProgramFiles (x86)\cloudflared\cloudflared.exe"
    if (Test-Path $fallback) {
        $cloudflared = $fallback
    } else {
        Write-Host "  cloudflared not found. Install it:" -ForegroundColor Red
        Write-Host "    winget install Cloudflare.cloudflared" -ForegroundColor Yellow
        exit 1
    }
}

# ── Check if the local server is running ─────────────────────
$connection = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue
if (-not $connection.TcpTestSucceeded) {
    Write-Host "  [WARN] Nothing running on port $Port" -ForegroundColor Yellow
    Write-Host ""
    if ($Port -eq 5173) {
        Write-Host "  Start the dev servers first:" -ForegroundColor White
        Write-Host "    Terminal 1:  npm run dev:server    (Express on 8080)" -ForegroundColor Gray
        Write-Host "    Terminal 2:  npm run dev           (Vite on 5173)" -ForegroundColor Gray
    } else {
        Write-Host "  Start your server on port $Port first." -ForegroundColor White
    }
    Write-Host ""
    exit 1
}

# ── Start the tunnel ─────────────────────────────────────────
Write-Host "  Starting Cloudflare quick tunnel..." -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop sharing." -ForegroundColor Gray
Write-Host ""
Write-Host "  Share the https://*.trycloudflare.com URL with your team!" -ForegroundColor Green
Write-Host ""

& cloudflared tunnel --url http://localhost:$Port
