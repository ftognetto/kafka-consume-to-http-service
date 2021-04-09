export class KafkaConfig {

    brokers: string[];
    username: string;
    password: string;

    static fromEnv(): KafkaConfig {

        const brokersString = process.env.KAFKA_BROKERS;
        if (!brokersString) return null;
        const brokers = brokersString.split(',').map((t) => t.trim());
        if (!brokers || !brokers.length) return null;

        const username = process.env.KAFKA_USERNAME;
        if (!username) return null;
        const password = process.env.KAFKA_PASSWORD;
        if (!password) return null;
        
        
        const config: KafkaConfig = { brokers, username, password };

        if (isKafkaConfig(config)){
            return config;
        }
        else {
            return null;
        }

    }
}

export function isKafkaConfig(config: any): config is KafkaConfig {
    if (config && config.brokers && config.brokers.length && config.username && config.password) {
        return true;
    }
    return false;
    
}