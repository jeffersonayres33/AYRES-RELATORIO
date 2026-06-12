const fs = require('fs');
let c = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between">\s*<\/h5>\s*\{v\.type !== "text" && \(\s*<button[\s\S]*?<Plus className="w-3\.5 h-3\.5" \/> Adicionar\s*<\/button>\s*\)\s*\}\s*<\/div>\s*>\s*<Plus className="w-3\.5 h-3\.5" \/> Adicionar\s*<\/button>\s*<\/div>\s*<div className="space-y-3">/;

const replacement = `<div className="flex items-center justify-between">
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
                                                  <div className="space-y-3">`;

console.log("Regex matches?", regex.test(c));
c = c.replace(regex, replacement);
fs.writeFileSync('src/components/TripOverview.tsx', c);
console.log("Done");
