const nodemailer = require("nodemailer");

// Create a Transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "henry4@ethereal.email",
    pass: "y2u725JPY8P6vdkYjZ",
  },
});

module.exports = transporter;
