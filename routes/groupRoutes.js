const express = require('express');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteGroup
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createGroup)
  .get(protect, getMyGroups);

router.route('/:id')
  .get(protect, getGroupById)
  .delete(protect, deleteGroup);

router.put('/:id/add-member', protect, addMemberToGroup);
router.put('/:id/remove-member', protect, removeMemberFromGroup);


module.exports = router;