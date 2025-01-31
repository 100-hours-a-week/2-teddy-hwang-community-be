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

//글생성
const createPost = async (req, res, next) => {
  try {
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
      return next(new BadRequest('사용자 정보가 누락되었습니다.'));
    }

    const newPost = await save({
      title,
      content,
      image: imageUrl,
      created_at: timestamp(),
      modified_at: timestamp(),
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
    return next(new InternalServerError());
  }
};
//날짜 변환 함수
const timestamp = () => {
  const today = new Date();
  // 미국시간 기준이니까 9를 더해주면 대한민국 시간
  today.setHours(today.getHours() + 9);
  // 문자열로 바꿔주고 T를 빈칸으로 바꿔주면 yyyy-mm-dd hh:mm:ss 이런 형식 나옴
  return today.toISOString().replace('T', ' ').substring(0, 19);
};
//글 수정
const updatePost = async (req, res, next) => {
  try {
    const id = Number(req.params.post_id);
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

    if (!user_id) {
      return next(new BadRequest('사용자 정보가 누락되었습니다.'));
    }

    const postData = {
      title,
      content,
      image: imageUrl,
      modified_at: timestamp(),
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
    next(new InternalServerError());
  }
};
//전체 글 조회
const getAllPosts = async (req, res, next) => {
  try {
    // 쿼리 파라미터에서 페이지와 한 페이지당 글 개수 추출
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      next(new BadRequest('잘못된 페이지 파라미터입니다.'));
    }
    const posts = await findAll(page, limit);

    if (!posts) {
      next(new BadRequest());
    }

    res.status(200).json({
      message: '게시글 목록 조회를 성공했습니다.',
      data: posts,
    });
  } catch (error) {
    next(new InternalServerError());
  }
};
//글 상세 조회
const getOnePost = async (req, res, next) => {
  try {
    const id = Number(req.params.post_id);
    const shouldIncreaseViewCount = req.shouldIncreaseViewCount;
    const post = await findById(id, shouldIncreaseViewCount);

    if (!post) {
      next(new BadRequest());
    }

    res.status(200).json({
      message: '게시글 상세 조회를 성공했습니다.',
      data: post,
    });
  } catch (error) {
    next(new InternalServerError());
  }
};

//글 삭제
const deletePost = async (req, res, next) => {
  try {
    const id = Number(req.params.post_id);

    const post = await deleteById(id);

    if (post) {
      res.status(200).json({
        message: '게시글 삭제를 성공했습니다.',
        data: {
          post_id: id,
        },
      });
    } else {
      next(new BadRequest());
    }
  } catch (error) {
    return next(new InternalServerError());
  }
};

module.exports = {
  createPost: [postUpload.single('image'), createPost],
  updatePost: [postUpload.single('image'), updatePost],
  getAllPosts,
  getOnePost,
  deletePost,
};
