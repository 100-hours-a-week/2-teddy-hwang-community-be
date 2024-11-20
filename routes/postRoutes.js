const express = require('express');
const { createPost, updatePost } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);

router.patch('/:post_id', updatePost);

module.exports = router;