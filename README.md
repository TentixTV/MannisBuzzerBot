<div align="center">

# 🎮 MannisBox — Discord Musik-Quiz, Hitster & Wallpaper Master (v4.8.025)

### *Die ultimative High-End Desktop-App & Discord-Buzzer-Bot Suite*

<br>

[![Electron](https://img.shields.io/badge/Electron-34.5.8-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.18.0-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Version](https://img.shields.io/badge/Release-v4.8.025-10B981?style=for-the-badge)](https://github.com/TentixTV/MannisBuzzerBot/releases/tag/v4.8.025)
[![Idee](https://img.shields.io/badge/Idee-ThisManniGuy-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![Author](https://img.shields.io/badge/Entwickler-TentixTV-8B5CF6?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TentixTV)
[![License: MIT](https://img.shields.io/badge/Lizenz-MIT-F59E0B?style=for-the-badge)](LICENSE)

<br>

> 💡 **Idee & Konzept:** **ThisManniGuy** (Discord)  
> 🛠️ **Entwicklung:** **TentixTV** im Auftrag von **ThisManniGuy**

---

### ⚡ Sofort-Download / Instant Download (v4.8.025)

Keine Installation nötig! Einfach herunterladen, entpacken und sofort loslegen:

[![Direct Download ZIP](https://img.shields.io/badge/📦_Instant_Download-MannisBox_v4.8.025_(ZIP)-2563EB?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/TentixTV/MannisBuzzerBot/releases/download/v4.8.025/MannisBox-Windows-x64.zip)
[![Direct Download RAR](https://img.shields.io/badge/🗜️_Instant_Download-MannisBox_v4.8.025_(RAR)-7C3AED?style=for-the-badge&logo=winrar&logoColor=white)](https://github.com/TentixTV/MannisBuzzerBot/releases/download/v4.8.025/MannisBox-Windows-x64.rar)

🔗 **Alle Versionen & Assets:** [GitHub Releases Overview](https://github.com/TentixTV/MannisBuzzerBot/releases)

---

</div>

## 🌟 Die 3 Deluxe-Spielmodi

### 🎵 1. Songquiz
- **Intelligente Ordner-Erkennung**: Erkennt Künstler, Titel & Metadaten vollautomatisch aus Tags, Dateinamen oder Excel-Copy-Paste.
- **Echtzeit-Suche (Live Autocomplete)**: Tippe einfach im Regie-Panel und finde Tracks 1:1 in Millisekunden.
- **10-Sekunden Antwort-Timer**: Nach dem Buzzern läuft ein präziser 10s Countdown für den aktiven Spieler ab. Läuft er ab, entscheidet der Host über Freigabe oder Rundenabbruch.
- **Integrierter Audio-Streamer**: Lokaler Zero-Latency Audio-Player mit Waveform-Visualizer & OBS-Browser-Source-Unterstützung.

### 📻 2. Hitster (Zeitstrahl & Dispute-Chips)
- **Automatischer Tag-Scanner**: Liest Erscheinungsjahre direkt aus MP3-Tags (ID3v2, Release Date, Lyrics & Comments) oder manueller Regie.
- **3D Flippable Kassette / Karte**: Mit animiertem 3D-Kartenflip zum Aufdecken des Geheimjahres.
- **🪙 Spielchips & Anfechtungs-System**:
  - Jeder Spieler besitzt 3 Hitster-Chips (`🪙`).
  - Wenn ein Spieler eine Karte anfechten möchte ("Chip werfen"), registriert der Bot sofort wer den Chip zuerst geworfen hat — absolut manipulationssicher!
  - Chips können in der Regie per `[+]` / `[-]` flexibel angepasst werden.
- **10-Karten Meilenstein**: Spieler sammeln erratene Hits auf ihren individuellen Regalen bis zum 10-Karten-Sieg!

### 🎬 3. Wallpaperquiz (Progressive Schärfestufen)
- **Dynamisches Pixelations-Rendering**: Bot und OBS-Stream zeigen Bilder von extrem verpixelt (Stufe 1) über 4 Zwischenstufen bis gestochen scharf (Stufe 5).
- **Zeitabhängiges Punktesystem (1 bis 4 Punkte)**:
  - ⏱️ Erraten in **0-10s**: **4 Punkte**
  - ⏱️ Erraten in **10-20s**: **3 Punkte**
  - ⏱️ Erraten in **20-30s**: **2 Punkte**
  - ⏱️ Erraten in **30-40s+**: **1 Punkt**
- **Automatischer Countdown-Stopp**: Sobald ein Spieler buzzert, wird der Runden-Countdown sofort pausiert, sodass niemand Zeit verliert während er antwortet!

---

## 🚀 Neue Deluxe-Features in v4.8.024

- ✏️ **Interaktiver Punkte-Editor ("Links unten auf die Punkte")**:
  - Fahre mit der Maus über Mannis Punkte (`#lblHostScore`) links unten in der Status-Card oder über beliebige Spieler-Pills — sie leuchten und vergrößern sich mit sanftem Hover.
  - Ein Klick öffnet ein animiert bouncendes Pop-up mit Schnellwahltasten `[-5]`, `[-1]`, `[+1]`, `[+5]` sowie direkter Tastatureingabe (`Enter` zum Speichern).
- 🔍 **Ordner Live-Suche**:
  - Song-, Hitster- und Wallpaper-Regie besitzen jeweils eine blitzschnelle Autocomplete-Suche, um gezielt Songs oder Filme auszuwählen.
- 🪟 **Custom Frameless Window**:
  - Vollwertige eigene Titelleiste mit Minimieren, Maximieren/Wiederherstellen und Schließen.
- 🛡️ **Offline- & Resilienz-Engine**:
  - Countdown, Buzzer und Regie-Funktionen starten zuverlässig auch im lokalen Testbetrieb ohne bestehende Discord-Verbindung.
- 🎨 **Reines UI-Design**:
  - Störende Textbeschriftungen auf dem 3D-Buzzer und unpassende Untertitel wurden vollständig entfernt.
  - Kompaktes Scroll-Layout ohne unschöne Panel-Überläufe.

---

## 🏆 Spielregeln & Punktesystem

| Modus | Richtige Antwort | Falsche Antwort | Ablauf |
| :--- | :---: | :---: | :--- |
| 🎵 **Songquiz** | **+3 Punkte** *(+4 Pkt komplett)* | **-1 Pkt** *(Wdh: -2 Pkt)* | 10s Antwort-Timer ➔ Freigabe / Nächster Spieler |
| 📻 **Hitster** | **+1 Karte / Punkt** | **0 Punkte** | Karte wird platziert, Chip-Anfechtung möglich |
| 🎬 **Wallpaper** | **1 - 4 Punkte** *(nach Speed)* | **-1 Pkt** | Buzzer pausiert Countdown sofort |
| 🔥 **Boost x2** | **Doppelte Punkte!** | Regulär | Epische Partikel-Animation in der Arena |

---

## 📥 Schnellstart für Anwender

1. Lade das Windows-Paket herunter: **[MannisBox-Windows-x64.zip](https://github.com/TentixTV/MannisBuzzerBot/releases/download/v4.8.024/MannisBox-Windows-x64.zip)**
2. Entpacke das Archiv in einen beliebigen Ordner.
3. Starte **`MannisBox.exe`**.
4. Trage beim ersten Start deinen Discord-Bot-Token ein (unter ⚙️ Einstellungen) — fertig!

---

## 🛠️ Für Entwickler

```bash
# Repository klonen
git clone https://github.com/TentixTV/MannisBuzzerBot.git
cd MannisBuzzerBot

# Abhängigkeiten installieren
npm install

# App im Entwicklungsmodus starten
npm start

# Standalone Windows .exe, .zip & .rar kompilieren
npm run build
```

---

## 📜 Lizenz & Credits

- **Konzept & Vision:** **ThisManniGuy**
- **Entwicklung:** **[TentixTV](https://github.com/TentixTV)**
- **Lizenz:** [MIT License](LICENSE)
