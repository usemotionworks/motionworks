
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = () => {
  const encodedKey = process.env.PRE_SAVE_TOKEN_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error(
      "PRE_SAVE_TOKEN_ENCRYPTION_KEY is not configured"
    );
  }

  const key = Buffer.from(encodedKey, "base64");

  if (
    key.length !== 32 ||
    key.toString("base64") !== encodedKey
  ) {
    throw new Error(
      "PRE_SAVE_TOKEN_ENCRYPTION_KEY must be a valid base64-encoded 32-byte key"
    );
  }

  return key;
};

export const encryptPreSaveToken = (token, context) => {
  if (typeof token !== "string" || !token.length) {
    throw new Error("A valid token is required");
  }

  if (typeof context !== "string" || !context.length) {
    throw new Error("Encryption context is required");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
    { authTagLength: AUTH_TAG_LENGTH }
  );

  cipher.setAAD(Buffer.from(context, "utf8"));

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
};

export const decryptPreSaveToken = (encryptedToken, context) => {
  if (
    typeof encryptedToken !== "string" ||
    typeof context !== "string" ||
    !context.length
  ) {
    throw new Error("Invalid encrypted token or context");
  }

  const parts = encryptedToken.split(".");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted token format");
  }

  const [, encodedIv, encodedTag, encodedData] = parts;

  const iv = Buffer.from(encodedIv, "base64");
  const authTag = Buffer.from(encodedTag, "base64");
  const encrypted = Buffer.from(encodedData, "base64");

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH ||
    !encrypted.length
  ) {
    throw new Error("Invalid encrypted token components");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
    { authTagLength: AUTH_TAG_LENGTH }
  );

  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
