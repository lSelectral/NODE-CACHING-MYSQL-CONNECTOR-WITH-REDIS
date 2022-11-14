const redis = require('redis');
require('dotenv').config();


const client = redis.createClient({
    host: process.env.REDIS_SERVER,
    post: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});


client.on('error', (err) => {
    console.error(err);
});

module.exports = {
    async getArrayItem(key) {
        return new Promise((resolve, reject) => {
            client.exists(key, (err, ok) => {
                if (err) reject(err.message);
                else {
                    client.get(key, (err, reply) => {
                        if (err) reject(err.message);
                        else {
                            if (reply) resolve(JSON.parse(reply));
                            else resolve([]);
                        }
                    });
                }
            });
        })
    },
    async addArrayItem(key, array,expiryDate=40000) {
        return new Promise((resolve, reject) => {
            client.SETEX(key, parseInt((+new Date)/1000) + expiryDate, JSON.stringify(array), (ok) => {
                resolve(array);
            });
        })
    },
    async delKeyItem(keys) {
        return new Promise((resolve, reject) => {
            client.DEL(keys, (ok) => {
                resolve();
            });
        });
    },
    async delPrefixKeyItem(keys) {
        return new Promise((resolve, reject) => {
            if (Array.isArray(keys)) {
                keys.forEach((el, elIndex) => {
                    client.keys(el, (err, data) => {
                        if (err) reject(err.message);
                        else {
                            if (!data.length) {
                                resolve();
                            }
                            data.forEach((keyItem, index) => {
                                client.DEL(keyItem, (ok) => {
                                    if (index + 1 == data.length && keys.length == elIndex + 1) {
                                        resolve();
                                    }
                                });
                            });
                        }
                    })
                })
            } else {
                client.keys(keys, (err, data) => {
                    if (err) reject(err.message);
                    else {
                        if (!data.length) {
                            resolve();
                        }
                        data.forEach((keyItem, index) => {
                            client.DEL(keyItem, (ok) => {
                                if (index + 1 == data.length) {
                                    resolve();
                                }
                            });
                        });
                    }
                })
            }
        });
    },
    getRedisClient() {
        return client;
    }
}