const {
  BadRequest,
  InternalServerError,
} = require('../middleware/customError');
const {
  save,
  findByEmail,
  existsByNicknameSignup,
  findById,
  updateUser,
  updatePassword,
  existsByNicknameUpdate,
  deleteUser,
} = require('../model/User');
const bcrypt = require('bcrypt');
const { userUpload } = require('../config/s3Config');
const { userValidator } = require('../utils/validation');

//사용자 생성
const createUser = async (req, res, next) => {
  try {
    // 클라이언트 요청 데이터(이메일, 비밀번호, 닉네임)
    const { email, password, nickname } = req.body;
    const imageUrl = req.file ? req.file.location : '';

    // 유효성 검사
    const emailValidation = userValidator.email(email);
    const passwordValidation = userValidator.password(password);
    const nicknameValidation = userValidator.nickname(nickname);
    const imageValidation = userValidator.image(imageUrl);

    if (!emailValidation.isValid) {
      return next(new BadRequest(emailValidation.message));
    }

    if (!passwordValidation.isValid) {
      return next(new BadRequest(passwordValidation.message));
    }

    if (!nicknameValidation.isValid) {
      return next(new BadRequest(nicknameValidation.message));
    }

    if (!imageValidation.isValid) {
      return next(new BadRequest(imageValidation.message));
    }

    //이메일 중복검사
    const existingEmail = await findByEmail(email);
    if (existingEmail) {
      return next(new BadRequest('이메일이 이미 존재합니다.'));
    }
    //닉네임 중복검사
    const existingNickname = await existsByNicknameSignup(nickname);
    if (existingNickname) {
      return next(new BadRequest('닉네임이 이미 존재합니다.'));
    }
    const encryptPassword = await bcrypt.hash(password, 10);
    //회원가입
    const newUser = await save({
      email,
      password: encryptPassword,
      nickname,
      profile_image: imageUrl,
    });

    res.status(201).json({
      message: '회원가입을 성공했습니다.',
      data: {
        user_id: newUser.id,
      },
    });
  } catch (error) {
    return next(new InternalServerError('회원가입에 실패했습니다.'));
  }
};
//회원 정보 조회
const getUserDetails = async (req, res, next) => {
  try {
    const id = Number(req.user.id);

    if(!id) {
      return next(new BadRequest('회원 정보 조회에 유저 정보가 누락되었습니다.'));
    }

    const user = await findById(id);

    if (!user) {
      return next(BadRequest('회원 정보 조회에 실패했습니다'));
    }

    res.status(200).json({
      message: '회원 정보 조회를 성공했습니다.',
      data: {
        user_id: user.user_id,
        email: user.email,
        nickname: user.nickname,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    return next(new InternalServerError('회원 정보 조회에 실패했습니다.'));
  }
};
//회원 정보 수정
const updateUserInfo = async (req, res, next) => {
  try {
    const id = Number(req.user.id);
    const { nickname } = req.body; // 클라이언트가 요청한 데이터 (닉네임)
    const imageUrl = req.file ? req.file.location : req.body.image;

    if(!id) {
      return next(new BadRequest('회원 정보 수정에 유저 정보가 누락되었습니다.'));
    }

    // 유효성 검사
    const nicknameValidation = userValidator.nickname(nickname);
    const imageValidation = userValidator.image(imageUrl);

    if (!nicknameValidation.isValid) {
      return next(new BadRequest(nicknameValidation.message));
    }

    if (!imageValidation.isValid) {
      return next(new BadRequest(imageValidation.message));
    }

    const user = await updateUser(id, nickname, imageUrl);

    res.status(200).json({
      message: '회원 정보 수정을 성공했습니다.',
      data: {
        user_id: user.id,
        profile_image: user.profile_image,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    return next(new InternalServerError('회원 정보 수정에 실패했습니다.'));
  }
};
//비밀번호 수정
const updateUserPassword = async (req, res, next) => {
  try {
    //경로 파라미터 추출
    const id = Number(req.user.id);
    const password = req.body.password;

    if(!id) {
      return next(new BadRequest('비밀번호 수정에 유저 정보가 누락되었습니다.'));
    }

    const passwordValidation = userValidator.password(password);

    if (!passwordValidation.isValid) {
      return next(new BadRequest(passwordValidation.message));
    }

    const user = await updatePassword(id, password);

    res.status(200).json({
      message: '비밀번호 수정을 성공했습니다.',
      data: {
        user_id: user.id,
      },
    });
  } catch (error) {
    return next(new InternalServerError('비밀번호 수정에 실패했습니다.'));
  }
};
//이메일 중복 확인
const existsByEmail = async (req, res, next) => {
  try {
    const email = req.params.email;

    if(!email) {
      return next(new BadRequest('이메일 중복 확인에 이메일이 누락되었습니다.'));
    }

    const user = await findByEmail(email);

    if (!user) {
      res.status(200).json({
        message: '중복된 이메일이 없습니다.',
        data: true,
      });
    } else {
      res.status(200).json({
        message: '중복된 이메일이 있습니다.',
        data: false,
      });
    }
  } catch (error) {
    return next(new InternalServerError('이메일 중복확인에 실패했습니다.'));
  }
};
//닉네임 중복 확인(유저 수정)
const checkNicknameUpdate = async (req, res, next) => {
  try {
    const id = Number(req.user.id);
    const nickname = req.params.nickname;
    
    if(!id) {
      return next(new BadRequest('유저 수정에 유저 정보가 누락되었습니다.'));
    }

    if(!nickname) {
      return next(new BadRequest('유저 수정에 닉네임이 누락되었습니다'));
    }

    const user = await existsByNicknameUpdate(nickname, id);

    if (!user) {
      res.status(200).json({
        message: '중복된 닉네임이 없습니다.',
        data: true,
      });
    } else {
      res.status(200).json({
        message: '중복된 닉네임이 있습니다.',
        data: false,
      });
    }
  } catch (error) {
    return next(new InternalServerError('유저 수정에 닉네임 중복 확인을 실패했습니다.'));
  }
};
//닉네임 중복 확인(회원가입)
const checkNicknameSignup = async (req, res, next) => {
  try {
    const nickname = req.params.nickname;

    if(!nickname) {
      return next(new BadRequest('회원 가입에 닉네임 정보가 누락되었습니다.'));
    }

    const user = await existsByNicknameSignup(nickname);

    if (!user) {
      res.status(200).json({
        message: '중복된 닉네임이 없습니다.',
        data: true,
      });
    } else {
      res.status(200).json({
        message: '중복된 닉네임이 있습니다.',
        data: false,
      });
    }
  } catch (error) {
    return next(new InternalServerError('회원 가입에 닉네임 중복확인을 실패했습니다.'));
  }
};
//회원 탈퇴
const removeUser = async (req, res, next) => {
  try {
    const id = Number(req.user.id);

    if(!id) {
      return next(new BadRequest('회원 탈퇴에 유저 정보가 누락되었습니다.'));
    }

    const user = await deleteUser(id);

    if (user) {
      res.status(200).json({
        message: '회원 탈퇴를 성공했습니다.',
        data: {
          user_id: id,
        },
      });
    } else {
      return next(new BadRequest('회원 탈퇴에 실패했습니다.'));
    }
  } catch (error) {
    return next(new InternalServerError('회원 탈퇴에 실패했습니다.'));
  }
};

module.exports = {
  createUser: [userUpload.single('image'), createUser],
  getUserDetails,
  updateUserInfo: [userUpload.single('image'), updateUserInfo],
  updateUserPassword,
  existsByEmail,
  checkNicknameSignup,
  checkNicknameUpdate,
  removeUser,
};
