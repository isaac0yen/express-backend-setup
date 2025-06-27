import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

const mailer = {
  sendMail: async (recipientEmail: string, htmlContent: string, subject: string) => {
    try {
      const mailOptions = {
        from: process.env.DISPLAY_EMAIL,
        to: recipientEmail,
        html: htmlContent,
        subject: subject,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      return { success: false, error };
    }
  }
};

export default mailer;
