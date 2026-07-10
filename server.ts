import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API endpoints
  app.post("/api/gemini/automark", async (req, res) => {
    try {
      const { establishments, termos, evalItems } = req.body;
      if (!evalItems || !Array.isArray(evalItems)) {
        return res.status(400).json({ error: "No evalItems provided" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Você é um assistente analista especializado em fiscalização técnica do CRF/AM.
Sua missão é realizar um cruzamento inteligente de dados de fiscalização para identificar quais critérios de infrações sanitárias ocorreram na cidade.

--- ESTABELECIMENTOS INSPECIONADOS NA CIDADE ---
${JSON.stringify(establishments || [], null, 2)}

--- TERMOS DE VISITA E OBSERVAÇÕES DOS FISCAIS EM CAMPO ---
${JSON.stringify(termos || [], null, 2)}

--- CRITÉRIOS DE AVALIAÇÃO DISPONÍVEIS ---
${JSON.stringify(evalItems.map(item => ({ id: item.id, title: item.title, description: item.description, paragraph: item.paragraph })), null, 2)}

Analise minuciosamente as observações de campo e as informações de presença de Responsável Técnico ("rtPresente": "NÃO" ou similar) para cada critério.
Para critérios genéricos ou padrão como apelos ou parágrafos de conclusão de avaliação que devem sempre constar no relatório, marque como true se eles forem padrão ou se forem de apelo à fiscalização.
Considere termos técnicos equivalentes, sinônimos, e abreviações comuns de fiscalização sanitária brasileira (ex: "AFE", "Alvará", "RDC 44", "Receita controlada", "Portaria 344", "UBS", "Posto de Saúde", "CAF", "CFT", "REMUME", "Lâminas", "Laudos", "Laboratório", "Supermercado").

Determine quais itens de avaliação devem ser marcados (matched: true ou false) e forneça uma justificativa concisa (até 1 frase em português) citando as evidências ou dados específicos do estabelecimento/termo correspondente.
IMPORTANTE: Sempre que citar ou basear a decisão em um estabelecimento específico, inclua obrigatoriamente o seu Nome Fantasia ou Razão Social juntamente com o respectivo CNPJ do estabelecimento no texto da justificativa (exemplo: "Identificada ausência de RT na Farmácia Silva (CNPJ: 12.345.678/0001-90) de acordo com as observações do fiscal.").`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "O ID único do item de avaliação correspondente." },
                    matched: { type: Type.BOOLEAN, description: "Se o critério de infração ou irregularidade foi identificado nos dados." },
                    justification: { type: Type.STRING, description: "Uma breve explicação de no máximo 1 frase do porquê foi marcado ou não com base nos dados fornecidos." }
                  },
                  required: ["id", "matched", "justification"]
                }
              }
            },
            required: ["results"]
          }
        }
      });

      // Parse and return
      let parsedResults;
      try {
        parsedResults = JSON.parse(response.text || "{}");
      } catch (parseErr) {
        console.error("Failed to parse Gemini response as JSON", response.text);
        parsedResults = { results: [] };
      }

      res.json(parsedResults);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to run AI automark" });
    }
  });

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
