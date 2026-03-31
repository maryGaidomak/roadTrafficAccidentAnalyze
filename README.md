# Backend: Инфраструктура Big Data для обработки данных по ДТП

Учебный backend-проект на **Node.js + TypeScript + Express + MongoDB + Kafka**.

## Что делает система

- **simulator** генерирует поток дорожной телеметрии и инцидентов;
- **processor** читает события из Kafka, валидирует их, сохраняет в MongoDB и обновляет агрегаты риска;
- **app** отдаёт REST API для dashboard и аналитики.

## Требования

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Настройка

```bash
cp .env.example .env
npm install
```

## NPM scripts

- `npm run dev` — backend в watch-режиме
- `npm run build` — сборка TypeScript
- `npm run start` — запуск backend из `dist`
- `npm run simulator` — запуск генератора событий
- `npm run processor` — запуск Kafka consumer/processor
- `npm run seed:segments` — сидирование дорожных сегментов
- `npm run seed:historical` — сидирование исторической статистики ДТП
- `npm run seed:risk` — сидирование начальных агрегатов риска
- `npm run lint` — проверка TypeScript
- `npm run smoke` — базовый smoke-check API
- `npm run smoke:e2e` — e2e smoke-сценарий потока simulator -> Kafka -> processor -> API

## API endpoints

- `GET /health`
- `GET /api/incidents/recent?limit=50`
- `GET /api/telemetry/recent?segmentId=SEG-101&limit=100`
- `GET /api/risk/top?limit=10`
- `GET /api/stats/summary`
- `GET /api/stats/historical?region=north&from=2026-03-01&to=2026-03-31`
- `GET /api/segments/:id`
- `GET /api/regions`

## Полный сценарий запуска через Docker

### 1) Поднять инфраструктуру и API

```bash
docker compose up --build -d mongo kafka app
```

### 2) Засидировать демо-данные

```bash
docker compose run --rm app npm run seed:segments
docker compose run --rm app npm run seed:historical
docker compose run --rm app npm run seed:risk
```

### 3) Запустить simulator

```bash
docker compose up -d simulator
```

### 4) Запустить processor

```bash
docker compose up -d processor
```

### 5) Проверить API

```bash
curl "http://localhost:3000/health"
curl "http://localhost:3000/api/telemetry/recent?limit=20"
curl "http://localhost:3000/api/incidents/recent?limit=20"
curl "http://localhost:3000/api/risk/top?limit=10"
```

## Smoke scenario (end-to-end)

Когда `app`, `simulator`, `processor` запущены:

```bash
npm run smoke:e2e
```

Скрипт проверяет:
- API отвечает на `/health`;
- новые telemetry появляются со временем;
- endpoint incidents доступен и отдаёт данные/изменения;
- `risk/top` возвращает агрегаты риска.

## Режимы simulator

- `SIMULATOR_MODE=kafka`
- `SIMULATOR_MODE=kafka+mongo`
- `SIMULATOR_MODE=console`

Для docker-сценария по умолчанию в `docker-compose.yml` для сервиса simulator используется `SIMULATOR_MODE=kafka`, чтобы запись в Mongo делал именно processor.

## Формат ошибок API

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter: limit"
  }
}
```
