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

export const sendDeleteAccountOTP = async (to: string, otp: string) => {
  const htmlContent = `
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #fca5a5;">Account Deletion Request</p>
      <h2 style="margin: 0; font-size: 32px; color: #ffffff;">Confirm Account Deletion</h2>
    </div>
    <div style="background: linear-gradient(135deg, rgba(239,68,68,0.18), rgba(127,29,29,0.12)); border: 1px solid rgba(239,68,68,0.35); border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #f3f4f6; text-align: left;">
        We received a request to permanently delete your Cinexium account. Use the OTP below to confirm this action.
      </p>
    </div>
    <div style="background-color: #1a1d24; padding: 24px; text-align: center; border-radius: 14px; margin: 24px 0; border: 1px solid #2a2f3a;">
      <p style="margin: 0 0 10px; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #9ca3af;">Deletion OTP</p>
      <h1 style="font-size: 40px; letter-spacing: 10px; margin: 0; color: #ffffff;">${otp}</h1>
      <p style="margin: 12px 0 0; font-size: 13px; color: #9ca3af;">This code is valid for 10 minutes.</p>
    </div>
    <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; margin-top: 24px;">
      <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #fca5a5;">Didn&apos;t request account deletion?</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #d1d5db;">
        Do not share this OTP with anyone. If this request was not made by you, please reset your password immediately and contact
        <a href="mailto:cinexium@gmail.com" style="color: #f87171; text-decoration: none; margin-left: 4px;">cinexium@gmail.com</a>.
      </p>
    </div>
  `;

  const success = await sendEmail(to, 'Confirm your Cinexium account deletion', htmlContent);
  if (!success && process.env.NODE_ENV !== 'production') {
    console.log(`[DEVELOPMENT] Delete account OTP for ${to} is: ${otp}`);
  }
  return success;
};
