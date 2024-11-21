const fs = require('fs');
const path = require('path');
const User = require('./User');
const { InternalServerError, BadRequest } = require('../middleware/customError');

class Comment {
    constructor() {
        this.filePath = path.join(__dirname, '../data/comments.json');
    }
    //모든 댓글 조회(댓글 작성할 때 맨 뒤에 추가해야해서 필요)
    findAll() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return data ? JSON.parse(data) : [];
        }catch(error) {
            if(error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    //댓글 생성
    createComment(commentData) {
        try {
            const comments = this.findAll();
            
            const newComment = {
                id: comments.length + 1,
                ...commentData
            };
            comments.push(newComment);
            
            fs.writeFileSync(this.filePath, JSON.stringify(comments, null, 2), 'utf8');
            
            return newComment;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //글에 해당하는 댓글 조회(댓글 유저 정보 포함)
    findByPostId(postId) {
        try {
            const comments = this.findAll();
            const commentsInPost = comments
            .filter(comment => comment.post_id === Number(postId))
            .map(comment => {
                const user = User.findById(comment.user_id);
                return {
                    ...comment,
                    author: {
                        nickname: user.nickname,
                        profile_image: user.profile_image
                    }
                };
            });

            return commentsInPost ? commentsInPost : null;
        }catch(error) {
            throw new InternalServerError();
        }
    }
}

module.exports = new Comment();