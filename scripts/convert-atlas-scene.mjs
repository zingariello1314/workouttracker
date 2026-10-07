import fs from 'fs';

const srcPath = 'C:/Users/zinga/Desktop/human-atlas/app/scene.tsx';
const destPath =
  'C:/Users/zinga/Desktop/momentum/src/components/tabs/AnatomyTab/atlas/AnatomyAtlasScene.jsx';

let s = fs.readFileSync(srcPath, 'utf8');
s = s.replace(
  "import {useEffect,useRef} from 'react';",
  "import React, { useEffect, useRef } from 'react';"
);
s = s.replace("from './explosion-layout'", "from './explosionLayout.js'");
s = s.replace("from './model-download'", "from './modelDownload.js'");
s = s.replace("from './pointer-tap'", "from './pointerTap.js'");
s = s.replace("import {SYSTEMS,type Atlas,type SceneState} from './anatomy';", "import { SYSTEMS } from './anatomy.js';");
s = s.replace(/^interface Props[^\n]*\n/m, '');
s = s.replace(
  'export default function AnatomyScene({atlas,state,onSelect,onProgress,onError}:Props){',
  'export default function AnatomyAtlasScene({ atlas, state, onSelect, onProgress, onError }) {'
);
s = s.replace('const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect);', 'const host=useRef(null),latest=useRef(state),select=useRef(onSelect);');
s = s.replace('const el=host.current!;', 'const el=host.current; if(!el) return;');
s = s.replace('let lastState:SceneState|null=null;', 'let lastState=null;');
s = s.replace('let renderer:T.WebGLRenderer;', 'let renderer;');
s = s.replace('const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],pickers:(T.Mesh|undefined)[]=[],', 'const materials=[],geometries=[],pickers=[],');
s = s.replace('const offsets:T.Vector3[]=[],', 'const offsets=[],');
s = s.replace(/^  type Target=\{[^}]+\}([^;]*);/m, '  ');
s = s.replace('let targets:Target[]=[];', 'let targets=[];');
s = s.replace('const findTarget=(x:number,y:number,radius:number)=>', 'const findTarget=(x,y,radius)=>');
s = s.replace('const materialFor=(system:string)=>', 'const materialFor=(system)=>');
s = s.replace('const loadChunk=async(ci:number)=>', 'const loadChunk=async(ci)=>');
s = s.replace('const groups=new Map<string,T.BufferGeometry[]>();', 'const groups=new Map();');
s = s.replace('mats.get(system as never)', 'mats.get(system)');
s = s.replace('const fit=(view:string,extent=0)=>', 'const fit=(view,extent=0)=>');
s = s.replace('const down=(e:PointerEvent)=>', 'const down=(e)=>');
s = s.replace('const move=(e:PointerEvent)=>', 'const move=(e)=>');
s = s.replace('const cancel=(e:PointerEvent)=>', 'const cancel=(e)=>');
s = s.replace('const up=(e:PointerEvent)=>', 'const up=(e)=>');
s = s.replace('const contextLost=(e:Event)=>', 'const contextLost=(e)=>');
s = s.replace(/chunk\.gzip!/g, 'chunk.gzip');
// Scope DOM queries to the embed root
s = s.replace(
  "document.querySelector('.detail-sheet')",
  "el.closest('.human-atlas-embed')?.querySelector('.detail-sheet')"
);
s = s.replace(
  "document.querySelector('.identity')",
  "el.closest('.human-atlas-embed')?.querySelector('.identity')"
);

fs.writeFileSync(destPath, s);
console.log('wrote', destPath, s.length);
