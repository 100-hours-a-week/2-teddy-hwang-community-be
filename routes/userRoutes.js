const express = require('express');
const { createUser, login, getUserDetails, updateUserInfo } = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.post('/login', login);

router.get('/:user_id', getUserDetails);

router.patch('/:user_id/profile', updateUserInfo);

module.exports = router;