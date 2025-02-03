const {
  BadRequest,
  InternalServerError,
} = require('../middleware/customError');
const {
  findAll,
  save,
  update,
  findById,
  deleteById,
} = require('../model/Post');
const { postUpload } = require('../config/s3Config');
const { postValidator } = require('../utils/validation');
const { getTimestamp } = require('../utils/dayUtil');

//글생성
const createPost = async (req, res, next) => {
  try {
    // 클라이언트가 요청한 데이터 (제목, 내용, 유저 아이디)
    const { title, content, user_id } = req.body;
    const userId = Number(user_id);
    const imageUrl = req.file ? req.file.location : '';

    // 유효성 검사
    const titleValidation = postValidator.title(title);
    const contentValidation = postValidator.content(content);

    if (!titleValidation.isValid) {
      return next(new BadRequest(titleValidation.message));
    }

    if (!contentValidation.isValid) {
      return next(new BadRequest(contentValidation.message));
    }

    if (!user_id) {
      return next(new BadRequest('게시글 작성에 사용자 정보가 누락되었습니다.'));
    }

    const newPost = await save({
      title,
      content,
      image: imageUrl,
      created_at: getTimestamp(),
      modified_at: getTimestamp(),
      like_count: 0,
      view_count: 0,
      comment_count: 0,
      user_id: userId,
    });

    res.status(201).json({
      message: '게시글 작성을 성공했습니다.',
      data: {
        post_id: newPost.id,
        image_url: imageUrl,
      },
    });
  } catch (error) {
    return next(new InternalServerError('게시글 작성을 실패했습니다.'));
  }
};
//글 수정
const updatePost = async (req, res, next) => {
  try {
    const id = Number(req.params.post_id);
    // 클라이언트가 요청한 데이터 (제목, 내용, 유저 아이디)
    const { title, content, user_id } = req.body;
    const userId = Number(user_id);
    const imageUrl = req.file ? req.file.location : req.body.image;

    // 유효성 검사
    const titleValidation = postValidator.title(title);
    const contentValidation = postValidator.content(content);

    if (!titleValidation.isValid) {
      return next(new BadRequest(titleValidation.message));
    }

    if (!contentValidation.isValid) {
      return next(new BadRequest(contentValidation.message));
    }

    if(!id) {
      return next(new BadRequest('게시글 수정에 게시글 정보가 누락되었습니다.'));
    }

    if (!user_id) {
      return next(new BadRequest('게시글 수정에 사용자 정보가 누락되었습니다.'));
    }

    const postData = {
      title,
      content,
      image: imageUrl,
      modified_at: getTimestamp(),
      user_id: userId,
    };

    const post = await update(id, postData);

    res.status(200).json({
      message: '게시글 수정을 성공했습니다.',
      data: {
        post_id: post.id,
      },
    });
  } catch (error) {
    return next(new InternalServerError('게시글 수정에 실패했습니다.'));
  }
};
//전체 글 조회
const getAllPosts = async (req, res, next) => {
  try {
    // 쿼리 파라미터에서 페이지와 한 페이지당 글 개수 추출
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      return next(new BadRequest('잘못된 페이지 파라미터입니다.'));
    }
    const posts = await findAll(page, limit);

    if (!posts) {
      return next(new BadRequest('게시글 목록 조회에 실패했습니다.'));
    }

    res.status(200).json({
      message: '게시글 목록 조회를 성공했습니다.',
      data: posts,
    });
  } catch (error) {
    return next(new InternalServerError('게시글 목록 조회에 실패했습니다.'));
  }
};
//글 상세 조회
const getOnePost = async (req, res, next) => {
  try {
    const id = Number(req.params.post_id);
    const shouldIncreaseViewCount = req.shouldIncreaseViewCount; // 조회수 증가를 할 것인지 말 것인지
    const post = await findById(id, shouldIncreaseViewCount);
    
    if(!id) {
      return next(new BadRequest('게시글 상세 조회에 게시글 정보가 없습니다.'));
    }

    if (!post) {
      return next(new BadRequest('게시글 상세 조회를 실패했습니다.'));
    }

    res.status(200).json({
      message: '게시글 상세 조회를 성공했습니다.',
      data: post,
    });
  } catch (error) {
    return next(new InternalServerError('게시글 상세 조회를 실패했습니다.'));
  }
};

//글 삭제
const deletePost = async (req, res, next) => {
  try {
    const id = Number(req.params.post_id);

    if(!id) {
      return next(new BadRequest('게시글 삭제에 게시글 정보가 없습니다.'));
    }

    const post = await deleteById(id);
   

    if (!post) {
      return next(new BadRequest('게시글 삭제를 실패했습니다.'));
    } else {
      res.status(200).json({
        message: '게시글 삭제를 성공했습니다.',
        data: {
          post_id: id,
        },
      });
    }
  } catch (error) {
    return next(new InternalServerError('게시글 삭제를 실패했습니다.'));
  }
};

module.exports = {
  createPost: [postUpload.single('image'), createPost],
  updatePost: [postUpload.single('image'), updatePost],
  getAllPosts,
  getOnePost,
  deletePost,
};
