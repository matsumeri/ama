# AMA

AMA es una capa simple para centralizar el uso de APIs de Meta Ads.

## Stack

- Frontend: Angular + TypeScript
- Backend: Node.js + Express + TypeScript

## Estructura

- frontend: interfaz para modulos y consultas
- backend: endpoints base para integrar APIs de Meta

## Modulos incluidos (por uso)

- Marketing Management API
- Insights & Reporting API
- Audiences API
- Lead Ads API
- Commerce & Catalog API
- Pixel & Conversions API
- Business Assets API
- Meta Ad Library API (foco principal)

## Foco actual: Biblioteca de Anuncios Meta

El modulo Biblioteca de Anuncios ya tiene:

- Formulario de busqueda por termino, pais, tipo y limite
- Endpoint backend que consulta ads_archive de Meta Graph API
- Vista de resultados con datos basicos y link a snapshot

## Seguridad operativa

- API key opcional via header x-api-key (configurada con AMA_API_KEY)
- Rate limit configurable por ventana y maximo de requests
- Manejo de errores estandarizado (validacion, errores Meta, errores internos)

## Modulo real habilitado: Marketing Management API

Tambien disponible en frontend en la ruta:

- /marketing-management

Incluye:

- Carga de campañas, ad sets y ads por adAccountId
- Formularios para crear campañas, ad sets y ads
- Acciones rapidas para pausar entidades
- Filtros por texto/estado y paginacion por tabla
- Filtros por rango de fecha (from/to) y ordenamiento por nombre/status/id/fecha
- Panel de observabilidad para reintentos y errores Meta

Endpoints base para integracion con Graph API:

- GET /api/meta/marketing/campaigns?adAccountId=123
- POST /api/meta/marketing/campaigns
- PATCH /api/meta/marketing/campaigns/:campaignId
- GET /api/meta/marketing/adsets?adAccountId=123
- POST /api/meta/marketing/adsets
- PATCH /api/meta/marketing/adsets/:adSetId
- GET /api/meta/marketing/ads?adAccountId=123
- POST /api/meta/marketing/ads
- PATCH /api/meta/marketing/ads/:adId

Ad Library:

- POST /api/meta/ad-library/search
- GET /api/meta/ad-library/search-text?q=fitness&adReachedCountries=US&limit=25

Observabilidad:

- GET /api/meta/observability
- POST /api/meta/observability/reset

## Configuracion

1. Copia backend/.env.example a backend/.env.
2. Define META_ACCESS_TOKEN con un token valido de Meta.
3. Define AMA_API_KEY para exigir autenticacion por API key.
4. Ajusta reintentos Meta si lo necesitas:
	- META_RETRY_ATTEMPTS
	- META_RETRY_BASE_DELAY_MS
5. Define ruta de persistencia de observabilidad (opcional):
	- OBSERVABILITY_STORE_PATH

## Ejecutar

En dos terminales:

1. Frontend

```bash
npm --prefix frontend run start
```

Nota para Codespaces: este comando ya levanta Angular con host 0.0.0.0 y permite hostnames *.app.github.dev.
Tambien configura NG_ALLOWED_HOSTS para evitar el error "URL with hostname ... is not allowed".

2. Backend

```bash
npm --prefix backend run dev
```

URLs:

- Frontend: http://localhost:4200
- Backend: http://localhost:4000

Si defines AMA_API_KEY, envia header obligatorio:

```text
x-api-key: tu_clave
```

## Resiliencia y errores Meta

- Reintentos automaticos con backoff exponencial + jitter para errores de red, HTTP 429 y HTTP 5xx
- Mapeo de errores comunes de Meta (token expirado, permisos insuficientes, rate limits y request invalido)
- Persistencia en disco de metricas de observabilidad para mantener contadores tras reinicios
