const { pool, getCurrentTimestamp } = require('../config/dbConfig');
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
    const timestamp = getCurrentTimestamp();
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
                if (typeof param === 'object' && param instanceof Date) return `'${param.toISOString()}'`;
                return param;
            });
        };

        // 쿼리 프록시 생성
        const queryProxy = {
            query: async (sql, params = []) => {
                const formattedQuery = formatQuery(sql, [...params]); // params 배열 복사
                console.log(`[${getCurrentTimestamp()}] ${formattedQuery.query}`);
                return conn.query(sql, params);
            }
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