const mysql = require('mysql2/promise');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();

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

// 세션 스토어 옵션 설정
const sessionStoreOptions = {
    ...dbConfig,
    createDatabaseTable: true,
    // 체크 주기(ms)
    checkExpirationInterval: 900000, // 15분마다 만료된 세션 체크
    // 세션 만료 시간(ms)
    expiration: 86400000, // 24시간
    // 세션 테이블 설정
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    },
    // 만료된 세션 자동 정리
    clearExpired: true
};

const sessionStore = new MySQLStore(sessionStoreOptions);

module.exports = {
    pool,
    sessionStore
};
