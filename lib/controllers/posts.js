const { Router } = require('express');

module.exports = Router()
  .get('/', (req, res, next) => {
    res.json({ asdf: 'hello peter' });
  })
  .post('/', (req, res, next) => {

  });
