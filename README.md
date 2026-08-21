# 🎮 MannisBox — Discord Musik-Quiz & Buzzer Master

<div align="center">

![MannisBox Banner](App.png)

### **Die ultimative Desktop-App für Musik-Quizze & Buzzer-Runden auf Discord!**

[![Electron](https://img.shields.io/badge/Electron-v34.5.8-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14.18.0-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Author](https://img.shields.io/badge/Author-TentixTV-8b5cf6?style=for-the-badge)](https://github.com/TentixTV)

</div>

---

## 🌟 Highlights & Features

- 🕹️ **Scribble Darkmode UI**: Inspiriert vom Skribbl-Design mit fetten 3D-Arcade-Buttons, animierten Badges und responsivem 3-Spalten-Layout.
- ⚡ **Lokaler Bot-Lebenszyklus**: Der Discord-Bot läuft direkt in der Desktop-App. App auf ➔ Bot online. App zu ➔ Bot trennt Voice und geht offline.
- 🔔 **Interaktive Buzzer-Arena**:
  - Live-Erfassung aller Klicks im Discord mit **Millisekunden-Reihenfolge** (1., 2., 3., ...).
  - Dynamische **Glocken-Animation mit schwingendem Pendelklöppel**.
  - **Queue-Management**: Klicke auf beliebige Spieler in der Warteschlange, um sie direkt dranzunehmen.
- 🔊 **Epische Sound-Engine**:
  - 🔔 **Buzzer**: Wuchtiger Sub-Bass-Punch mit reichem Sägezahn-Schall.
  - ❌ **Falsch**: Dramatischer zweistufiger Fail-Horn-Sound.
  - ✅ **Richtig**: Kristallklarer Glocken-Akkord (C5-E5-G5-C6) mit Glitzer-Harmonien.
  - 🌟 **100% Perfekt**: Feierliche Sieges-Fanfare für volle Song- & Interpretennennung.
  - **Lokale Lautsprecher-Vorschau**: Alle Sounds lassen sich direkt in der App über die PC-Lautsprecher testen.
- 👑 **Spielleiter-Schutz & Host-System**:
  - Feste Host-User-ID (`@Host` wird dynamisch im Discord und in der App angezeigt).
  - Spielleiter kann nicht versehentlich mitbuzzern und erhält keine Punkte.
- ⏳ **Intelligenter 3-Sekunden-Cooldown**:
  - Nach Vergabe von Punkten wird der Zug abgeschlossen und der Buzzer nach 3 Sekunden automatisch wieder freigegeben.

---

## 🏆 Spielregeln & Punktesystem

| Aktion | Punkte | Sound-Effekt | Ablauf |
| :--- | :---: | :--- | :--- |
| ❌ **Falsch** *(1. Versuch)* | **-1 Punkt** | Epischer Fail-Horn | 3s Cooldown ➔ Nächster Spieler |
| ❌ **Falsch** *(Folgefehler)* | **-2 Punkte** | Epischer Fail-Horn | 3s Cooldown ➔ Nächster Spieler |
| ⏭️ **Weiter / Überspringen** | **0 Punkte** | Keiner | Sofort nächster Spieler |
| ✅ **Richtig** | **+3 Punkte** | Kristall-Chime | Runde gewonnen ➔ 3s Cooldown |
| 🌟 **100% Vollständig** *(Song & Interpret)* | **+4 Punkte** | Sieges-Fanfare | Runde gewonnen ➔ 3s Cooldown |

---

## 🚀 Schnellstart & Installation

### Option 1: Standalone `.exe` starten (Kein Node.js nötig)
1. Lade dir die `MannisBox.exe` (oder das ZIP-Archiv) aus den [Releases](https://github.com/TentixTV/MannisBuzzerBot/releases) herunter.
2. Doppelklicke auf **`MannisBox.exe`** — fertig!

### Option 2: Aus dem Quellcode starten
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

Mit einem einzigen Befehl erstellst du sowohl die lauffähige Standalone-App im `dist/`-Ordner als auch das fertige `.zip`-Archiv zum Verschicken:

```bash
npm run build
```

Ausgabe-Dateien:
- 📁 **`dist/MannisBox-win32-x64/MannisBox.exe`** (Direkt starten)
- 📦 **`dist/MannisBox-Windows-x64.zip`** (Zum Verschicken)

---

## ⚙️ Einstellungen & Ersteinrichtung

1. **Bot einladen**: Klicke in der App auf **„🔗 Bot auf Discord einladen“**, um ihn zu deinem Server hinzuzufügen.
2. **Kanäle wählen**: In den Einstellungen (⚙️) deinen Server, den **Buzzer-Textkanal** und den **Voice-Kanal** auswählen.
3. **Spielleiter festlegen**: Deine Discord User-ID eintragen.
4. **Auf „Speichern & Verbinden“ klicken** — Viel Spaß beim Quizzen! 🎵

---

## 📜 Lizenz & Autor

Entwickelt mit ❤️ von **[TentixTV](https://github.com/TentixTV)**.  
Lizenziert unter der **MIT License** — siehe [LICENSE](LICENSE) für Details.
