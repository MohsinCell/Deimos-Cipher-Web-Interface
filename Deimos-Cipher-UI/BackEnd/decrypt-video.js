const deimos = require("./build/Release/deimos_cipher");

async function decryptVideo(encryptedHex, password) {
  return new Promise((resolve, reject) => {
    try {
      // Decrypt the hex string
      let decryptedData = deimos.decrypt(encryptedHex, password);

      // Ensure decrypted data is a Buffer
      if (typeof decryptedData === "string") {
        decryptedData = Buffer.from(decryptedData, "hex");
      } else if (decryptedData instanceof Uint8Array) {
        decryptedData = Buffer.from(decryptedData);
      }

      resolve(decryptedData); // Return as Buffer
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { decryptVideo };
