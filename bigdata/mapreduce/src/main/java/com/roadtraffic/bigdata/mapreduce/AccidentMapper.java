package com.roadtraffic.bigdata.mapreduce;

import java.io.IOException;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

/**
 * Input format (CSV):
 * accident_id,event_time,region,road_segment,severity,weather,time_of_day,injured_count,fatal_count
 */
public class AccidentMapper extends Mapper<LongWritable, Text, Text, IntWritable> {

    private static final IntWritable ONE = new IntWritable(1);

    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        String line = value.toString();
        if (line.startsWith("accident_id,")) {
            return;
        }

        String[] parts = line.split(",");
        if (parts.length < 7) {
            return;
        }

        String region = parts[2].trim();
        String severity = parts[4].trim();
        String weather = parts[5].trim();
        String timeOfDay = parts[6].trim();

        String factorKey = String.join("|", region, severity, weather, timeOfDay);
        context.write(new Text(factorKey), ONE);
    }
}
