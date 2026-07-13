import nodemailer from 'nodemailer';

const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  const emailUser = process.env.EMAIL_USER;

  try {
    const transporter = getTransporter();
    if (!transporter || !emailUser) {
      console.warn('Email transport is not configured.');
      return false;
    }

    const mailOptions = {
      from: `"Cinexium" <${emailUser}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f1115; color: #ffffff; border-radius: 10px;">
          ${htmlContent}
          <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888888; text-align: center;">This is an automated message from Cinexium. Please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendOTP = async (to: string, otp: string) => {
  const htmlContent = `
    <h2 style="color: #e50914; text-align: center;">Welcome to Cinexium</h2>
    <p style="font-size: 16px; color: #cccccc; text-align: center;">Use the following OTP to complete your request. This code is valid for 10 minutes.</p>
    <div style="background-color: #1a1d24; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
      <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #ffffff;">${otp}</h1>
    </div>
    <p style="font-size: 14px; color: #888888; text-align: center;">If you didn't request this, please ignore this email.</p>
  `;
  
  const success = await sendEmail(to, 'Your Cinexium OTP Code', htmlContent);
  if (!success && process.env.NODE_ENV !== 'production') {
    console.log(`[DEVELOPMENT] OTP for ${to} is: ${otp}`);
  }
  return success;
};
