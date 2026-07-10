import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Download, 
  AlertCircle, 
  RefreshCw,
  FolderOpen,
  Code,
  FileCode2,
  Trash2,
  ListFilter,
  Cog
} from "lucide-react";
import { parseLoteXML, parseTermos0XML, parseNovosCadastros20XML } from "../utils/xmlParser";
import { Estabelecimento, TechnicalResponsible, TermoSanitario } from "../types";
import { motion } from "motion/react";

interface ImporterProps {
  onDataImported: (data: {
    estabelecimentos: Estabelecimento[];
    rts: TechnicalResponsible[];
    termos: TermoSanitario[];
  }) => void;
}

export default function Importer({ onDataImported }: ImporterProps) {
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, { success: boolean; msg: string; count: number }>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgressMsg, setImportProgressMsg] = useState("");
  
  const tempEstabsRef = useRef<Estabelecimento[]>([]);
  const tempRtsRef = useRef<TechnicalResponsible[]>([]);
  const tempTermosRef = useRef<TermoSanitario[]>([]);

  // Interactive XML Live Preview node inspector
  const [inspectedXmlType, setInspectedXmlType] = useState<string | null>(null);
  const [inspectedXmlContent, setInspectedXmlContent] = useState<string>("");

  const handleDrag = (e: React.DragEvent, type: string, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: active }));
  };

  const processFiles = (filesList: FileList | File[], type: "lote" | "fem_0" | "fem_20") => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    setIsImporting(true);
    const sizeMb = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
    setImportProgressMsg(`Lendo ${files.length} arquivo(s) (${sizeMb.toFixed(2)} MB)...`);

    const contentPromises = files.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    }));

    Promise.all(contentPromises).then((contents) => {
      setImportProgressMsg("Processando e cruzando dados do XML. Aguarde, por favor...");
      setInspectedXmlType(type);
      setInspectedXmlContent(contents[0] || "");

      setTimeout(() => {
        try {
          if (type === "lote") {
            let es: Estabelecimento[] = [];
            let rs: TechnicalResponsible[] = [];
            contents.forEach(content => {
              const parsed = parseLoteXML(content);
              es = es.concat(parsed.estabelecimentos);
              rs = rs.concat(parsed.rts);
            });
            tempEstabsRef.current = [...tempEstabsRef.current, ...es];
            tempRtsRef.current = [...tempRtsRef.current, ...rs];
            
            setStatus(prev => ({
              ...prev,
              lote: { success: true, msg: `XML LOTE importado (${files.length} arq)`, count: tempEstabsRef.current.length }
            }));
            triggerIntegration();
          } else if (type === "fem_0") {
            let ts: TermoSanitario[] = [];
            contents.forEach(content => {
              ts = ts.concat(parseTermos0XML(content));
            });
            tempTermosRef.current = [...tempTermosRef.current, ...ts];
            
            setStatus(prev => ({
              ...prev,
              fem_0: { success: true, msg: `XML xxxx_0 importado (${files.length} arq)`, count: tempTermosRef.current.length }
            }));
            triggerIntegration();
          } else if (type === "fem_20") {
            let novEs: Estabelecimento[] = [];
            contents.forEach(content => {
              novEs = novEs.concat(parseNovosCadastros20XML(content));
            });
            const map = new Map(tempEstabsRef.current.map(item => [item.inscricao, item]));
            novEs.forEach(nov => {
              if (!map.has(nov.inscricao)) {
                map.set(nov.inscricao, nov);
              }
            });
            tempEstabsRef.current = Array.from(map.values());
            
            // For count info, we keep track of total added by fem_20 via state
            setStatus(prev => {
              const currentCount = prev.fem_20?.count || 0;
              return {
                ...prev,
                fem_20: { 
                  success: true, 
                  msg: prev.fem_20 ? `XML xxxx_20 importado (+${files.length} arq)` : `XML xxxx_20 importado (${files.length} arq)`, 
                  count: currentCount + novEs.length 
                }
              };
            });
            triggerIntegration();
          }
        } catch (err) {
          setStatus(prev => ({
            ...prev,
            [type]: { success: false, msg: `Erro ao analisar XML: arquivo corrompido ou incompatível`, count: 0 }
          }));
        } finally {
          setIsImporting(false);
          setImportProgressMsg("");
        }
      }, 80);
    }).catch(err => {
      console.error("Error reading files", err);
      setIsImporting(false);
      setImportProgressMsg("");
    });
  };

  const handleDrop = (e: React.DragEvent, type: "lote" | "fem_0" | "fem_20") => {
    handleDrag(e, type, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, type);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "lote" | "fem_0" | "fem_20") => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, type);
    }
  };

  const triggerIntegration = () => {
    const es = tempEstabsRef.current;
    const rs = tempRtsRef.current;
    const ts = tempTermosRef.current;
    if (es.length > 0 || ts.length > 0) {
      onDataImported({
        estabelecimentos: es,
        rts: rs,
        termos: ts,
      });
    }
  };

  const downloadSampleXML = (type: "lote" | "fem_0" | "fem_20") => {
    let content = "";
    let filename = "";

    if (type === "lote") {
      filename = "siscon1024.xml";
      content = `<?xml version="1.0" encoding="UTF-8"?>
<Siscon>
  <Estabelecimento>
    <R1>
      <Inscricao>12409</Inscricao>
      <Fantasia>DROGARIA ULTRA POPULAR</Fantasia>
      <Razao>AMAZONAS COMMERCIO FARMACEUTICO LTDA</Razao>
      <Cidade>TEFE</Cidade>
      <Bairro>CENTRO</Bairro>
      <Endereco>AVENIDA HUGO PINHEIRO, 456</Endereco>
      <Nome_Area>DROGARIA</Nome_Area>
      <CNPJ>10.457.896/0001-20</CNPJ>
    </R1>
    <R2>
      <Inscricao>39401</Inscricao>
      <Fantasia>FARMACIA TRABALHADOR</Fantasia>
      <Razao>M. N. DOS SANTOS DRUGSTORES</Razao>
      <Cidade>TEFE</Cidade>
      <Bairro>ABIAL</Bairro>
      <Endereco>RUA MARECHAL DEODORO, 90</Endereco>
      <Nome_Area>DROGARIA</Nome_Area>
      <CNPJ>08.125.741/0001-44</CNPJ>
    </R2>
  </Estabelecimento>
  <RespTecnico>
    <R1>
      <Nome>DR. JEFFERSON AYRES CASTRO</Nome>
      <CRF>AM-4509</CRF>
      <Estabelecimento>12409</Estabelecimento>
      <SEGUNDA_RT>08:00 - 12:00 / 14:00 - 18:00</SEGUNDA_RT>
      <TERCA_RT>08:00 - 12:00 / 14:00 - 18:00</TERCA_RT>
      <QUARTA_RT>08:00 - 12:00 / 14:00 - 18:00</QUARTA_RT>
      <QUINTA_RT>08:00 - 12:00 / 14:00 - 18:00</QUINTA_RT>
      <SEXTA_RT>08:00 - 12:00 / 14:00 - 18:00</SEXTA_RT>
      <SABADO_RT>08:00 - 12:00</SABADO_RT>
      <DOMINGO_RT>--</DOMINGO_RT>
    </R1>
  </RespTecnico>
</Siscon>`;
    } else if (type === "fem_0") {
      filename = "1024_0.xml";
      content = `<?xml version="1.0" encoding="UTF-8"?>
<FEM_0>
  <Inspecao>
    <NrSeqIntimacao>INT-2026-TEF19</NrSeqIntimacao>
    <Estabelecimento>12409</Estabelecimento>
    <NrSeqAuto>null</NrSeqAuto>
    <Obs>O estabelecimento farmaceutico apresenta as areas de distribuicao limpas e organizadas. Constatou-se falta de adequacao no manual de controle de validade, razao pela qual foi expedido termo de intimacao para correcao em 15 dias.</Obs>
    <NrSeqTermo>INS-2026-TEF01</NrSeqTermo>
    <DtInicio>15/05/2026 09:30:00</DtInicio>
    <DtFim>15/05/2026 11:45:00</DtFim>
    <Lote>LOTE_TEST_TEFE_2026</Lote>
    <InformacoesPrestadasPor>MARCIO GOMES SOUZA</InformacoesPrestadasPor>
    <CargoFuncao>SUB-GERENTE</CargoFuncao>
    <IfpRg>459012-AM</IfpRg>
    <IfpCpf>109.874.562-09</IfpCpf>
    <NomeRtPresente>DR. JEFFERSON AYRES CASTRO</NomeRtPresente>
    <RTPresente>SIM</RTPresente>
    <InspetorFiscalizacao>ROBERTO BENEVENUTO / JEFFERSON AYRES</InspetorFiscalizacao>
  </Inspecao>
  <Item>
    <Estabelecimento>12409</Estabelecimento>
    <Termo>INS-2026-TEF01</Termo>
    <NomeRt>DR. JEFFERSON AYRES CASTRO</NomeRt>
    <InscricaoRt>AM-4509</InscricaoRt>
    <NumFicha>FCH-1090</NumFicha>
    <DtInicio>15/05/2026 09:30:00</DtInicio>
    <DtFim>15/05/2026 11:45:00</DtFim>
    <Data>15/05/2026</Data>
    <ArquivarFVPE>S</ArquivarFVPE>
    <Outros>O estabelecimento atende a regulamentacao geral de controle especial e dispensa.</Outros>
    
    <FdaV1Cep01>S</FdaV1Cep01>
    <FdaV1Cep02>S</FdaV1Cep02>
    <FdaV1Cep03>S</FdaV1Cep03>
    <FdaV1Cep04>S</FdaV1Cep04>
    <FdaV1Cep05>N</FdaV1Cep05>
    <FdaV1Cep06>S</FdaV1Cep06>
    <FdaV1Cep07>S</FdaV1Cep07>
    <FdaV1Cep08>S</FdaV1Cep08>
    <FdaV1Cep09>S</FdaV1Cep09>
    <FdaV1Cep10>S</FdaV1Cep10>
    <FdaV1Cep11>S</FdaV1Cep11>
    <FdaV1Cep12>S</FdaV1Cep12>
    <FdaV1Cep13>S</FdaV1Cep13>
    <FdaV1Cep14>S</FdaV1Cep14>
    <FdaV1Cep15>S</FdaV1Cep15>
    <FdaV1Cep16>S</FdaV1Cep16>
    <FdaV1Cep17>S</FdaV1Cep17>
    <FdaV1Cep18>N</FdaV1Cep18>
    <FdaV1Cep19>S</FdaV1Cep19>
    <FdaV1Cep20>S</FdaV1Cep20>
    <FdaV1Cep21>S</FdaV1Cep21>
    <FdaV1Cep22>S</FdaV1Cep22>
    <FdaV1Cep23>S</FdaV1Cep23>
    <FdaV1Cep24>S</FdaV1Cep24>
    <FdaV1Cep25>S</FdaV1Cep25>
    <FdaV1Cep26>N</FdaV1Cep26>

    <FTotalAnaliseReceita>40</FTotalAnaliseReceita>
    <FTotalAnaliseNotificacao>10</FTotalAnaliseNotificacao>
    <FTotalAnaliseAntimicrobianos>15</FTotalAnaliseAntimicrobianos>
    
    <FdaV1RecKReceita>2</FdaV1RecKReceita>
    <FdaV1RecKNotificacao>1</FdaV1RecKNotificacao>
    <FdaV1RecKAntimicrobianos>0</FdaV1RecKAntimicrobianos>
  </Item>
</FEM_0>`;
    } else {
      filename = "1024_20.xml";
      content = `<?xml version="1.0" encoding="UTF-8"?>
<FEM_20>
  <NovoEstabelecimento>
    <Inscricao>I9902</Inscricao>
    <Fantasia>DROGARIA VALE DO SOL</Fantasia>
    <Razao>J G PINHEIRO FARMA ME</Razao>
    <Cidade>ALVARAES</Cidade>
    <Bairro>CENTRO</Bairro>
    <Endereco>AVENIDA GETULIO VARGAS, S/N</Endereco>
    <CNPJ>29.351.487/0001-81</CNPJ>
    <Nome_Area>DROGARIA</Nome_Area>
  </NovoEstabelecimento>
  <NovoEstabelecimento>
    <Inscricao>I9903</Inscricao>
    <Fantasia>FARMA-VIDA INTERIOR</Fantasia>
    <Razao>S O MELLO DROGARIA</Razao>
    <Cidade>MAUES</Cidade>
    <Bairro>CENTRO</Bairro>
    <Endereco>RUA RAMALHO JUNIOR, 12</Endereco>
    <CNPJ>34.120.487/0001-09</CNPJ>
    <Nome_Area>DROGARIA</Nome_Area>
  </NovoEstabelecimento>
</FEM_20>`;
    }

    const blob = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadTargets = [
    {
      id: "lote" as const,
      title: "1. XML LOTE (sisconxxxx.xml)",
      desc: "Banco cadastral do SISCON contendo os dados preliminares das empresas e escala técnica de RTs.",
      modelName: "sisconxxxx.xml"
    },
    {
      id: "fem_0" as const,
      title: "2. XML FISCALIZAÇÃO (xxxx_0.xml)",
      desc: "Termos lavrados em campo pela FEM: Termos de Inspeção, Intimações, Notificações, Autos de Infração e checklist.",
      modelName: "xxxx_0.xml"
    },
    {
      id: "fem_20" as const,
      title: "3. XML EMPRESAS NOVAS (xxxx_20.xml)",
      desc: "Empresas sem cadastro prévio no lote, registradas em campo pelo fiscal da FEM (geralmente clandestinas/ilegais).",
      modelName: "xxxx_20.xml"
    }
  ];

  return (
    <div className="space-y-8 text-slate-800">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        
        {/* Title area */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight font-display text-slate-900">
              Carga e Cruzamento de Dados (SISCON & FEM)
            </h2>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed max-w-2xl">
              Alimente o sistema com os três arquivos XML gerados pelo SISCON de escritório e pelo aplicativo FEM (tablet de campo) dos fiscais farmacêuticos do Amazonas.
            </p>
          </div>
        </div>

        {/* Triple upload grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {uploadTargets.map((target) => (
            <div key={target.id} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-slate-400 font-display">
                  {target.title}
                </span>
                <button
                  onClick={() => downloadSampleXML(target.id)}
                  className="text-sm text-violet-700 hover:text-violet-800 flex items-center gap-1 font-black bg-violet-50 border border-violet-100 px-2 py-0.5 rounded cursor-pointer transition-all"
                  title="Baixar XML modelo técnico para teste"
                >
                  <Download className="w-3 h-3" /> Modelo {target.modelName}
                </button>
              </div>

              <div
                className={`flex-1 border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[190px] relative overflow-hidden group ${
                  dragActive[target.id]
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50"
                }`}
                onDragOver={(e) => handleDrag(e, target.id, true)}
                onDragLeave={(e) => handleDrag(e, target.id, false)}
                onDrop={(e) => handleDrop(e, target.id)}
                onClick={() => document.getElementById(`file-${target.id}`)?.click()}
              >
                <input
                  id={`file-${target.id}`}
                  type="file"
                  accept=".xml"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e, target.id)}
                />

                <div className="p-3 bg-white border border-slate-200 shadow-xs rounded-2xl text-slate-400 mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-violet-500" />
                </div>
                
                <p className="text-sm font-bold text-slate-800">Arraste ou clique para enviar</p>
                <p className="text-sm text-slate-500 mt-1 max-w-[200px] leading-tight select-none font-medium">
                  {target.desc}
                </p>
              </div>

              {/* Status Indicator */}
              {status[target.id] && (
                <div 
                  className={`p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium border ${
                    status[target.id].success 
                      ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
                      : "bg-rose-50 border-rose-150 text-rose-800"
                  }`}
                >
                  {status[target.id].success ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="font-bold block leading-snug">{status[target.id].msg}</h5>
                    {status[target.id].success && (
                      <p className="text-[10.5px] text-emerald-700/90 font-mono mt-0.5 font-bold">
                        {status[target.id].count} blocos de dados integrados.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* XML Node Hierarchy Live Preview Inspector */}
      {inspectedXmlType && inspectedXmlContent && (
        <div className="bg-white rounded-3xl border border-slate-200/95 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-violet-500" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-base font-display tracking-widest uppercase">
                  Auditor Sintático de XML
                </h4>
                <p className="text-sm text-slate-400">Verificador automático de tags e conformidade de importação</p>
              </div>
            </div>
            
            <button
              onClick={() => { setInspectedXmlType(null); setInspectedXmlContent(""); }}
              className="p-1 px-3 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-mono text-sm font-bold cursor-pointer transition-colors"
            >
              Fechar Visualização
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <span className="text-sm font-mono font-bold text-slate-400 uppercase tracking-widest block">Metadados Detectados</span>
              <div className="font-mono text-sm space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Tipo do Arquivo:</span>
                  <span className="font-bold uppercase text-violet-600">{inspectedXmlType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Encoding XML:</span>
                  <span className="font-bold text-slate-800">UTF-8 / Delphi</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Tamanho do Arquivo:</span>
                  <span className="font-bold text-slate-800">{(inspectedXmlContent.length / 1024).toFixed(2)} KB</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Status do Canal:</span>
                  <span className="font-bold text-emerald-600">Pronto para Cruzamento</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 relative">
              <span className="absolute top-2 right-3 text-sm font-mono font-bold text-slate-400 uppercase select-none">
                Estilo XML Cru
              </span>
              <pre className="p-4 bg-slate-55 text-slate-700 rounded-xl border border-slate-150 text-sm whitespace-pre font-mono overflow-auto max-h-[160px] max-w-full shadow-inner">
                {inspectedXmlContent}
              </pre>
            </div>
          </div>
        </div>
      )}

      {isImporting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10001] flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="flex flex-col items-center gap-6 max-w-md">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-2xl animate-pulse scale-150" />
              <Cog className="w-20 h-20 text-violet-500 animate-spin relative z-10" style={{ animationDuration: '2.5s' }} />
            </div>
            <div className="space-y-2 relative z-10">
              <h4 className="text-xl font-black text-white uppercase tracking-wider font-display leading-snug">
                Carregando e Processando Lote XML...
              </h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                {importProgressMsg}
              </p>
              <div className="pt-2 text-xs text-violet-400/80 font-mono animate-pulse">
                Por favor, não feche a janela ou recarregue a página.
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
