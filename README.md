<div align="center">

# 🎮 MannisBox — Discord Musik-Quiz & Buzzer Master (v1.1.0)

### *Die ultimative Desktop-App für Musik-Quizze & Buzzer-Runden auf Discord!*

<br>

[![Electron](https://img.shields.io/badge/Electron-34.5.8-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.18.0-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Version](https://img.shields.io/badge/Release-v1.1.0-10B981?style=for-the-badge)](https://github.com/TentixTV/MannisBuzzerBot/releases)
[![Idea](https://img.shields.io/badge/Idee-ThisManniGuy-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![Author](https://img.shields.io/badge/Entwickler-TentixTV-8B5CF6?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TentixTV)
[![License: MIT](https://img.shields.io/badge/Lizenz-MIT-F59E0B?style=for-the-badge)](LICENSE)

<br>

> 💡 **Idee & Konzept:** **ThisManniGuy** (Discord)  
> 🛠️ **Entwicklung:** **TentixTV** im Auftrag von **ThisManniGuy**

---

</div>

## 🌟 Highlights & Features in v1.1.0

- 🕹️ **Scribble Darkmode UI**: Inspiriert vom Skribbl-Design mit fetten 3D-Arcade-Buttons, animierten Badges und responsivem 3-Spalten-Layout.
- 🔔 **Golden Bell & Arena**: Wunderschön animierte Glocke mit harmonischer Schwingung und sanftem Ticking.
- ⏳ **Animierter 3-2-1 Center Countdown**:
  - Nach jeder Punktevergabe schützt ein Doppel-Klick-Schutz vor versehentlichen Mehrfacheingaben.
  - Ein animierter `3.. 2.. 1..`-Countdown zählt herunter.
  - Bei falschen Antworten rutscht der nächste Spieler automatisch hoch. Bei richtigen Antworten wird die Queue zurückgesetzt.
- 🎧 **Mitspieler im Voice-Kanal**:
  - Live-Übersicht aller Personen im Voice-Kanal mit Avatar und 1-Klick-Bann/Entbann-Funktion.
- 🎮 **Discord Rich Presence (Status)**:
  - Zeigt im Discord live: `Spielt SongQuiz 🎵` und `👥 X Mitspieler`.
- ✏️ **Slide-Down Ranglisten-Editor**:
  - Beim Überfahren eines Spielers klappt sanft eine Aktionsleiste mit `[-1 Punkt]`, `[+1 Punkt]` und `[🚫 Sperren]` auf — ohne Verschieben oder Abschneiden!
- 🏁 **Deluxe Quiz-Endstand & Podium**:
  - Button **„Runde beenden & Ranking“** postet ein Endstand-Embed mit 🥇 1. Platz Champion, 🥈 2. Platz, 🥉 3. Platz und vollständiger Rangliste aller Teilnehmer.
- 👑 **Host-Erkennung**:
  - Zeigt in der App und in Discord dynamisch `@ID (Name)` an.

---

## 🏆 Spielregeln & Punktesystem

| Aktion | Punkte | Sound-Effekt | Ablauf |
| :--- | :---: | :--- | :--- |
| ❌ **Falsch** *(1. Versuch)* | **-1 Punkt** | Epischer Fail-Horn | 3s Countdown ➔ Nächster Spieler rutscht hoch |
| ❌ **Falsch** *(Folgefehler)* | **-2 Punkte** | Epischer Fail-Horn | 3s Countdown ➔ Nächster Spieler rutscht hoch |
| ⏭️ **Weiter / Überspringen** | **0 Punkte** | Keiner | Sofort nächster Spieler |
| ✅ **Richtig** | **+3 Punkte** | Kristall-Chime | Queue geleert ➔ 3s Countdown |
| 🌟 **100% Vollständig** *(Song & Interpret)* | **+4 Punkte** | Sieges-Fanfare | Queue geleert ➔ 3s Countdown |

---

## 📥 Direkter Download & Schnellstart

### 🎮 Fertige App für Windows herunterladen (Keine Installation nötig)
Lade dir einfach das fertige Windows-Paket herunter, entpacke es und starte direkt die **`MannisBox.exe`**:

[![Download Windows ZIP](https://img.shields.io/badge/📦_Download-MannisBox_v1.1.0_(Windows_x64)-2563EB?style=for-the-badge&logo=windows)](https://github.com/TentixTV/MannisBuzzerBot/releases/tag/v1.1.0)

1. Lade dir die neueste Version aus den **[GitHub Releases](https://github.com/TentixTV/MannisBuzzerBot/releases)** herunter.
2. Entpacke das `.zip`-Archiv auf deinem PC.
3. Starte die **`MannisBox.exe`** mit einem Doppelklick — der Bot verbindet sich automatisch!

---

### 💻 Für Entwickler: Aus dem Quellcode starten
```bash
# 1. Repository klonen
git clone https://github.com/TentixTV/MannisBuzzerBot.git
cd MannisBuzzerBot

# 2. Abhängigkeiten installieren
npm install

# 3. App starten
npm start
```

---

## 🛠️ Build-Pipeline (Eigene `.exe` & `.zip` erstellen)

```bash
npm run build
```

Ausgabe-Dateien:
- 📁 **`dist/MannisBox-win32-x64/MannisBox.exe`** (Direkt starten)
- 📦 **`dist/MannisBox-Windows-x64.zip`** (Zum Verschicken)

---

## 📜 Danksagung & Lizenz

- **Konzept & Idee:** **ThisManniGuy** (Discord)
- **Entwicklung:** **[TentixTV](https://github.com/TentixTV)** im Auftrag von **ThisManniGuy**.
- **Lizenz:** Lizenziert unter der **MIT License** — siehe [LICENSE](LICENSE) für Details.
