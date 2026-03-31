import { Kafka, Producer } from 'kafkajs';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

class KafkaProducer {
  private readonly producer: Producer;
  private connected = false;

  constructor() {
    const kafka = new Kafka({
      clientId: env.kafkaClientId,
      brokers: env.kafkaBrokers
    });
    this.producer = kafka.producer();
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    await this.producer.connect();
    this.connected = true;
    logger.info('Kafka producer connected');
  }

  public async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    await this.producer.disconnect();
    this.connected = false;
    logger.info('Kafka producer disconnected');
  }

  public async publish(topic: string, message: unknown): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export const kafkaProducer = new KafkaProducer();
