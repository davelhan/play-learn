import fs from 'fs';
import path from 'path';
const roots=['index.html','campaign','assets/js','data'],exts=new Set(['.html','.js','.json']),files=[];
function walk(p){if(!fs.existsSync(p))return;const s=fs.statSync(p);if(s.isDirectory())for(const n of fs.readdirSync(p))walk(path.join(p,n));else if(exts.has(path.extname(p)))files.push(p)}
roots.forEach(walk);
const R=[
['Mission complete. Le résultat reste visible : inspecte la scène aussi longtemps que tu veux, puis rejoue ou retourne à la Campaign Map quand tu le décides.','Mission complete. The result stays visible: inspect the scene for as long as you want, then replay or return to the Campaign Map when you decide.'],
['BODY ANGLE change avec le corps','BODY ANGLE changes with the body'],['IMU RAW suit le même mouvement','IMU RAW follows the same motion'],['ESTIMATE reste UNKNOWN','ESTIMATE remains UNKNOWN'],
['Le corps garde son angle quand l’IMU est OFF','The body keeps its angle when the IMU is OFF'],['IMU RAW disparaît','IMU RAW disappears'],['La mesure revient quand l’IMU repasse ONLINE','The measurement returns when the IMU comes back ONLINE'],
['Lis les rôles des blocs à droite. RAW DATA est disponible, mais STATE ESTIMATOR indique NO INPUT. Le lien cassé est maintenant signalé : clique directement dessus pour le réparer.','Read the roles of the blocks on the right. RAW DATA is available, but STATE ESTIMATOR shows NO INPUT. The broken link is now highlighted: click it directly to repair it.'],['Après réparation, ESTIMATED ANGLE apparaît','After the repair, ESTIMATED ANGLE appears'],
['Le corps reste incliné. Fais varier Sensor data age. Compare BODY ANGLE, ESTIMATED ANGLE et State confidence.','Keep the body tilted. Vary Sensor data age. Compare BODY ANGLE, ESTIMATED ANGLE and State confidence.'],['Avec des données anciennes, l’estimation est pauvre','With old data, the estimate is poor'],['En rendant les données plus fraîches, l’estimation se rapproche du corps','With fresher data, the estimate moves closer to the body state'],['State confidence passe d’un état faible à un état sain','State confidence moves from weak to healthy'],
['Lance STAND TEST.','Run STAND TEST.'],['Measure → Estimate → Control → Motors fonctionne comme une chaîne','Measure → Estimate → Control → Motors works as a chain'],
['Lis les métriques ensemble. Traverse au moins une frontière d’échec, comprends ce qui la cause, puis reconstruis une configuration valide.','Read the metrics together. Cross at least one failure boundary, understand what causes it, then rebuild a valid configuration.'],
['La condition “${m.disturbance?.label||\'changed condition\'}” a changé. Ne cherche pas à l’annuler : adapte réellement les contrôles qui restent sous ton autorité.','The condition “${m.disturbance?.label||\'changed condition\'}” changed. Do not try to cancel it: genuinely adapt the controls that remain under your authority.']
];
let n=0;for(const f of files){let s=fs.readFileSync(f,'utf8'),b=s;for(const [a,c] of R)s=s.split(a).join(c);if(s!==b){fs.writeFileSync(f,s);console.log('localized',f);n++}}console.log('LOCALIZED_FILES_PASS2='+n);
