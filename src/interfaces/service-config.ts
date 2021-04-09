export class ServiceConfig {

    endpoint_name: string;
    endpoint_url: string;
    topics: string[];

    static fromEnv(): ServiceConfig {

        const endpoint_name = process.env.ENDPOINT_NAME;
        if (!endpoint_name) return null;
        const endpoint_url = process.env.ENDPOINT_URL;
        if (!endpoint_url) return null;
        const topicString = process.env.TOPICS;
        if (!topicString) return null;
        const topics = topicString.split(',').map((t) => t.trim());
        if (!topics || !topics.length) return null;
        
        const config: ServiceConfig = { endpoint_name, endpoint_url, topics };

        if (isServiceConfig(config)){
            return config;
        }
        else {
            return null;
        }

    }
}

export function isServiceConfig(config: any): config is ServiceConfig {
    if (config && config.endpoint_name && config.endpoint_url && config.topics && config.topics.length) {
        return true;
    }
    return false;
    
}