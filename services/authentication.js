const JWT = require("jsonwebtoken");

const secret = "$uper#lft456Man$piderMonkey@2580";

function createTokenForUser(user) {
  const payload = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    profileImageURL: user.profileImageURL,
    employeeCode: user.employeeCode,
    reportingManager: user.reportingManager,
    designation: user.designation,
    role: user.role,
    department: user.department,
    location: user.location,
  };
  const token = JWT.sign(payload, secret);
  return token;
}

function validateToken(token) {
  const payload = JWT.verify(token, secret);
  return payload;
}

module.exports = {
  createTokenForUser,
  validateToken,
};
