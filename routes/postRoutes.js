const express = require('express');
const { createPost, updatePost, getAllPosts } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);

router.patch('/:post_id', updatePost);

router.get('/', getAllPosts);

module.exports = router;