import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

const ISSUER_NAME = "Wesite";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function getEncryptionKey(): Buffer {
  const secret = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET || "default-wesite-encryption-salt-2fa";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a sensitive TOTP secret using AES-256-GCM.
 */
export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a TOTP secret previously encrypted with AES-256-GCM.
 */
export function decryptSecret(encryptedPayload: string): string {
  const [ivHex, tagHex, contentHex] = encryptedPayload.split(":");
  if (!ivHex || !tagHex || !contentHex) {
    throw new Error("Invalid encrypted payload format");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(contentHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Generate 8 human-readable backup recovery codes formatted like `ABC12-DEF34`.
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

/**
 * Normalize and hash a recovery code for secure database storage.
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.replace(/[-\s]/g, "").toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generate a complete 2FA setup bundle:
 * Base32 secret, otpauth:// URI, QR Code PNG data URL, and backup codes.
 */
export async function generateTwoFactorSetup(userEmail: string) {
  const secret = generateSecret();
  const otpAuthUri = generateURI({
    secret,
    label: userEmail,
    issuer: ISSUER_NAME,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  const recoveryCodes = generateRecoveryCodes(8);
  const hashedRecoveryCodes = recoveryCodes.map(hashRecoveryCode);

  return {
    secret,
    otpAuthUri,
    qrCodeDataUrl,
    recoveryCodes,
    hashedRecoveryCodes,
  };
}

/**
 * Verify a 6-digit TOTP code against a Base32 secret.
 * Allows 1-step epoch tolerance (±30s) for clock drift.
 */
export function verifyTwoFactorCode(secret: string, token: string): boolean {
  try {
    const cleanToken = token.trim().replace(/\s+/g, "");
    const result = verifySync({
      secret,
      token: cleanToken,
      epochTolerance: 1,
    });
    return Boolean(result.valid);
  } catch {
    return false;
  }
}

/**
 * Verify and consume a backup recovery code against a user's stored hashed recovery codes.
 */
export function verifyAndConsumeRecoveryCode(
  storedHashedCodes: string[],
  inputCode: string,
): { valid: boolean; remainingCodes: string[] } {
  const inputHash = hashRecoveryCode(inputCode);
  const index = storedHashedCodes.indexOf(inputHash);

  if (index === -1) {
    return { valid: false, remainingCodes: storedHashedCodes };
  }

  const remainingCodes = [...storedHashedCodes];
  remainingCodes.splice(index, 1);
  return { valid: true, remainingCodes };
}

// ----------------------------------------------------
// Stateless JWT tokens for multi-step 2FA verification
// ----------------------------------------------------

export type RegistrationSetupPayload = {
  type: "register_setup";
  name: string;
  email: string;
  passwordHash: string;
  secret: string;
  hashedRecoveryCodes: string[];
};

export function signRegistrationSetupToken(payload: Omit<RegistrationSetupPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "register_setup" },
    getJwtSecret(),
    { expiresIn: "15m" },
  );
}

export function verifyRegistrationSetupToken(token: string): RegistrationSetupPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as RegistrationSetupPayload;
  if (decoded.type !== "register_setup") {
    throw new Error("Invalid registration setup token");
  }
  return decoded;
}

export type LoginTwoFactorPayload = {
  type: "login_2fa";
  userId: string;
  email: string;
};

export function signLoginTwoFactorToken(payload: Omit<LoginTwoFactorPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "login_2fa" },
    getJwtSecret(),
    { expiresIn: "5m" },
  );
}

export function verifyLoginTwoFactorToken(token: string): LoginTwoFactorPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as LoginTwoFactorPayload;
  if (decoded.type !== "login_2fa") {
    throw new Error("Invalid 2FA login token");
  }
  return decoded;
}
