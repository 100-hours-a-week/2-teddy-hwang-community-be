const { executeTransaction } = require('../config/dbConfig');
const {
  BadRequest,
} = require('../middleware/customError');

const POST_QUERIES = {
  FIND_ALL:
    'SELECT p.post_id, p.title, p.like_count, p.comment_count, p.view_count, p.modified_at, u.nickname, u.profile_image ' +
    'FROM posts p ' +
    'JOIN users u ON p.user_id = u.user_id ' +
    'WHERE p.is_deleted = false ' +
    'ORDER BY p.post_id DESC ' +
    'LIMIT ? OFFSET ?',
  COUNT_POSTS:
    'SELECT COUNT(*) as total FROM posts p ' +
    'JOIN users u ON p.user_id = u.user_id ' +
    'WHERE p.is_deleted = false',
  INSERT_POST:
    'INSERT INTO posts (title, content, image, created_at, modified_at, like_count, view_count, comment_count, user_id) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  UPDATE_POST:
    'UPDATE posts SET title = ?, content = ?, image = ?, modified_at = ? ' +
    'WHERE post_id = ? AND user_id = ?',
  FIND_POST:
    'SELECT p.post_id, p.title, p.user_id, p.modified_at, p.image , p.content, ' +
    'p.like_count, p.comment_count, p.view_count, u.nickname, u.profile_image ' +
    'FROM posts p ' +
    'JOIN users u ON p.user_id = u.user_id ' +
    'WHERE p.post_id = ? AND p.is_deleted = false',
  FIND_COMMENTS_BY_POST:
    'SELECT c.comment_id, c.content, c.modified_at, u.user_id, u.nickname, u.profile_image ' +
    'FROM comments c ' +
    'JOIN users u ON c.user_id = u.user_id ' +
    'WHERE c.post_id = ? AND c.is_deleted = false',
  UPDATE_VIEW_COUNT:
    'UPDATE posts SET view_count = view_count + 1 ' +
    'WHERE post_id = ? AND is_deleted = false',
  DELETE_POST: 'UPDATE posts SET is_deleted = true WHERE post_id = ?',
  FIND_LIKE_COUNT: 'SELECT like_count FROM posts WHERE post_id = ?',
};

// 글 전체 조회
const findAll = async (page = 1, limit = 10) => {
  return executeTransaction(async conn => {
    // 전체 게시글 수 조회
    const [countResult] = await conn.query(POST_QUERIES.COUNT_POSTS);
    const totalPosts = countResult[0].total;

    // offset 계산
    const offset = (page - 1) * limit;

    // 페이징된 게시글 조회
    const [rows] = await conn.query(POST_QUERIES.FIND_ALL, [limit, offset]);

    const posts = rows.map(post => ({
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
      totalPosts,
    };
  });
};
// 글 생성
const save = async postData => {
  return executeTransaction(async conn => {
    const [result] = await conn.query(POST_QUERIES.INSERT_POST, [
      postData.title,
      postData.content,
      postData.image,
      postData.created_at,
      postData.modified_at,
      postData.like_count,
      postData.view_count,
      postData.comment_count,
      postData.user_id,
    ]);
    return {
      id: result.insertId,
      ...postData,
    };
  });
};
// 글 수정
const update = async (id, postData) => {
  return executeTransaction(async conn => {
    const [result] = await conn.query(POST_QUERIES.UPDATE_POST, [
      postData.title,
      postData.content,
      postData.image,
      postData.modified_at,
      id,
      postData.user_id,
    ]);
    if (result.affectedRows == 0) {
      throw new BadRequest('글을 찾을 수 없습니다.');
    }
    return {
      id,
      ...postData,
    };
  });
};
// 글 상세 조회
const findById = async (id, increaseView = false) => {
  return executeTransaction(async conn => {
    if (increaseView) {
      // 조회수 증가 쿼리
      await conn.query(POST_QUERIES.UPDATE_VIEW_COUNT, [id]);
    }

    const [posts] = await conn.query(POST_QUERIES.FIND_POST, [id]);

    if (!posts.length) {
      throw new BadRequest('게시글을 찾을 수 없습니다.');
    }

    const post = posts[0];

    // 게시글 기본 정보 추출
    const postDetails = {
      post_id: post.post_id,
      title: post.title,
      user_id: post.user_id,
      post_author: {
        nickname: post.nickname,
        profile_image: post.profile_image,
      },
      post_modified_at: post.modified_at,
      post_image: post.image,
      content: post.content,
      like_count: post.like_count,
      view_count: post.view_count,
      comment_count: post.comment_count,
      comments: [],
    };

    if (post.comment_count > 0) {
      const [comments] = await conn.query(POST_QUERIES.FIND_COMMENTS_BY_POST, [
        id,
      ]);
      postDetails.comments = comments.map(comment => ({
        comment_id: comment.comment_id,
        content: comment.content,
        modified_at: comment.modified_at,
        author: {
          user_id: comment.user_id,
          nickname: comment.nickname,
          profile_image: comment.profile_image,
        },
      }));
    }

    return postDetails;
  });
};
//글 삭제
const deleteById = async id => {
  return executeTransaction(async conn => {
    const [result] = await conn.query(POST_QUERIES.DELETE_POST, [id]);

    if (result.affectedRows === 0) {
      throw new BadRequest();
    }

    return true;
  });
};
//현재 글 좋아요 수 확인
const findLikeCount = async id => {
  return executeTransaction(async conn => {
    const [rows] = await conn.query(POST_QUERIES.FIND_LIKE_COUNT, [id]);
    return rows[0].like_count || 0;
  });
};

module.exports = {
  findAll,
  save,
  update,
  findById,
  deleteById,
  findLikeCount,
};
