package com.roadtraffic.bigdata.mapreduce;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class AccidentRunner {

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.err.println("Usage: AccidentRunner <input_path> <output_path>");
            System.exit(1);
        }

        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "accident factor counter");
        job.setJarByClass(AccidentRunner.class);

        job.setMapperClass(AccidentMapper.class);
        job.setReducerClass(AccidentReducer.class);
        job.setCombinerClass(AccidentReducer.class);

        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}
