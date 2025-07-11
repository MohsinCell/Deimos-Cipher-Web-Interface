const deimos = require("./build/Release/deimos_cipher"); // Import the Deimos Cipher C++ binding

// Decrypts hex-encoded ciphertext back to plaintext
function decryptText(ciphertextHex, password) {
  try {
    const encryptedBuffer = Buffer.from(ciphertextHex, "hex"); // Convert from hex
    return deimos.decrypt(encryptedBuffer, password);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

module.exports = { decryptText };
