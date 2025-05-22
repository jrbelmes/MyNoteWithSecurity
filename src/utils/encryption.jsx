import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-secret-key';

export const SecureStorage = {
  encrypt: (data) => CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString(),

  decrypt: (ciphertext) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch {
      return null;
    }
  },

  setLocalItem: (key, value) => {
    const encrypted = SecureStorage.encrypt(value);
    localStorage.setItem(key, encrypted);
  },

  getLocalItem: (key) => {
    const encrypted = localStorage.getItem(key);
    return encrypted ? SecureStorage.decrypt(encrypted) : null;
  },

  setSessionItem: (key, value) => {
    const encrypted = SecureStorage.encrypt(value);
    sessionStorage.setItem(key, encrypted);
  },

  getSessionItem: (key) => {
    const encrypted = sessionStorage.getItem(key);
    return encrypted ? SecureStorage.decrypt(encrypted) : null;
  }
};
