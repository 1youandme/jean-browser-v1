# JeanTrail Dockerfile
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY tailwind.config.js ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci --only=production

# Build frontend
RUN npm run build

# Rust backend stage
FROM rust:1.70-alpine AS backend-builder

# Install required system dependencies
RUN apk add --no-cache \
    musl-dev \
    pkgconfig \
    openssl-dev \
    sqlite-dev \
    postgresql-dev

WORKDIR /app

# Copy Cargo files
COPY src-tauri/Cargo.toml ./src-tauri/
COPY src-tauri/Cargo.lock ./src-tauri/
COPY src-tauri/src/ ./src-tauri/src/

# Copy frontend build
COPY --from=frontend-builder /app/dist ./src-tauri/dist/

# Build Rust backend
WORKDIR /app/src-tauri
RUN cargo build --release

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    sqlite \
    postgresql-client \
    curl

# Create app user
RUN addgroup -g 1001 -S jeantrail && \
    adduser -S jeantrail -u 1001 -G jeantrail

WORKDIR /app

# Copy the binary
COPY --from=backend-builder /app/src-tauri/target/release/jeantrail ./

# Copy database schema
COPY database/ ./database/

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/plugins && \
    chown -R jeantrail:jeantrail /app

# Switch to non-root user
USER jeantrail

# Expose ports
EXPOSE 3000 8080

# Environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://jeantrail:password@localhost:5432/jeantrail
ENV RUST_LOG=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["./jeantrail"]