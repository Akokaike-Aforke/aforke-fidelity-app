const nodemailer = require("nodemailer")
const sendEmail = async options =>{
    //1. create a transporter
    const transporter = nodemailer.createTransport({
      // service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    //if gmail service, activate the 'less secure app'
    //gmail sends only 500 messages per day so use sendgrid or mailgun
    //2. define the email options
    const mailOptions = {
        from: 'Jonas Joe <joe4@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    //3. send the email
    await transporter.sendMail(mailOptions)
}
module.exports = sendEmail;