import fs from 'fs';
import path from 'path';

// English-only UI guard: scan all public HTML, runtime JS and mission data. Final localization check.
const roots=['index.html','campaign','assets/js','data'];
const exts=new Set(['.html','.js','.json']);
const french=/[àâçéèêëîïôùûüÿœæ]|\b(?:tu|une|un|le|la|les|des|du|de|dans|avec|sans|pour|par|sur|vers|reste|restent|mission terminée|terminée|retour|campagne|joueur|réuss|échec|doit|peut|choisis|observe|déplace|utilise|construis|apprend|apprendre|système|même|quand|avant|après|jusqu|pendant|nouveau|nouvelle|permet|indique|actuel|actuelle|visible|imposé|imposée|décision|résultat|preuve|connaissance|coordonnées|repère|origine|axes|point physique|question|cible|atteindre|fonction|implémentation|chaîne|retour d'évidence|conditions nominales|incapable|s'adapter|montrer|monde|change|réalité|nécessaire|valide|valider|vérifie|aucun|aucune|toutes|tout|seulement|encore|garder|garde|reste visible|aussi longtemps|quitter|rejoue|rejouer|fais|regarde|comprends|comprendre|état|mesure|contrôle|panne|réparer|réparé|devient|doivent|lorsque|lorsqu|afin|donc|mais|pas|plus|moins|entre|depuis|ainsi)\b/i;
const files=[];
function walk(p){if(!fs.existsSync(p))return;const st=fs.statSync(p);if(st.isDirectory()){for(const n of fs.readdirSync(p))walk(path.join(p,n));}else if(exts.has(path.extname(p)))files.push(p)}
for(const r of roots)walk(r);
let hits=0;
for(const f of files){const lines=fs.readFileSync(f,'utf8').split(/\r?\n/);lines.forEach((line,i)=>{if(french.test(line)){hits++;console.log(`${f}:${i+1}: ${line.trim().slice(0,500)}`)}})}
console.log(`FRENCH_UI_HITS=${hits}`);
if(hits)process.exitCode=2;
