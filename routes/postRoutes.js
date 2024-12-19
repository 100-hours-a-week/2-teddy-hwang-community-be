const express = require('express');
const { createPost, updatePost, getAllPosts, getOnePost, deletePost, getOnePostWithoutView, } = require('../controllers/postController');

const router = express.Router();
const likeRoutes = require('./likeRoutes');

router.post('/', ...createPost);

router.patch('/:post_id', ...updatePost);

router.get('/', getAllPosts);
router.get('/:post_id', getOnePost);
router.get('/:post_id/without-view', getOnePostWithoutView);

router.delete('/:post_id', deletePost);

router.use('/', likeRoutes);

module.exports = router;