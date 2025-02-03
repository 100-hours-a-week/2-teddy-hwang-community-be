const mysql = require('mysql2/promise');
const { getTimestamp } = require('../utils/dayUtil');
const { InternalServerError } = require('../middleware/customError');
require('../utils/color');
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

// 트랜잭션 실행 함수
const executeTransaction = async callback => {
  const timestamp = getTimestamp();
  try {
    console.log(`[${timestamp}] 트랜잭션 시작!!`.info);
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    // 쿼리와 파라미터를 결합하는 함수
    const formatQuery = (sql, params = []) => {
      if (!params.length) return sql;
      return sql.replace(/\?/g, () => {
        const param = params.shift();
        if (param === null) return 'NULL';
        if (typeof param === 'string') return `'${param}'`;
        if (typeof param === 'object' && param instanceof Date)
          return `'${param.toISOString()}'`;
        return param;
      });
    };

    // 쿼리 프록시 생성
    const queryProxy = {
      query: async (sql, params = []) => {
        const formattedQuery = formatQuery(sql, [...params]); // params 배열 복사
        console.log(`[${getTimestamp()}] ${formattedQuery.query}`);
        return conn.query(sql, params);
      },
    };

    try {
      const result = await callback(queryProxy);
      await conn.commit();
      console.log(`[${timestamp}] 트랜잭션 커밋 완료!!`.success);
      return result;
    } catch (error) {
      await conn.rollback();
      console.log(`[${timestamp}] 트랜잭션 롤백!!`.error, error.message);
      throw error;
    } finally {
      await conn.release();
    }
  } catch (error) {
    console.error(`[${timestamp}] 트랜잭션 실패!!`.error, error.message);
    throw new InternalServerError();
  }
};
module.exports = {
  executeTransaction
};
