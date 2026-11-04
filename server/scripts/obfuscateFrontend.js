import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

/**
 * ============================================================================
 * SHREEJI ENTERPRISE AUTOMATED CODE OBFUSCATOR & ANTI-REVERSE-ENGINEER SCRIPT
 * 100% Free Open-Source Build Tool using javascript-obfuscator
 * Transforms readable JS into impenetrable, self-defending, encrypted bytecode
 * ============================================================================
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const targets = [
  'script.js',
  'Shreeji web/script.js',
  '3d-map/viewer.js',
  'Shreeji web/3d-map/viewer.js',
  'js/shreeji-security-shield.js',
  'Shreeji web/js/shreeji-security-shield.js'
];

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.35,
  debugProtection: false, // Set to false during file build to allow clean node execution
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: true,
  shuffleStringArray: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

console.log('🛡️  [Security:Obfuscator] Initiating anti-reverse engineering pipeline...\n');

let totalSaved = 0;
let filesProcessed = 0;

for (const relPath of targets) {
  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Skip: ${relPath} not found`);
    continue;
  }

  const originalSource = fs.readFileSync(fullPath, 'utf8');
  console.log(`🔒 Obfuscating ${relPath} (${Math.round(originalSource.length / 1024)} KB)...`);

  const startTime = Date.now();
  const obfuscatedResult = JavaScriptObfuscator.obfuscate(originalSource, obfuscationOptions);
  const obfuscatedCode = obfuscatedResult.getObfuscatedCode();
  const elapsed = Date.now() - startTime;

  // Create .protected.js alongside
  const protectedPath = fullPath.replace(/\.js$/, '.protected.js');
  fs.writeFileSync(protectedPath, obfuscatedCode, 'utf8');

  console.log(`   ✅ Generated ${path.basename(protectedPath)} in ${elapsed}ms (${Math.round(obfuscatedCode.length / 1024)} KB)`);
  filesProcessed++;
}

console.log(`\n🎉 [Security:Obfuscator] Completed! ${filesProcessed} files armored against reverse engineering.`);
console.log('💡 Protected files generated with .protected.js suffix for secure deployment.\n');

