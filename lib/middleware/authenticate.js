const { verify } = require('../utils/jwt.js');

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies[process.env.COOKIE_NAME];
    const user = verify(token);
    req.user = user;
    next();
  } catch(error) {
    console.log(error);
    error.status = 401;
    next(error);
  }
};
