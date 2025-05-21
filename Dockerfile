# Usar Node.js versión LTS
FROM node:20-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine para entender por qué se pueden necesitar libc6-compat
RUN apk add --no-cache libc6-compat postgresql-client
WORKDIR /app

# Copiar package.json y package-lock.json (si está disponible)
COPY package.json package-lock.json* ./
# Instalar dependencias y actualizar package-lock.json
RUN npm install

# Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js recopila información completamente anónima de telemetría para uso estadístico.
# Aprende más aquí: https://nextjs.org/telemetry
# Descomenta la siguiente línea en caso de querer deshabilitar la telemetría
ENV NEXT_TELEMETRY_DISABLED 1

# Ignora errores de ESLint en producción
ENV NEXT_LINT_IGNORE_ESLINT_ERROR=true

# Ejecuta build sin validación de tipos ni linting
RUN npm run build:prod

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Descomenta la siguiente línea en caso de querer deshabilitar la telemetría
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configuración automática de next/static y next/image.
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
