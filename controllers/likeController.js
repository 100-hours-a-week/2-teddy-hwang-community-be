const { BadRequest, InternalServerError } = require('../middleware/customError');
const LikeModel = require('../model/Like');

//좋아요 추가
const addLike = async (req, res, next) => {
    try {
        const postId = req.params.post_id;
        const userId = req.body.user_id;

        if(!userId || !postId) {
            next(new BadRequest());
        }

        const like = await LikeModel.addLike(postId, userId);

        res.status(201).json({
            message: '좋아요 추가를 성공했습니다.',
            post_id: like.post_id
        })
        
    }catch(error) {
        next(new InternalServerError());
    }
}
//좋아요 취소
const removeLike = async (req, res, next) => {
    try {
        const postId = req.params.post_id;
        const userId = req.body.user_id;

        if(!userId || !postId) {
            next(new BadRequest());
        }

        const like = await LikeModel.removeLike(postId, userId);

        res.status(201).json({
            message: '좋아요 취소를 성공했습니다.',
            post_id: like
        })
        
    }catch(error) {
        next(new InternalServerError());
    }
}

module.exports = {
    addLike,
    removeLike
}