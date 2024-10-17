import CryptoJS from 'crypto-js';

const secretKey = 'krystyll';

const secureSessionStorage = {
  setItem(key, value) {

    const stringValue = String(value); 

    if (!stringValue) {
      console.error(`Cannot set item: ${key} - value is empty or undefined`);
      return;
    }

    const encryptedValue = CryptoJS.AES.encrypt(stringValue, secretKey).toString();
    sessionStorage.setItem(key, encryptedValue);
  },

  getItem(key) {
    const encryptedValue = sessionStorage.getItem(key);
    if (!encryptedValue) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, secretKey);
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);

      
      return key === 'admin_level' ? parseInt(decryptedValue, 10) : decryptedValue;
    } catch (e) {
      console.error('Error decrypting session storage value', e);
      return null;
    }
  },

  removeItem(key) {
    sessionStorage.removeItem(key);
  },

  clear() {
    sessionStorage.clear();
  },
};

export default secureSessionStorage;
