const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
  return (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    if (!tokenCookieValue) {
      return next();
    }

    try {
      const userPayload = validateToken(tokenCookieValue);
      req.user = userPayload;
    } catch (error) {
      // res.send("Error Occured", error);
      res.status(401).send("Authentication Error: " + error.message);
    }
    console.log("My requested user", req.user)
    return next();
  };
}

module.exports = {
  checkForAuthenticationCookie
};
