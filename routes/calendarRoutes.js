const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public read-only episode endpoints (no auth required)
router.get('/episodes/upcoming', optionalAuth, calendarController.getUpcomingEpisodes);
router.get('/episodes/recent', optionalAuth, calendarController.getRecentEpisodes);
router.get('/episodes/whats-next', optionalAuth, calendarController.getWhatsNext);
router.get('/episodes/by-month', calendarController.getEpisodesForMonth);
router.get('/episodes/:tvId/next', calendarController.getNextEpisodeForShow);

// Protected routes (require authentication)
router.use(authenticate);

// Events (require auth - user's personal events)
router.get('/events', calendarController.getEvents);
router.get('/events/:id', calendarController.getEvent);
router.post('/events', calendarController.createEvent);
router.put('/events/:id', calendarController.updateEvent);
router.delete('/events/:id', calendarController.deleteEvent);

// Reminders (require auth - user's personal reminders)
router.get('/reminders', calendarController.getReminders);
router.post('/reminders', calendarController.createReminder);
router.post('/reminders/auto-episode', calendarController.enableAutoReminders);
router.delete('/reminders/auto-episode/:tvId', calendarController.disableAutoReminders);

module.exports = router;


