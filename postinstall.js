// postinstall: ensure correct native binary for current platform
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const zlib = require('zlib');

const TARGET_DIR = path.join(__dirname, 'node_modules', 'better-sqlite3', 'build', 'Release');
const TARGET_FILE = path.join(TARGET_DIR, 'better_sqlite3.node');

// Already have a valid binary
if (fs.existsSync(TARGET_FILE) && fs.statSync(TARGET_FILE).size > 10000) {
  console.log(`[${process.platform}-${process.arch}] binary already present, skipping`);
  process.exit(0);
}

fs.mkdirSync(TARGET_DIR, { recursive: true });

const PLATFORM = process.platform === 'linux' ? 'linux' : process.platform;
const ARCH = process.arch === 'arm' ? 'arm64' : process.arch;
const BUNDLE_PATH = path.join(__dirname, 'native-bundles', `${PLATFORM}-${ARCH}`, 'better-sqlite3.tar.gz');

if (fs.existsSync(BUNDLE_PATH)) {
  console.log(`Extracting bundled [${PLATFORM}-${ARCH}] binary...`);
  const tarBuf = fs.readFileSync(BUNDLE_PATH);
  const extracted = zlib.gunzipSync(tarBuf);
  fs.writeFileSync(TARGET_FILE, extracted);
  console.log(`Done (${extracted.length} bytes)`);
} else {
  console.log(`No bundled binary for [${PLATFORM}-${ARCH}], skipping`);
}
