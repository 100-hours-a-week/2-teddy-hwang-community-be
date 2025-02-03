const {
  BadRequest,
  InternalServerError,
} = require('../middleware/customError');
const { save, update, findByUserId, deleteById } = require('../model/Comment');
const { getTimestamp } = require('../utils/dayUtil');
const { postValidator } = require('../utils/validation');

const createComment = async (req, res, next) => {
  try {
    // 클라이언트 요청 데이터 (내용, 유저 아이디, 게시글 아이디)
    const { content, user_id, post_id } = req.body;

    // 유효성 검사
    const commentValidation = postValidator.comment(content);

    if (!commentValidation.isValid) {
      return next(new BadRequest(commentValidation.message));
    }

    if (!user_id || !post_id) {
      return next(new BadRequest('댓글 생성에 필수 정보가 누락되었습니다.'));
    }

    const commentData = {
      content,
      created_at: getTimestamp(),
      modified_at: getTimestamp(),
      user_id,
      post_id,
    };

    const newComment = await save(commentData);

    const { id } = newComment;

    res.status(201).json({
      message: '댓글 작성을 성공했습니다.',
      data: {
        comment_id: id,
      },
    });
  } catch (error) {
    return next(new InternalServerError('댓글 작성을 실패했습니다.'));
  }
};

//댓글 수정
const updateComment = async (req, res, next) => {
  try {
    // 클라이언트 요청 데이터 (내용, 게시글 아이디, 유저 아이디, 댓글 아이디)
    const { content, post_id, user_id, comment_id } = req.body; 

    // 유효성 검사
    const commentValidation = postValidator.comment(content);

    if (!commentValidation.isValid) {
      return next(new BadRequest(commentValidation.message));
    }

    if(!post_id || !user_id || !comment_id) {
      return next(new BadRequest('댓글 수정에 필수 정보가 누락되었습니다.'));
    }

    const commentData = {
      content,
      modified_at: getTimestamp(),
      user_id,
      post_id,
      comment_id,
    };

    const comment = await update(commentData);

    res.status(200).json({
      message: '댓글 수정을 성공했습니다.',
      data: {
        comment_id: comment.comment_id,
      },
    });
  } catch (error) {
    return next(new InternalServerError('댓글 수정에 실패했습니다.'));
  }
};
//해당 댓글 조회
const findCommentUser = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);

    if(!userId) {
      return next(new BadRequest('댓글 조회시 해당 유저의 정보가 없습니다.'));
    }

    const comments = await findByUserId(userId);

    if (!comments) {
      return next(new BadRequest('해당 유저의 댓글을 조회하는데 실패했습니다.'));
    }

    res.status(200).json({
      message: '해당 유저의 댓글 조회를 성공했습니다.',
      data: comments,
    });
  } catch (error) {
    return next(new InternalServerError('해당 유저의 댓글을 조회하는데 실패했습니다'));
  }
};

//댓글 삭제
const deleteComment = async (req, res, next) => {
  try {
    const id = Number(req.params.comment_id);

    if(!id) {
      return next(new BadRequest('댓글 삭제 중 게시글 정보가 누락되었습니다.'));
    }

    const comment = await deleteById(id);

    if (!comment) {
      return next(new BadRequest('댓글 삭제에 실패했습니다.'));
    }

    res.status(200).json({
      message: '댓글 삭제를 성공했습니다.',
      data: {
        comment_id: id,
      },
    });
  } catch (error) {
    return next(new InternalServerError('댓글 삭제에 실패했습니다.'));
  }
};

module.exports = {
  createComment,
  updateComment,
  findCommentUser,
  deleteComment,
};
