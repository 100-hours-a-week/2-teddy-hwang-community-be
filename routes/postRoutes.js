const express = require('express');
const { createPost, updatePost, getAllPosts, getOnePost } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);

router.patch('/:post_id', updatePost);

router.get('/', getAllPosts);
router.get('/:post_id', getOnePost);

module.exports = router;