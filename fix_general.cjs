const fs = require('fs');
let code = fs.readFileSync('src/components/GeneralEvalConfig.tsx', 'utf8');

const regexTypeSelect = /<option value="text">Variável de Texto Simples<\/option>\s*<option value="table">Tabela \/ Lista de Registros<\/option>/m;
const repTypeSelect = `<option value="text">Variável de Texto Simples</option>
                        <option value="table">Tabela / Lista de Registros</option>
                        <option value="condition">Condição Lógica (SE)</option>`;

code = code.replace(regexTypeSelect, repTypeSelect);

const regexSave = /fields: variableFields\.map/;
const repSave = `conditionRefVar: editingVariable.conditionRefVar || "",
        conditionOperator: editingVariable.conditionOperator || "equals",
        conditionTargetValue: editingVariable.conditionTargetValue || "",
        conditionTrueText: editingVariable.conditionTrueText || "",
        conditionFalseText: editingVariable.conditionFalseText || "",
        fields: variableFields.map`;

code = code.replace(regexSave, repSave);

const regexModalis = /<p className="text-\[10\.5px\] text-slate-400 mt-1\.5 leading-relaxed ml-1">\s*Textos simples são substituídos diretamente no relatório\. Tabelas criam uma lista de registros nos formulários com sub-campos\.\s*<\/p>\s*<\/div>\s*\{\(!editingVariable\.type \|\| editingVariable\.type === "table"\) && \(/m;

const replacementModalis = `<p className="text-[10.5px] text-slate-400 mt-1.5 leading-relaxed ml-1">
                       Textos simples são substituídos diretamente no relatório. Tabelas criam uma lista de registros nos formulários com sub-campos. Condições lógicas avaliam outras variáveis.
                     </p>
                  </div>

                  {editingVariable.type === "condition" && (
                    <div className="bg-amber-50/50 p-4 border border-amber-200/50 rounded-2xl space-y-4">
                       <p className="text-[11px] text-amber-700 font-medium">Configure a condição lógica. O relatório exibirá o "Texto Verdadeiro" se a condição for atendida, ou o "Texto Falso" caso contrário.</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Variável de Referência</label>
                             <input 
                                value={editingVariable.conditionRefVar || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionRefVar: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none"
                                placeholder="[MUNICIPIO] ou LABS_INFRA"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Operador</label>
                             <select 
                                value={editingVariable.conditionOperator || "equals"}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionOperator: e.target.value as any })}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none cursor-pointer"
                             >
                                <option value="equals">Igual a (=)</option>
                                <option value="greater_than">Maior que (&gt;)</option>
                                <option value="less_than">Menor que (&lt;)</option>
                             </select>
                          </div>
                          <div className="sm:col-span-2">
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Valor Alvo</label>
                             <input 
                                value={editingVariable.conditionTargetValue || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionTargetValue: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none"
                                placeholder="MANAUS ou 0"
                             />
                          </div>
                          <div className="sm:col-span-2">
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Texto se Verdadeiro</label>
                             <textarea 
                                value={editingVariable.conditionTrueText || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionTrueText: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none min-h-[80px]"
                                placeholder="Insira o texto que aparecerá se a condição for verdadeira..."
                             />
                          </div>
                          <div className="sm:col-span-2">
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Texto se Falso</label>
                             <textarea 
                                value={editingVariable.conditionFalseText || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionFalseText: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none min-h-[80px]"
                                placeholder="Insira o texto que aparecerá se a condição for falsa..."
                             />
                          </div>
                       </div>
                    </div>
                  )}

                  {(!editingVariable.type || editingVariable.type === "table") && (`;

code = code.replace(regexModalis, replacementModalis);

fs.writeFileSync('src/components/GeneralEvalConfig.tsx', code);
