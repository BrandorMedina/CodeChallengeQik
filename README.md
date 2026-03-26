# Banco Digital API

Microservicio bancario construido con NestJS, GraphQL, PostgreSQL, Redis y ElasticSearch. Soporta múltiples monedas (DOP, USD, EUR) con conversión automática en transferencias usando tasas de compra y venta.

---

## Stack tecnológico

| Tecnología | Rol |
|---|---|
| NestJS + TypeScript | Framework principal |
| GraphQL (Apollo Server v4) | API layer |
| PostgreSQL 16 | Base de datos principal |
| TypeORM + Migraciones | ORM y versionado de esquema |
| Redis 7 | Caching de consultas |
| ElasticSearch 8.17 | Búsqueda full-text de transacciones |
| Docker + Docker Compose | Infraestructura local |
| Jest | Pruebas unitarias con cobertura |

---

## Requisitos previos

- Node.js 20+
- Docker Desktop corriendo

---

## Instalación y ejecución local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar infraestructura (PostgreSQL + Redis + ElasticSearch)
docker-compose up -d postgres redis elasticsearch

# 4. Esperar ~20 segundos a que ElasticSearch esté listo, luego ejecutar migraciones
npm run migration:run:dev

# 5. Levantar la app en modo desarrollo
npm run start:dev
```

La app estará disponible en:
- **GraphQL Playground**: http://localhost:3000/graphql
- **Health Check**: http://localhost:3000/health

---

## Levantar todo con Docker (producción)

```bash
# Build + levantar todos los servicios incluyendo la app
docker-compose up --build -d

# Ver logs de la app
docker-compose logs -f app
```

---

## Scripts disponibles

```bash
npm run start:dev          # Desarrollo con hot-reload
npm run build              # Compilar TypeScript
npm run lint               # ESLint
npm run format             # Prettier
npm run test               # Tests unitarios
npm run test:cov           # Tests con reporte de cobertura

npm run migration:generate migrations/NombreMigracion  # Generar nueva migración
npm run migration:run      # Ejecutar migraciones pendientes
npm run migration:revert   # Revertir última migración
npm run migration:show     # Ver estado de migraciones
```

---

## Variables de entorno

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=banco_digital

REDIS_HOST=localhost
REDIS_PORT=6379

ES_NODE=http://localhost:9200
```

---

## Arquitectura del proyecto

```
src/
├── clients/              # Gestión de clientes
│   ├── dto/              # Types y Inputs GraphQL
│   ├── client.entity.ts
│   ├── clients.service.ts
│   ├── clients.resolver.ts
│   └── clients.module.ts
├── accounts/             # Cuentas bancarias por cliente
│   ├── dto/
│   ├── account.entity.ts
│   ├── accounts.service.ts
│   ├── accounts.resolver.ts
│   └── accounts.module.ts
├── transactions/         # Depósitos, retiros y transferencias
│   ├── dto/
│   ├── transaction.entity.ts
│   ├── transactions.service.ts
│   ├── transactions.resolver.ts
│   └── transactions.module.ts
├── currencies/           # Monedas y tasas de cambio (compra/venta)
│   ├── dto/
│   ├── currency.entity.ts
│   ├── exchange-rate.entity.ts
│   ├── currencies.service.ts
│   ├── currencies.resolver.ts
│   └── currencies.module.ts
├── elasticsearch/        # Módulo global de búsqueda
│   ├── elasticsearch.service.ts
│   └── elasticsearch.module.ts
├── health/               # Endpoint /health
│   ├── health.controller.ts
│   ├── redis.health.ts
│   └── health.module.ts
├── seed/                 # Datos iniciales reproducibles
│   ├── seed.service.ts
│   └── seed.module.ts
└── common/
    └── enums/            # CurrencyCode, TransactionType, AccountStatus
migrations/               # Migraciones TypeORM versionadas
```

---

## Modelo de datos

### Entidades principales

- **Client** — Titular de cuentas bancarias
- **Account** — Cuenta en una moneda específica (DOP, USD o EUR)
- **Transaction** — Depósito, retiro o transferencia con soporte de conversión de moneda
- **Currency** — Catálogo de monedas soportadas
- **ExchangeRate** — Tasa de cambio con precio de compra y venta por par de monedas

### Lógica de conversión de monedas

Las transferencias entre cuentas de distinta moneda aplican conversión automática:

| Dirección | Tasa usada | Descripción |
|---|---|---|
| Moneda extranjera → DOP | `buyRate` | El banco compra la moneda extranjera |
| DOP → Moneda extranjera | `sellRate` | El banco vende la moneda extranjera |
| Extranjera → Extranjera | `buyRate` + `sellRate` | Conversión cruzada vía DOP |

---

## Datos seed

Al iniciar la app por primera vez se insertan automáticamente:

- 3 monedas: **DOP**, **USD**, **EUR**
- 6 tasas de cambio con precio de compra y venta
- 3 clientes de prueba (Juan, María, Carlos)
- 5 cuentas en distintas monedas
- 4 transacciones de ejemplo

---

## Caching con Redis

Las consultas de transacciones se cachean con TTL de 60 segundos:
- `transactions:all` — lista completa
- `transactions:account:{id}` — por cuenta

El cache se invalida automáticamente después de cada depósito, retiro o transferencia.

---

## Búsqueda con ElasticSearch

Las transacciones se indexan en ElasticSearch al crearse. La búsqueda soporta:
- Búsqueda por tipo (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`)
- Búsqueda por moneda (`DOP`, `USD`, `EUR`)
- Búsqueda por descripción (full-text)
- Búsqueda por cuenta origen o destino

---

## Tests

```bash
# Correr todos los tests
npm run test

# Con reporte de cobertura (mínimo 70% lines/functions, 60% branches)
npm run test:cov
```

Módulos cubiertos:
- `ClientsService` — CRUD y validaciones
- `AccountsService` — balance y relaciones
- `TransactionsService` — depósito, retiro, transferencia, cache, ES
- `CurrenciesService` — conversión compra/venta y cross-currency

---

## URLs de servicios

| Servicio | URL |
|---|---|
| GraphQL Playground | http://localhost:3000/graphql |
| Health Check | http://localhost:3000/health |
| ElasticSearch | http://localhost:9200 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |