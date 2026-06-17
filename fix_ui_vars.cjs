const fs = require('fs');
let code = fs.readFileSync('src/components/TripOverview.tsx', 'utf8');

const regex = /const variablesInThisItem = dbEvalVariables\.filter\(v => textToSearch\.includes\(\`\\\[\$\{v\.id\}\\\]\`\)\);/m;

const replacement = `const getRequiredVars = (txt: string) => {
    let req: any[] = [];
    const visited = new Set<string>();
    const traverse = (t: string) => {
      dbEvalVariables.forEach(v => {
        if (t.includes(\`[\${v.id}]\`) && !visited.has(v.id)) {
          visited.add(v.id);
          if (v.type === "condition") {
            const logicTxt = \`\${v.conditionRefVar || ""} \${v.conditionTrueText || ""} \${v.conditionFalseText || ""}\`;
            traverse(logicTxt);
          } else {
            req.push(v);
          }
        }
      });
    };
    traverse(txt);
    // Include references that text depends on
    dbEvalVariables.forEach(v => {
       if (txt.includes(\`[\${v.id}]\`) && v.type === "condition") {
          const refVarId = (v.conditionRefVar || "").replace(/[\\[\\]]/g, "").trim();
          const refVar = dbEvalVariables.find(d => d.id === refVarId);
          if (refVar && refVar.type !== "condition" && !visited.has(refVar.id)) {
             visited.add(refVar.id);
             req.push(refVar);
          }
       }
    });
    return req;
  };
  const variablesInThisItem = getRequiredVars(textToSearch);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/TripOverview.tsx', code);
