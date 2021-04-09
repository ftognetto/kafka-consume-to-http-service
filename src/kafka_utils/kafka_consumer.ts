import { Kafka, KafkaMessage, Batch } from 'kafkajs';	
import { KafkaConfig } from '../interfaces/kafka-config';

async function asyncForEach(array: any[], callback: (item: any, index: number, array: []) => Promise<void>): Promise<void> {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array as []);
    }
}

export interface KafkaConsumerConfig {
    onMessage: (message: KafkaMessage, batch: Batch) => Promise<void>;
    onError?: (error: Error, message: KafkaMessage, topic: string) => Promise<void>;
    onDisconnect?: (messagesRead: number) => void;
    retries?: number;
    timeout?: number;
    fromBeginning?: boolean;
}
export class KafkaConsumer {	

    private _kafka: Kafka;	
    private topics: (string | RegExp)[];
    private groupId: string;

    constructor(config: KafkaConfig, topics: (string | RegExp)[], groupId: string) {	
        this._kafka = new Kafka({	
            brokers: config.brokers,	
            ssl: true,	
            sasl: {	
                mechanism: 'plain',	
                username: config.username,	
                password: config.password
            }	
        });	
        this.topics = topics;
        this.groupId = groupId;
    }	

    async consume(config: KafkaConsumerConfig): Promise<void> {

        let messagesRead = 0;
        const consumer = this._kafka.consumer({ groupId: this.groupId });

        consumer.on('consumer.stop', async () => {
            await consumer.disconnect();
        });
        consumer.on('consumer.disconnect', async () => {
            console.log('kafka_consumer', `Disconnected consumer ${this.groupId} from ${this.topics}`);
            if (config.onDisconnect) { config.onDisconnect(messagesRead); }
        });

        await consumer.connect();
        await asyncForEach(this.topics, async (t) => {
            await consumer.subscribe({ topic: t, fromBeginning: config.fromBeginning === false ? false : true });
        });
        
        await consumer.run({
            
            // eachMessage: async (payload) => {
            //     messagesRead++;
            //     console.log('kafka_consumer', `Read message on topic ${payload.topic} partition ${payload.partition} - ${payload.message.value.toString()}`);
            //     try {
            //         await config.onMessage(payload.message);
            //     }
            //     catch (e) {
            //         console.error('kafka_consumer', new Error(`Error reading message on topic ${payload.topic} partition ${payload.partition} - ${payload.message.value.toString()} - ${JSON.stringify(e)}`));
            //         if (config.onError) { await config.onError(e, payload.message, payload.topic); }
            //     }
            // },
            // eachBatchAutoResolve: false,
            eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
                for (const message of batch.messages) {
                    if (!isRunning() || isStale()) { break; }
                    messagesRead++;
                    console.log('kafka_consumer', `Read message from topic ${batch.topic} partition ${batch.partition} - ${message.value.toString()}`);
                    try {
                        await config.onMessage(message, batch);
                    }
                    catch (e) {
                        // Custom Retry Mechanism
                        let throwError = true;
                        if (config.retries) {
                            for (let i = 0; i < config.retries; i++) {
                                try {
                                    await this._timeout(1000 * (i + 1));
                                    console.log('kafka_consumer', `(${(i + 1)}) Retry message from topic ${batch.topic} partition ${batch.partition} - ${message.value.toString()}`);
                                    await config.onMessage(message, batch);
                                    throwError = false;
                                    break;
                                }
                                catch (ee) {
                                    // error still present
                                    throwError = true;
                                }
                            }
                        }
                        // Nothing to do - throw Error
                        if (throwError) {
                            console.error('kafka_consumer', new Error(`Error processing message from topic ${batch.topic} partition ${batch.partition} - ${JSON.stringify(e)} - ${message.value.toString()} `));
                            if (config.onError) { await config.onError(e, message, batch.topic); }
                        }
                    }
                    resolveOffset(message.offset);
                    await heartbeat();
                }
            }
        });

        if (config.timeout) {
            setTimeout(async () => {
                await consumer.stop();
            }, config.timeout * 1000 );
        }
        
    }

    private async _timeout(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
   
} 
