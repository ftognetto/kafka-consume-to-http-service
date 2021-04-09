import { ServiceConfig } from "./src/interfaces/service-config";
import { KafkaConfig } from "./src/interfaces/kafka-config";
import { KafkaConsumer } from './src/kafka_utils/kafka_consumer';
import { KafkaProducer } from './src/kafka_utils/kafka_producer';
import axios from 'axios';

const config: ServiceConfig = ServiceConfig.fromEnv();
if (!config) {
  throw Error('Config not valid');
}

const kafkaConfig: KafkaConfig = KafkaConfig.fromEnv();
if (!kafkaConfig) {
  throw Error('Kafka Config not valid');
}

console.log('kafka_consume_to_http', `Starting with configuration ${JSON.stringify(config)}`);

for (let t of config.topics) {

  const consumerTopic = [t];
  const consumerGroupId = `${config.endpoint_name}-${t}-consumer`;
  const consumer = new KafkaConsumer(kafkaConfig, consumerTopic, consumerGroupId);

  consumer.consume({
    onMessage: async (message) => {

      const baseUrl = config.endpoint_url;
      const relativeUrl = t.split('.').join('/');
      const dataString = message.value.toString();
      const data = JSON.parse(dataString);

      console.log(`Sending event ${data.type} to ${config.endpoint_name} - ${dataString}`);
      
      const res = await axios.post(`${baseUrl}/${relativeUrl}`, data);
      if (res.status !== 204) { 
        throw Error(JSON.stringify(res.data));
      }

    }, 
    onError: async (error, message, topic) => {
      try { 
          const errorMessage = { error, message, topic };
          const producer = new KafkaProducer(kafkaConfig, `${topic}.error`);
          await producer.sendMessage(errorMessage, message.key?.toString());
        }
        catch (ee) {
          console.error(new Error(`Error sending to dead letter queue ${t}.error from service ${config.endpoint_name} - ${JSON.stringify(ee)} - ${message.value.toString()}`));
          throw ee;
        }
    },
    onDisconnect: (messagesRead: number) => { 

    }
  });

}



