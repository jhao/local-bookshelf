const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'src', 'renderer');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function cleanDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const entry of fs.readdirSync(dirPath)) {
    const target = path.join(dirPath, entry);
    const stats = fs.statSync(target);
    if (stats.isDirectory()) {
      cleanDir(target);
      fs.rmdirSync(target);
    } else {
      fs.unlinkSync(target);
    }
  }
}

ensureDir(DIST_DIR);
cleanDir(DIST_DIR);
copyRecursive(SOURCE_DIR, DIST_DIR);

console.log(`Static assets copied from ${SOURCE_DIR} to ${DIST_DIR}`);
