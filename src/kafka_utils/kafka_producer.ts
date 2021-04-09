import { Kafka, Producer } from 'kafkajs';	
import { KafkaConfig } from '../interfaces/kafka-config';

export class KafkaProducer {	

    private _kafka: Kafka;	
    private _producer: Producer;	
    private _topic: string;

    constructor(config: KafkaConfig, topic: string) {	
        this._kafka = new Kafka({	
            brokers: config.brokers,
            ssl: true,	
            sasl: {	
                mechanism: 'plain',	
                username: config.username,
                password: config.password
            }	
        });	
        this._topic = topic;
        this._producer = this._kafka.producer();	
    }	

    async sendMessage(event: any, key?: string): Promise<void> {	
        try {	
            await this._producer.connect();
            await this._producer.send({	
                topic: this._topic,	
                messages: [	
                    { key, value: Buffer.from(JSON.stringify(event)) }	
                ]	
            });	
        }	
        catch (e) {	
            const error = `Error sending event to ${this._topic} - ${JSON.stringify(e)} - ${JSON.stringify(event)}`;	
            console.error(new Error(error));	
            throw new Error(error);	
        }	
        finally {	
            this._producer.disconnect();	
        }	

    }	

} 
