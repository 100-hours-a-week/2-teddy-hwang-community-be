const { pool, getCurrentTimestamp } = require('../config/dbConfig');
const { InternalServerError, BadRequest } = require('../middleware/customError');

const COMMENT_QUERIES = {
    INSERT_COMMENT: 'INSERT INTO comments (content, created_at, modified_at, user_id, post_id) ' +
    'VALUES (?, ?, ?, ?, ?)',
    UPDATE_COMMENT_COUNT_INCREASE: 'UPDATE posts SET comment_count = comment_count + 1 ' +
    'WHERE post_id = ?',
    UPDATE_COMMENT_COUNT_DECREASE: 'UPDATE posts SET comment_count = comment_count - 1 ' +
    'WHERE post_id = ?',
    FIND_BY_ID: 'SELECT * FROM comments WHERE comment_id = ?',
    UPDATE_COMMENT: 'UPDATE comments SET content = ?, modified_at = ? WHERE comment_id = ? AND user_id = ? AND post_id = ?',
    FIND_BY_USER_ID: 'SELECT * FROM comments WHERE user_id = ? AND is_deleted = false',
    DELETE_BY_ID: 'UPDATE comments SET is_deleted = true WHERE comment_id = ?'
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
//댓글 생성
const save = async (commentData) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            COMMENT_QUERIES.INSERT_COMMENT,
            [commentData.content, commentData.created_at, commentData.modified_at, commentData.user_id, commentData.post_id]
        );

        await conn.query(COMMENT_QUERIES.UPDATE_COMMENT_COUNT_INCREASE, [commentData.post_id]);
        return {
            id: result.insertId,
            ...commentData
        };
    });
}
//댓글 수정
const update = async (commentData) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            COMMENT_QUERIES.UPDATE_COMMENT,
            [commentData.content, commentData.modified_at, commentData.comment_id, commentData.user_id, commentData.post_id]
        );
        return {
            id: commentData.comment_id,
            ...commentData
        };
    });
}
//해당 유저가 쓴 댓글인지 조회
const findByUserId = async (userId) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(COMMENT_QUERIES.FIND_BY_USER_ID, [userId]);
        return rows || [];
    });
}
//댓글 삭제
const deleteById = async (id) => {
    return executeTransaction(async (conn) => {
        const [comment] = await conn.query(COMMENT_QUERIES.FIND_BY_ID, [id]);

        if(comment.length === 0) {
            throw new BadRequest('해당하는 댓글이 없습니다.');
        }
        const postId = comment[0].post_id;
        
        const [result] = await conn.query(COMMENT_QUERIES.DELETE_BY_ID, [id]);      
        if (result.affectedRows === 0) {
            throw new BadRequest();
        }

        await conn.query(COMMENT_QUERIES.UPDATE_COMMENT_COUNT_DECREASE, [postId]);
        
        return true;
    });
}


module.exports = {
    save,
    update,
    findByUserId,
    deleteById
};