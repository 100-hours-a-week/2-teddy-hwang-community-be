const { BadRequest, InternalServerError } = require('../middleware/customError');
const LikeModel = require('../model/Like');

const addLike = async (req, res, next) => {
    try {
        const postId = req.params.post_id;
        const userId = req.body.user_id;

        if(!userId || !postId) {
            next(new BadRequest());
        }

        const like = await LikeModel.addLike(postId, userId);

        res.status(201).json({
            message: '좋아요가 추가되었습니다.',
            post_id: like.post_id
        })
        
    }catch(error) {
        next(new InternalServerError());
    }
}

module.exports = {
    addLike
}