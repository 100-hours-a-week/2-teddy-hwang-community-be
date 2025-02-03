const { executeTransaction } = require('../config/dbConfig');

const REFRESH_TOKEN_QUERIES = {
  SAVE: 'INSERT INTO refresh_tokens (user_id, token, expired_at) VALUES (?, ?, ?)',
  FIND: 'SELECT * FROM refresh_tokens WHERE token = ? AND is_revoked = false',
  FIND_TOKEN_USER_ID:
    'SELECT * FROM refresh_tokens WHERE user_id = ? and is_revoked = false',
  REVOKE: 'UPDATE refresh_tokens SET is_revoked = true WHERE token = ?',
  DELETE_EXPIRED: 'DELETE FROM refresh_tokens WHERE expires_at < NOW()',
};

// Refresh Token 저장
const saveToken = async (userId, token, expiredAt) => {
  return executeTransaction(async conn => {
    const [result] = await conn.query(REFRESH_TOKEN_QUERIES.SAVE, [
      userId,
      token,
      expiredAt,
    ]);

    return result.insertId;
  });
};
// Refresh Token 찾기
const findToken = async token => {
  return executeTransaction(async conn => {
    const [rows] = await conn.query(REFRESH_TOKEN_QUERIES.FIND, [token]);

    return rows[0] || null;
  });
};
// 유저ID로 토큰 찾기
const findTokenByUserId = async userId => {
  return executeTransaction(async conn => {
    const [rows] = await conn.query(REFRESH_TOKEN_QUERIES.FIND_TOKEN_USER_ID, [
      userId,
    ]);

    return rows[0] || null;
  });
};
// Refresh Token 무효화
const revokeToken = async token => {
  return executeTransaction(async conn => {
    const [rows] = await conn.query(REFRESH_TOKEN_QUERIES.REVOKE, [token]);
  });
};
// 만료된 토큰 삭제
const deleteExpiredTokens = async () => {
  return executeTransaction(async conn => {
    const [rows] = await conn.query(REFRESH_TOKEN_QUERIES.DELETE_EXPIRED);
  });
};

module.exports = {
  saveToken,
  findToken,
  findTokenByUserId,
  revokeToken,
  deleteExpiredTokens,
};
