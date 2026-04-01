# Backend: Инфраструктура Big Data для обработки данных по ДТП

Учебный backend-проект на **Node.js + TypeScript + Express + MongoDB + Kafka**.

В репозитории теперь два независимых контура:

1. **Application stack**: `app`, `mongo`, `kafka`, `simulator`, `processor`
2. **Big data stack**: Hadoop (HDFS + YARN) + Spark

## Файлы Compose

- `docker-compose.app.yml` — только application stack.
- `bigdata/docker-compose.bigdata.yml` — только big data stack.
- `docker-compose.yml` — совместим с app-контуром (legacy, оставлен рабочим).

## Требования

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Настройка

```bash
cp .env.example .env
npm install
```

> При запуске через Docker Compose адреса инфраструктуры для контейнеров переопределяются автоматически: `MONGO_URI=mongodb://mongo:27017`, `KAFKA_BROKERS=kafka:9092`.

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
- `npm run smoke` — базовый smoke-check API
- `npm run smoke:e2e` — e2e smoke-сценарий потока simulator -> Kafka -> processor -> API
- `npm run smoke:historical` — smoke-check historical import + `/api/stats/historical`

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

## A. Запуск application stack

### 1) Поднять backend-контур

```bash
docker compose -f docker-compose.app.yml up --build -d mongo kafka app
```

### 2) Demo mode (быстрая демонстрация)

```bash
docker compose -f docker-compose.app.yml exec -T app npm run seed:segments
docker compose -f docker-compose.app.yml exec -T app npm run seed:historical
docker compose -f docker-compose.app.yml exec -T app npm run seed:risk
```

### 3) Real data mode (импорт файлов)

```bash
docker compose -f docker-compose.app.yml exec -T app npm run import:segments -- ./data/examples/road_segments.sample.json
docker compose -f docker-compose.app.yml exec -T app npm run import:historical -- ./data/examples/historical_stats.sample.json
```

### 4) Запустить simulator и processor

```bash
docker compose -f docker-compose.app.yml up -d simulator processor
```

### 5) Проверить API

```bash
curl "http://localhost:3000/health"
curl "http://localhost:3000/api/telemetry/recent?limit=20"
curl "http://localhost:3000/api/incidents/recent?limit=20"
curl "http://localhost:3000/api/risk/top?limit=10"
curl "http://localhost:3000/api/stats/historical"
```

> Почему `exec`, а не `run`: `docker compose run` создаёт one-off контейнеры со случайными именами.

---

## B. Запуск big data stack (Hadoop + Spark)

### 1) Поднять Hadoop и Spark

```bash
docker compose -f bigdata/docker-compose.bigdata.yml up -d
```

### 2) Проверить UI

- NameNode UI: http://localhost:9870
- ResourceManager UI: http://localhost:8088
- Spark Master UI: http://localhost:8080
- Spark Worker UI: http://localhost:8081, http://localhost:8082

### 3) Проверить HDFS report

```bash
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hdfs dfsadmin -report
```

### 4) Создать директорию в HDFS

```bash
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hdfs dfs -mkdir -p /data/traffic/input
```

### 5) Загрузить файл в HDFS

```bash
docker cp data/hdfs-input/traffic_events_sample.txt bigdata-namenode:/tmp/traffic_events_sample.txt
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hdfs dfs -put -f /tmp/traffic_events_sample.txt /data/traffic/input/
```

### 6) Показать ls / cat / setrep

```bash
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hdfs dfs -ls /data/traffic/input
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hdfs dfs -cat /data/traffic/input/traffic_events_sample.txt
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hdfs dfs -setrep -w 2 /data/traffic/input/traffic_events_sample.txt
```

### 7) Выполнить MapReduce (wordcount)

```bash
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hadoop jar /opt/hadoop-3.2.1/share/hadoop/mapreduce/hadoop-mapreduce-examples-3.2.1.jar wordcount /data/traffic/input /data/traffic/output-wordcount
```

### 8) Показать результат MapReduce

```bash
docker compose -f bigdata/docker-compose.bigdata.yml exec -T namenode hdfs dfs -cat /data/traffic/output-wordcount/part-r-00000
```

### 9) Spark SQL (чтение из HDFS)

```bash
docker compose -f bigdata/docker-compose.bigdata.yml exec -T spark-master /opt/spark/bin/spark-sql -e "SELECT 'spark-ok' as status"
```

---

## Как продемонстрировать Hadoop/Spark часть

1. Поднять big data stack: `docker compose -f bigdata/docker-compose.bigdata.yml up -d`
2. Открыть NameNode UI: `http://localhost:9870`
3. Выполнить `hdfs dfsadmin -report`
4. Создать директорию в HDFS
5. Загрузить файл в HDFS
6. Показать `hdfs dfs -ls`, `hdfs dfs -cat`, `hdfs dfs -setrep`
7. Запустить MapReduce `wordcount`
8. Показать output в HDFS
9. Открыть Spark UI (`http://localhost:8080`) или выполнить Spark SQL

---

## Структура данных для batch

- `data/examples/` — примеры JSON для импортов backend
- `data/historical/` — место для исторических batch-файлов
- `data/hdfs-input/` — входные файлы для HDFS/MapReduce/Spark

## Форматы входных файлов для импортера backend

Примеры:
- `data/examples/historical_stats.sample.json`
- `data/examples/road_segments.sample.json`

Поддерживаются `JSON` и `CSV`.
Для event-level исторических файлов (например `REGIONS`, `DATE_TIME`, `SUFFER_AMOUNT`, `LOST_AMOUNT`) импортёр агрегирует данные до уровня `region + date`.

## Порты

- NameNode UI: `9870`
- ResourceManager UI: `8088`
- Spark Master UI: `8080`
- Spark Worker UI: `8081`, `8082`
- App API: `3000`
- Kafka: `9092`
- MongoDB: `27017`
