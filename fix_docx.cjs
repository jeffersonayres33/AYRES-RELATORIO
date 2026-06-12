const fs = require('fs');
let code = fs.readFileSync('src/utils/docxExporter.ts', 'utf8');

const regex1 = /if \(pBlock\.startsWith\("### "\)\) \{[\s\S]*?else \{/g;
const rep1 = `if (pBlock.startsWith("**") && pBlock.endsWith("**")) {
      childrenElements.push(
        createParagraph(pBlock.substring(2, pBlock.length - 2), {
          bold: true,
          size: 24, // 12pt
          before: 300,
          after: 150,
        })
      );
    } else {`;
code = code.replace(regex1, rep1);

const regex2 = /if \(pBlock\.startsWith\("### "\)\) \{[\s\S]*?else \{/g;
const rep2 = `if (pBlock.startsWith("**") && pBlock.endsWith("**")) {
      relatorioSimplesXml += pBold(pBlock.substring(2, pBlock.length - 2));
    } else {`;
    
code = code.replace(regex2, rep2);

fs.writeFileSync('src/utils/docxExporter.ts', code);
