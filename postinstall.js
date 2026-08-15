// postinstall: ensure correct native binary for current platform
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const tar = require('tar-fs');

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
  const gunzipped = zlib.gunzipSync(tarBuf);

  // tar-fs extracts from a buffer; we pipe the gunzipped bytes to it
  const extract = tar.extract(TARGET_DIR);

  // tar-fs extract returns a writable stream; write the tar buffer to it
  let written = 0;
  const CHUNK_SIZE = 64 * 1024;
  while (written < gunzipped.length) {
    const chunk = gunzipped.slice(written, written + CHUNK_SIZE);
    extract.write(chunk);
    written += chunk.length;
  }
  extract.end();

  // Wait for extraction to complete
  extract.on('finish', () => {
    if (fs.existsSync(TARGET_FILE)) {
      const size = fs.statSync(TARGET_FILE).size;
      console.log(`Done: ${size} bytes written to ${TARGET_FILE}`);
    } else {
      console.warn(`[${PLATFORM}-${ARCH}] extraction finished but target file not found`);
    }
  });

  extract.on('error', (err) => {
    console.error(`[${PLATFORM}-${ARCH}] tar extraction error:`, err.message);
  });
} else {
  console.warn(`[${PLATFORM}-${ARCH}] no bundled binary found, binary may fail to load`);
}
