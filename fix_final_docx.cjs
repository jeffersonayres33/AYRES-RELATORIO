const fs = require('fs');
let c = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const regex = /relatorioSimplesXml \+= pBold\("3\. DA AVALIAÇÃO GERAL"\);\s*assessmentText\.split\(\/\\r\?\\n\\n\/\)\.forEach\(pBlock => \{\s*if \(pBlock\.trim\(\) === ''\) return;\s*if \(pBlock\.startsWith\("\*\*"\) && pBlock\.endsWith\("\*\*"\)\) \{\s*childrenElements\.push\([\s\S]*?\);\s*\} else \{/;

const rep = `relatorioSimplesXml += pBold("3. DA AVALIAÇÃO GERAL");
  assessmentText.split(/\\r?\\n\\n/).forEach(pBlock => {
    if (pBlock.trim() === '') return;
    if (pBlock.startsWith("**") && pBlock.endsWith("**")) {
      relatorioSimplesXml += pBold(pBlock.substring(2, pBlock.length - 2));
    } else {`;
    
c = c.replace(regex, rep);

fs.writeFileSync('src/utils/docxExporter.ts', c);
