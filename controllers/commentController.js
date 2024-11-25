const { BadRequest, InternalServerError } = require('../middleware/customError');
const CommentModel = require('../model/Comment');

const createComment = async (req, res, next) => {
    try {
        const {content, user_id, post_id} = req.body;

        if(!content || !user_id || !post_id) {
            next(new BadRequest());
        }

        const commentData = {
            content,
            created_at: timestamp(),
            modified_at: timestamp(),
            user_id,
            post_id
        }
        const newComment = await CommentModel.createComment(commentData);

        const { id } = newComment;

        res.status(201).json({
            message : '댓글 작성을 성공했습니다.',
            data : {
                comment_id : id 
            }
        });
    }catch(error) {
        next(new InternalServerError());
    }
}
//날짜 변환 함수
const timestamp = () => {
    const today = new Date();
    // 미국시간 기준이니까 9를 더해주면 대한민국 시간
    today.setHours(today.getHours() + 9);
    // 문자열로 바꿔주고 T를 빈칸으로 바꿔주면 yyyy-mm-dd hh:mm:ss 이런 형식 나옴
    return today.toISOString().replace("T", " ").substring(0, 19);
}
//댓글 수정
const updateComment = async (req, res, next) => {
    try {
        const id = req.params.comment_id;
        const { 
            content, 
            post_id, 
            user_id } = req.body;
        
        if(!content) {
            next(new BadRequest());
        }
        const commentData = {
            content,
            modified_at: timestamp(),
            user_id,
            post_id
        };

        const comment = await CommentModel.updateComment(id, commentData);
        
        res.status(200).json({
            message: '댓글 수정을 성공했습니다.',
            data: {
                comment_id: comment.id
            }
        });
    }catch(error) {
        next(new InternalServerError());
    }
}
//해당 댓글 조회
const findByUserId = async (req, res, next) => {
    try {
        const userId = req.body.user_id;

        const comments = await CommentModel.findByUserId(userId);

        if(!comments) {
            next(new BadRequest());
        }
        
        res.status(200).json({
            message: '댓글 조회를 성공했습니다.',
            data: comments
        });
    }catch(error) {
        next(new InternalServerError());
    }
}

module.exports = {
    createComment,
    updateComment,
    findByUserId
}