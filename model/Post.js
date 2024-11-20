const fs = require('fs');
const path = require('path');
const { InternalServerError, BadRequest } = require('../middleware/customError');

class Post {
    constructor() {
        this.filePath = path.join(__dirname, '../data/posts.json');
    }
    //글 전체 조회
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
    //글 생성
    createPost(postData) {
        try {
            const posts = this.findAll();
            const newPost = {
                id: posts.length + 1,
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
    
}

module.exports = new Post();