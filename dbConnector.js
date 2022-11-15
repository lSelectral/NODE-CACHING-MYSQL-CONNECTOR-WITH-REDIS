const db = require('mysql');
const { getArrayItem, addArrayItem, delPrefixKeyItem } = require('./redis.Connector');
require('dotenv').config();
const env = process.env;

const con = db.createPool({
    host: env.DB_HOST,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 20000,
    queueLimit: 20,
    acquireTimeout: 1000000,
    multipleStatements: true,
    port: env.DB_PORT

});

module.exports = {
    async QuaryCache(sql, parameters, resetCacheName = null) {
        return new Promise((resolve, reject) => {
            con.getConnection((err, connection) => {
                if (err) reject(err.message);
                else {
                    connection.query(sql, parameters, (err, data) => {
                        connection.release();
                        if (err) reject(err.message);
                        else {
                            if (resetCacheName) {
                                delPrefixKeyItem(resetCacheName).finally(() => {
                                    resolve(data);
                                })
                            } else resolve(data)
                        }
                    });
                }
            });
        })

    },
    async getCacheQuery(sql, parameters, cacheName) {
        return new Promise((resolve, reject) => {
            getArrayItem(cacheName)
                .then(data => {
                    if (data.length > 0) {
                        resolve(data);
                    } else {
                        con.getConnection((err, connection) => {
                            if (err) {
                                console.log("db connection error")
                                reject(err.message);
                            } else {
                                connection.query(sql, parameters, (err, data) => {
                                    connection.release();
                                    if (err) reject(err.message);
                                    else {
                                        addArrayItem(cacheName, data).then(() => {
                                            resolve(data);
                                        }).catch(err => {
                                            reject(err);
                                        });
                                    }
                                });
                            }
                        });
                    }
                }).catch((err) => {
                    console.log("redis error")
                    reject(err);
                });
        });

    },
    async getCacheQueryPagination(sql, parameters, cacheName, page, pageSize = 30) {
        return new Promise((resolve, reject) => {
            getArrayItem(cacheName)
                .then(data => {
                    if (typeof data === 'object' &&
                        !Array.isArray(data) &&
                        data !== null
                    ) {
                        resolve(data);
                    } else {
                        con.getConnection((err, connection) => {
                            if (err) {
                                console.log("db connection error")
                                reject(err.message);
                            } else {
                                connection.query(sql, parameters, (err, data) => {
                                    connection.release();
                                    if (err) reject(err.message);
                                    else {
                                        data = data.filter(r => r.id > 0);
                                        let list = [];

                                        for (var i = 0; i < data.length; i += pageSize)  list.push(data.slice(i, i + pageSize));
                                        const cPage = parseInt(page) >= 0 ? page : 0;

                                        if (!data.length || !(list.length - 1 >= cPage)) {
                                            resolve({
                                                totalCount: data.length,
                                                pageCount: list.length,
                                                detail: []
                                            });
                                        } else {
                                            addArrayItem(cacheName, {
                                                    totalCount: data.length,
                                                    pageCount: list.length,
                                                    detail: list[cPage]
                                                })
                                                .catch(err => {
                                                    reject(err);
                                                })
                                                .finally(() => {
                                                    resolve({
                                                        totalCount: data.length,
                                                        pageCount: list.length,
                                                        detail: list[cPage]
                                                    });
                                                });
                                        }
                                    }

                                });
                            }
                        });
                    }
                }).catch((err) => {
                    console.log("redis error")
                    reject(err);
                });
        });

    }
};