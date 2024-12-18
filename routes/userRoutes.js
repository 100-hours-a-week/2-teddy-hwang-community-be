const express = require('express');
const { isAuthenticated, isResourceOwner } = require('../middleware/auth');
const { createUser, login, getUserDetails, updateUserInfo, updatePassword, existsByEmail, existsByNickname, checkPasswordMatch, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.post('/login', login);

router.get('/:user_id', isAuthenticated, isResourceOwner, getUserDetails);
router.get('/email/:email', existsByEmail);
router.get('/nickname/:nickname', existsByNickname);
router.get('/:user_id/:password', isAuthenticated, isResourceOwner, checkPasswordMatch);

router.patch('/:user_id/profile', isAuthenticated, isResourceOwner, updateUserInfo);
router.patch('/:user_id/password', isAuthenticated, isResourceOwner, updatePassword);

router.delete('/:user_id', isAuthenticated, isResourceOwner, deleteUser);

module.exports = router;

