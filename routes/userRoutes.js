const express = require('express');
const router = express.Router();
const { registerUser, loginUser, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', protect, searchUsers); // Protected route for searching users

module.exports = router;