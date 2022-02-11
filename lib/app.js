const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const authenticate = require('./middleware/authenticate.js');
const app = express();

// Built in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors({
  credentials: true,
  origin: `${process.env.API_URL}:${process.env.PORT}`,
  exposedHeaders: ['set-cookie']
}));

// App routes
app.use('/api/v1/github', require('./controllers/github.js'));
app.use('/api/v1/posts', authenticate, require('./controllers/posts.js'));

// Error handling & 404 middleware for when
// a request doesn't match any app routes
app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = app;
