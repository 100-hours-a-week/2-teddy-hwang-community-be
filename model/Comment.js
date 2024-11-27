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
            const commentId = comments.length > 0 ? Math.max(...comments.map(comment => comment.id)) + 1 : 1;
            
            const newComment = {
                id: commentId,
                ...commentData
            };
            comments.push(newComment);
            //댓글 추가 후 모든 게시글 정보 가져오기
            const Post = require('./Post');
            const posts = Post.findAll();
            const post = posts.find(post => post.id === commentData.post_id);
            
            if(post) {
                post.comment_count++;

                fs.writeFileSync(path.join(__dirname, '../data/posts.json'), JSON.stringify(posts, null, 2), 'utf8');
            }

            
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
    //댓글 수정
    updateComment(id, commentData) {
        try {
            const comments = this.findAll();
            const commentIndex = comments.findIndex(comment => comment.id === Number(id));

            if(commentIndex === -1) {
                throw new Error('댓글을 찾을 수 없습니다.');
            }
            //유저 정보 수정
            const updatedComment = {
                ...comments[commentIndex],
                ...commentData
            };
            //배열에 반영
            comments[commentIndex] = updatedComment;

            fs.writeFileSync(this.filePath, JSON.stringify(comments, null, 2), 'utf8');

            return updatedComment;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //해당 유저가 쓴 댓글인지 조회
    findByUserId(userId) {
        try {
            const comments = this.findAll();
            const userComments = comments
            .filter(comment => comment.user_id === Number(userId))
            .map(comment => ({
                comment_id: comment.id,
                content: comment.content
            }));

            return userComments ? userComments : null;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //댓글 삭제
    deleteComment(id) {
        try {
            const comments = this.findAll();
            const commentIndex = comments.findIndex(comment => comment.id === Number(id));

            //해당 댓글이 없으면 에러 발생
            if (commentIndex === -1) {
                throw new BadRequest();
            }

            //해당 글 댓글 수 감소
            const postId = comments[commentIndex].post_id;
            const Post = require('./Post');
            const posts = Post.findAll();
            const postIndex = posts.findIndex(post => post.id === Number(postId));

            if (postIndex !== -1) {
                posts[postIndex].comment_count = Math.max(0, posts[postIndex].comment_count - 1); // 댓글 수 감소
                fs.writeFileSync(path.join(__dirname, '../data/posts.json'), JSON.stringify(posts, null, 2), 'utf8');
            }

            //댓글 삭제
            comments.splice(commentIndex, 1);

            //JSON 파일에 업데이트
            fs.writeFileSync(this.filePath, JSON.stringify(comments, null, 2), 'utf8');

            return true;
        } catch (error) {
            throw new InternalServerError();
        }
    }
}

module.exports = new Comment();