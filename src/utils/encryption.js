
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'your-secret-key-here';  // Change this to a secure key in production

export const encrypt = (data) => {
    try {
        return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
};

export const decrypt = (encryptedData) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};

export const secureStorage = {
    setItem: (key, value) => {
        const encrypted = encrypt(value);
        if (encrypted) {
            localStorage.setItem(key, encrypted);
        }
    },

    getItem: (key) => {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return decrypt(encrypted);
    },

    setSessionItem: (key, value) => {
        const encrypted = encrypt(value);
        if (encrypted) {
            sessionStorage.setItem(key, encrypted);
        }
    },

    getSessionItem: (key) => {
        const encrypted = sessionStorage.getItem(key);
        if (!encrypted) return null;
        return decrypt(encrypted);
    },

    removeItem: (key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    },

    clear: () => {
        localStorage.clear();
        sessionStorage.clear();
    }
};