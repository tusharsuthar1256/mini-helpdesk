const express = require('express');
const { getUsers, getAdmins, updateRole } = require('../controllers/user.controllers');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getUsers);
router.get('/admins', getAdmins);
router.patch('/:id/role', updateRole);

module.exports = router;
