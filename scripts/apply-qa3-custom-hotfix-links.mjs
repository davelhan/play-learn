import fs from 'fs';
const files=[
 'campaign/act-01/01-01-system-layers.html',
 'campaign/act-01/01-02-command-evidence.html',
 'campaign/act-01/01-03-trace-broken.html',
 'campaign/act-01/01-04-build-architecture.html',
 'campaign/act-01/01-05-coupled-failure.html',
 'campaign/act-01/01-06-architecture-gate.html'
];
const tag='<script src="../../assets/js/qa3/custom-qa3-hotfix.js?v=qa3-20260812"></script>';
for(const f of files){let s=fs.readFileSync(f,'utf8');if(!s.includes('custom-qa3-hotfix.js'))s=s.replace('</body>',`${tag}\n</body>`);if(f.includes('01-01-system-layers')&&!s.includes('custom-qa3-0101-pacing.js'))s=s.replace('</body>','<script src="../../assets/js/qa3/custom-qa3-0101-pacing.js?v=qa3-final-20260812"></script>\n</body>');fs.writeFileSync(f,s);console.log('checked',f)}
