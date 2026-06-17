const fs = require('fs');

let code = fs.readFileSync('src/components/GeneralEvalConfig.tsx', 'utf8');

const target1 = `                      <div>
                         <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Tipo de Entrada de Dados (Para Tabelas/Listas)</label>
                         <select
                            value={editingVariable.listInputType || "fields"}
                            onChange={e => setEditingVariable({ ...editingVariable, listInputType: e.target.value as "fields" | "radio" })}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold outline-none cursor-pointer"
                         >
                            <option value="fields">Campos da Variável (Múltiplos Campos por Registro)</option>
                            <option value="radio">Rádio (Seleção Única de Valor Predefinido)</option>
                         </select>
                      </div>

                      {(!editingVariable.listInputType || editingVariable.listInputType === "fields") && (
                        <>
                          <div>`;

const repl1 = `                      {(!editingVariable.listInputType || editingVariable.listInputType === "fields") && (
                        <>
                          <div>`;

const target2 = `                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5 ml-0.5">Placeholder (Instrução)</label>
                                <input
                                  type="text"
                                  placeholder="Digite a informação..."
                                  value={field.placeholder || ""}
                                  onChange={e => {
                                    const n = [...variableFields];
                                    n[idx].placeholder = e.target.value;
                                    setVariableFields(n);
                                  }}
                                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500"
                                />
                              </div>
                            </div>
                            <button
                              type="button"`;

const repl2 = `                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5 ml-0.5">Placeholder (Instrução)</label>
                                <input
                                  type="text"
                                  placeholder="Digite a informação..."
                                  value={field.placeholder || ""}
                                  onChange={e => {
                                    const n = [...variableFields];
                                    n[idx].placeholder = e.target.value;
                                    setVariableFields(n);
                                  }}
                                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                               <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5 ml-0.5">Tipo do Campo</label>
                               <select
                                  value={field.inputType || "text"}
                                  onChange={e => {
                                     const n = [...variableFields];
                                     n[idx].inputType = e.target.value as "text" | "radio";
                                     if(e.target.value === "radio" && !n[idx].options) {
                                        n[idx].options = [""];
                                     }
                                     setVariableFields(n);
                                  }}
                                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 bg-white"
                               >
                                  <option value="text">Texto</option>
                                  <option value="radio">Rádio (Seleção Única)</option>
                               </select>

                               {field.inputType === "radio" && (
                                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Opções do Rádio</label>
                                        <button
                                           type="button"
                                           onClick={() => {
                                              const n = [...variableFields];
                                              n[idx].options = [...(n[idx].options || []), ""];
                                              setVariableFields(n);
                                           }}
                                           className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center justify-center border border-violet-200 px-2 rounded-md hover:bg-violet-50 transition-colors"
                                        >
                                           + Opção
                                        </button>
                                     </div>
                                     {(field.options || []).map((o, oIdx) => (
                                        <div key={oIdx} className="flex gap-1.5 items-center">
                                           <input
                                              type="text"
                                              value={o}
                                              onChange={e => {
                                                 const n = [...variableFields];
                                                 const opts = [...(n[idx].options || [])];
                                                 opts[oIdx] = e.target.value;
                                                 n[idx].options = opts;
                                                 setVariableFields(n);
                                              }}
                                              placeholder="Ex: Conforme"
                                              className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded outline-none focus:border-violet-500"
                                           />
                                           <button
                                              type="button"
                                              onClick={() => {
                                                 const n = [...variableFields];
                                                 const opts = [...(n[idx].options || [])];
                                                 opts.splice(oIdx, 1);
                                                 n[idx].options = opts;
                                                 setVariableFields(n);
                                              }}
                                              className="text-rose-500 hover:text-rose-700"
                                           >
                                              <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                               )}
                            </div>
                            
                            <button
                              type="button"`;

const normalise = str => str.replace(/\r\n/g, '\n');

if (normalise(code).includes(normalise(target1))) {
   code = code.replace(normalise(target1), normalise(repl1));
   console.log("Replaced target1");
} else {
   console.log("Failed target1");
}

if (normalise(code).includes(normalise(target2))) {
   code = code.replace(normalise(target2), normalise(repl2));
   console.log("Replaced target2");
} else {
   console.log("Failed target2");
}

fs.writeFileSync('src/components/GeneralEvalConfig.tsx', code, 'utf8');

let code2 = fs.readFileSync('src/components/GeneralEvalConfig.tsx', 'utf8');
const target3 = `{editingVariable.type === "table" && editingVariable.listInputType === "radio" && (`;
const idx3 = code2.lastIndexOf(target3);
if (idx3 !== -1) {
   // Remove everything from target3 to the closing of that block
   // We know it ends before `<div className="flex justify-end pt-2 items-center gap-4">`
   const endTarget = `<div className="flex justify-end pt-2 items-center gap-4">`;
   const idxEnd = code2.indexOf(endTarget, idx3);
   if (idxEnd !== -1) {
      code2 = code2.substring(0, idx3) + code2.substring(idxEnd);
      console.log("Removed radio listInputType block.");
   }
}

// Remove the residual tags
code2 = code2.replace(`                  </>
                  )}
                  </>
                  )}`, "");

fs.writeFileSync('src/components/GeneralEvalConfig.tsx', code2, 'utf8');

EOF
