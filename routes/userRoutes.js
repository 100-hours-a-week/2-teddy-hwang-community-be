const express = require('express');
const { createUser, login, getUserDetails, updateUserInfo, updatePassword, existsByEmail, existsByNickname, checkPasswordMatch, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.post('/login', login);

router.get('/:user_id', getUserDetails);
router.get('/email/:email', existsByEmail);
router.get('/nickname/:nickname', existsByNickname);
router.get('/:user_id/:password', checkPasswordMatch);

router.patch('/:user_id/profile', updateUserInfo);
router.patch('/:user_id/password', updatePassword);

router.delete('/:user_id', deleteUser);

module.exports = router;