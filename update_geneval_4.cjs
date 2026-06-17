const fs = require('fs');
let code = fs.readFileSync('src/components/GeneralEvalConfig.tsx', 'utf8');

const targetLines = code.split('\n');
let replaced = false;

for (let i = 0; i < targetLines.length; i++) {
   if (targetLines[i].includes('className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500"') &&
       targetLines[i+2].includes('</div>') &&
       targetLines[i+3].includes('<button') &&
       targetLines[i+4].includes('type="button"')) {
       // Insert after targetLines[i+2]
       const insertion = `                            
                            <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-lg w-full">
                               <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5 ml-0.5">Tipo do Campo</label>
                               <select
                                  value={field.inputType || "text"}
                                  onChange={e => {
                                     const n = [...variableFields];
                                     n[idx].inputType = e.target.value as "text" | "radio";
                                     if(e.target.value === "radio" && (!n[idx].options || n[idx].options.length === 0)) {
                                        n[idx].options = [""];
                                     }
                                     setVariableFields(n);
                                  }}
                                  className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-violet-500 bg-white"
                               >
                                  <option value="text">Texto</option>
                                  <option value="radio">Rádio (Seleção Única de valores)</option>
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
                                              className="text-rose-500 hover:bg-rose-100 p-1 rounded-md"
                                           >
                                              <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                               )}
                            </div>`;
                            
       targetLines.splice(i+2, 0, insertion);
       replaced = true;
       break;
   }
}

if (replaced) {
   fs.writeFileSync('src/components/GeneralEvalConfig.tsx', targetLines.join('\n'), 'utf8');
   console.log("Success");
} else {
   console.log("Failed");
}
