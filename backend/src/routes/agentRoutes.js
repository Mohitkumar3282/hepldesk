const express = require('express');
const { listAgents } = require('../controllers/agentController');

const router = express.Router();
router.get('/', listAgents);

module.exports = router;
