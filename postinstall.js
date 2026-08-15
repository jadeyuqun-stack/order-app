// postinstall: ensure correct native binary for current platform
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TARGET_DIR = path.join(__dirname, 'node_modules', 'better-sqlite3', 'build', 'Release');
const TARGET_FILE = path.join(TARGET_DIR, 'better_sqlite3.node');

// Always extract the correct bundled binary (don't skip even if one exists)
// This ensures we get the right binary for the deployment target
fs.mkdirSync(TARGET_DIR, { recursive: true });

const PLATFORM = process.platform === 'linux' ? 'linux' : process.platform;
const ARCH = process.arch === 'arm' ? 'arm64' : process.arch;
const BUNDLE_PATH = path.join(__dirname, 'native-bundles', `${PLATFORM}-${ARCH}`, 'better-sqlite3.tar.gz');

if (fs.existsSync(BUNDLE_PATH)) {
  console.log(`[${PLATFORM}-${ARCH}] extracting bundled native binary...`);
  const tarBuf = fs.readFileSync(BUNDLE_PATH);
  const extracted = zlib.gunzipSync(tarBuf);
  fs.writeFileSync(TARGET_FILE, extracted);
  console.log(`Done: ${extracted.length} bytes written to ${TARGET_FILE}`);
} else {
  console.warn(`[${PLATFORM}-${ARCH}] no bundled binary found, binary may fail to load`);
}
