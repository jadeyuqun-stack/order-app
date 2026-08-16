// postinstall: ensure correct native binary for current platform
// Only runs on Linux (Render). Skips on macOS/Windows for local development.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const { execSync } = require('child_process');

// Skip on non-Linux platforms (local development)
if (process.platform !== 'linux') {
  console.log(`[postinstall] skipping on ${process.platform}-${process.arch}`);
  process.exit(0);
}

const PKG_DIR = path.join(__dirname, 'node_modules', 'better-sqlite3');
const TARGET_FILE = path.join(PKG_DIR, 'build', 'Release', 'better_sqlite3.node');

fs.mkdirSync(path.join(PKG_DIR, 'build', 'Release'), { recursive: true });

const ARCH = process.arch === 'arm' ? 'arm64' : 'x64';
const BUNDLE_PATH = path.join(__dirname, 'native-bundles', `linux-${ARCH}`, 'better-sqlite3.tar.gz');

if (fs.existsSync(BUNDLE_PATH)) {
  console.log(`[linux-${ARCH}] extracting bundled native binary...`);

  const tarBuf = fs.readFileSync(BUNDLE_PATH);
  const gunzipped = zlib.gunzipSync(tarBuf);

  // Write gunzipped tar to a temp file, then extract with system tar
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-extract-'));
  const tmpTar = path.join(tmpDir, 'bundle.tar');
  fs.writeFileSync(tmpTar, gunzipped);

  // Extract to package root so 'build/Release/better_sqlite3.node' lands correctly
  // Use -xf (not -xzf) since the data is already decompressed
  execSync(`tar -xf "${tmpTar}" -C "${PKG_DIR}"`, { stdio: 'pipe' });
  fs.unlinkSync(tmpTar);
  fs.rmdirSync(tmpDir);

  if (fs.existsSync(TARGET_FILE)) {
    const size = fs.statSync(TARGET_FILE).size;
    console.log(`Done: ${size} bytes written to ${TARGET_FILE}`);
  } else {
    console.warn(`[linux-${ARCH}] extraction finished but target file not found`);
    process.exit(1);
  }
} else {
  console.warn(`[linux-${ARCH}] no bundled binary found, binary may fail to load`);
  process.exit(1);
}
