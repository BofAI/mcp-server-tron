FROM node:24.22.3-trixie-slim@sha256:4d00acb4bcc42c454c4eb801526f7ad7f772ea3bd4fd168c5cc2e384abcbb9d4 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build
RUN npm prune --omit=dev && install -d -m 0750 /image/logs /image/home
RUN dpkg-query -s dash > /image/dash.status

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:675c532423b908f9e56f9d60a4e62309b63cd2a3175acb90a46b96f7ee68e121 AS runtime

WORKDIR /app

COPY package.json docker-start.cjs ./
COPY --chmod=0755 docker-start.sh ./
COPY --from=builder /usr/bin/dash /usr/bin/sh
COPY --from=builder /image/dash.status /var/lib/dpkg/status.d/dash
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder --chown=1000:1000 /image/logs /app/logs
COPY --from=builder --chown=1000:1000 /image/home /home/node

USER 1000:1000

ENV NODE_ENV=production
ENV HOME=/home/node
ENV PATH=/nodejs/bin:$PATH
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=3001
ENV MCP_LOG_DIR=/app/logs

EXPOSE 3001

ENTRYPOINT ["./docker-start.sh"]
