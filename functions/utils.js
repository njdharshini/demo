const zlib = require('zlib');
const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key is missing in environment variables.');
}

// Encrypt and compress IDs
const encryptIDs = (ids) => {
    const jsonString = JSON.stringify(ids);
    const compressed = zlib.gzipSync(jsonString);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
    return encrypted.toString('base64');
};

// Decrypt and decompress IDs
const decryptIDs = (encryptedData) => {
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    const decompressed = zlib.gunzipSync(decrypted);
    return JSON.parse(decompressed.toString());
};

module.exports = { encryptIDs, decryptIDs };
