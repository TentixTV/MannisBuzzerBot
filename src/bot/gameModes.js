const fs = require('fs');
const path = require('path');
let mm = null;
try {
  mm = require('music-metadata');
} catch (e) {
  console.warn('[GameModes] music-metadata not loaded:', e.message);
}

function cleanMetadata(text) {
  if (!text) return '';
  let cleaned = text;
  const noise = [
    /[\(\[\{].*?(remaster|live|official|video|edit|mix|deluxe|version|mono|stereo|bonus|explicit|clean).*?[\)\]\}]/gi,
    /feat\..*$/gi,
    /ft\..*$/gi,
    /featuring.*$/gi
  ];
  for (const n of noise) {
    cleaned = cleaned.replace(n, '');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

function censorText(text, mask = '█') {
  if (!text) return '';
  return text.split('').map(c => /[a-zA-Z0-9äöüÄÖÜß]/.test(c) ? mask : c).join('');
}

function calculateWallpaperPoints(elapsedSeconds) {
  if (elapsedSeconds < 10) return 4;
  if (elapsedSeconds < 20) return 3;
  if (elapsedSeconds < 30) return 2;
  return 1;
}

function getWallpaperStage(elapsedSeconds) {
  if (elapsedSeconds < 10) return 1;
  if (elapsedSeconds < 20) return 2;
  if (elapsedSeconds < 30) return 3;
  if (elapsedSeconds < 40) return 4;
  return 5;
}

async function scanAudioFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return { success: false, error: 'Ordner existiert nicht' };

  const validExts = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac']);
  const files = [];
  const genres = new Set();

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(currentDir, ent.name);
      if (ent.isDirectory()) {
        walk(fullPath);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (validExts.has(ext)) {
          files.push(fullPath);
          const relDir = path.relative(folderPath, currentDir);
          if (relDir && relDir !== '.') {
            genres.add(relDir);
          }
        }
      }
    }
  }

  try {
    walk(folderPath);
  } catch (err) {
    return { success: false, error: err.message };
  }

  return {
    success: true,
    totalFiles: files.length,
    folder: folderPath,
    genres: Array.from(genres).sort(),
    files
  };
}

async function extractAudioTags(filePath) {
  let title = path.basename(filePath, path.extname(filePath));
  let artist = 'Unbekannter Künstler';
  let genre = 'Unbekannt';
  let year = 'Unbekannt';

  function findYearInValue(val) {
    if (!val) return null;
    if (typeof val === 'number') {
      if (val >= 1900 && val <= 2099) return String(val);
      return null;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        const found = findYearInValue(item);
        if (found) return found;
      }
      return null;
    }
    if (typeof val === 'object') {
      if (val.text) {
        const found = findYearInValue(val.text);
        if (found) return found;
      }
      for (const k of Object.keys(val)) {
        const found = findYearInValue(val[k]);
        if (found) return found;
      }
      return null;
    }
    const m = String(val).match(/\b(19\d{2}|20\d{2})\b/);
    return m ? m[1] : null;
  }

  if (mm) {
    try {
      const meta = await mm.parseFile(filePath);
      if (meta && meta.common) {
        if (meta.common.title) title = meta.common.title;
        if (meta.common.artist) artist = meta.common.artist;
        if (meta.common.genre && meta.common.genre[0]) genre = meta.common.genre[0];
        
        // Year resolution: year field, date, comments, description, lyrics, native
        const yCandidates = [
          meta.common.year,
          findYearInValue(meta.common.date),
          findYearInValue(meta.common.originaldate),
          findYearInValue(meta.common.originalyear),
          findYearInValue(meta.common.comment),
          findYearInValue(meta.common.description),
          findYearInValue(meta.common.lyrics),
          findYearInValue(meta.native)
        ];
        for (const cand of yCandidates) {
          if (cand && String(cand).length === 4) {
            year = String(cand);
            break;
          }
        }
      }
    } catch (e) {
      console.debug('[GameModes] Tag parse fallback for:', filePath);
    }
  }

  // If filename looks like "Artist - Title"
  const baseName = path.basename(filePath, path.extname(filePath));
  if (baseName.includes(' - ') && artist === 'Unbekannter Künstler') {
    const parts = baseName.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  const cleanArtist = cleanMetadata(artist);
  const cleanTitle = cleanMetadata(title);

  // Auto-detect year from path/filename if unknown (e.g. "80er", "1984", etc.)
  if (year === 'Unbekannt') {
    const yearMatch = filePath.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      year = yearMatch[1];
    } else if (/80er/i.test(filePath)) {
      year = '1985';
    } else if (/90er/i.test(filePath)) {
      year = '1995';
    } else if (/70er/i.test(filePath)) {
      year = '1975';
    } else if (/2000er/i.test(filePath)) {
      year = '2005';
    } else if (/2010er/i.test(filePath)) {
      year = '2015';
    }
  }

  return {
    filePath,
    title: cleanTitle,
    artist: cleanArtist,
    genre,
    year,
    fullTitle: `${cleanArtist} - ${cleanTitle}`,
    censoredTitle: `${censorText(cleanArtist)} - ${censorText(cleanTitle)}`
  };
}

function scanWallpaperFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return { success: false, error: 'Ordner existiert nicht' };

  const validExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);
  const rounds = [];

  try {
    const items = fs.readdirSync(folderPath);
    for (const item of items) {
      if (item.startsWith('.')) continue;
      const fullPath = path.join(folderPath, item);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }

      if (stat.isDirectory()) {
        try {
          const subFiles = fs.readdirSync(fullPath)
            .filter(f => validExts.has(path.extname(f).toLowerCase()))
            .map(f => path.join(fullPath, f))
            .sort();

          if (subFiles.length >= 4) {
            const movieTitle = item.replace(/_/g, ' ');
            rounds.push({
              movieTitle,
              stages: {
                1: subFiles[0],
                2: subFiles[1],
                3: subFiles[2],
                4: subFiles[3],
                5: subFiles[subFiles.length - 1]
              },
              sharpImage: subFiles[subFiles.length - 1]
            });
          } else if (subFiles.length >= 1) {
            const movieTitle = item.replace(/_/g, ' ');
            rounds.push({
              movieTitle,
              stages: {
                1: subFiles[0],
                2: subFiles[0],
                3: subFiles[0],
                4: subFiles[0],
                5: subFiles[0]
              },
              sharpImage: subFiles[0]
            });
          }
        } catch (subErr) {
          console.warn('[WallpaperScan] Could not read subfolder:', fullPath, subErr.message);
        }
      } else if (validExts.has(path.extname(item).toLowerCase())) {
        const movieTitle = path.basename(item, path.extname(item)).replace(/_/g, ' ');
        rounds.push({
          movieTitle,
          stages: {
            1: fullPath,
            2: fullPath,
            3: fullPath,
            4: fullPath,
            5: fullPath
          },
          sharpImage: fullPath
        });
      }
    }

    // Fallback: If no rounds found at top level, perform a deep walk to find all images
    if (rounds.length === 0) {
      function deepWalk(dir) {
        let entries = [];
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
        for (const ent of entries) {
          if (ent.name.startsWith('.')) continue;
          const p = path.join(dir, ent.name);
          if (ent.isDirectory()) {
            deepWalk(p);
          } else if (ent.isFile() && validExts.has(path.extname(ent.name).toLowerCase())) {
            const movieTitle = path.basename(ent.name, path.extname(ent.name)).replace(/_/g, ' ');
            rounds.push({
              movieTitle,
              stages: { 1: p, 2: p, 3: p, 4: p, 5: p },
              sharpImage: p
            });
          }
        }
      }
      deepWalk(folderPath);
    }
  } catch (err) {
    return { success: false, error: err.message };
  }

  return {
    success: true,
    count: rounds.length,
    rounds
  };
}

module.exports = {
  cleanMetadata,
  censorText,
  calculateWallpaperPoints,
  getWallpaperStage,
  scanAudioFolder,
  extractAudioTags,
  scanWallpaperFolder
};
