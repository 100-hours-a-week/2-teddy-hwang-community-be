const { BadRequest, InternalServerError } = require('../middleware/customError');
const PostModel = require('../model/Post');
const { postUpload } = require('../config/s3Config');

//글생성
const createPost = async (req, res, next) => {
    try {
        const { 
            title, 
            content, 
            user_id } = req.body;
    
        const userId = Number(user_id);

        const imageUrl = req.file ? req.file.location : "";
        
        if(!title || !content || !user_id) {
            next(new BadRequest());
        }

        const newPost = await PostModel.createPost({
            title,
            content,
            image: imageUrl,
            created_at : timestamp(), 
            modified_at : timestamp(), 
            like_count : 0, 
            view_count : 0, 
            comment_count : 0, 
            user_id: userId
        });

        const { id } = newPost;
        
        res.status(201).json({
            message: '게시글 작성을 성공했습니다.',
            data: {
                post_id: id,
                image_url: imageUrl
            }
        });
    }catch(error) {
       return next(new InternalServerError());
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
//글 수정
const updatePost = async (req, res, next) => {
    try {
        const id = req.params.post_id;
        const { 
            title, 
            content, 
            user_id } = req.body;

        const userId = Number(user_id);

        const imageUrl = req.file ? req.file.location : "";

        if(!title || !content || !user_id) {
            next(new BadRequest());
        }
        const postData = {
            title,
            content,
            image: imageUrl,
            modified_at: timestamp(),
            user_id: userId
        };

        const post = await PostModel.updatePost(id, postData);
        
        res.status(200).json({
            message: '게시글 수정을 성공했습니다.',
            data: {
                post_id: post.id
            }
        });
    }catch(error) {
        next(new InternalServerError());
    }
}
//전체 글 조회
const getAllPosts = async (req, res, next) => {
    try {
        const posts = await PostModel.findAllWithUser();

        if(!posts) {
            next(new BadRequest());
        }
        //전체 글 역순 정렬
        posts.sort((a, b) => b.id - a.id);
        
        res.status(200).json({
            message: '게시글 목록 조회를 성공했습니다.',
            data: posts
        });
    }catch(error) {
        next(new InternalServerError());
    }
}
//글 상세 조회
const getOnePost = async (req, res, next) => {
    try {
        const id = req.params.post_id;
        const post = await PostModel.findByIdWithView(id);

        if(!post) {
            next(new BadRequest());
        }

        res.status(200).json({
            message: '게시글 상세 조회를 성공했습니다.',
            data: post   
        });
    }catch(error) {
        next(new InternalServerError());
    }
}
//글 상세 조회 조회수 증가x
const getOnePostWithoutView = async (req, res, next) => {
    try {
        const id = req.params.post_id;
        const post = await PostModel.findByIdWithoutView(id);

        if(!post) {
            next(new BadRequest());
        }

        res.status(200).json({
            message: '게시글 상세 조회를 성공했습니다.',
            data: post   
        });
    }catch(error) {
        next(new InternalServerError());
    }
}
//글 삭제
const deletePost = async (req, res, next) => {
    try {
        const id = req.params.post_id;
    
        const post = await PostModel.deletePost(id);

        if(post) {
            res.status(200).json({
                message: '게시글 삭제를 성공했습니다.',
                data: {
                    post_id: id
                }
            });
        }else {
            next(new BadRequest());
        }
    }catch(error) {
        return next(new InternalServerError());
    }
}

module.exports = {
    createPost: [postUpload.single('image'), createPost],
    updatePost: [postUpload.single('image'), updatePost],
    getAllPosts,
    getOnePost,
    getOnePostWithoutView,
    deletePost
}