# Big Data контур для проекта roadTrafficAccidentAnalyze

Этот контур добавлен **отдельно** от application stack и не ломает существующие сервисы:
- `app`
- `mongo`
- `kafka`
- `simulator`
- `processor`

Big Data контур запускается отдельным compose-файлом и включает:
- Hadoop HDFS + YARN
- MapReduce execution environment
- Spark (master/workers + client) для Spark SQL

---

## 1) Структура `bigdata/`

```text
bigdata/
├── docker-compose.bigdata.yml
├── hadoop.env
├── README.bigdata.md
├── data/
│   └── hdfs-input/
│       ├── accidents_sample.csv
│       ├── vehicles_sample.csv
│       └── participants_sample.csv
├── mapreduce/
│   ├── pom.xml
│   └── src/main/java/com/roadtraffic/bigdata/mapreduce/
│       ├── AccidentMapper.java
│       ├── AccidentReducer.java
│       └── AccidentRunner.java
└── spark/
    ├── spark_sql_scenario.py
    └── conf/
        ├── core-site.xml
        └── hdfs-site.xml
```

---

## 2) Запуск Big Data stack

```bash
docker compose -f bigdata/docker-compose.bigdata.yml up -d
```

Проверка статуса:

```bash
docker compose -f bigdata/docker-compose.bigdata.yml ps
```

Остановка:

```bash
docker compose -f bigdata/docker-compose.bigdata.yml down
```

Остановка с удалением томов:

```bash
docker compose -f bigdata/docker-compose.bigdata.yml down -v
```

---

## 3) Доступные UI и порты

### Hadoop
- NameNode UI: http://localhost:9870
- NameNode RPC: `localhost:9000`
- ResourceManager UI: http://localhost:8088
- HistoryServer UI: http://localhost:8188

### Spark
- Spark Master UI: http://localhost:8080
- Spark Worker 1 UI: http://localhost:8081
- Spark Worker 2 UI: http://localhost:8082
- Spark driver UI (client jobs): http://localhost:4040

> В этом контуре Spark UI явно вынесен на `localhost:4040` через `spark-client`.

---

## 4) Подготовка данных в HDFS

Скопировать sample CSV в NameNode контейнер и загрузить в HDFS:

```bash
docker cp bigdata/data/hdfs-input/. bigdata-namenode:/tmp/hdfs-input/

docker exec -it bigdata-namenode bash -lc '
  hdfs dfs -mkdir -p /user/root/input &&
  hdfs dfs -put -f /tmp/hdfs-input/*.csv /user/root/input/
'
```

Проверить загрузку:

```bash
docker exec -it bigdata-namenode hdfs dfs -ls /user/root/input
```

---

## 5) MapReduce: учебный skeleton

Папка: `bigdata/mapreduce/`

Логика шаблона:
- `AccidentMapper` формирует ключ комбинации факторов ДТП:
  - `region|severity|weather|time_of_day`
- `AccidentReducer` считает количество записей по ключу
- `AccidentRunner` запускает Job

### Сборка jar

```bash
cd bigdata/mapreduce
mvn -q clean package
cd ../..
```

### Запуск в Hadoop

```bash
docker cp bigdata/mapreduce/target/accident-factor-counter-1.0.0.jar bigdata-namenode:/tmp/

docker exec -it bigdata-namenode bash -lc '
  hdfs dfs -rm -r -f /user/root/output/accident_factors || true
  hadoop jar /tmp/accident-factor-counter-1.0.0.jar \
    com.roadtraffic.bigdata.mapreduce.AccidentRunner \
    /user/root/input/accidents_sample.csv \
    /user/root/output/accident_factors
'
```

Просмотр результата:

```bash
docker exec -it bigdata-namenode hdfs dfs -cat /user/root/output/accident_factors/part-r-00000
```

---

## 6) Spark SQL sample scenario

Папка: `bigdata/spark/spark_sql_scenario.py`

Сценарий делает:
1. Чтение 3 CSV из HDFS в DataFrame:
   - `accidents`
   - `vehicles`
   - `participants`
2. Регистрацию временных таблиц
3. SQL-запросы:
   - `GROUP BY`
   - `JOIN`
4. Вывод результатов в консоль

### Запуск Spark SQL сценария

```bash
docker exec -it bigdata-spark-client spark-submit \
  --master spark://spark-master:7077 \
  /opt/bitnami/spark/jobs/spark_sql_scenario.py
```

---

## 7) Важно про независимость контуров

- Application stack продолжает жить в своих compose-файлах и сервисах.
- Big Data stack запускается отдельно через:
  - `docker compose -f bigdata/docker-compose.bigdata.yml ...`
- Конфликты портов отсутствуют с типовым запуском текущего backend-контура (кроме случая, если на хосте уже заняты 8080/8081/8082/8088/9870/4040).

---

## 8) Быстрый smoke-check Big Data контура

```bash
# 1) Запуск
docker compose -f bigdata/docker-compose.bigdata.yml up -d

# 2) Проверка UI
# NameNode   -> http://localhost:9870
# YARN RM    -> http://localhost:8088
# Spark Mstr -> http://localhost:8080

# 3) Загрузка данных
docker cp bigdata/data/hdfs-input/. bigdata-namenode:/tmp/hdfs-input/
docker exec -it bigdata-namenode bash -lc 'hdfs dfs -mkdir -p /user/root/input && hdfs dfs -put -f /tmp/hdfs-input/*.csv /user/root/input/'

# 4) Spark SQL сценарий
docker exec -it bigdata-spark-client spark-submit --master spark://spark-master:7077 /opt/bitnami/spark/jobs/spark_sql_scenario.py
```
