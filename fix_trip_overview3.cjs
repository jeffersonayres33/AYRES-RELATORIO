const fs = require('fs');
let code = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

const regex = /\/\/ Group into categories[\s\S]*?return joined;\n  \};/m;

const replacement = `// Group into categories
    const baseCategories = [
      { id: "farmacias", titleBase: "FARMÁCIAS E DROGARIAS" },
      { id: "laboratorios", titleBase: "LABORATÓRIOS" },
      { id: "farmacia_hospitalar", titleBase: "FARMÁCIA HOSPITALAR" },
      { id: "remume", titleBase: "REMUME, CFT E GOVERNANÇA DA ASSISTÊNCIA FARMACÊUTICA" },
      { id: "outras_irregularidades", titleBase: "OUTRAS IRREGULARIDADES SANITÁRIAS RELEVANTES" },
      { id: "conclusao_especifica", titleBase: "DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO" }
    ];

    let subIndex = 1;

    baseCategories.forEach(cat => {
      const isConclusao = cat.id === "conclusao_especifica";
      const catItems = dbEvalItems.filter(item => (item.category === cat.id) || (!item.category && cat.id === "farmacias"))
        .filter(item => evalItems[item.id]);

      if (catItems.length > 0) {
        if (isConclusao) {
           paragraphs.push(\`**4. \${cat.titleBase}**\`);
        } else {
           paragraphs.push(\`**3.\${subIndex} \${cat.titleBase}**\`);
           subIndex++;
        }
        
        catItems.forEach(item => {
           let p = item.paragraph;
           p = p.replace(/\\[LABS_INFRA\\]/g, formattedLabsInfra);
           p = p.replace(/\\[LABS_LAMINAS\\]/g, formattedLabsLaminas);
           p = p.replace(/\\[HOSPITAIS\\]/g, formattedHospitals);
           
           // Process Custom Variables (Text & Tables)
           dbEvalVariables.forEach(v => {
              if (v.type === "condition") return;
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
                    const refVDef = dbEvalVariables.find(d => d.id === refVarId);
                    if (refVDef && refVDef.type === "text") {
                       refValueText = customVariablesData[refVarId]?.[0]?.[refVDef.fields[0]?.key || "val"] || "";
                    } else {
                       refValueText = customVariablesData[refVarId].length.toString();
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
        });
      }
    });

    let joined = paragraphs.join("\\n\\n");
    
    // Also process conditions inside \`finalIntro\` before returning, but we already added finalIntro to paragraphs!
    // Wait, the variables inside finalIntro were not processed by the condition loop because it was pushed at index 0.
    // Let's re-run condition loop over the entire \`joined\` text just to be safe!
    dbEvalVariables.forEach(v => {
       if (v.type !== "condition") return;
       const regex = new RegExp(\`\\\\\\[\${v.id}\\\\\\]\`, 'g');
       if (joined.match(regex)) {
          let refValueText = "";
          const refVarId = (v.conditionRefVar || "").replace(/[\\[\\]]/g, "").trim();
          
          if (refVarId === "MUNICIPIO") refValueText = selectedCity.toUpperCase();
          else if (refVarId === "QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO" || refVarId.includes("INSPECOES")) refValueText = cityEstabs.length.toString();
          else if (refVarId === "QDT_AUTOS_DE_INFRACAO_MUNIC_SELC" || refVarId.includes("AUTOS")) {
             const cityInscricoes = new Set(cityEstabs.map(e => e.inscricao));
             const num = termos.filter(t => t.estabelecimentoId && cityInscricoes.has(t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "").length;
             refValueText = num.toString();
          }
          else if (customVariablesData[refVarId]) {
             const refVDef = dbEvalVariables.find(d => d.id === refVarId);
             if (refVDef && refVDef.type === "text") {
                refValueText = customVariablesData[refVarId]?.[0]?.[refVDef.fields[0]?.key || "val"] || "";
             } else {
                refValueText = customVariablesData[refVarId].length.toString();
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
          joined = joined.replace(regex, replacementText);
       }
    });
    
    // Process text Variables for joined text as well
    dbEvalVariables.forEach(v => {
       if (v.type === "condition") return;
       const regex = new RegExp(\`\\\\\\[\${v.id}\\\\\\]\`, 'g');
       if (joined.match(regex)) {
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
          joined = joined.replace(regex, formattedV);
       }
    });

    const fiscalNames = travelFiscais.split(" / ");
    fiscalNames.forEach((name, i) => {
       const regex = new RegExp(\`\\\\\\[NOME_FISCAL\${i + 1}\\\\\\]\`, 'g');
       joined = joined.replace(regex, name.trim());
    });
    joined = joined.replace(/\\[PERIODO_DE_FISCALIZAÇÃO\\]/g, travelPeriod || "NÃO INFORMADO");

    return joined;
  };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/TripOverview.tsx', code);
