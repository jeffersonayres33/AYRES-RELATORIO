# Como Obter e Configurar a Chave de API do Gemini (CRF/AM)

Este guia explica o passo a passo para obter uma chave de API do Gemini e configurá-la de forma oculta na aplicação, garantindo que o recurso de **Avaliação Geral ("Marcar automaticamente com IA")** funcione perfeitamente tanto no **Google AI Studio (interno)** quanto no **GitHub Pages (externo)**.

---

## 1. Como Obter a Chave de API do Gemini (Grátis)

As chaves de API do Gemini são obtidas diretamente do console oficial do Google:

1. Acesse o site do **[Google AI Studio](https://aistudio.google.com/)**;
2. Faça login com sua conta do Google (Gmail);
3. No menu lateral ou no topo, clique no botão **"Get API key"** (Obter chave de API);
4. Clique em **"Create API key"** (Criar chave de API);
5. Selecione um projeto do Google Cloud ou crie um novo na hora (é gratuito);
6. Copie a chave gerada (ela começa com `AIzaSy...`). **Guarde-a com segurança!**

---

## 2. Como Introduzir a Chave no Google AI Studio (Servidor/Interno)

No ambiente do Google AI Studio, o sistema roda de forma integrada com um servidor backend em Node.js (`server.ts`), que oculta a chave do navegador:

1. No painel lateral ou no menu de configurações (**Settings** / **Secrets**) do seu workspace do Google AI Studio;
2. Adicione uma nova variável de ambiente secreta (Secret):
   - **Nome (Key):** `GEMINI_API_KEY`
   - **Valor (Value):** `AIzaSy...` (cole a chave obtida no passo 1)
3. O servidor em nuvem detectará automaticamente e protegerá as requisições.

---

## 3. Como Introduzir a Chave no GitHub Pages (Cliente/Estático)

Como o **GitHub Pages** hospeda apenas arquivos estáticos (HTML, JS, CSS) e não possui um servidor backend rodando ativamente, as chamadas de IA passam a ocorrer de forma **direta e segura do navegador** (client-side fallback). 

Para ocultar a chave no código-fonte, usamos o sistema de compilação do **Vite**:

### Passo A: Criar o arquivo de variáveis localmente
Crie um arquivo chamado `.env` na raiz do seu projeto local antes de rodar a build (nunca o envie para repositórios públicos):
```env
VITE_GEMINI_API_KEY=AIzaSy... (Sua Chave do Gemini aqui)
```

### Passo B: Se você utiliza GitHub Actions para Deploy Automático
Se você usa fluxos de trabalho automatizados (Actions) para enviar o código ao GitHub Pages, configure a chave como um **Secret do GitHub**:
1. No seu repositório no GitHub, vá em **Settings** > **Secrets and variables** > **Actions**;
2. Clique em **New repository secret**;
3. Crie um segredo com o nome:
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** `AIzaSy...` (sua chave do Gemini);
4. No seu arquivo de workflow do GitHub Actions (`.github/workflows/...`), certifique-se de expor essa variável durante a etapa de build. Exemplo:
   ```yaml
   - name: Build Application
     run: npm run build
     env:
       VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
   ```

Quando a compilação do Vite rodar (`npm run build`), o código embutirá a chave de forma transparente, permitindo que a inteligência artificial funcione diretamente do GitHub Pages sem solicitar nenhuma digitação por parte do usuário final.
