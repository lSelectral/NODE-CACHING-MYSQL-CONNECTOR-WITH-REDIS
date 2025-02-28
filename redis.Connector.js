const redis = require('redis');
const { promisify } = require('util');
require('dotenv').config();

const client = redis.createClient({
    host: process.env.REDIS_SERVER,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

client.on('error', (err) => {
    console.error(err);
});

const existsAsync = promisify(client.exists).bind(client);
const getAsync = promisify(client.get).bind(client);
const setexAsync = promisify(client.setex).bind(client);
const delAsync = promisify(client.del).bind(client);
const keysAsync = promisify(client.keys).bind(client);

function _namespaceKey(key) {
    return process.env.REDIS_VHOST ? `${process.env.REDIS_VHOST}:${key}` : key;
}

module.exports = {
    async getArrayItem(key) {
        const namespacedKey = _namespaceKey(key);
        const exists = await existsAsync(namespacedKey);
        if (exists) {
            const reply = await getAsync(namespacedKey);
            return JSON.parse(reply);
        }
        return [];
    },

    async addArrayItem(key, array, expiryDate = 40000) {
        const namespacedKey = _namespaceKey(key);
        await setexAsync(namespacedKey, expiryDate, JSON.stringify(array));
        return array;
    },

    async delKeyItem(keys) {
        if (Array.isArray(keys)) {
            const namespacedKeys = keys.map(key => _namespaceKey(key));
            await delAsync(namespacedKeys);
        } else {
            const namespacedKey = _namespaceKey(keys);
            await delAsync(namespacedKey);
        }
    },

    async delPrefixKeyItem(keys) {
        if (Array.isArray(keys)) {
            for (const el of keys) {
                const namespacedPattern = _namespaceKey(`${el}*`);
                const data = await keysAsync(namespacedPattern);
                if (data.length) {
                    await Promise.all(data.map(keyItem => delAsync(keyItem)));
                }
            }
        } else {
            const namespacedPattern = _namespaceKey(`${keys}*`);
            const data = await keysAsync(namespacedPattern);
            if (data.length) {
                await Promise.all(data.map(keyItem => delAsync(keyItem)));
            }
        }
    },

    getRedisClient() {
        return client;
    }
};