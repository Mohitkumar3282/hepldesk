const express = require('express');
const {
  createTicket,
  listTickets,
  getStats,
  getTicket,
  updateStatus,
  addComment,
} = require('../controllers/ticketController');

const router = express.Router();

router.get('/stats', getStats);
router.get('/', listTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.patch('/:id/status', updateStatus);
router.post('/:id/comments', addComment);

module.exports = router;
