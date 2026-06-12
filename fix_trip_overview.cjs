const fs = require('fs');
let code = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

const regex = /\/\/ Group into categories[\s\S]*?orderedCategories\.forEach\(cat => \{[\s\S]*?\n    \}\);\n/m;

const replacement = `// Group into categories
    const baseCategories = [
      { id: "farmacias", titleBase: "FARMÁCIAS E DROGARIAS" },
      { id: "laboratorios", titleBase: "LABORATÓRIOS" },
      { id: "farmacia_hospitalar", titleBase: "FARMÁCIA HOSPITALAR" },
      { id: "remume", titleBase: "REMUME, CFT E GOVERNANÇA DA ASSISTÊNCIA FARMACÊUTICA" },
      { id: "outras_irregularidades", titleBase: "OUTRAS IRREGULARIDADES SANITÁRIAS RELEVANTES" }
    ];

    let subIndex = 1;

    baseCategories.forEach(cat => {
      const catItems = dbEvalItems.filter(item => (item.category === cat.id) || (!item.category && cat.id === "farmacias"))
        .filter(item => evalItems[item.id]);

      if (catItems.length > 0) {
        paragraphs.push(\`**3.\${subIndex} \${cat.titleBase}**\`);
        subIndex++;
        
        catItems.forEach(item => {
           let p = item.paragraph;
           p = p.replace(/\\[LABS_INFRA\\]/g, formattedLabsInfra);
           p = p.replace(/\\[LABS_LAMINAS\\]/g, formattedLabsLaminas);
           p = p.replace(/\\[HOSPITAIS\\]/g, formattedHospitals);
           
           // Process Custom Variables
           dbEvalVariables.forEach(v => {
              const regex = new RegExp(\`\\\\\\[\${v.id}\\\\\\]\`, 'g');
              if (p.match(regex)) {
                 const valuesList = customVariablesData[v.id] || [];
                 // Filter text variables here if necessary, but records handling captures type correctly
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
           paragraphs.push(p);
        });
      }
    });

    const conclusaoItems = dbEvalItems.filter(item => item.category === "conclusao_especifica").filter(item => evalItems[item.id]);
    if (conclusaoItems.length > 0) {
        paragraphs.push(\`**4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO**\`);
        conclusaoItems.forEach(item => {
           let p = item.paragraph;
           p = p.replace(/\\[LABS_INFRA\\]/g, formattedLabsInfra);
           p = p.replace(/\\[LABS_LAMINAS\\]/g, formattedLabsLaminas);
           p = p.replace(/\\[HOSPITAIS\\]/g, formattedHospitals);
           
           // Process Custom Variables
           dbEvalVariables.forEach(v => {
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
           paragraphs.push(p);
        });
    }
`;

c = code.replace(regex, replacement);
fs.writeFileSync('src/components/TripOverview.tsx', c);
