import { doc, getDoc, setDoc, db, auth } from "../lib/supabase";

export interface GeminiConfigMeta {
  apiKey: string;
  updatedAt?: number;
  updatedBy?: string;
}

let inMemoryKey = "";
let isInitialized = false;

// 1. Resolve the effective API key for AI calls
export const getEffectiveGeminiKey = (): string => {
  // 1. Check in-memory cached key from database or session
  if (inMemoryKey && inMemoryKey.trim().length > 0) {
    return inMemoryKey.trim();
  }

  // 2. Check cached global database key in localStorage
  try {
    const globalKey = localStorage.getItem("GLOBAL_GEMINI_API_KEY");
    if (globalKey && globalKey.trim().length > 0) {
      inMemoryKey = globalKey.trim();
      return inMemoryKey;
    }
  } catch (e) {}

  // 3. Check custom user key in localStorage
  try {
    const customKey = localStorage.getItem("GEMINI_API_KEY") || localStorage.getItem("VITE_GEMINI_API_KEY");
    if (customKey && customKey.trim().length > 0) {
      inMemoryKey = customKey.trim();
      return inMemoryKey;
    }
  } catch (e) {}

  // 4. Check build-time embedded env vars
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

// 2. Fetch the central API key from the database (available to ALL users)
export const fetchDbGeminiConfig = async (): Promise<GeminiConfigMeta | null> => {
  try {
    const docRef = doc(db, "app_settings", "gemini_config");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && typeof data.apiKey === "string" && data.apiKey.trim().length > 0) {
        const cleanKey = data.apiKey.trim();
        inMemoryKey = cleanKey;
        try {
          localStorage.setItem("GLOBAL_GEMINI_API_KEY", cleanKey);
          localStorage.setItem("GEMINI_API_KEY", cleanKey);
        } catch (e) {}
        window.dispatchEvent(new Event("gemini_key_updated"));
        return {
          apiKey: cleanKey,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        };
      }
    }
  } catch (err) {
    console.warn("Failed to fetch global Gemini API Key from database:", err);
  }
  return null;
};

// 3. Save the central API key to the database (authorized users only)
export const saveDbGeminiKey = async (key: string, userEmail?: string): Promise<void> => {
  const trimmed = (key || "").trim();
  const email = userEmail || auth.currentUser?.email || "administrador";
  
  try {
    const docRef = doc(db, "app_settings", "gemini_config");
    await setDoc(docRef, {
      apiKey: trimmed,
      updatedAt: Date.now(),
      updatedBy: email
    });
  } catch (err: any) {
    console.error("Error saving Gemini key to database:", err);
    throw new Error(`Falha ao salvar chave no banco de dados: ${err.message || err}`);
  }

  // Update local memory & cache
  inMemoryKey = trimmed;
  try {
    if (trimmed) {
      localStorage.setItem("GLOBAL_GEMINI_API_KEY", trimmed);
      localStorage.setItem("GEMINI_API_KEY", trimmed);
    } else {
      localStorage.removeItem("GLOBAL_GEMINI_API_KEY");
      localStorage.removeItem("GEMINI_API_KEY");
    }
  } catch (e) {}

  window.dispatchEvent(new Event("gemini_key_updated"));
};

// 4. Initialize global key on app boot
export const initGlobalGeminiKey = async (): Promise<void> => {
  if (isInitialized) return;
  isInitialized = true;
  await fetchDbGeminiConfig();
};

// 5. Check if the current user has permission to manage the Gemini key
export const canManageGeminiKey = (role?: string, allowedTabs?: string[]): boolean => {
  if (!role) return false;
  if (role === "admin") return true;
  if (role === "moderator" && Array.isArray(allowedTabs)) {
    return allowedTabs.includes("gemini") || allowedTabs.includes("gemini_key");
  }
  return false;
};

// 6. Test key connection with Gemini 2.5 Flash
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
