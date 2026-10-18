FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

ARG BUILD_ID=local
RUN --mount=type=secret,id=env_production,target=/app/.env.production,required=false npm run build

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
