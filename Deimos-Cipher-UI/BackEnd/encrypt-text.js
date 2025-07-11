const deimos = require("./build/Release/deimos_cipher"); // Import the Deimos Cipher C++ binding

// Encrypts text using Deimos Cipher and returns a hex-encoded ciphertext
function encryptText(plaintext, password) {
  try {
    const encryptedBuffer = deimos.encrypt(plaintext, password);
    return Buffer.from(encryptedBuffer).toString("hex"); // Convert to hex
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
}

module.exports = { encryptText };
