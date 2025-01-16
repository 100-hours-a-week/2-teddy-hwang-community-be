// routes/userRoutes.js
const express = require('express');
const { 
    createUser, 
    getUserDetails, 
    updateUserInfo, 
    updateUserPassword, 
    existsByEmail, 
    checkNicknameSignup, 
    checkNicknameUpdate, 
    removeUser 
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 회원가입
router.post('/', ...createUser);

// 이메일, 닉네임 중복 체크
router.get('/email/:email', existsByEmail);
router.get('/signup/nickname/:nickname', checkNicknameSignup);
router.get('/profile/nickname/:nickname', authMiddleware, checkNicknameUpdate);

// 유저 정보 관련
router.get('/:user_id', authMiddleware, getUserDetails);
router.patch('/:user_id/profile', authMiddleware, ...updateUserInfo);
router.patch('/:user_id/password', authMiddleware, updateUserPassword);
router.delete('/:user_id', authMiddleware, removeUser);

module.exports = router;