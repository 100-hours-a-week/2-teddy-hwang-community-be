const express = require('express');
const { createUser, login, getUserDetails } = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.post('/login', login);

router.get('/:user_id', getUserDetails);

module.exports = router;