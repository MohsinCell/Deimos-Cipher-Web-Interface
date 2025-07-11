const deimos = require("./build/Release/deimos_cipher");

async function encryptVideo(inputBuffer, password) {
  return new Promise((resolve, reject) => {
    try {
      const chunkHex = inputBuffer.toString("hex"); // Convert binary to hex
      let encryptedData = deimos.encrypt(chunkHex, password); // Encrypt

      // Ensure encrypted data is a hex string
      let encryptedHex;
      if (encryptedData instanceof Uint8Array) {
        encryptedHex = Buffer.from(encryptedData).toString("hex");
      } else if (Buffer.isBuffer(encryptedData)) {
        encryptedHex = encryptedData.toString("hex");
      } else if (typeof encryptedData === "string") {
        encryptedHex = encryptedData;
      } else {
        throw new Error("Unexpected encrypted data format");
      }

      resolve(encryptedHex); // Return encrypted data as hex string
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { encryptVideo };
