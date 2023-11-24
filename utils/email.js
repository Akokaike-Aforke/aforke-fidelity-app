const nodemailer = require("nodemailer");
const htmlToText = require("html-to-text");

//USING GMAIL
const sendEmail = async (options) => {
  //1. create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    // host: process.env.GMAIL_HOST,
    secure: false,
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  //2. define the email options
  const mailOptions = {
    from: `Lucy Ken <${process.env.GMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //3. send the email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;

// module.exports = class Email {
//   constructor(user, url) {
//     this.to = user.email;
//     this.firstName = user.fullname.split(" ")[0];
//     this.url = url;
//     this.from = `Jonas Joe <${process.env.EMAIL_FROM}>`;
//     text = "changing password";
//   }

//   newTransport() {
//     if (process.env.NODE_ENV === "production") {
//       //use sendGrid
//       return 1;
//     }

//     return nodemailer.createTransport({
//       // service: 'Gmail',
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//   }

//   async send(template, subject) {
//     //1. render HTML based on pug templates

//     //2. create email options
//     const mailOptions = {
//       from: this.from,
//       to: this.to,
//       subject,
//       text: options.message,
//     };
//     //3. create a transporter and send email
//     await this.newTransport().sendMail(mailOptions);
//   }
//   async sendWelcome() {
//     await this.send("welcome", "Welcome to Fidelity Bank");
//   }
// };

// const sendEmail = async options =>{
//     //1. create a transporter
//     const transporter = nodemailer.createTransport({
//       // service: 'Gmail',
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//     //if gmail service, activate the 'less secure app'
//     //gmail sends only 500 messages per day so use sendgrid or mailgun
//     //2. define the email options
//     const mailOptions = {
//         from: 'Jonas Joe <joe4@gmail.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message
//     }
//     //3. send the email
//     await transporter.sendMail(mailOptions)
// }
// module.exports = sendEmail;
