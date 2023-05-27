#!/usr/bin/env node
/**
 * @module routes
 */
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

/* Create a new User */
router.post('/users', UsersController.postNew);

module.exports = router;
