const fs = require('fs');

const files = [
  'src/components/TripOverview.tsx',
  'src/components/NameMappingConfig.tsx',
  'src/components/CRFMappingConfig.tsx',
  'src/components/TemplateConfig.tsx',
  'src/components/CustomVariables.tsx',
  'src/utils/docxExporter.ts'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/alert\(/g, 'console.error(');
  fs.writeFileSync(file, code);
}
