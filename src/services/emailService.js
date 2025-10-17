import nodemailer from "nodemailer";
import config from "../config/index";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ejs from "ejs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD,
  },
});

export async function renderTemplate(templateName, payload = {}) {
  const file = path.join(
    __dirname,
    "..",
    "templates",
    "emails",
    `${templateName}.ejs`
  );
  return ejs.renderFile(file, payload);
}

export async function sendEmail(to, subject, html, text) {
  const message = {
    from: `"Mini Social Media App <no-reply@minisocialmediaapp.com>"`,
    to,
    subject,
    text,
    html,
  };

  try {
    const sending = await transporter.sendMail(message);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export default { renderTemplate, sendEmail };
