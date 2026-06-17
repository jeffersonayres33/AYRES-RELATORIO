const fs = require('fs');
let code = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

const target = `                                                  {v.type !== "text" && v.listInputType !== "radio" && (
                                                    <button 
                                                      type="button"
                                                      onClick={() => {
                                                        const newRec: Record<string, string> = {};
                                                        (v.fields || []).forEach(f => newRec[f.key] = "");
                                                        setCustomVariablesData({
                                                          ...customVariablesData,
                                                          [v.id]: [...records, newRec]
                                                        });
                                                      }}
                                                      className="text-xs text-violet-600 hover:text-violet-750 font-black uppercase flex items-center gap-1 cursor-pointer"
                                                    >
                                                       <Plus className="w-3.5 h-3.5" /> Adicionar
                                                    </button>
                                                  )}
                                                </div>
                                                {v.type !== "text" ? (
                                                  v.listInputType === "radio" ? (
                                                    <div className="space-y-2 pt-2">
                                                       {(v.radioOptions || []).map((opt, i) => (
                                                          <label key={i} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                                                             <input
                                                                type="radio"
                                                                name={\`radio_\${v.id}\`}
                                                                value={opt}
                                                                checked={records[0]?.["val"] === opt}
                                                                onChange={() => {
                                                                   setCustomVariablesData({ ...customVariablesData, [v.id]: [{ "val": opt }] });
                                                                }}
                                                                className="w-4 h-4 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                                             />
                                                             <span>{opt}</span>
                                                          </label>
                                                       ))}
                                                    </div>
                                                  ) : (
                                                  <div className="space-y-3">
                                                    {records.map((record, idx) => (
                                                      <div key={idx} className="flex gap-2 items-start relative border-l-2 border-slate-200 pl-3">
                                                        <div className="flex-1 grid gap-2 grid-cols-1 sm:grid-cols-2">
                                                          {(v.fields || []).map(f => (
                                                            <input 
                                                              key={f.key}
                                                              type="text" 
                                                              placeholder={f.placeholder || f.label} 
                                                              value={record[f.key] || ""} 
                                                              onChange={(e) => {
                                                                const newRecords = [...records];
                                                                newRecords[idx] = { ...newRecords[idx], [f.key]: e.target.value };
                                                                setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                              }} 
                                                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                                            />
                                                          ))}
                                                        </div>
                                                        <button 
                                                          onClick={() => {
                                                            const newRecords = records.filter((_, i) => i !== idx);
                                                            setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                          }} 
                                                          className="p-1.5 mt-0.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0 transition-colors"
                                                          title="Remover"
                                                        >
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    ))}
                                                    {records.length === 0 && (
                                                      <p className="text-[10px] text-slate-400 italic">Nenhum {v.name.toLowerCase()} adicionado. Clique no botão acima para adicionar.</p>
                                                    )}
                                                  </div>
                                                  )
                                                ) : (`;

const repl = `                                                  {v.type !== "text" && (
                                                    <button 
                                                      type="button"
                                                      onClick={() => {
                                                        const newRec = {};
                                                        (v.fields || []).forEach(f => newRec[f.key] = "");
                                                        setCustomVariablesData({
                                                          ...customVariablesData,
                                                          [v.id]: [...records, newRec]
                                                        });
                                                      }}
                                                      className="text-xs text-violet-600 hover:text-violet-750 font-black uppercase flex items-center gap-1 cursor-pointer"
                                                    >
                                                       <Plus className="w-3.5 h-3.5" /> Adicionar
                                                    </button>
                                                  )}
                                                </div>
                                                {v.type !== "text" ? (
                                                  <div className="space-y-3">
                                                    {records.map((record, idx) => (
                                                      <div key={idx} className="flex gap-2 items-start relative border-l-2 border-slate-200 pl-3">
                                                        <div className="flex-1 grid gap-2 grid-cols-1 md:grid-cols-2">
                                                          {(v.fields || []).map(f => (
                                                             <div key={f.key} className="flex flex-col gap-1">
                                                                {f.inputType === "radio" ? (
                                                                   <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
                                                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{f.label}</span>
                                                                      <div className="flex flex-wrap gap-2">
                                                                         {(f.options || []).map((opt, oIdx) => (
                                                                            <label key={oIdx} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-medium text-slate-700 bg-white border border-slate-200 p-1.5 rounded-md hover:bg-violet-50 hover:border-violet-200 transition-colors">
                                                                               <input
                                                                                  type="radio"
                                                                                  name={\`radio_\${v.id}_\${idx}_\${f.key}\`}
                                                                                  value={opt}
                                                                                  checked={record[f.key] === opt}
                                                                                  onChange={() => {
                                                                                     const newRecords = [...records];
                                                                                     newRecords[idx] = { ...newRecords[idx], [f.key]: opt };
                                                                                     setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                                                  }}
                                                                                  className="w-3 h-3 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                                                               />
                                                                               {opt}
                                                                            </label>
                                                                         ))}
                                                                      </div>
                                                                   </div>
                                                                ) : (
                                                                    <input 
                                                                      type="text" 
                                                                      placeholder={f.placeholder || f.label} 
                                                                      value={record[f.key] || ""} 
                                                                      onChange={(e) => {
                                                                        const newRecords = [...records];
                                                                        newRecords[idx] = { ...newRecords[idx], [f.key]: e.target.value };
                                                                        setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                                      }}
                                                                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all h-full" 
                                                                    />
                                                                )}
                                                             </div>
                                                          ))}
                                                        </div>
                                                        <button 
                                                          onClick={() => {
                                                            const newRecords = records.filter((_, i) => i !== idx);
                                                            setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                          }} 
                                                          className="p-1.5 mt-0.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0 transition-colors"
                                                          title="Remover"
                                                        >
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    ))}
                                                    {records.length === 0 && (
                                                      <p className="text-[10px] text-slate-400 italic">Nenhum registro adicionado. Clique em "Adicionar".</p>
                                                    )}
                                                  </div>
                                                ) : (`;

const normalise = str => str.replace(/\r\n/g, '\n');

if (normalise(code).includes(normalise(target))) {
   code = code.replace(normalise(target), normalise(repl));
   console.log("Replaced target component part");
} else {
   console.log("Failed matching target component part");
}

fs.writeFileSync('src/components/TripOverview.tsx', code, 'utf8');

EOF
