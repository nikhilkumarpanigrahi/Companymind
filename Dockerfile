# ──────────────────────────────────────────────────────────────
#  CompanyMind Backend + Frontend  |  Multi-stage Docker build
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Build frontend ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY tsconfig*.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY src/ src/
RUN npm run build

# ── Stage 2: Production runtime ─────────────────────────────
FROM node:20-alpine AS runtime

LABEL maintainer="CompanyMind Team"
LABEL description="CompanyMind Express API + React Frontend"

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy backend source
COPY app.cjs server.cjs ./
COPY config/ config/
COPY controllers/ controllers/
COPY middleware/ middleware/
COPY models/ models/
COPY routes/ routes/
COPY services/ services/
COPY utils/ utils/
COPY validators/ validators/
COPY seeds/ seeds/
COPY scripts/ scripts/

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN adduser -D appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1

# Set production mode
ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "server.cjs"]
