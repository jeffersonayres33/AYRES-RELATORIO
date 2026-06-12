import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API endpoints
  app.post("/api/gemini/correct", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
      });

      const prompt = `Você é um corretor ortográfico e gramatical técnico. Corrija o texto abaixo. 
Mantenha a estrutura de parágrafos idêntica. Melhore o espaçamento, pontuação e fluidez se necessário, mas mantenha a integridade do conteúdo legal, técnico e formal.
Não adicione cabeçalhos, introduções ou explicações. Retorne apenas o texto corrigido estruturado.\n\n${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ correctedText: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to correct text" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
