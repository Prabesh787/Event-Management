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

const smtpPort = parseInt(process.env.MAILTRAP_PORT || "587", 10);

export const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST, // e.g., "smtp.gmail.com"
  port: smtpPort, // 465 (implicit TLS) or 587 (STARTTLS)
  // Port 465 requires implicit TLS. Without this, nodemailer waits for a
  // plaintext greeting that never arrives and the connection times out.
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
  email: "eventsedu73@gmail.com",
  name: "Bigyan Khadka",
};
