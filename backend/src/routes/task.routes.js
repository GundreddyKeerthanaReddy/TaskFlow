const express = require('express');
const { body } = require('express-validator');
const {
  getTasks, getTask, createTask, updateTask, deleteTask,
  moveTask, addComment, deleteComment, updateChecklistItem
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.post('/', [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Task title must be 2-200 characters'),
  body('project').isMongoId().withMessage('Valid project ID required'),
  validate
], createTask);

router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/move', moveTask);

router.post('/:id/comments', [
  body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1-2000 characters'),
  validate
], addComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.patch('/:id/checklist/:itemId', updateChecklistItem);

module.exports = router;
