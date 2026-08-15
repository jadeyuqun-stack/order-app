// postinstall: ensure correct native binary for current platform
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Transform } = require('stream');

const TARGET_DIR = path.join(__dirname, 'node_modules', 'better-sqlite3', 'build', 'Release');
const TARGET_FILE = path.join(TARGET_DIR, 'better_sqlite3.node');

fs.mkdirSync(TARGET_DIR, { recursive: true });

const PLATFORM = process.platform === 'linux' ? 'linux' : process.platform;
const ARCH = process.arch === 'arm' ? 'arm64' : process.arch;
const BUNDLE_PATH = path.join(__dirname, 'native-bundles', `${PLATFORM}-${ARCH}`, 'better-sqlite3.tar.gz');

if (fs.existsSync(BUNDLE_PATH)) {
  console.log(`[${PLATFORM}-${ARCH}] extracting bundled native binary...`);

  const tarBuf = fs.readFileSync(BUNDLE_PATH);
  const gunzipped = zlib.gunzipSync(tarBuf);

  // Extract tar synchronously using tar-fs with a callback stream approach
  // We use a custom sink that writes to a buffer, then extract the single file
  const entries = [];
  let files = {};

  const extract = require('tar-fs').extract(TARGET_DIR, {
    ignore: (name) => {
      // Collect entries instead of extracting to disk
      return false;
    }
  });

  // Instead of streaming to disk, use a simpler approach:
  // Manually parse the tar from the gunzipped buffer
  const BufferList = require('bufferlist') || null;

  // Actually, let's use a completely different approach:
  // Write gunzipped data to a temp file, then use child_process execSync with tar
  const os = require('os');
  const { execSync } = require('child_process');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-extract-'));
  const tmpTar = path.join(tmpDir, 'bundle.tar');
  fs.writeFileSync(tmpTar, gunzipped);

  // Use system tar to extract (available on both macOS and Linux)
  execSync(`tar -xzf "${tmpTar}" -C "${TARGET_DIR}"`, { stdio: 'pipe' });
  fs.unlinkSync(tmpTar);
  fs.rmdirSync(tmpDir);

  if (fs.existsSync(TARGET_FILE)) {
    const size = fs.statSync(TARGET_FILE).size;
    console.log(`Done: ${size} bytes written to ${TARGET_FILE}`);
  } else {
    console.warn(`[${PLATFORM}-${ARCH}] extraction finished but target file not found`);
  }
} else {
  console.warn(`[${PLATFORM}-${ARCH}] no bundled binary found, binary may fail to load`);
}
