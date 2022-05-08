const jwt = require("jsonwebtoken");
// This middleware 

module.exports = (req, res, next) => {
  const authHeaders = req.get("Authorization");
  if (!authHeaders) {
    req.isAuth = false;
    return next();
  }
  const token = authHeaders.split(" ")[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, "supersecretsecret");
  } catch (err) {
    req.isAuth = false;
    return next();
  }

  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  return next();
};
