const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtConfig = {
  // 액세스 토큰 및 리프레시 토큰 설정
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
  },

  // Access Token 생성
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        nickname: user.nickname,
        profile_image: user.profile_image,
      },
      this.access.secret,
      { expiresIn: this.access.expiresIn },
    );
  },
  // Refresh Token 생성
  generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, this.refresh.secret, {
      expiresIn: this.refresh.expiresIn,
    });
  },
  // Access Token 검증
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.access.secret);
      return {
        message: 'Access Token 검증에 성공했습니다',
        success: true,
        data: decoded,
      };
    } catch (error) {
      return {
        message: 'Access Token 검증에 실패했습니다',
        success: false,
        data: error.message,
      };
    }
  },
  // Refresh Token 검증
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refresh.secret);
      return {
        message: 'Refresh Token 검증에 성공했습니다',
        success: true,
        data: decoded,
      };
    } catch (error) {
      return {
        message: 'Refresh Token 검증에 실패했습니다',
        success: false,
        data: error.message,
      };
    }
  },
};

module.exports = jwtConfig;
