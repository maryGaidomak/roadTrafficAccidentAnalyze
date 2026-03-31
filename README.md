# Backend: Инфраструктура Big Data для обработки данных по ДТП

Простой backend-проект для курсовой на стеке **Node.js + TypeScript + Express + MongoDB + Kafka**.

## Требования

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Структура

```text
src/
  api/
  config/
  domain/
  infrastructure/
  repositories/
  scripts/
  services/
  simulator/
  utils/
```

## Настройка окружения

```bash
cp .env.example .env
npm install
```

## Порядок локального запуска

1. Поднять MongoDB и Kafka:
   ```bash
   docker compose up -d mongo kafka
   ```
2. Запустить backend:
   ```bash
   npm run dev
   ```
3. (Опционально) Заполнить демо-данными:
   ```bash
   npm run seed:segments
   npm run seed:historical
   npm run seed:risk
   ```
4. Запустить simulator:
   ```bash
   npm run simulator
   ```

## Режимы simulator

- `SIMULATOR_MODE=kafka` — публикует только в Kafka.
- `SIMULATOR_MODE=kafka+mongo` — публикует в Kafka и пишет сырые события в MongoDB.
- `SIMULATOR_MODE=console` — не публикует, пишет события в логи.

## API endpoints

- `GET /health`
- `GET /api/incidents/recent?limit=50`
- `GET /api/telemetry/recent?segmentId=SEG-101&limit=100`
- `GET /api/risk/top?limit=10`
- `GET /api/stats/summary`
- `GET /api/stats/historical?region=north&from=2026-03-01&to=2026-03-31`
- `GET /api/segments/:id`
- `GET /api/regions`

## Примеры curl

```bash
curl "http://localhost:3000/health"
curl "http://localhost:3000/api/incidents/recent?limit=20"
curl "http://localhost:3000/api/telemetry/recent?segmentId=SEG-101&limit=50"
curl "http://localhost:3000/api/risk/top?limit=10"
curl "http://localhost:3000/api/stats/summary"
curl "http://localhost:3000/api/stats/historical?region=north&from=2026-03-20&to=2026-03-31"
curl "http://localhost:3000/api/segments/SEG-101"
curl "http://localhost:3000/api/regions"
```

## NPM scripts

- `npm run dev` — backend в watch-режиме
- `npm run build` — сборка TypeScript
- `npm run start` — запуск из `dist`
- `npm run simulator` — генерация телеметрии и инцидентов
- `npm run seed:segments` — сидирование дорожных сегментов
- `npm run seed:historical` — сидирование исторической статистики ДТП
- `npm run seed:risk` — сидирование агрегатов риска
- `npm run lint` — проверка TypeScript
- `npm run smoke` — smoke-проверка основных endpoint-ов

## Docker

Полный запуск:

```bash
docker compose up --build
```

## Примечания

- `node_modules/` исключены через `.gitignore` и `.dockerignore`.
- Индексы MongoDB инициализируются автоматически при старте backend.
- Формат ошибок API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter: limit"
  }
}
```
