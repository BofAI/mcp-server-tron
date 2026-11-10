FROM node:24.22.1-bookworm-slim@sha256:1681862882da07ee5476fee047bcf34138833f1df42633bb25bcb0f438d5bf3d AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:24.22.1-bookworm-slim@sha256:1681862882da07ee5476fee047bcf34138833f1df42633bb25bcb0f438d5bf3d AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/build ./build
COPY docker-start.sh ./docker-start.sh

RUN chown -R root:root /app \
  && chmod -R go-w /app \
  && chmod 755 /app /app/docker-start.sh \
  && mkdir -p /app/logs \
  && chown node:node /app/logs \
  && chmod 750 /app/logs

USER node

ENV NODE_ENV=production
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=3001
ENV MCP_LOG_DIR=/app/logs

EXPOSE 3001

ENTRYPOINT ["./docker-start.sh"]
