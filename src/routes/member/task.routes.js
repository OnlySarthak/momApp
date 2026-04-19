const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth.middleware');
const {
    getTasksList,
    getTasksbyFilter,
    assignTask,
    renameTask,
    deleteTask
} = require('../../controllers/member/task.controller');

// Apply auth middleware to all member task routes
router.use(auth);

router.get('/', getTasksList);
router.get('/filter', getTasksbyFilter);
router.post('/', assignTask);
router.put('/rename/:id', renameTask);
router.delete('/:id', deleteTask);

module.exports = router;
