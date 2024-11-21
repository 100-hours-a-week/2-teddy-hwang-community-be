const fs = require('fs');
const path = require('path');
const User = require('./User');
const Comment = require('./Comment');
const { InternalServerError, BadRequest } = require('../middleware/customError');

class Post {
    constructor() {
        this.filePath = path.join(__dirname, '../data/posts.json');
    }
    //글 전체 조회
    findAll() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            const posts =  data ? JSON.parse(data) : [];
            return posts;
        }catch(error) {
            if(error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    //사용자 정보를 추가한 데이터를 반환하는 메서드
    findAllWithUser() {
        const posts = this.findAll();

        return posts.map(post => {
            const user = User.findById(post.user_id);
            return {
                ...post,
                author: {
                    nickname: user.nickname,
                    profile_image: user.profile_image,
                }
            };
        });
    }
    //글 생성
    createPost(postData) {
        try {
            const posts = this.findAll();
            const postId = posts.length > 0 ? Math.max(...posts.map(post => post.id)) + 1 : 1;
            const newPost = {
                id: postId,
                ...postData
            };
            posts.push(newPost);
            fs.writeFileSync(this.filePath, JSON.stringify(posts, null, 2), 'utf8');
            
            return newPost;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //글 수정
    updatePost(id, postData) {
        try {
            const posts = this.findAll();
            const postIndex = posts.findIndex(post => post.id === Number(id));

            if(postIndex === -1) {
                throw new Error('글을 찾을 수 없습니다.');
            }
            //유저 정보 수정
            const updatedPost = {
                ...posts[postIndex],
                ...postData
            };
            //배열에 반영
            posts[postIndex] = updatedPost;

            fs.writeFileSync(this.filePath, JSON.stringify(posts, null, 2), 'utf8');

            return updatedPost;
        }catch(error) {
            throw new InternalServerError();
        }
    }
    //글 상세 조회
    findById(id) {
        try {
            const posts = this.findAll();
            const post = posts.find(post => post.id === Number(id));
            const user = User.findById(post.user_id);
            const comments = Comment.findByPostId(post.id);

            const postDetails = {
                post_id: post.id,
                title: post.title,
                post_author: {
                    nickname : user.nickname,
                    profile_image : user.profile_image
                },
                user_id: post.user_id,
                post_modified_at: post.modified_at,
                post_image: post.image,
                content: post.content,
                like_count: post.like_count,
                view_count: post.view_count,
                comment_count: post.comment_count,
                comments: comments
            }
            return postDetails ? postDetails : null;           
        }catch(error) {
            console.error(error);
            throw new InternalServerError();
        }
    }
    //글 삭제
    deletePost(id) {
        try {
            const posts = this.findAll();
            const postIndex = posts.findIndex(post => post.id === Number(id));

            //해당 글이 없으면 에러 발생
            if (postIndex === -1) {
                throw new BadRequest();
            }

            //글 삭제
            posts.splice(postIndex, 1);

            //JSON 파일에 업데이트
            fs.writeFileSync(this.filePath, JSON.stringify(posts, null, 2), 'utf8');

            return true;
        } catch (error) {
            throw new InternalServerError();
        }
    }
}

module.exports = new Post();