const express = require('express');
const { isAuthenticated, isResourceOwner } = require('../middleware/auth');
const {  createUser, login, getUserDetails, updateUserInfo, updateUserPassword, existsByEmail, checkNicknameSignup, checkNicknameUpdate, removeUser, logout } = require('../controllers/userController');

const router = express.Router();

router.post('/', ...createUser);
router.post('/login', login);
router.post('/logout', logout);

router.get('/:user_id', isAuthenticated, isResourceOwner, getUserDetails);
router.get('/email/:email', existsByEmail);
router.get('/signup/nickname/:nickname', checkNicknameSignup);
router.get('/profile/nickname/:nickname', checkNicknameUpdate);

router.patch('/:user_id/profile', ...updateUserInfo);
router.patch('/:user_id/password', isAuthenticated, isResourceOwner, updateUserPassword);

router.delete('/:user_id', isAuthenticated, isResourceOwner, removeUser);

module.exports = router;

