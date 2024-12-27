const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL 연결 풀 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true, // 연결 대기 옵션
    connectionLimit: 30, // 최대 연결 수
    queueLimit: 0 // 대기 큐 크기 (0은 제한 없음)
});

module.exports = pool;
