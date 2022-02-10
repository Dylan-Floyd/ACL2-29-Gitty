const express = require('express');
const authentication = require('./middleware/authentication.js');
const app = express();

// Built in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(require('cookie-parser'));

// App routes
app.use('/api/v1/github', require('./controllers/github.js'));
app.use('/api/v1/posts', authentication, require('./controllers/posts.js'));

// Error handling & 404 middleware for when
// a request doesn't match any app routes
app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = app;
