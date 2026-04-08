import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  REGISTRATION_CONFIRMED_TEMPLATE,
  REGISTRATION_PENDING_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { transporter, sender } from "./mailtrap.config.js";
import QRCode from "qrcode";

export const sendRegistrationPendingEmail = async (email, userName, eventTitle, eventPrice) => {
  const html = REGISTRATION_PENDING_TEMPLATE
    .replace("{userName}", userName)
    .replace("{eventTitle}", eventTitle)
    .replace("{eventPrice}", eventPrice);

  try {
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: `Action Required: Registration Pending for ${eventTitle}`,
      html,
    });
  } catch (error) {
    console.error("Error sending pending registration email:", error);
  }
};

export const sendRegistrationConfirmedEmail = async (email, userName, eventTitle, eventDate, eventLocation, registrationId) => {
  try {
    // Generate QR Code as data URL
    const qrData = JSON.stringify({
      registrationId,
      event: eventTitle,
      user: userName
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    
    // Extract base64 part
    const base64Data = qrCodeDataUrl.split(",")[1];

    const html = REGISTRATION_CONFIRMED_TEMPLATE
      .replace("{userName}", userName)
      .replace("{eventTitle}", eventTitle)
      .replace("{eventDate}", eventDate)
      .replace("{eventLocation}", eventLocation);

    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: `Confirmed: Your registration for ${eventTitle}`,
      html,
      attachments: [
        {
          filename: "qrcode.png",
          content: base64Data,
          encoding: "base64",
          cid: "qrcode", // same cid as in html template img tag
        },
      ],
    });
  } catch (error) {
    console.error("Error sending confirmed registration email:", error);
  }
};

export const sendVerificationEmail = async (email, verificationToken) => {
  const html = VERIFICATION_EMAIL_TEMPLATE.replace(
    "{verificationCode}",
    verificationToken
  );

  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Verify your email",
      html,
    });
    console.log("Email sent successfully:", response.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error(`Error sending verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const html = `<h1>Welcome, ${name}!</h1><p>Thanks for joining College Event Management.</p>`;

  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Welcome to College Event Management!",
      html,
    });
    console.log("Welcome email sent:", response.messageId);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error(`Error sending welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset",
    });
    // console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);

    throw new Error(`Error sending password reset success email: ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    });
  } catch (error) {
    console.error(`Error sending password reset success email`, error);

    throw new Error(`Error sending password reset success email: ${error}`);
  }
};
