import CryptoJS from "crypto-js"

// Use a secret key from environment (should be set in production)
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || "default-key-change-in-production"

export function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString()
}

export function decryptToken(encryptedToken: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

