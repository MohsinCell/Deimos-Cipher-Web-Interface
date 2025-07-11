import express from "express";
import addon from "./build/Release/deimos_cipher"; // Load compiled addon

const app = express.default();
const port = 3000;

app.use(express.json()); // For JSON request bodies

app.post("/encrypt", (req, res) => {
  const { plaintext, key } = req.body;
  if (!plaintext || !key) {
    return res.status(400).json({ error: "Missing plaintext or key" });
  }
  const ciphertext = addon.encrypt(plaintext, key);
  res.json({ ciphertext });
});

app.post("/decrypt", (req, res) => {
  const { ciphertext, key } = req.body;
  if (!ciphertext || !key) {
    return res.status(400).json({ error: "Missing ciphertext or key" });
  }
  const plaintext = addon.decrypt(ciphertext, key);
  res.json({ plaintext });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
