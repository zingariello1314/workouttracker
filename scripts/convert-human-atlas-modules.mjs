import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '../src/components/tabs/AnatomyTab/atlas');

function stripTs(src) {
  let s = src;
  s = s.replace(/^import\s+type\s+[^;]+;\s*/gm, '');
  s = s.replace(/import\s*\{([^}]+)\}\s*from/g, (_m, inner) => {
    const cleaned = inner
      .split(',')
      .map((p) => p.replace(/\btype\s+/g, '').trim())
      .filter(Boolean)
      .join(', ');
    return `import {${cleaned}} from`;
  });
  s = s.replace(/^export\s+type\s+[^=]+=[^;]+;\s*/gm, '');
  s = s.replace(/^export\s+interface\s+\w+[^{]*\{[\s\S]*?\}\s*/gm, '');
  s = s.replace(/^interface\s+\w+[^{]*\{[\s\S]*?\}\s*/gm, '');
  s = s.replace(/^type\s+\w+\s*=[^;]+;\s*/gm, '');
  s = s.replace(/\bas\s+[A-Za-z_][\w.<>,[\]|\s'"-]*/g, '');
  s = s.replace(/\bprivate\s+/g, '');
  // Drop simple param type annotations: name: Type
  s = s.replace(/([,(]\s*)([A-Za-z_][\w]*)\??:\s*[A-Za-z_][\w.<>,[\]|&\s'"-]*/g, '$1$2');
  // Drop return types ) : Type {
  s = s.replace(/\)\s*:\s*[A-Za-z_][\w.<>,[\]|&\s'"-]*\s*([=>{])/g, ') $1');
  return s;
}

const files = [
  'anatomy.js',
  'explosionLayout.js',
  'modelDownload.js',
  'pointerTap.js',
  'AnatomyAtlasScene.jsx',
];

for (const f of files) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8');
  s = stripTs(s);
  s = s.replace("from './explosion-layout'", "from './explosionLayout.js'");
  s = s.replace("from './model-download'", "from './modelDownload.js'");
  s = s.replace("from './pointer-tap'", "from './pointerTap.js'");
  s = s.replace("from './anatomy'", "from './anatomy.js'");
  if (f === 'AnatomyAtlasScene.jsx') {
    s = s.replace(
      /import\s*\{useEffect,useRef\}\s*from\s*'react';?/,
      "import React, { useEffect, useRef } from 'react';"
    );
    if (!s.includes("from 'react'")) {
      s = `import React, { useEffect, useRef } from 'react';\n${s}`;
    }
    s = s.replace(/export default function AnatomyScene/, 'export default function AnatomyAtlasScene');
  }
  if (f === 'anatomy.js') {
    // Keep runtime exports only — strip remaining TS-looking export type lines if any
    s = s.replace(/^export type[\s\S]*?;\s*/gm, '');
  }
  fs.writeFileSync(p, s);
  console.log('ok', f, s.length);
}
