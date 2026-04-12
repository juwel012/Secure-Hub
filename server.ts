import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/proxy-check", async (req, res) => {
    try {
      const { default: handler } = await import("./api/proxy-check.js");
      await handler(req as any, res as any);
    } catch (error: any) {
      console.error("Proxy check handler error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/validate-email", async (req, res) => {
    const { email } = req.body;
    // Simulate a deep handshake with mail servers
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    
    // Heuristic: common patterns or shorter names are more likely to be taken/valid
    const username = email.split('@')[0];
    const hasDot = username.includes('.');
    const hasNumbers = /\d/.test(username);
    
    // Base score on complexity and commonality
    let score = 50;
    if (username.length < 15) score += 20;
    if (hasDot) score += 10;
    if (hasNumbers) score += 5;
    
    // Add some randomness
    score += Math.floor(Math.random() * 30);
    
    const isValid = score > 65;
    
    res.json({ 
      valid: isValid,
      score: Math.min(score, 100),
      logs: [
        `Connecting to mx.google.com [142.250.141.26]...`,
        `Handshake established via TLS 1.3 (X25519)`,
        `EHLO securehub.neural.network`,
        `MAIL FROM: <verify@securehub.pro>`,
        `RCPT TO: <${email}>`,
        isValid 
          ? `250 2.1.5 OK - Recipient address verified` 
          : `550 5.1.1 The email account that you tried to reach does not exist.`
      ]
    });
  });

  const distPath = path.resolve(process.cwd(), "dist");
  const hasBuild = fs.existsSync(distPath);

  if (hasBuild) {
    console.log(">>> SECUREHUB: SERVING FROM DIST (PRODUCTION) <<<");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log(">>> SECUREHUB: SERVING VIA VITE (DEVELOPMENT) <<<");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const templatePath = path.resolve(process.cwd(), "index.html");
        let template = fs.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL ERROR:", err);
  process.exit(1);
});
