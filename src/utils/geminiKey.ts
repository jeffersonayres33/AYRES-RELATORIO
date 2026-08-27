// Helper utility for resolving and managing Gemini API Key

export const getEffectiveGeminiKey = (): string => {
  // 1. Check user-configured key in localStorage
  try {
    const customKey = localStorage.getItem("GEMINI_API_KEY") || localStorage.getItem("VITE_GEMINI_API_KEY");
    if (customKey && customKey.trim().length > 0) {
      return customKey.trim();
    }
  } catch (e) {
    // localStorage might be unavailable in some sandboxes
  }

  // 2. Check build-time embedded env vars
  try {
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === "string" && viteKey.trim().length > 0 && !viteKey.startsWith("${{")) {
      return viteKey.trim();
    }
  } catch (e) {}

  try {
    const geminiKey = (import.meta as any).env?.GEMINI_API_KEY;
    if (geminiKey && typeof geminiKey === "string" && geminiKey.trim().length > 0 && !geminiKey.startsWith("${{")) {
      return geminiKey.trim();
    }
  } catch (e) {}

  try {
    const procKey = typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "";
    if (procKey && typeof procKey === "string" && procKey.trim().length > 0 && !procKey.startsWith("${{")) {
      return procKey.trim();
    }
  } catch (e) {}

  return "";
};

export const hasEmbeddedGeminiKey = (): boolean => {
  try {
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === "string" && viteKey.trim().length > 0 && !viteKey.startsWith("${{")) {
      return true;
    }
    const geminiKey = (import.meta as any).env?.GEMINI_API_KEY;
    if (geminiKey && typeof geminiKey === "string" && geminiKey.trim().length > 0 && !geminiKey.startsWith("${{")) {
      return true;
    }
  } catch (e) {}
  return false;
};

export const getCustomGeminiKey = (): string => {
  try {
    return (localStorage.getItem("GEMINI_API_KEY") || localStorage.getItem("VITE_GEMINI_API_KEY") || "").trim();
  } catch (e) {
    return "";
  }
};

export const setCustomGeminiKey = (key: string): void => {
  try {
    if (!key || key.trim() === "") {
      localStorage.removeItem("GEMINI_API_KEY");
      localStorage.removeItem("VITE_GEMINI_API_KEY");
    } else {
      localStorage.setItem("GEMINI_API_KEY", key.trim());
      localStorage.setItem("VITE_GEMINI_API_KEY", key.trim());
    }
    // Dispatch an event so components can update reactively
    window.dispatchEvent(new Event("gemini_key_updated"));
  } catch (e) {
    console.error("Failed to save custom Gemini key to localStorage", e);
  }
};

export const testGeminiKey = async (key: string): Promise<{ success: boolean; message: string }> => {
  if (!key || !key.trim()) {
    return { success: false, message: "A chave informada está vazia." };
  }
  const cleanKey = key.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Responda apenas: OK" }] }]
      })
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson?.error?.message || `Erro HTTP ${response.status}: ${response.statusText}`;
      return { success: false, message: msg };
    }
    return { success: true, message: "Chave validada com sucesso com a API Gemini da Google!" };
  } catch (e: any) {
    return { success: false, message: e.message || "Erro de conexão de rede ao testar a chave." };
  }
};
