import fs from 'fs';
import path from 'path';

const src =
  process.argv[2] ||
  'C:/Users/zinga/.cursor/browser-logs/cdp-response-Runtime.evaluate-2026-10-31T04-46-43-541Z.json';
const dest =
  process.argv[3] ||
  'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json';

const raw = fs.readFileSync(src, 'utf8');
const parsed = JSON.parse(raw);
const val =
  parsed?.result?.result?.value ??
  parsed?.result?.value ??
  parsed?.value ??
  null;

if (typeof val !== 'string') {
  console.error('Unexpected CDP shape', {
    top: Object.keys(parsed || {}),
    resultKeys: parsed?.result && Object.keys(parsed.result),
    type: typeof val
  });
  process.exit(1);
}

const data = JSON.parse(val);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(data));
console.log('written', dest, data._meta);
