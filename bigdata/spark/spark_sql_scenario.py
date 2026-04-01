from pyspark.sql import SparkSession


def main() -> None:
    spark = (
        SparkSession.builder
        .appName("RoadTrafficAccidentSparkSQLScenario")
        .master("spark://spark-master:7077")
        .getOrCreate()
    )

    accidents = (
        spark.read
        .option("header", True)
        .option("inferSchema", True)
        .csv("hdfs://namenode:9000/user/root/input/accidents_sample.csv")
    )
    vehicles = (
        spark.read
        .option("header", True)
        .option("inferSchema", True)
        .csv("hdfs://namenode:9000/user/root/input/vehicles_sample.csv")
    )
    participants = (
        spark.read
        .option("header", True)
        .option("inferSchema", True)
        .csv("hdfs://namenode:9000/user/root/input/participants_sample.csv")
    )

    accidents.createOrReplaceTempView("accidents")
    vehicles.createOrReplaceTempView("vehicles")
    participants.createOrReplaceTempView("participants")

    print("=== GROUP BY: accidents by region/severity/weather/time_of_day ===")
    spark.sql(
        """
        SELECT region, severity, weather, time_of_day, COUNT(*) AS accidents_count
        FROM accidents
        GROUP BY region, severity, weather, time_of_day
        ORDER BY accidents_count DESC, region
        """
    ).show(truncate=False)

    print("=== JOIN: average participant age and vehicles per accident by region ===")
    spark.sql(
        """
        SELECT
          a.region,
          COUNT(DISTINCT a.accident_id) AS accidents_total,
          COUNT(DISTINCT v.vehicle_id) AS vehicles_total,
          ROUND(AVG(p.age), 2) AS avg_participant_age
        FROM accidents a
        LEFT JOIN vehicles v ON a.accident_id = v.accident_id
        LEFT JOIN participants p ON a.accident_id = p.accident_id
        GROUP BY a.region
        ORDER BY accidents_total DESC, a.region
        """
    ).show(truncate=False)

    spark.stop()


if __name__ == "__main__":
    main()
