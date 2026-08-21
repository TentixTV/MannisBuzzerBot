const fs = require('fs');
const path = require('path');
const packager = require('@electron/packager');
const { ZipArchive } = require('archiver');
const pngToIco = require('png-to-ico').default || require('png-to-ico');

async function ensureIcon() {
  const pngPath = path.join(__dirname, '..', 'App.png');
  const icoPath = path.join(__dirname, '..', 'App.ico');

  if (fs.existsSync(pngPath) && !fs.existsSync(icoPath)) {
    console.log('Converting App.png to App.ico...');
    const buf = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, buf);
  }
}

async function zipFolder(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => {
      const stats = fs.statSync(outPath);
      const mb = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✓ Created ZIP: ${outPath} (${mb} MB)`);
      resolve();
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function build() {
  console.log('====================================================');
  console.log('   MANNISBOX — AUTOMATED BUILD PIPELINE (DIST + ZIP)  ');
  console.log('====================================================');

  const rootDir = path.join(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');

  // Ensure icon
  await ensureIcon();

  // 1. Package into dist/ with ASAR (clean & protected)
  console.log('\n[1/2] Packaging Standalone Windows App into dist/ ...');
  const appPaths = await packager({
    dir: rootDir,
    name: 'MannisBox',
    platform: 'win32',
    arch: 'x64',
    icon: path.join(rootDir, 'App.ico'),
    out: distDir,
    overwrite: true,
    asar: {
      unpack: '**/{ffmpeg-static,opusscript}/**'
    },
    prune: true,
    ignore: (filePath) => {
      if (!filePath) return false;
      // Only ignore top-level build/temp directories, never node_modules internals!
      if (filePath.startsWith('/dist') || filePath.startsWith('\\dist')) return true;
      if (filePath.startsWith('/release') || filePath.startsWith('\\release')) return true;
      if (filePath.startsWith('/.git') || filePath.startsWith('\\.git')) return true;
      if (filePath.startsWith('/scripts') || filePath.startsWith('\\scripts')) return true;
      if (filePath.endsWith('.zip')) return true;
      return false;
    }
  });

  const packagedAppDir = appPaths[0];
  console.log(`✓ Standalone App built in: ${packagedAppDir}`);
  console.log(`  ➔ Executable: ${path.join(packagedAppDir, 'MannisBox.exe')}`);

  // 2. Create ZIP Archives (both in dist/ and at project root for easy access)
  console.log('\n[2/2] Creating Distribution ZIP Archives (for sending)...');
  const distZipPath = path.join(distDir, 'MannisBox-Windows-x64.zip');
  const rootZipPath = path.join(rootDir, 'MannisBox-Windows-x64.zip');

  await zipFolder(packagedAppDir, distZipPath);

  // Copy to root as well for convenience
  fs.copyFileSync(distZipPath, rootZipPath);
  console.log(`✓ Also available at root: ${rootZipPath}`);

  console.log('\n====================================================');
  console.log('🎉 BUILD SUCCESSFUL!');
  console.log(`📁 Standalone App Ordner : ${packagedAppDir}`);
  console.log(`🚀 Direkt starten         : ${path.join(packagedAppDir, 'MannisBox.exe')}`);
  console.log(`📦 Zum Verschicken (ZIP)  : ${distZipPath}`);
  console.log('====================================================\n');
}

build().catch((err) => {
  console.error('Build failed with error:', err);
  process.exit(1);
});
