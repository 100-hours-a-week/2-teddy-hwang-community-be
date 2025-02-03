const bcrypt = require('bcrypt');
const jwtConfig = require('../config/jwtConfig');
const { findByEmail, findById } = require('../model/User');
const {
  BadRequest,
  InternalServerError,
  UnauthorizedError,
} = require('../middleware/customError');
const {
  saveToken,
  findToken,
  revokeToken,
  findTokenByUserId,
} = require('../model/RefreshToken');
const { userValidator } = require('../utils/validation');

// 로그인
const login = async (req, res, next) => {
  try {
    // 클라이언트 요청 데이터 (이메일, 비밀번호)
    const { email, password } = req.body; 

    const emailValidation = userValidator.email(email);
    const passwordValidation = userValidator.password(password);

    // 유효성 검사
    if (!emailValidation.isValid) {
      return next(new BadRequest(emailValidation.message));
    }

    if (!passwordValidation.isValid) {
      return next(new BadRequest(passwordValidation.message));
    }

    const user = await findByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: '*아이디 또는 비밀번호가 올바르지 않습니다.',
      });
    }
    // 저장된 비밀번호와 입력된 비밀번호 비교
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: '*아이디 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // Access Token 및 Refresh Token 생성
    const accessToken = jwtConfig.generateAccessToken(user);

    // Refresh 토큰 확인
    let refreshToken;
    const existingToken = await findTokenByUserId(user.user_id);

    if (existingToken) {
      // 기존 Refresh 토큰의 유효성 검증
      const tokenVerification = jwtConfig.verifyRefreshToken(
        existingToken.token,
      );

      if (tokenVerification.success) {
        // 유효한 토큰이 있다면 재사용
        refreshToken = existingToken.token;
      } else {
        // 기존 토큰이 없다면 새로 발급
        refreshToken = jwtConfig.generateRefreshToken(user.user_id);
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 14);
        await saveToken(user.user_id, refreshToken, expiredAt);
      }
    } else {
      // 기존 토큰이 없다면 새로 발급
      refreshToken = jwtConfig.generateRefreshToken(user.user_id);
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 14);
      await saveToken(user.user_id, refreshToken, expiredAt);
    }

    // Refresh Token을 HTTP-only 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14일
    });

    res.status(200).json({
      message: '로그인을 성공했습니다.',
      data: {
        user_id: user.user_id,
        accessToken,
      },
    });
  } catch (error) {
    return next(new InternalServerError('로그인을 실패했습니다.'));
  }
};
// 토큰 갱신
const refresh = async (req, res, next) => {
  try {
    // 클라이언트 요청 데이터 (토큰, 유저 아이디)
    const { refreshToken, userId } = req; 
    
    if(!refreshToken) {
      return next(new BadRequest('토큰 갱신 중에 Refresh Token이 없습니다.')); 
    }

    if(!userId) {
      return next(new BadRequest('토큰 갱신 중에 유저 정보가 없습니다.'));
    }

    // DB에서 Refresh Token 확인
    const storedToken = await findToken(refreshToken);
    if (!storedToken) {
      return next(new UnauthorizedError('유효하지 않은 Refresh Token입니다.'));
    }

    // userId로 사용자 정보 조회
    const user = await findById(userId);
    if (!user) {
      return next(new UnauthorizedError('토큰 갱신 중에 유저를 찾을 수 없습니다.'));
    }
    const newAccessToken = jwtConfig.generateAccessToken(user);

    res.status(200).json({
      message: '토큰이 갱신되었습니다.',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return next(new InternalServerError('토큰 갱신에 실패했습니다.'));
  }
};
// 로그아웃
const logout = async (req, res, next) => {
  try { 
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return new BadRequest('로그아웃 할 Refresh Token이 없습니다.');      
    } else {
      await revokeToken(refreshToken); // Refresh Token 무효화
    }

    // Refresh Token 쿠키 제거
    res.clearCookie('refreshToken');

    res.status(200).json({
      message: '로그아웃 되었습니다.',
    });
  } catch (error) {
    return next(new InternalServerError('로그아웃에 실패했습니다.'));
  }
};

module.exports = {
  login,
  refresh,
  logout,
};
