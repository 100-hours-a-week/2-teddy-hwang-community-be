const { pool } = require('../config/dbConfig');
const { InternalServerError, BadRequest } = require('../middleware/customError');

const LIKE_QUERIES = {
    INSERT_LIKE: 'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
    ADD_LIKE_COUNT: 'UPDATE posts SET like_count = like_count + 1 WHERE post_id = ?',
    DELETE_LIKE: 'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
    REMOVE_LIKE_COUNT: 'UPDATE posts SET like_count = like_count - 1 WHERE post_id = ?',
    FIND_POST_LIKE: 'SELECT * FROM likes WHERE user_id = ? AND post_id = ?'
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
        }
    } catch (error) {
        console.error(error);
        throw new InternalServerError();
    }
};
//좋아요 추가 및 게시글의 like_count 증가
const insertLike = async (postId, userId) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            LIKE_QUERIES.INSERT_LIKE,
            [userId, postId]
        ); 

        await conn.query(LIKE_QUERIES.ADD_LIKE_COUNT, [postId]);
        
        return {
            id: result.insertId,
        };
    });
}
//좋아요 취소 및 게시글의 like_count 감소
const deleteLike = (postId, userId) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            LIKE_QUERIES.DELETE_LIKE,
            [userId, postId]
        );

        await conn.query(LIKE_QUERIES.REMOVE_LIKE_COUNT, [postId]);

        if (result.affectedRows === 0) {
            throw new BadRequest();
        }       
        return postId;
    });
}
//특정 게시글에 사용자가 좋아요를 눌렀는지 확인
const findPostLike = (postId, userId) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(
            LIKE_QUERIES.FIND_POST_LIKE,
            [userId, postId]
        );
        
        return rows.length === 0 ? false : true; // 좋아요가 존재하면 true, 없으면 false 반환
    });
}


module.exports = {
    insertLike,
    deleteLike,
    findPostLike
};