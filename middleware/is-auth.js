const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeaders = req.get("Authorization");
  if (!authHeaders) {
    const err = new Error("Not authenticated");
    err.statusCode = 401;
    throw err;
  }
  const token = authHeaders.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "somesecretlyjsonwebtoken");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  if (!decodedToken) {
    const err = new Error("Not authenticated");
    err.statusCode = 401;
    throw err;
  }
  req.userId = decodedToken.userId;
  next();
};
