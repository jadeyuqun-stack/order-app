// postinstall: download correct better-sqlite3 native binary for current platform
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const VERSION = '12.11.1';
const ABI_MAP = { '127': 'node-v127', '137': 'node-v137', '141': 'node-v141', '147': 'node-v147' };
const ABI_TAG = ABI_MAP[process.versions.modules] || 'node-v141';
const PLATFORM = process.platform === 'linux' ? 'linux' : process.platform;
const ARCH = process.arch === 'arm' ? 'arm64' : process.arch;
const ARCH_MAP = { arm64: 'arm64', x64: 'x64', arm: 'arm' };
const SAFE_ARCH = ARCH_MAP[ARCH] || 'x64';

const FILENAME = `better-sqlite3-v${VERSION}-${ABI_TAG}-${PLATFORM}-${SAFE_ARCH}.tar.gz`;
const URL = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${VERSION}/${FILENAME}`;

const TARGET_DIR = path.join(__dirname, 'node_modules', 'better-sqlite3', 'build', 'Release');
const TARGET_FILE = path.join(TARGET_DIR, 'better_sqlite3.node');

// Skip if already have a valid binary
if (fs.existsSync(TARGET_FILE)) {
  const sz = fs.statSync(TARGET_FILE).size;
  if (sz > 10000) {
    console.log(`[${PLATFORM}-${SAFE_ARCH}] binary already present (${sz} bytes), skipping`);
    process.exit(0);
  }
}

fs.mkdirSync(TARGET_DIR, { recursive: true });
console.log(`[${PLATFORM}-${SAFE_ARCH}] downloading ${FILENAME}...`);

function download(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        download(res.headers.location).then(resolve).catch(reject);
      } else if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

download(URL)
  .then(buf => {
    const extracted = zlib.gunzipSync(buf);
    fs.writeFileSync(TARGET_FILE, extracted);
    console.log(`[${PLATFORM}-${SAFE_ARCH}] done (${extracted.length} bytes)`);
  })
  .catch(err => {
    // Don't fail the build — let node-gyp fallback handle it
    console.warn(`[postinstall] download skipped: ${err.message}`);
    process.exit(0);
  });
