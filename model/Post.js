const { pool, getCurrentTimestamp } = require('../config/dbConfig');
const { InternalServerError, BadRequest } = require('../middleware/customError');
require('colors');

const POST_QUERIES = {
    FIND_ALL: 'SELECT p.post_id, p.title, p.like_count, p.comment_count, p.view_count, p.modified_at, u.nickname, u.profile_image ' + 
    'FROM posts p ' +
    'JOIN users u ON p.user_id = u.user_id ' + 
    'WHERE p.is_deleted = false ' +
    'ORDER BY p.post_id DESC ' +
    'LIMIT ? OFFSET ?',
    COUNT_POSTS: 'SELECT COUNT(*) as total FROM posts p ' +
    'JOIN users u ON p.user_id = u.user_id ' + 
    'WHERE p.is_deleted = false',
    INSERT_POST: 'INSERT INTO posts (title, content, image, created_at, modified_at, like_count, view_count, comment_count, user_id) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    UPDATE_POST: 'UPDATE posts SET title = ?, content = ?, image = ?, modified_at = ? ' +
    'WHERE post_id = ? AND user_id = ?',
    FIND_BY_ID: 'SELECT p.post_id, p.title, p.user_id, p.modified_at as post_modified_at, p.image as post_image, p.content as post_content, ' +
    'p.like_count, p.comment_count, p.view_count, u.nickname as author_nickname, u.profile_image as author_profile_image, ' +
    'c.comment_id, c.content as comment_content, c.modified_at as comment_modified_at, ' +
    'cu.user_id as comment_user_id, cu.nickname as comment_author_nickname, cu.profile_image as comment_author_profile_image ' +
    'FROM posts p ' + 
    'JOIN users u ON p.user_id = u.user_id ' +
    'LEFT JOIN comments c ON p.post_id = c.post_id AND c.is_deleted = false ' +
    'LEFT JOIN users cu ON c.user_id = cu.user_id ' +
    'WHERE p.post_id = ? AND p.is_deleted = false AND u.is_deleted = false',
    UPDATE_VIEW_COUNT: 'UPDATE posts SET view_count = view_count + 1 ' + 
    'WHERE post_id = ? AND is_deleted = false',
    DELETE_POST: 'UPDATE posts SET is_deleted = true WHERE post_id = ?',
    FIND_LIKE_COUNT: 'SELECT like_count FROM posts WHERE post_id = ?'
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



// 글 전체 조회
const findAll = async (page = 1, limit = 10) => {
    return executeTransaction(async (conn) => {
        // 전체 게시글 수 조회
        const [countResult] = await conn.query(POST_QUERIES.COUNT_POSTS);
        const totalPosts = countResult[0].total;

        // offset 계산
        const offset = (page - 1) * limit;

        // 페이징된 게시글 조회
        const [rows] = await conn.query(POST_QUERIES.FIND_ALL, [limit, offset]);
        
        const posts = rows.map((post) => ({
            post_id: post.post_id,
            title: post.title,
            like_count: post.like_count,
            comment_count: post.comment_count,
            view_count: post.view_count,
            modified_at: post.modified_at,
            author: {
                nickname: post.nickname,
                profile_image: post.profile_image,
            },
        }));
        return {
            posts,
            hasMore: offset + posts.length < totalPosts,
            totalPosts
        }
   });  
}
// 글 생성
const save = async (postData) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            POST_QUERIES.INSERT_POST,
            [postData.title, postData.content, postData.image, postData.created_at, postData.modified_at, postData.like_count, postData.view_count, postData.comment_count, postData.user_id]
        );
        return {
            id: result.insertId,
            ...postData
        };
    });
}
// 글 수정
const update = async (id, postData) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(
            POST_QUERIES.UPDATE_POST,
            [postData.title, postData.content, postData.image, postData.modified_at, id, postData.user_id]
        );
        if(result.affectedRows == 0) {
            throw new Error('글을 찾을 수 없습니다.');
        }
        return {
            id,
            ...postData
        };
    });
}
// 글 상세 조회 조회수 증가 x
const findByIdWithoutView = async (id) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(POST_QUERIES.FIND_BY_ID, [id]);

        if(!rows || rows.length == 0) {
            throw new BadRequest('게시글을 찾을 수 없습니다.');
        }

        const post = rows[0];

        // 게시글 기본 정보 추출
        const postDetails = {
            post_id: post.post_id,
            title: post.title,
            user_id: post.user_id,
            post_author: {
                nickname: post.author_nickname,
                profile_image: post.author_profile_image
            },
            post_modified_at: post.post_modified_at,
            post_image: post.post_image,
            content: post.post_content,
            like_count: post.like_count,
            view_count: post.view_count,
            comment_count: post.comment_count,
            comments: []
        };
        // 댓글이 있는 경우에만 처리
        const commentMap = new Map();
                
        rows.forEach(row => {
        if (row.comment_id) {  // 댓글이 있는 경우에만
            commentMap.set(row.comment_id, {
                comment_id: row.comment_id,
                content: row.comment_content,
                modified_at: row.comment_modified_at,
                author: {
                    user_id: row.comment_user_id,
                    nickname: row.comment_author_nickname,
                    profile_image: row.comment_author_profile_image
                }
            });
        }
        });

        postDetails.comments = Array.from(commentMap.values());

        return postDetails;
    });
}
// 글 상세 조회 조회수 증가
const findByIdWithView = async (id) => {
    return executeTransaction(async (conn) => {
        // 조회수 증가 쿼리
        await conn.query(POST_QUERIES.UPDATE_VIEW_COUNT, [id]);

        const [rows] = await conn.query(POST_QUERIES.FIND_BY_ID, [id]);

        if(!rows || rows.length == 0) {
            throw new BadRequest('게시글을 찾을 수 없습니다.');
        }

        const post = rows[0];

        // 게시글 기본 정보 추출
        const postDetails = {
            post_id: post.post_id,
            title: post.title,
            user_id: post.user_id,
            post_author: {
                nickname: post.author_nickname,
                profile_image: post.author_profile_image
            },
            post_modified_at: post.post_modified_at,
            post_image: post.post_image,
            content: post.post_content,
            like_count: post.like_count,
            view_count: post.view_count,
            comment_count: post.comment_count,
            comments: []
        };
        // 댓글이 있는 경우에만 처리
        const commentMap = new Map();

        rows.forEach(row => {
        if (row.comment_id) {  // 댓글이 있는 경우에만
            commentMap.set(row.comment_id, {
                comment_id: row.comment_id,
                content: row.comment_content,
                modified_at: row.comment_modified_at,
                author: {
                    user_id: row.comment_user_id,
                    nickname: row.comment_author_nickname,
                    profile_image: row.comment_author_profile_image
                }
            });
        }
        });

        postDetails.comments = Array.from(commentMap.values());

        return postDetails;
    });
}
//글 삭제
const deleteById = async (id) => {
    return executeTransaction(async (conn) => {
        const [result] = await conn.query(POST_QUERIES.DELETE_POST, [id]);
        
        if (result.affectedRows === 0) {
            throw new BadRequest();
        }
        
        return true;
    });
}
//현재 글 좋아요 수 확인
const findLikeCount = async (id) => {
    return executeTransaction(async (conn) => {
        const [rows] = await conn.query(POST_QUERIES.FIND_LIKE_COUNT, [id]);
        return rows[0].like_count !== 0 ? rows[0].like_count : 0;
   });  
}

module.exports = {
    findAll,
    save,
    update,
    findByIdWithoutView,
    findByIdWithView,
    deleteById,
    findLikeCount
};