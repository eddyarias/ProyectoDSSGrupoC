const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const KEY = Buffer.from(process.env.AES_SECRET_KEY, "hex");
const IV_LENGTH = 16;

// Cifrar texto
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Descifrar texto
function decrypt(data) {
  const [ivHex, encrypted] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
