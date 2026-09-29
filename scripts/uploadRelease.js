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
const TAG = 'v5.0.004';

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
  const releaseDescription = `## MannisBox ${TAG} — Live Buzzer-Nachrichten im Textkanal & Spielleiter-Trennung (Kein Mitspieler)\n\n### One-Click Instant Download:\n- [MannisBox-Windows-x64.zip](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/MannisBox-Windows-x64.zip)\n- [MannisBox-Windows-x64.rar](https://github.com/${REPO ? `${OWNER}/${REPO}` : ''}/releases/download/${TAG}/MannisBox-Windows-x64.rar)\n\nKeine Installation nötig! Einfach entpacken und \`MannisBox.exe\` direkt per Doppelklick starten.\n\n### Neuerungen & Fixes in ${TAG}:\n- **Regie-Buzzer sauber beschriftet:**\n  - Beim Klick auf den Regie-Buzzer in der App wird nun überall sauber ausschließlich \`Regie\` angezeigt (nicht mehr \`Regie (Dome)\`).\n- **Live Buzzer-Benachrichtigung im Text-Kanal:**\n  - Sobald ein Spieler den Buzzer betätigt (per Discord-Button, \`/buzzer\`, Chatbefehl oder Web/App), schickt der Bot sofort eine unübersehbare Benachrichtigung samt Reaktionszeit, möglicher Punkte und Spieler-Ping direkt in den ausgewählten Textkanal!\n  - Bei richtiger oder falscher Antwort postet der Bot nun ebenfalls das Ergebnis live in den Textkanal.\n- **Spielleiter (ThisManniGuy) ist reiner Host und KEIN Mitspieler:**\n  - ThisManniGuy wird nun strikt als Spielleiter geführt und erscheint weder in der Mitspieler-Liste des Voice-Kanals, noch im Punktestand oder auf der Stream-Anzeige.\n  - Voice-Updates und Host-Buzzer legen keine Phantom-Spielerprofile mehr für den Host an.\n- **Alle Fixes aus v5.0.002 enthalten:**\n  - DAVE E2EE Protokoll (@snazzah/davey) gegen Voice-Flapping / Code 4017.\n  - Mutex-gesteuerter Voice-Watchdog (15s) ohne Verbindungsabbrüche.\n  - Perfekt ausbalancierte /goal- und /boost-Mechaniken.`;

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
      name: `MannisBox ${TAG} — Live Buzzer-Nachrichten im Textkanal & Spielleiter-Trennung`,
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
      name: `MannisBox ${TAG} — Live Buzzer-Nachrichten im Textkanal & Spielleiter-Trennung`,
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
