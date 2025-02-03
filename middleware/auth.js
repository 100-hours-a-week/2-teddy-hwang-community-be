const jwtConfig = require('../config/jwtConfig');
const { findTokenByUserId } = require('../model/RefreshToken');
const { findAuthUser } = require('../model/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: '로그인이 필요한 서비스입니다.',
      });
    }

    // Bearer 제거 하고 토큰 추출
    const token = authHeader.split(' ')[1];
    const verified = jwtConfig.verifyAccessToken(token);

    if (verified.success) {
      if (!verified.data || !verified.data.id) {
        return res.status(401).json({
          message: '로그인이 필요한 서비스입니다.',
        });
      }
      req.user = verified.data;
      return next();
    }

    // Access Token이 만료된 경우
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: '재로그인이 필요합니다.',
      });
    }

    // Refresh Token 검증
    const refreshVerified = jwtConfig.verifyRefreshToken(refreshToken);
    if (!refreshVerified.success) {
      return res.status(401).json({
        message: '재로그인이 필요합니다.',
      });
    }

    // DB에 저장된 Refresh Token과 비교
    const storedToken = await findTokenByUserId(refreshVerified.data.id);
    if (!storedToken || storedToken.token !== refreshToken) {
      return res.status(401).json({
        message: '재로그인이 필요합니다.',
      });
    }

    const user = await findAuthUser(refreshVerified.data.id);
    if (!user) {
      return res.status(401).json({
        message: '로그인이 필요한 서비스입니다.',
      });
    }

    // 새로운 Access Token 발급
    const newAccessToken = jwtConfig.generateAccessToken(user);
    req.user = user;
    res.setHeader('Authorization', `Bearer ${newAccessToken}`);
    next();
  } catch (error) {
    return res.status(401).json({
      message: '로그인이 필요한 서비스입니다.',
    });
  }
};
// 토큰 갱신 미들웨어
const refreshTokenMiddleware = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh 토큰이 없습니다.',
      });
    }

    const verified = jwtConfig.verifyRefreshToken(refreshToken);
    if (!verified.success) {
      return res.status(401).json({
        message: '유효하지 않은 Refresh 토큰입니다.',
      });
    }

    req.refreshToken = refreshToken;
    req.userId = verified.data.id;
    next();
  } catch (error) {
    return res.status(401).json({
      message: '로그인이 필요한 서비스입니다.',
    });
  }
};

module.exports = {
  authMiddleware,
  refreshTokenMiddleware,
};
