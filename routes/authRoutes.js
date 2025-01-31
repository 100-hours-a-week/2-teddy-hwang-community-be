// routes/authRoutes.js
const express = require('express');
const {
  login,
  refresh,
  logout,
  logoutAll,
} = require('../controllers/authController');
const {
  authMiddleware,
  refreshTokenMiddleware,
} = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/logout-all', authMiddleware, logoutAll);
router.post('/refresh', refreshTokenMiddleware, refresh);

module.exports = router;
