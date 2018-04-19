require('dotenv').config();
const mysql = require('mysql2/promise');

const db = {};

db.pool = mysql.createPool({
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_DB,
    charset: process.env.DB_CHARSET || 'utf8mb4_unicode_ci',
    namedPlaceholders: true,
    supportBigNumbers: true,
    bigNumberStrings: true
});

db.query = async (sql, data = []) => {
    const [row] = await db.pool.query(sql, data);
    return row[0];
};

module.exports = db;