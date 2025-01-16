const jwtConfig = require('../config/jwtConfig');
const { UnauthorizedError } = require('./customError');
const { findTokenByUserId, findById } = require('../model/RefreshToken');

const authMiddleware = async (req, res, next) => {
    try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('인증 토큰이 필요합니다');
        }

        // Bearer 제거 하고 토큰 추출
        const token = authHeader.split(' ')[1];
        const verified = jwtConfig.verifyAccessToken(token);
    
        if(verified.success) {
            req.user = verified.data;
            return next();
        }

        // Access Token이 만료된 경우
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            throw new UnauthorizedError('재로그인이 필요합니다');
        }

        // Refresh Token 검증
        const refreshVerified = jwtConfig.verifyRefreshToken(refreshToken);
        if(!refreshVerified.success) {
            throw new UnauthorizedError('재로그인이 필요합니다');
        }

        // DB에 저장된 Refresh Token과 비교
        const storedToken = await findTokenByUserId(refreshVerified.data.id);
        if(!storedToken || storedToken.token !== refreshToken) {
            throw new UnauthorizedError('재로그인이 필요합니다');
        }

        const user = await findById(refreshVerified.data.id);
        if(!user) {
            throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
        }

        // 새로운 Access Token 발급
        const newAccessToken = jwtConfig.generateAccessToken(user);   
        req.user = user;
        res.setHeader('Authorization', `Bearer ${newAccessToken}`);
        next();
        
    } catch (error) {
        next(new UnauthorizedError(error.message));
    }
};
// 토큰 갱신 미들웨어
const refreshTokenMiddleware = (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            throw new UnauthorizedError('Refresh 토큰이 없습니다.');
        }

        const verified = jwtConfig.verifyRefreshToken(refreshToken);
        if(!verified.success) {
            throw new UnauthorizedError('유효하지 않은 Refresh 토큰입니다.');
        }

        req.refreshToken = refreshToken;
        req.userId = verified.data.id;
        next();
    } catch (error) {
        next(new UnauthorizedError(error.message));
    }
};

module.exports = {
    authMiddleware,
    refreshTokenMiddleware
};