const fs = require('fs');
const path = require('path');
const Post = require('./Post');
const { InternalServerError, BadRequest } = require('../middleware/customError');

class Like {
    constructor() {
        this.likeFilePath = path.join(__dirname, '../data/likes.json');
        this.postFilePath = path.join(__dirname, '../data/posts.json');
    }
    //JSON 파일에서 좋아요 데이터 읽어오기
    readLikesFile() {
        try {
            const data = fs.existsSync(this.likeFilePath) ? fs.readFileSync(this.likeFilePath, 'utf8') : '[]';
            return JSON.parse(data);
        } catch (error) {
            throw new InternalServerError();
        }
    }

    //JSON 파일에서 게시글 데이터 읽어오기
    readPostsFile() {
        try {
            const data = fs.existsSync(this.postFilePath) ? fs.readFileSync(this.postFilePath, 'utf8') : '[]';
            return JSON.parse(data);
        } catch (error) {
            throw new InternalServerError();
        }
    }

    //JSON 파일에 좋아요 데이터 저장
    writeLikesFile(likes) {
        try {
            fs.writeFileSync(this.likeFilePath, JSON.stringify(likes, null, 2), 'utf8');
        } catch (error) {
            throw new InternalServerError();
        }
    }

    //JSON 파일에 게시글 데이터 저장
    writePostsFile(posts) {
        try {
            fs.writeFileSync(this.postFilePath, JSON.stringify(posts, null, 2), 'utf8');
        } catch (error) {
            throw new InternalServerError();
        }
    }

    //좋아요 추가 및 게시글의 like_count 증가
    addLike(postId, userId) {
        const likes = this.readLikesFile();
        const posts = this.readPostsFile();

        //이미 좋아요가 눌려 있는지 확인
        const existLike = likes.find(like => like.post_id === Number(postId) && like.user_id === Number(userId));
        if (existLike) {
            throw new BadRequest('이미 좋아요를 눌렀습니다.');
        }

        //좋아요 추가
        const newLike = { post_id: Number(postId), user_id: userId };
        likes.push(newLike);
        this.writeLikesFile(likes);

        // posts.json에서 해당 게시글의 like_count 증가
        const postIndex = posts.findIndex(post => post.id === Number(postId));
        if (postIndex !== -1) {
            posts[postIndex].like_count++;
            this.writePostsFile(posts);
        }

        return newLike;
    }
    //좋아요 취소 및 게시글의 like_count 감소
    removeLike(postId, userId) {
        const likes = this.readLikesFile();
        const posts = this.readPostsFile();

        // 좋아요가 존재하지 않는 경우 에러 처리
        const updatedLikes = likes.filter(like => !(like.post_id === Number(postId) && like.user_id === userId));
        if (updatedLikes.length === likes.length) {
            throw new BadRequest('좋아요를 누르지 않았습니다.');
        }

        // 좋아요 취소
        this.writeLikesFile(updatedLikes);

        // posts.json에서 해당 게시글의 like_count 감소
        const postIndex = posts.findIndex(post => post.id === Number(postId));
        if (postIndex !== -1 && posts[postIndex].like_count > 0) {
            posts[postIndex].like_count --;
            this.writePostsFile(posts);
        }

        return true;
    }

}

module.exports = new Like();