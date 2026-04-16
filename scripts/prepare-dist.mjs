import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const srcManifest = resolve(root, 'src/manifest.json');
const distDir = resolve(root, 'dist');
const distManifest = resolve(distDir, 'manifest.json');

if (!existsSync(srcManifest)) {
  throw new Error('Missing source manifest at src/manifest.json');
}

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

copyFileSync(srcManifest, distManifest);
console.log('Copied src/manifest.json -> dist/manifest.json');
