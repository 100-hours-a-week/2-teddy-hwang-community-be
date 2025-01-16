const bcrypt = require('bcrypt');
const { pool } = require('../config/dbConfig');
const { InternalServerError, BadRequest } = require('../middleware/customError');

const USER_QUERIES = {
    FIND_BY_ID: 'SELECT * FROM users WHERE user_id = ? AND is_deleted = false',
    FIND_BY_EMAIL: 'SELECT * FROM users WHERE email = ? AND is_deleted = false',
    INSERT_USER: 'INSERT INTO users (email, password, nickname, profile_image) VALUES (?, ?, ?, ?)',
    UPDATE_USER: 'UPDATE users SET nickname = ?, profile_image = ? WHERE user_id = ?',
    UPDATE_PASSWORD: 'UPDATE users SET password = ? WHERE user_id = ?',
    CHECK_NICKNAME: 'SELECT * FROM users WHERE nickname = ? AND user_id != ? AND is_deleted = false',
    CHECK_NICKNAME_SIGNUP: 'SELECT * FROM users WHERE nickname = ? AND is_deleted = false',
    UPDATE_SOFT_DELETE_USER: 'UPDATE users SET is_deleted = true WHERE user_id = ?',
    UPDATE_SOFT_DELETE_POSTS: 'UPDATE posts SET is_deleted = true WHERE user_id = ?',
    UPDATE_SOFT_DELETE_COMMENTS: 'UPDATE comments SET is_deleted = true WHERE user_id = ?'
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
// ID로 유저 조회
const findById = async (id) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(USER_QUERIES.FIND_BY_ID, [id]);
        return rows[0] || null;   
    });   
};
// 이메일로 유저 조회
const findByEmail = async (email) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(USER_QUERIES.FIND_BY_EMAIL, [email]);
        return rows.length > 0 ? rows[0] : null;
    });
};
// 회원가입
const save = async (userData) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            USER_QUERIES.INSERT_USER,
            [userData.email, userData.password, userData.nickname, userData.profile_image]
        );
        return {
            id: result.insertId,
            ...userData
        };
    });
};
//회원 정보 수정
const updateUser = async (id, nickname, profile_image) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            USER_QUERIES.UPDATE_USER,
            [nickname, profile_image, id]
        );

        if(result.affectedRows == 0) {
            throw new Error('유저를 찾을 수 없습니다.');
        }

        return {
            id,
            nickname,
            profile_image
        };
    });
};
// 비밀번호 수정
const updatePassword = async (id, password) => {
    return executeTransaction(async (conn) => {
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);

        const [result] = await conn.query(
            USER_QUERIES.UPDATE_PASSWORD,
            [encryptedPassword, id]
        );

        return id;
    });
};
// 닉네임 중복 확인(유저 수정)
const existsByNicknameUpdate = async (nickname, userId) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            USER_QUERIES.CHECK_NICKNAME,
            [nickname, userId]  
        );
        return rows[0] || undefined;
    });
};
// 닉네임 중복 확인(회원가입)
const existsByNicknameSignup = async (nickname) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            USER_QUERIES.CHECK_NICKNAME_SIGNUP,
            [nickname]  
        );
        return rows[0] || undefined;
    });
};

//회원 탈퇴
const deleteUser = async (id) => {
    return executeTransaction(async (conn) => {
        await conn.query(USER_QUERIES.UPDATE_SOFT_DELETE_COMMENTS, [id]);
        await conn.query(USER_QUERIES.UPDATE_SOFT_DELETE_POSTS, [id]);

        const [result] = await conn.query(USER_QUERIES.UPDATE_SOFT_DELETE_USER, [id]);
        
        if (result.affectedRows === 0) {
            throw new BadRequest();
        }

        return true;
    });
};

module.exports = {
    findById,
    findByEmail,
    save,
    updateUser,
    updatePassword,
    existsByNicknameUpdate,
    existsByNicknameSignup,
    deleteUser
};