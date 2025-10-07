import nodemailer from 'nodemailer';
import logger from './logger';

// Check if email is disabled
const isEmailDisabled = process.env.DISABLE_EMAIL === 'true';

// Create a transporter object using the default SMTP transport
// Only create transporter if email is not disabled
const transporter = isEmailDisabled ? null : nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@example.com',
    pass: process.env.EMAIL_PASS || 'your-email-password',
  },
});

/**
 * Send a password reset email to the user
 * @param email - The recipient's email address
 * @param firstName - The user's first name
 * @param resetToken - The password reset token
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> => {
  // If email is disabled, log and return early
  if (isEmailDisabled) {
    logger.info('Email disabled: Skipping password reset email', { email });
    return;
  }

  try {
    // Create the reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Define email options
    const mailOptions = {
      from: `"FlowTrainer Support" <${process.env.EMAIL_FROM || 'support@flowtrainer.com'}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You have requested to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you cannot click the button, copy and paste the following link in your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This email was sent by FlowTrainer. If you have any questions, please contact our support team.
          </p>
        </div>
      `,
    };

    // Send the email
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      logger.info('Password reset email sent', { messageId: info.messageId, email });
    }
  } catch (error: any) {
    logger.error('Failed to send password reset email', { error, email });
    // Don't throw error to prevent breaking the flow
  }
};

/**
 * Send a welcome email to new users
 * @param email - The recipient's email address
 * @param firstName - The user's first name
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  // If email is disabled, log and return early
  if (isEmailDisabled) {
    logger.info('Email disabled: Skipping welcome email', { email });
    return;
  }

  try {
    // Define email options
    const mailOptions = {
      from: `"FlowTrainer Team" <${process.env.EMAIL_FROM || 'team@flowtrainer.com'}>`,
      to: email,
      subject: 'Welcome to FlowTrainer!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to FlowTrainer!</h2>
          <p>Hello ${firstName},</p>
          <p>Welcome to FlowTrainer! We're excited to have you on board.</p>
          <p>FlowTrainer is a powerful workflow automation platform that helps you streamline your processes and boost productivity.</p>
          <p>Here are some things you can do:</p>
          <ul>
            <li>Create and manage workflows</li>
            <li>Automate repetitive tasks</li>
            <li>Collaborate with your team</li>
            <li>Monitor and optimize your processes</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Get Started
            </a>
          </div>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Happy automating!</p>
          <p>The FlowTrainer Team</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This email was sent by FlowTrainer. You received this email because you signed up for an account.
          </p>
        </div>
      `,
    };

    // Send the email
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      logger.info('Welcome email sent', { messageId: info.messageId, email });
    }
  } catch (error: any) {
    logger.error('Failed to send welcome email', { error, email });
    // Don't throw error to prevent breaking the flow
  }
};