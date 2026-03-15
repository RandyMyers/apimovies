/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel's serverless environment.
 */
console.log('[api/index.js] Vercel serverless entry loading');
process.env.VERCEL = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const app = require('../app');
console.log('[api/index.js] App required, exporting');
module.exports = app;
