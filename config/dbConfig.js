const mysql = require('mysql2/promise');
const colors = require('colors');
const moment = require('moment');
require('dotenv').config();

// 색상 설정
colors.setTheme({
    info: 'blue',
    success: 'green',
    warn: 'yellow',
    error: 'red',
    query: 'cyan'
});

// MySQL 연결 풀 설정
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true, // 연결 대기 옵션
    connectionLimit: 30, // 최대 연결 수
    queueLimit: 0, // 대기 큐 크기 (0은 제한 없음)
};

// MySQL 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 타임스탬프 포맷 함수
const getCurrentTimestamp = () =>  moment().format('YYYY-MM-DD HH:mm:ss');


module.exports = {
    pool,
    getCurrentTimestamp
};
