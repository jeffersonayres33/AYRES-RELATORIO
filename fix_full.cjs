const fs = require('fs');
let c = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

const regex = /<div key=\{v\.id\} className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*}\)/;

const replacement = `<div key={v.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                                <div className="flex items-center justify-between">
                                                  <h5 className="text-[11px] uppercase font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                                                     ⚙️ [{v.id}] - {v.name}
                                                  </h5>
                                                  {v.type !== "text" && (
                                                    <button 
                                                      type="button"
                                                      onClick={() => {
                                                        const newRec: Record<string, string> = {};
                                                        v.fields.forEach(f => newRec[f.key] = "");
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
                                                        <div className="flex-1 grid gap-2 grid-cols-1 sm:grid-cols-2">
                                                          {v.fields.map(f => (
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
                                                ) : (
                                                  <div className="space-y-3 pt-2">
                                                    <input 
                                                      type="text" 
                                                      placeholder={\`Valor para \${v.name}\`} 
                                                      value={records[0]?.[v.fields[0]?.key || "val"] || ""} 
                                                      onChange={(e) => {
                                                        const key = v.fields[0]?.key || "val";
                                                        setCustomVariablesData({ ...customVariablesData, [v.id]: [{ [key]: e.target.value }] });
                                                      }} 
                                                      className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                                    />
                                                  </div>
                                                )}
                                             </div>
                                          );
                                       })`;

console.log("Regex test: ", regex.test(c));
c = c.replace(regex, replacement);
fs.writeFileSync('src/components/TripOverview.tsx', c);
console.log("Replaced fully");
