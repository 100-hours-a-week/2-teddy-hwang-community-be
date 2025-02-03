const {
  BadRequest,
  InternalServerError,
} = require('../middleware/customError');
const { insertLike, deleteLike, findPostLike } = require('../model/Like');
const { findLikeCount } = require('../model/Post');

//좋아요 추가
const addLike = async (req, res, next) => {
  try {
    const postId = Number(req.params.post_id);
    const userId = Number(req.user.id);

    if (!userId || !postId) {
      return next(new BadRequest('좋아요 추가에 필수 정보가 누락되었습니다.'));
    }

    const like = await insertLike(postId, userId);
    const likeCount = await findLikeCount(postId);

    res.status(201).json({
      message: '좋아요 추가를 성공했습니다.',
      data: {
        post_id: like.post_id,
        like_count: likeCount,
      },
    });
  } catch (error) {
    return next(new InternalServerError('좋아요 추가에 실패했습니다.'));
  }
};
//좋아요 취소
const removeLike = async (req, res, next) => {
  try {
    const postId = Number(req.params.post_id);
    const userId = Number(req.user.id);

    if (!userId || !postId) {
      return next(new BadRequest('좋아요 취소에 필수 정보가 누락되었습니다.'));
    }

    const like = await deleteLike(postId, userId);
    const likeCount = await findLikeCount(postId);

    res.status(200).json({
      message: '좋아요 취소를 성공했습니다.',
      data: {
        post_id: like.post_id,
        like_count: likeCount,
      },
    });
  } catch (error) {
    return next(new InternalServerError('좋아요 취소에 실패했습니다.'));
  }
};
//좋아요 상태 확인
const isLikedByUser = async (req, res, next) => {
  try {
    const postId = Number(req.params.post_id);
    const userId = Number(req.user.id);

    if (!userId || !postId) {
      return next(new BadRequest('좋아요 상태 확인에 필수 정보가 누락되었습니다.'));
    }

    const like = await findPostLike(postId, userId);

    res.status(200).json({
      message: '좋아요 상태 확인을 성공했습니다.',
      is_liked: like,
    });
  } catch (error) {
    return next(new InternalServerError('좋아요 상태 확인에 실패했습니다.'));
  }
};

module.exports = {
  addLike,
  removeLike,
  isLikedByUser,
};
