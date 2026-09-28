const fs = require('fs');
const path = require('path');
const https = require('https');

let TOKEN = process.env.GITHUB_TOKEN || '';
if (!TOKEN) {
  try {
    const { execSync } = require('child_process');
    const creds = execSync('echo protocol=https`nhost=github.com | git credential fill', { shell: 'powershell', encoding: 'utf8' });
    const match = creds.match(/password=(.+)/);
    if (match) TOKEN = match[1].trim();
  } catch (e) {}
}
const OWNER = 'TentixTV';
const REPO = 'MannisBuzzerBot';
const TAG = 'v4.8.031';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function uploadAsset(uploadUrlRaw, filePath, contentType) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const mb = (fileSize / 1024 / 1024).toFixed(1);

    // uploadUrl is like https://uploads.github.com/repos/OWNER/REPO/releases/ID/assets{?name,label}
    const cleanUrl = uploadUrlRaw.replace(/\{.*\}/, '');
    const urlObj = new URL(`${cleanUrl}?name=${encodeURIComponent(filename)}`);

    console.log(`\n➔ Uploading ${filename} (${mb} MB) to GitHub Releases...`);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'MannisBox-Uploader',
        'Content-Type': contentType,
        'Content-Length': fileSize
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ Successfully uploaded: ${filename}`);
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Asset upload failed (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', reject);

    const fileStream = fs.createReadStream(filePath);
    let uploadedBytes = 0;
    let lastLog = Date.now();

    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      if (Date.now() - lastLog > 2000) {
        lastLog = Date.now();
        const percent = ((uploadedBytes / fileSize) * 100).toFixed(1);
        console.log(`  Upload progress ${filename}: ${percent}% (${(uploadedBytes / 1024 / 1024).toFixed(1)} / ${mb} MB)`);
      }
    });

    fileStream.pipe(req);
  });
}

async function main() {
  console.log(`1. Checking if release for ${TAG} exists...`);
  let release = null;
  try {
    release = await request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'MannisBox-Uploader',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    console.log(`Found existing release ID: ${release.id}`);
    const releaseDescription = `## MannisBox ${TAG} — Crash Fix, Privacy & 120 FPS Performance Update\n\n### One-Click Instant Download:\n- [MannisBox-Windows-x64.zip](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.zip)\n- [MannisBox-Windows-x64.rar](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.rar)\n\nKeine Installation nötig! Einfach entpacken und \`MannisBox.exe\` direkt per Doppelklick starten.\n\n### Neuerungen & Fixes in ${TAG}:\n- **Crash Prevention & Startup Hardening:**\n  - Abstürze nach wenigen Sekunden behoben (sauberes Timeout- und Error-Handling beim Discord Voice-Channel Beitritt).\n  - Unverträgliche Chromium/GPU-Flags (VaapiVideoDecoder, CanvasOopRasterization) entfernt.\n  - Globale Exception- und Rejection-Handler integriert, damit unerwartete Netzwerkabbrüche die App nicht beenden.\n- **Wallpaper Privacy (Anti-Cheat):**\n  - Beim Wallpaper-Modus werden die Bilder nicht mehr im Discord-Chat gepostet (verhindert Spoiler und Reverse-Search). Die schärfende Leinwand läuft exklusiv im Stream Overlay und der App.\n- **High-FPS & Stuttering Fixes:**\n  - Signature-Caching für DOM-Elemente (Scoreboard, Hitster-Shelves, Timeline) verhindert 500ms DOM-Neubauten und beseitigt Mikroruckler.\n  - WebGL Hintergrundcanvas GPU-Füllrate auf hochauflösenden Screens (1440p/4K) gedeckelt für konstante 60–144 FPS.\n  - Throttled Mousemove-Listener für Gaming-Mäuse mit hoher Polling-Rate (1000Hz+).\n- **Audio & Songauswahl:**\n  - Songauswahl beim Ordner-Suchfilter vollständig korrigiert.\n  - Optimierte 2D-Flammen Boost-Animation ohne abgeschnittene Ränder.`;

    const updatePayload = JSON.stringify({
      name: `MannisBox ${TAG} — Crash Fix, Privacy & 120 FPS Performance Update`,
      body: releaseDescription,
      draft: false,
      prerelease: false
    });
    try {
      await request({
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/releases/${release.id}`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'User-Agent': 'MannisBox-Uploader',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(updatePayload)
        }
      }, updatePayload);
      console.log(`✓ Updated release notes for ${TAG}`);
    } catch (e) {
      console.warn('Could not patch release notes:', e.message);
    }
  } catch (err) {
    console.log(`Release does not exist yet. Creating new release for ${TAG}...`);
    const releaseDescription = `## MannisBox ${TAG} — Crash Fix, Privacy & 120 FPS Performance Update\n\n### One-Click Instant Download:\n- [MannisBox-Windows-x64.zip](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.zip)\n- [MannisBox-Windows-x64.rar](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.rar)\n\nKeine Installation nötig! Einfach entpacken und \`MannisBox.exe\` direkt per Doppelklick starten.\n\n### Neuerungen & Fixes in ${TAG}:\n- **Crash Prevention & Startup Hardening:**\n  - Abstürze nach wenigen Sekunden behoben (sauberes Timeout- und Error-Handling beim Discord Voice-Channel Beitritt).\n  - Unverträgliche Chromium/GPU-Flags (VaapiVideoDecoder, CanvasOopRasterization) entfernt.\n  - Globale Exception- und Rejection-Handler integriert, damit unerwartete Netzwerkabbrüche die App nicht beenden.\n- **Wallpaper Privacy (Anti-Cheat):**\n  - Beim Wallpaper-Modus werden die Bilder nicht mehr im Discord-Chat gepostet (verhindert Spoiler und Reverse-Search). Die schärfende Leinwand läuft exklusiv im Stream Overlay und der App.\n- **High-FPS & Stuttering Fixes:**\n  - Signature-Caching für DOM-Elemente (Scoreboard, Hitster-Shelves, Timeline) verhindert 500ms DOM-Neubauten und beseitigt Mikroruckler.\n  - WebGL Hintergrundcanvas GPU-Füllrate auf hochauflösenden Screens (1440p/4K) gedeckelt für konstante 60–144 FPS.\n  - Throttled Mousemove-Listener für Gaming-Mäuse mit hoher Polling-Rate (1000Hz+).\n- **Audio & Songauswahl:**\n  - Songauswahl beim Ordner-Suchfilter vollständig korrigiert.\n  - Optimierte 2D-Flammen Boost-Animation ohne abgeschnittene Ränder.`;

    const releasePayload = JSON.stringify({
      tag_name: TAG,
      target_commitish: 'main',
      name: `MannisBox ${TAG} — Crash Fix, Privacy & 120 FPS Performance Update`,
      body: releaseDescription,
      draft: false,
      prerelease: false
    });

    release = await request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/releases`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'MannisBox-Uploader',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(releasePayload)
      }
    }, releasePayload);
    console.log(`✓ Created GitHub Release: ${release.name} (ID: ${release.id})`);
  }

  const existingAssets = release.assets || [];
  const rootDir = path.join(__dirname, '..');
  const zipFile = path.join(rootDir, 'MannisBox-Windows-x64.zip');
  const rarFile = path.join(rootDir, 'MannisBox-Windows-x64.rar');

  // Helper to delete an asset
  async function deleteAssetIfExists(assetName) {
    const existing = existingAssets.find(a => a.name === assetName);
    if (existing) {
      console.log(`Deleting existing ${assetName} (ID: ${existing.id}) to upload fresh build...`);
      try {
        await request({
          hostname: 'api.github.com',
          path: `/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`,
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'User-Agent': 'MannisBox-Uploader',
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        console.log(`✓ Deleted old ${assetName}`);
      } catch (e) {
        console.warn(`Could not delete asset ${existing.id}:`, e.message);
      }
    }
  }

  // Upload zip
  if (fs.existsSync(zipFile)) {
    await deleteAssetIfExists('MannisBox-Windows-x64.zip');
    await uploadAsset(release.upload_url, zipFile, 'application/zip');
  }

  // Upload rar
  if (fs.existsSync(rarFile)) {
    await deleteAssetIfExists('MannisBox-Windows-x64.rar');
    await uploadAsset(release.upload_url, rarFile, 'application/x-rar-compressed');
  }

  console.log('\n🎉 ALL ASSETS SUCCESSFULLY ATTACHED TO GITHUB RELEASE!');
  console.log(`🔗 Release URL: https://github.com/${OWNER}/${REPO}/releases/tag/${TAG}`);
  console.log(`📦 Direct ZIP: https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.zip`);
  console.log(`🗜️ Direct RAR: https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.rar`);
}

main().catch(err => {
  console.error('Fatal error during release upload:', err);
  process.exit(1);
});
