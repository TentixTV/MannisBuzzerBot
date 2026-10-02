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
const TAG = 'v5.1.000';

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
  const releaseDescription = `## MannisBox ${TAG} — Song-Quiz Punkte konfigurierbar (2 Pkt Teils / 4 Pkt Vollständig) & Neuer Custom-Button\n\n### One-Click Instant Download:\n- [MannisBox-Windows-x64.zip](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.zip)\n- [MannisBox-Windows-x64.rar](https://github.com/${REPO ? `${OWNER}/${REPO}` : ''}/releases/download/${TAG}/MannisBox-Windows-x64.rar)\n\nKeine Installation nötig! Einfach entpacken und \`MannisBox.exe\` direkt per Doppelklick starten.\n\n### Neuerungen & Highlights in ${TAG}:\n- **Punkte-Vergabe beim Songs-Erkennen an der linken Regie-Seite bearbeitbar:**\n  - In der Regie links gibt es eine neue Punkte-Konfiguration für das Song-Quiz mit interaktiven Plus- und Minus-Steppern sowie Direkteingabe.\n  - **Teils erkannt:** Standardmäßig auf **2 Punkte** gesetzt (vorher 3), wenn z.B. nur der Titel oder nur der Interpret erraten wurde.\n  - **100% Vollständig:** Standardmäßig auf **4 Punkte** gesetzt für die vollständige Lösung (Titel & Interpret).\n  - **Custom Vorgabe:** Schnelle Voreinstellung für benutzerdefinierte Punktvergaben.\n- **Neuer Custom-Bewertungsbutton in der Mitte:**\n  - In der Bewertungsleiste gibt es nun neben Falsch, Weiter, Teils und Vollständig einen stylischen neuen **Custom-Button**.\n  - Klickt der Host darauf, öffnet sich ein modaler Dialog zur Eingabe einer individuellen Punktzahl für den aktuell an der Reihe befindlichen Spieler.\n- **Vollständige Live-Synchronisierung:**\n  - Werden links an den Punkten Änderungen vorgenommen, spiegeln sich diese sofort live auf den Bewertungs-Buttons, im 2X-Boost-Multiplikator und in den Discord-Meldungen wider.\n- **Alle bisherigen Features inklusive:**\n  - /goal & /boost Slash-Commands, Hitster- & Wallpaper-Modi, automatische Audio-Steuerung, E2EE DAVE Voice und frameless Deluxe-Design.`;

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

    const updatePayload = JSON.stringify({
      name: `MannisBox ${TAG} — Song-Quiz Punkte konfigurierbar (2 Pkt Teils / 4 Pkt Vollständig) & Custom-Button`,
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

    const releasePayload = JSON.stringify({
      tag_name: TAG,
      target_commitish: 'main',
      name: `MannisBox ${TAG} — Song-Quiz Punkte konfigurierbar (2 Pkt Teils / 4 Pkt Vollständig) & Custom-Button`,
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
