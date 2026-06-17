const fs = require('fs');
let c = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

c = c.replace(/\/\/ Let's re-run condition loop over the entire \`joined\` text just to be safe![\s\S]*?\/\/ Process text Variables for joined text as well/m, `// Let's re-run condition loop over the entire \`joined\` text just to be safe!
    let keepRunning = true;
    let iter = 0;
    while(keepRunning && iter < 5) {
       keepRunning = false;
       iter++;
       dbEvalVariables.forEach(v => {
          if (v.type !== "condition") return;
          const regex = new RegExp(\`\\\\\\[\${v.id}\\\\\\]\`, 'g');
          if (joined.match(regex)) {
             keepRunning = true;
             let refValueText = "";
             const refVarId = (v.conditionRefVar || "").replace(/[\\[\\]]/g, "").trim();
             
             if (refVarId === "MUNICIPIO") refValueText = selectedCity.toUpperCase();
             else if (refVarId === "QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO" || refVarId.includes("INSPECOES")) refValueText = cityEstabs.length.toString();
             else if (refVarId === "QDT_AUTOS_DE_INFRACAO_MUNIC_SELC" || refVarId.includes("AUTOS")) {
                const cityInscricoes = new Set(cityEstabs.map(e => e.inscricao));
                const num = termos.filter(t => t.estabelecimentoId && cityInscricoes.has(t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "").length;
                refValueText = num.toString();
             }
             else if (refVarId) {
                const refVDef = dbEvalVariables.find(d => d.id === refVarId);
                if (refVDef && refVDef.type === "text") {
                   refValueText = customVariablesData[refVarId]?.[0]?.[refVDef.fields[0]?.key || "val"] || "";
                } else if (refVDef) {
                   refValueText = (customVariablesData[refVarId] || []).length.toString();
                } else {
                   refValueText = "";
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
             } else if (v.conditionOperator === "greater_equals") {
                evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef >= numTarget : refValueText >= target;
             } else if (v.conditionOperator === "less_equals") {
                evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef <= numTarget : refValueText <= target;
             } else if (v.conditionOperator === "not_equals") {
                evalResult = refValueText.toString().toLowerCase() !== target.toLowerCase();
             } else { // equals
                evalResult = refValueText.toString().toLowerCase() === target.toLowerCase();
             }
             
             const replacementText = evalResult ? (v.conditionTrueText || "") : (v.conditionFalseText || "");
             joined = joined.replace(regex, replacementText);
          }
       });
    }
    
    // Process text Variables for joined text as well`);

fs.writeFileSync('src/components/TripOverview.tsx', c);
