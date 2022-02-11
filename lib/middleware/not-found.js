module.exports = (req, res, next) => {
  console.log(`${req.originalUrl} not found`);
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};
