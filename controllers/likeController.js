const { BadRequest, InternalServerError } = require('../middleware/customError');
const LikeModel = require('../model/Like');
const PostModel = require('../model/Post');

//좋아요 추가
const addLike = async (req, res, next) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        if(!userId || !postId) {
            next(new BadRequest());
        }

        const like = await LikeModel.addLike(postId, userId);
        const likeCount = await PostModel.getLikeCount(postId);

        res.status(201).json({
            message: '좋아요 추가를 성공했습니다.',
            data: {
                post_id: like.post_id,
                like_count: likeCount
            }           
        })
        
    }catch(error) {
        return next(new InternalServerError());
    }
}
//좋아요 취소
const removeLike = async (req, res, next) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        if(!userId || !postId) {
            next(new BadRequest());
        }

        const like = await LikeModel.removeLike(postId, userId);
        const likeCount = await PostModel.getLikeCount(postId);

        res.status(200).json({
            message: '좋아요 취소를 성공했습니다.',
            data: {
                post_id: like.post_id,
                like_count: likeCount
            }       
        })
        
    }catch(error) {
        next(new InternalServerError());
    }
}
//좋아요 상태 확인
const isLikedByUser = async (req, res, next) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        if(!userId || !postId) {
            next(new BadRequest());
        }

        const like = await LikeModel.isLikedByUser(postId, userId);

        res.status(200).json({
            message: '좋아요 상태 확인을 성공했습니다.',
            is_liked: like
        })
        
    }catch(error) {
        next(new InternalServerError());
    }
}

module.exports = {
    addLike,
    removeLike,
    isLikedByUser
}