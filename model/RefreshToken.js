const { pool } = require('../config/dbConfig');
const { InternalServerError, BadRequest } = require('../middleware/customError');

const REFRESH_TOKEN_QUERIES = {
    SAVE: 'INSERT INTO refresh_tokens (user_id, token, expired_at) VALUES (?, ?, ?)',
    FIND: 'SELECT * FROM refresh_tokens WHERE token = ? AND is_revoked = false',
    FIND_TOKEN_USER_ID: 'SELECT * FROM refresh_tokens WHERE user_id = ? and is_revoked = false',
    FIND_BY_ID: 'SELECT u.*, rt.token, rt.expired_at ' +
    'FROM users u ' +
    'LEFT JOIN refresh_tokens rt ON u.user_id = rt.user_id ' +
    'WHERE u.user_id = ? AND u.is_deleted = false AND rt.is_revoked = false',
    REVOKE: 'UPDATE refresh_tokens SET is_revoked = true WHERE token = ?',
    REVOKE_ALL: 'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = ?',
    DELETE_EXPIRED: 'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
};
// 트랜잭션 실행 함수
const executeTransaction = async (callback) => {
    try {
        const conn = await pool.getConnection();
        await conn.beginTransaction();

        try {
            const result = await callback(conn);
            await conn.commit();
            return result;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            await conn.release();
        }
    } catch (error) {
        console.error(error);
        throw new InternalServerError();
    }
};
// Refresh Token 저장
const saveToken = async (userId, token, expiredAt) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            REFRESH_TOKEN_QUERIES.SAVE,
            [userId, token, expiredAt]
        );

        return result.insertId;
    });
};
// Refresh Token 찾기
const findToken = async (token) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            REFRESH_TOKEN_QUERIES.FIND,
            [token]
        );

        return rows[0] || null;
    });
};
// 유저ID로 토큰 찾기
const findTokenByUserId = async (userId) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            REFRESH_TOKEN_QUERIES.FIND_TOKEN_USER_ID,
            [userId]
        );

        return rows[0] || null;
    });
}
// 유저ID로 사용자 정보 및 토큰 정보 찾기
const findById = async (userId) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            REFRESH_TOKEN_QUERIES.FIND_BY_ID,
            [userId]
        );

        return rows[0] || null;
    });
}
// Refresh Token 무효화
const revokeToken = async (token) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            REFRESH_TOKEN_QUERIES.REVOKE,
            [token]
        );
    });
};
// 사용자의 모든 Refresh Token 무효화
const revokeAllUserTokens = async (userId) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            REFRESH_TOKEN_QUERIES.REVOKE_ALL,
            [userId]
        );
    });
};
// 만료된 토큰 삭제
const deleteExpiredTokens = async () => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            REFRESH_TOKEN_QUERIES.DELETE_EXPIRED
        );
    });
};

module.exports = {
    saveToken,
    findToken,
    findTokenByUserId,
    findById,
    revokeToken,
    revokeAllUserTokens,
    deleteExpiredTokens
}



