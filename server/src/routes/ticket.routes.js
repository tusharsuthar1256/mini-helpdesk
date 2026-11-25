const express = require('express');
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  manageTicket,
  deleteTicket,
  getStats,
  getTicketActivity,
} = require('../controllers/ticket.controllers');
const { getComments, addComment } = require('../controllers/comment.controllers');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getTickets);
router.post('/', createTicket);
router.get('/stats', getStats);
router.get('/:id', getTicket);
router.patch('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/manage', adminOnly, manageTicket);
router.get('/:id/activity', getTicketActivity);
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);

module.exports = router;
