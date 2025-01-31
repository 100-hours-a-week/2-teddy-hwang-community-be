const {
  BadRequest,
  InternalServerError,
} = require('../middleware/customError');
const { save, update, findByUserId, deleteById } = require('../model/Comment');
const { postValidator } = require('../utils/validation');

const createComment = async (req, res, next) => {
  try {
    const { content, user_id, post_id } = req.body;

    // 유효성 검사
    const commentValidation = postValidator.comment(content);

    if (!commentValidation.isValid) {
      return next(new BadRequest(commentValidation.message));
    }

    if (!user_id || !post_id) {
      next(new BadRequest('댓글 생성에 필수 정보가 누락되었습니다.'));
    }

    const commentData = {
      content,
      created_at: timestamp(),
      modified_at: timestamp(),
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
    next(new InternalServerError());
  }
};
//날짜 변환 함수
const timestamp = () => {
  const today = new Date();
  // 미국시간 기준이니까 9를 더해주면 대한민국 시간
  today.setHours(today.getHours() + 9);
  // 문자열로 바꿔주고 T를 빈칸으로 바꿔주면 yyyy-mm-dd hh:mm:ss 이런 형식 나옴
  return today.toISOString().replace('T', ' ').substring(0, 19);
};
//댓글 수정
const updateComment = async (req, res, next) => {
  try {
    const { content, post_id, user_id, comment_id } = req.body;

    // 유효성 검사
    const commentValidation = postValidator.comment(content);

    if (!commentValidation.isValid) {
      return next(new BadRequest(commentValidation.message));
    }

    const commentData = {
      content,
      modified_at: timestamp(),
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
    next(new InternalServerError());
  }
};
//해당 댓글 조회
const findCommentUser = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);

    const comments = await findByUserId(userId);

    if (!comments) {
      next(new BadRequest('해당 유저의 댓글을 조회하는데 실패했습니다.'));
    }

    res.status(200).json({
      message: '댓글 조회를 성공했습니다.',
      data: comments,
    });
  } catch (error) {
    next(new InternalServerError());
  }
};

//댓글 삭제
const deleteComment = async (req, res, next) => {
  try {
    const id = Number(req.params.comment_id);

    const comment = await deleteById(id);

    if (!comment) {
      next(new BadRequest('댓글 삭제에 실패했습니다.'));
    }

    res.status(200).json({
      message: '댓글 삭제를 성공했습니다.',
      data: {
        comment_id: id,
      },
    });
  } catch (error) {
    next(new InternalServerError());
  }
};

module.exports = {
  createComment,
  updateComment,
  findCommentUser,
  deleteComment,
};
