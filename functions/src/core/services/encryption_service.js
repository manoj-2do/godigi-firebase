/* eslint-disable */
const crypto = require("crypto");

const encryptAES256ECB = (plainText, salt) => {
  const key = Buffer.from(salt.padEnd(32).substring(0, 32));
  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const result = encrypted.toString("base64");
  return result;
};

const decryptAES256ECB = (encryptedText, salt) => {
  try {
    const key = Buffer.from(salt.padEnd(32).substring(0, 32));
    const decipher = crypto.createDecipheriv("aes-256-ecb", key, null);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (_) {
    return encryptedText;
  }
};

module.exports = { encryptAES256ECB, decryptAES256ECB };