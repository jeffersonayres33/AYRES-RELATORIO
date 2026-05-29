import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Key, 
  Play, 
  RotateCcw, 
  Award, 
  HardDrive, 
  CheckCircle,
  Terminal,
  Activity,
  Unlock,
  Lock,
  RefreshCw
} from "lucide-react";
import { LicenseStatus } from "../types";
import { motion } from "motion/react";

export default function LicenseAdmin() {
  const [volumeSerial, setVolumeSerial] = useState<string>("A3CB4E10");
  const [activationAttempts, setActivationAttempts] = useState<number>(1);
  const [codigoFi, setCodigoFi] = useState<string>("");
  const [enteredKey, setEnteredKey] = useState<string>("");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  const [license, setLicense] = useState<LicenseStatus>({
    isActivated: false,
    serialNumber: "A3CB4E10",
    licenseDaysLeft: 0
  });

  const FI = 4.7652018990;
  const PII = 7.9836655289;

  useEffect(() => {
    const saved = localStorage.getItem("siscon_activated_license");
    if (saved) {
      try {
        setLicense(JSON.parse(saved));
        addLog("Autenticação bem-sucedida. Assinatura SHA256 verificada e ativa na memória física.");
      } catch {
        addLog("Nenhum registro de licença prévia e segura localizado nos blocos locais.");
      }
    } else {
      addLog("Alerta: Sistema operando em modo demonstrativo temporário. Ativação física pendente.");
    }
  }, []);

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 12)]);
  };

  const cleanDigits = (text: string): string => {
    return text.replace(/[^0-9]/g, "");
  };

  const handleGenerateFi = () => {
    const numericPart = cleanDigits(volumeSerial);
    if (!numericPart) {
      addLog("Erro fatal: Volume serial da máquina não possui coeficientes numéricos válidos.");
      return;
    }
    const val = parseInt(numericPart, 10);
    const result = val * FI * activationAttempts;
    setCodigoFi(result.toString());
    addLog(`Fórmula Executada: (Serial: ${val} * Coeficiente Fi Φ: ${FI} * Ativs: ${activationAttempts})`);
    addLog(`Código Polinomial Fi Φ Gerado: ${result.toFixed(6)}`);
  };

  const handleActivate = () => {
    if (!codigoFi) {
      addLog("Cancelado: Por favor, gere o polinômio fi Φ da máquina antes de desbloquear.");
      return;
    }

    const calculatedTarget = parseFloat(codigoFi) * PII;
    const isCorrect = Math.abs(parseFloat(enteredKey) - calculatedTarget) < 0.01;

    if (isCorrect) {
      const activeState: LicenseStatus = {
        isActivated: true,
        serialNumber: volumeSerial,
        licenseDaysLeft: 365,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
        activationKeyUsed: enteredKey
      };
      setLicense(activeState);
      localStorage.setItem("siscon_activated_license", JSON.stringify(activeState));
      
      addLog("SUCESSO: Resposta do polinômio Pi π coincide perfeitamente com a criptografia de hardware!");
      addLog("Ativação registrada com sucesso em 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VOut'");
      addLog("Módulos dinâmicos de auditoria foram liberados para exportação de PDFs comerciais.");
    } else {
      addLog("ERRO: Assinatura da Chave Pi π inválida para o hardware identificado!");
      setActivationAttempts(prev => prev + 1);
    }
  };

  const handleAutoGeneratePi = () => {
    if (!codigoFi) {
      handleGenerateFi();
    }
    const targetFi = codigoFi ? parseFloat(codigoFi) : (parseInt(cleanDigits(volumeSerial), 10) * FI * activationAttempts);
    const targetPi = targetFi * PII;
    setEnteredKey(targetPi.toString());
    addLog(`Desbloqueador Criptográfico: Chave Pi π calculada e injetada: ${targetPi.toFixed(6)}`);
  };

  const handleResetLicense = () => {
    localStorage.removeItem("siscon_activated_license");
    setLicense({
      isActivated: false,
      serialNumber: "A3CB4E10",
      licenseDaysLeft: 0
    });
    setCodigoFi("");
    setEnteredKey("");
    addLog("Licença limpa. Registros de simulação expurgados da memória local.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800 leading-relaxed">
      {/* Action / Input console */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
          
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
              <ShieldCheck className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm font-display tracking-widest uppercase">Segurança & Chave de Licenciamento</h3>
              <p className="text-[11px] text-slate-405">Algoritmo polinomial baseado nas chaves Fi (Φ) e Pi (π) para liberação da DVS/AM.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Input 1 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">1. Fingerprint da Máquina (HD Serial)</label>
              <div className="flex gap-2 relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <HardDrive className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={volumeSerial}
                  onChange={(e) => setVolumeSerial(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-3 py-2.5 text-xs font-mono font-bold rounded-xl text-slate-850 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                />
                <button
                  onClick={handleGenerateFi}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
                >
                  Calcular Fi <Play className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9.5px] text-slate-400 block leading-snug font-medium">
                Simula o volume serial físico obtido no Delphi via chamada nativa à <code>GetVolumeInformation</code>.
              </span>
            </div>

            {/* Input 2 */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">2. Código Polinomial Fi  (Edit1)</label>
              <input
                type="text"
                readOnly
                value={codigoFi}
                placeholder="Polinômio fi gerado..."
                className="w-full bg-slate-50/75 border border-slate-200 p-2.5 text-xs font-mono font-bold text-slate-500 rounded-xl focus:outline-none"
              />
              <span className="text-[9.5px] text-slate-400 block leading-snug font-medium">
                Equação fundamental: <code>SerialPart • Fi Coefficient • Ativs</code>
              </span>
            </div>
          </div>

          {/* Verification section */}
          <div className="mt-8 border-t border-slate-100 pt-5 space-y-4">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest font-display">
              3. Chave de Desbloqueio e Coeficiente Pi 
            </span>
            
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                placeholder="Insira a chave Pi de validação..."
                className="flex-1 bg-slate-50 border border-slate-200 p-3 text-xs font-mono font-bold text-slate-805 focus:outline-none focus:border-violet-500 focus:bg-white rounded-xl transition-all"
              />
              
              <button
                onClick={handleAutoGeneratePi}
                className="bg-white hover:bg-slate-55 text-violet-600 hover:text-violet-700 font-extrabold text-xs p-3 rounded-xl transition-colors border border-slate-200 cursor-pointer shadow-xs shrink-0"
              >
                Injetar Chave Padrão
              </button>

              <button
                onClick={handleActivate}
                className="bg-violet-600 hover:bg-violet-500 border border-violet-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer active:scale-[0.98]"
              >
                Desbloquear Console
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-[10.5px] text-slate-400 leading-relaxed font-semibold">
              O ecossistema original em Delphi verifica se o código Pi digitado equivale a: <code>CódigoFi • 7.9836655289 (Pii)</code>. Ao validar, o banco de dados volátil homologa a segurança e emula a liberação total de relatórios de auditoria comercial do AM.
            </div>
          </div>
        </div>

        {/* Console debugging screen */}
        <div className="bg-[#0b0f19] rounded-3xl p-5 shadow-lg border border-[#161f30] space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#161f30] pb-2">
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold tracking-widest text-[#6c7d93] uppercase select-none">
              <Terminal className="w-4 h-4 text-violet-400 animate-pulse" /> Console de Diagnósticos Criptográficos
            </div>
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
          </div>

          <div className="font-mono text-[10.5px] space-y-1.5 h-[140px] overflow-y-auto pr-1">
            {consoleLogs.map((log, i) => (
              <div key={i} className="leading-relaxed odd:text-slate-400 even:text-violet-400 font-medium">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side status panels */}
      <div className="space-y-6">
        
        {/* Status board */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-center flex flex-col items-center justify-center relative overflow-hidden">
          
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-24 h-24 rounded-full bg-slate-50 pointer-events-none" />

          <div className={`p-4 rounded-2xl mb-4 border ${
            license.isActivated 
              ? "bg-emerald-50 border-emerald-150 text-emerald-600" 
              : "bg-rose-50 border-rose-150 text-rose-600"
          }`}>
            {license.isActivated ? <Unlock className="w-9 h-9" /> : <Lock className="w-9 h-9" />}
          </div>

          <h3 className="font-extrabold text-slate-900 font-display text-base tracking-tight leading-none uppercase">Assinatura Digital</h3>
          
          <div className="mt-3 select-none">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase border ${
              license.isActivated 
                ? "bg-emerald-50 border-emerald-150 text-emerald-700" 
                : "bg-rose-50 border-rose-150 text-rose-750"
            }`}>
              <CheckCircle className="w-3.5 h-3.5" />
              {license.isActivated ? "Licenciado & Seguro" : "Modo Avaliação"}
            </span>
          </div>

          {license.isActivated ? (
            <div className="mt-6 w-full divide-y divide-slate-100 border-t border-slate-100 pt-4 space-y-2.5 text-xs text-left text-slate-550 font-semibold">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Instante de Validade:</span>
                <span className="font-extrabold text-slate-800 uppercase">365 Dias</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Vencimento da Licença:</span>
                <span className="font-extrabold text-violet-600">{license.expiresAt}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 pr-0.5">
                <span className="truncate max-w-[130px]">Chave Pi gravada:</span>
                <span className="truncate max-w-[120px] font-bold text-slate-700 font-mono" title={license.activationKeyUsed}>{license.activationKeyUsed}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Barreira de Segurança:</span>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">Integração Online</span>
              </div>

              <button
                onClick={handleResetLicense}
                className="w-full mt-6 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold py-2.5 rounded-xl text-center border border-slate-200 transition-colors cursor-pointer active:scale-[0.98]"
              >
                Redefinir Licença local
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-505 mt-4 leading-relaxed font-semibold">
              No modo demonstrativo simplificado certas chamadas de exportação avançadas simulam biblioteca ausente (j1e2f3.dll de hardware). Utilize os polinômios matemáticos ao lado para restaurar toda a cobertura.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
