# Backend: Инфраструктура Big Data для обработки данных по ДТП

Backend-приложение на **Node.js + TypeScript + Express + MongoDB + Kafka** для:
- приема/генерации/публикации дорожных событий;
- хранения событий и агрегатов в MongoDB;
- предоставления REST API для панели мониторинга ДТП.

## Структура проекта

```text
src/
  config/
  domain/
  api/
    controllers/
    routes/
  services/
  repositories/
  infrastructure/
    kafka/
    mongo/
  simulator/
  utils/
  scripts/
```

## Быстрый старт

1. Скопируйте переменные окружения:
   ```bash
   cp .env.example .env
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите инфраструктуру (MongoDB + Kafka):
   ```bash
   docker compose up -d mongo kafka
   ```
4. Запустите backend:
   ```bash
   npm run dev
   ```

## API

- `GET /health`
- `GET /api/incidents/recent?limit=20`
- `GET /api/telemetry/recent?limit=20`
- `GET /api/risk/top?limit=20`
- `GET /api/stats/summary`
- `GET /api/regions`
- `GET /api/segments/:id`
- `GET /api/stats/historical?limit=20`

## Kafka topics

- `road.telemetry`
- `road.incidents`

## Simulator

Запуск симулятора:

```bash
npm run simulator
```

Что делает:
- каждые 2–5 секунд генерирует телеметрию;
- с настраиваемой вероятностью создает инциденты;
- сериализует события в JSON и публикует в Kafka;
- при `SIMULATOR_WRITE_TO_MONGO=true` пишет сырые события в MongoDB.

## Полезные скрипты

- `npm run dev` — запуск API в watch режиме;
- `npm run build` — сборка TypeScript в `dist`;
- `npm run start` — запуск собранного приложения;
- `npm run simulator` — запуск генератора событий;
- `npm run lint` — проверка типов.

## Docker

Полный запуск:

```bash
docker compose up --build
```

## Переменные окружения

Смотрите `.env.example`.
