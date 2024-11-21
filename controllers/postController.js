const { BadRequest, InternalServerError } = require('../middleware/customError');
const PostModel = require('../model/Post');

//글생성
const createPost = async (req, res, next) => {
    try {
        const { 
            title, 
            content, 
            image, 
            user_id } = req.body;
        
        if(!title || !content || !user_id) {
            next(new BadRequest());
        }

        const newPost = await PostModel.createPost({
            title,
            content,
            image,
            created_at : timestamp(), 
            modified_at : timestamp(), 
            like_count : 0, 
            view_count : 0, 
            comment_count : 0, 
            user_id
        });

        const { id } = newPost;
        
        res.status(201).json({
            message: '게시글 작성을 성공했습니다.',
            data: {
                post_id: id 
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
//글 수정
const updatePost = async (req, res, next) => {
    try {
        const id = req.params.post_id;
        const { 
            title, 
            content, 
            image, 
            user_id } = req.body;
        
        if(!title || !content || !user_id) {
            next(new BadRequest());
        }
        const postData = {
            title,
            content,
            image,
            modified_at: timestamp(),
            user_id
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
        const posts = await PostModel.findAll();

        if(!posts) {
            next(new BadRequest());
        }

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
        const post = await PostModel.findById(id);

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
    createPost,
    updatePost,
    getAllPosts,
    getOnePost,
    deletePost
}