FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3600
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY scripts/ocr.swift ./scripts/ocr.swift
RUN mkdir .data && chown -R node:node /app
USER node
EXPOSE 3600
CMD ["node","server/index.mjs"]
