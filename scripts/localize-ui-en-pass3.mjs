import fs from 'fs';
import path from 'path';

const roots=['index.html','campaign','assets/js','data'];
const exts=new Set(['.html','.js','.json']);
const files=[];
function walk(p){if(!fs.existsSync(p))return;const st=fs.statSync(p);if(st.isDirectory()){for(const n of fs.readdirSync(p))walk(path.join(p,n));}else if(exts.has(path.extname(p)))files.push(p)}
roots.forEach(walk);

const R=[
["Cette fois, le chemin est libre, mais un actionneur signale une limitation thermique. Observe encore les deux directions : le fault remonte d'abord ; ensuite une nouvelle commande descend.","This time the path is clear, but an actuator reports thermal derating. Observe both directions again: the fault travels upward first; then a new command travels downward."],
["Voir la panne sans supposer sa cause.","Observe the failure without assuming its cause."],
["Lance le test une fois.","Run the test once."],
["Les moteurs restent ONLINE","The motors remain ONLINE"],
["BODY ORIENTATION reste UNKNOWN","BODY ORIENTATION remains UNKNOWN"],
["Sensor data age agit surtout sur State confidence","Sensor data age mainly affects State confidence"],
["Control latency agit sur Control response","Control latency affects Control response"],
["Le bon diagnostic doit redevenir sain avant le test","The correct diagnostic must return to healthy before the test"],
["Couper l’IMU ne peut pas supprimer l’orientation physique du robot. Cela supprime uniquement sa mesure.","Turning the IMU off cannot remove the robot’s physical orientation. It only removes its measurement."],
["Les moteurs sont ONLINE, mais le robot n’a pas de BODY ORIENTATION utilisable.","The motors are ONLINE, but the robot has no usable BODY ORIENTATION."],
["Le robot tombe alors que ses moteurs fonctionnent.","The robot falls even though its motors are working."],
["State confidence est faible","State confidence is low"],
["Control response est faible","Control response is low"],
["BODY ANGLE et IMU RAW bougent ensemble. ESTIMATE remains UNKNOWN.","BODY ANGLE and IMU RAW move together. ESTIMATE remains UNKNOWN."],
["Observe les signaux qui changent ensemble.","Observe which signals change together."],
["Lis les métriques ensemble. Traverse au moins une frontière d’échec, comprends ce qui la cause, puis reconstruis une configuration valide.","Read the metrics together. Cross at least one failure boundary, understand what causes it, then rebuild a valid configuration."],
["La condition “${m.disturbance?.label||'changed condition'}” a changé. Ne cherche pas à l’annuler : adapte réellement les contrôles qui restent sous ton autorité.","The condition “${m.disturbance?.label||'changed condition'}” changed. Do not try to cancel it: genuinely adapt the controls that remain under your authority."]
];

let changed=0;
for(const f of files){
  let s=fs.readFileSync(f,'utf8'),before=s;
  for(const [from,to] of R)s=s.split(from).join(to);
  if(s!==before){fs.writeFileSync(f,s);changed++;console.log('localized',f)}
}
console.log(`LOCALIZED_FILES_PASS3=${changed}`);
