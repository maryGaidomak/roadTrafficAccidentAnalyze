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

> При запуске через Docker Compose адреса инфраструктуры переопределяются автоматически: `MONGO_URI=mongodb://mongo:27017`, `KAFKA_BROKERS=kafka:9092`.

## NPM scripts

- `npm run dev` — backend в watch-режиме
- `npm run build` — сборка TypeScript
- `npm run start` — запуск backend из `dist`
- `npm run simulator` — запуск генератора событий
- `npm run processor` — запуск Kafka consumer/processor
- `npm run seed:segments` — сидирование **demo** дорожных сегментов
- `npm run seed:historical` — сидирование **demo** исторической статистики ДТП
- `npm run seed:risk` — сидирование **demo** агрегатов риска
- `npm run import:segments -- ./data/examples/road_segments.sample.json` — импорт road segments из JSON/CSV
- `npm run import:historical -- ./data/examples/historical_stats.sample.json` — импорт historical accident stats из JSON/CSV
- `npm run lint` — проверка TypeScript
- `npm run smoke` — базовый smoke-check API
- `npm run smoke:e2e` — e2e smoke-сценарий потока simulator -> Kafka -> processor -> API
- `npm run smoke:historical` — smoke-check импорта historical данных + проверка `/api/stats/historical`

## API endpoints

- `GET /health`
- `GET /api/incidents/recent?limit=50`
- `GET /api/telemetry/recent?segmentId=SEG-101&limit=100`
- `GET /api/risk/top?limit=10`
- `GET /api/stats/summary`
- `GET /api/stats/historical?region=Moscow&from=2026-03-01&to=2026-03-31`
- `GET /api/segments/:id`
- `GET /api/regions`

---

## Demo mode (сценарий A)

Используется для быстрой демонстрации без внешних исторических файлов.

### 1) Поднять инфраструктуру и API

```bash
docker compose up --build -d mongo kafka app
```

### 2) Засидировать demo data

```bash
docker compose exec -T app npm run seed:segments
docker compose exec -T app npm run seed:historical
docker compose exec -T app npm run seed:risk
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
curl "http://localhost:3000/api/stats/historical?region=Moscow"
```

---

## Real data import mode (сценарий B)

Используется для загрузки исторических данных и дорожных сегментов из реальных/внешних файлов.

### 1) Поднять инфраструктуру и API

```bash
docker compose up --build -d mongo kafka app
```

### 2) Импортировать road segments из файла

```bash
docker compose exec -T app npm run import:segments -- ./data/examples/road_segments.sample.json
# или через env:
# docker compose exec -T -e IMPORT_FILE_PATH=./data/examples/road_segments.sample.json app npm run import:segments
```

### 3) Импортировать historical accident stats из файла

```bash
docker compose exec -T app npm run import:historical -- ./data/examples/historical_stats.sample.json
# или через env:
# docker compose exec -T -e IMPORT_FILE_PATH=./data/examples/historical_stats.sample.json app npm run import:historical
```

### 4) Запустить simulator

```bash
docker compose up -d simulator
```

### 5) Запустить processor

```bash
docker compose up -d processor
```

### 6) Проверить API

```bash
curl "http://localhost:3000/health"
curl "http://localhost:3000/api/telemetry/recent?limit=20"
curl "http://localhost:3000/api/incidents/recent?limit=20"
curl "http://localhost:3000/api/risk/top?limit=10"
curl "http://localhost:3000/api/stats/historical"
```

### 7) Дополнительный smoke-check historical import

```bash
npm run smoke:historical
```

---

## Форматы входных файлов для импорта

Примеры лежат в `data/examples/`:

- `historical_stats.sample.json`
- `road_segments.sample.json`

Поддерживаемые форматы: **JSON** и **CSV**.

### Минимальная схема historical данных

- `region`
- `date`
- `accidentsCount`
- `injuriesCount`
- `fatalitiesCount`
- `event_time` (опционально, будет вычислен)
- `updatedAt` (проставляется при импорте)

### Минимальная схема road segments

- `segmentId`
- `region`
- `name`
- `startPoint`/`endPoint` или координаты (`startLat/startLon/endLat/endLon` или `coordinates`)
- `speedLimit`
- `lanes`

Если часть полей имеет другие имена (например `segment_id`, `region_name`, `accidents`, `deaths`), импортер выполняет нормализацию.
Для event-level исторических файлов (например записи с `REGIONS`, `DATE_TIME`, `SUFFER_AMOUNT`, `LOST_AMOUNT`) импортер агрегирует данные до уровня `region + date`.
Записи с критически отсутствующими полями пропускаются с warning в логах.

---

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

## Как показать проект преподавателю

Рекомендуемый демонстрационный сценарий защиты:

1. Поднять контейнеры:
   ```bash
   docker compose up --build -d mongo kafka app
   ```
2. Загрузить данные (demo seed или real import):
   ```bash
   docker compose exec -T app npm run seed:segments
   docker compose exec -T app npm run seed:historical
   docker compose exec -T app npm run seed:risk
   # либо import:segments + import:historical
   ```
3. Запустить simulator:
   ```bash
   docker compose up -d simulator
   ```
4. Запустить processor:
   ```bash
   docker compose up -d processor
   ```
5. Открыть `/health`:
   ```bash
   curl "http://localhost:3000/health"
   ```
6. Открыть `/api/telemetry/recent`:
   ```bash
   curl "http://localhost:3000/api/telemetry/recent?limit=10"
   ```
7. Открыть `/api/incidents/recent`:
   ```bash
   curl "http://localhost:3000/api/incidents/recent?limit=10"
   ```
8. Открыть `/api/risk/top`:
   ```bash
   curl "http://localhost:3000/api/risk/top?limit=5"
   ```
9. Открыть `/api/stats/historical`:
   ```bash
   curl "http://localhost:3000/api/stats/historical"
   ```

> Примечание: `docker compose run` создаёт one-off контейнеры с случайными именами.
> Чтобы не видеть дополнительные "random-name" контейнеры, используйте `docker compose exec -T app ...` как в командах выше.

## Формат ошибок API

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter: limit"
  }
}
```
