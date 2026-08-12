import fs from 'fs';
const files=[
 'campaign/act-01/01-01-system-layers.html',
 'campaign/act-01/01-02-command-evidence.html',
 'campaign/act-01/01-03-trace-broken.html',
 'campaign/act-01/01-04-build-architecture.html',
 'campaign/act-01/01-05-coupled-failure.html',
 'campaign/act-01/01-06-architecture-gate.html',
 'campaign/act-02/02-01-frames-poses.html',
 'campaign/act-02/02-02-joint-axes.html',
 'campaign/act-02/02-03-forward-inverse-kinematics.html'
];
const hotfix='<script src="../../assets/js/qa3/custom-qa3-hotfix.js?v=qa3-20260812"></script>';
const completionCss='<link rel="stylesheet" href="../../assets/css/completion-inline.css?v=completion1-20260812">';
const completionJs='<script src="../../assets/js/completion-inline.js?v=completion1-20260812"></script>';
for(const f of files){
  let s=fs.readFileSync(f,'utf8');
  if(f.includes('/act-01/')&&!s.includes('custom-qa3-hotfix.js'))s=s.replace('</body>',`${hotfix}\n</body>`);
  if(f.includes('01-01-system-layers')&&!s.includes('custom-qa3-0101-pacing.js'))s=s.replace('</body>','<script src="../../assets/js/qa3/custom-qa3-0101-pacing.js?v=qa3-final-20260812"></script>\n</body>');
  if(!s.includes('completion-inline.css'))s=s.replace('</head>',`${completionCss}\n</head>`);
  if(!s.includes('completion-inline.js'))s=s.replace('</body>',`${completionJs}\n</body>`);
  s=s.replace(/>CAMPAIGN MAP</g,'>RETURN TO CAMPAIGN MAP<');
  fs.writeFileSync(f,s);
  console.log('checked',f);
}
