const fs = require('fs');
let code = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

const regexVars = /\/\/ Process Custom Variables[\s\S]*?paragraphs\.push\(p\);\n        \}\);/m;

const replacementVars = `// Process Custom Variables
           dbEvalVariables.forEach(v => {
              if (v.type === "condition") return; // process conditions later
              const regex = new RegExp(\`\\\\\\[\${v.id}\\\\\\]\`, 'g');
              if (p.match(regex)) {
                 const valuesList = customVariablesData[v.id] || [];
                 const formattedV = valuesList.map(record => {
                    if (v.type === "text") {
                       return record[v.fields[0]?.key || "val"] || "";
                    }
                    let fp = v.formatPattern || "";
                    v.fields.forEach(f => {
                       const key = \`{\${f.key}}\`;
                       const val = record[f.key] || "";
                       fp = fp.split(key).join(val);
                    });
                    return fp;
                 }).join(", ");
                 p = p.replace(regex, formattedV);
              }
           });
           
           // Process Conditions
           dbEvalVariables.forEach(v => {
              if (v.type !== "condition") return;
              const regex = new RegExp(\`\\\\\\[\${v.id}\\\\\\]\`, 'g');
              if (p.match(regex)) {
                 // Evaluate Condition
                 let refValueText = "";
                 const refVarId = (v.conditionRefVar || "").replace(/[\\[\\]]/g, "").trim();
                 
                 // System variables
                 if (refVarId === "MUNICIPIO") refValueText = selectedCity.toUpperCase();
                 else if (refVarId === "QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO" || refVarId.includes("INSPECOES")) refValueText = cityEstabs.length.toString();
                 else if (refVarId === "QDT_AUTOS_DE_INFRACAO_MUNIC_SELC" || refVarId.includes("AUTOS")) {
                    const cityInscricoes = new Set(cityEstabs.map(e => e.inscricao));
                    const num = termos.filter(t => t.estabelecimentoId && cityInscricoes.has(t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "").length;
                    refValueText = num.toString();
                 }
                 else if (customVariablesData[refVarId]) {
                    // Check if it's text or table
                    const refVDef = dbEvalVariables.find(d => d.id === refVarId);
                    if (refVDef && refVDef.type === "text") {
                       refValueText = customVariablesData[refVarId]?.[0]?.[refVDef.fields[0]?.key || "val"] || "";
                    } else {
                       refValueText = customVariablesData[refVarId].length.toString(); // size of table
                    }
                 }
                 
                 let evalResult = false;
                 const target = (v.conditionTargetValue || "").trim();
                 let numRef = parseFloat(refValueText);
                 let numTarget = parseFloat(target);
                 
                 if (v.conditionOperator === "greater_than") {
                    evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef > numTarget : refValueText > target;
                 } else if (v.conditionOperator === "less_than") {
                    evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef < numTarget : refValueText < target;
                 } else { // equals
                    evalResult = refValueText.toString().toLowerCase() === target.toLowerCase();
                 }
                 
                 const replacementText = evalResult ? (v.conditionTrueText || "") : (v.conditionFalseText || "");
                 p = p.replace(regex, replacementText);
              }
           });
           
           paragraphs.push(p);
        });`;

code = code.replace(regexVars, replacementVars + "\n" + replacementVars.replace(/paragraphs\.push\(p\);/g, "")); 
// Wait, the regex captures up to paragraphs.push(p); \n });
// So we need to ensure the block handles both farmacias loop and conclusao loop correctly?
// Instead, let me just run my full script from `fix_trip_overview.cjs` modified to have conditions.`;
