// import { MailtrapClient } from "mailtrap";
// import dotenv from "dotenv";

// dotenv.config();

// export const mailtrapClient = new MailtrapClient({
// 	endpoint: process.env.MAILTRAP_ENDPOINT,
// 	token: process.env.MAILTRAP_TOKEN,
// });

// export const sender = {
// 	email: "mailtrap@demomailtrap.com",
// 	name: "Burak",
// };



import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Use 587 (STARTTLS) by default: Render allows outbound 587 but blocks 465,
// so port 465 times out at CONN on Render. Keep this 587 in production.
const smtpPort = parseInt(process.env.MAILTRAP_PORT || "587", 10);

export const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST, // e.g., "smtp.gmail.com"
  port: smtpPort, // 587 (STARTTLS) on Render; 465 (implicit TLS) only off-Render
  // secure must be true ONLY for 465 (implicit TLS); 587 uses STARTTLS (false).
  secure: smtpPort === 465,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
  // Fail fast instead of hanging if the host/port is unreachable.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

// Surface SMTP config problems at startup rather than on first send.
transporter.verify((err) => {
  if (err) {
    console.error("SMTP transporter verify failed:", err.message);
  } else {
    console.log("SMTP transporter ready");
  }
});

export const sender = {
  // Gmail requires the "from" to match the authenticated account, otherwise it
  // rewrites or rejects the header. Default to the SMTP user; override via EMAIL_FROM.
  email: process.env.EMAIL_FROM || process.env.MAILTRAP_USER || "eventsedu73@gmail.com",
  name: process.env.EMAIL_FROM_NAME || "EduEvents",
};
