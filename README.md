# BESM 4E: Character Architect & Companion

[![Live Web Application](https://img.shields.io/badge/▶%20RUN%20APP%20ONLINE-Live%20on%20GitHub%20Pages-success?style=for-the-badge&logo=googlechrome)](https://captainload.github.io/besm-4e-character-editor/)

> ### 🌐 [**▶ Click Here to Run the Application in Your Browser**](https://captainload.github.io/besm-4e-character-editor/)
> **Direct Live Link:** [https://captainload.github.io/besm-4e-character-editor/](https://captainload.github.io/besm-4e-character-editor/)
> 
> *Runs instantly in any browser. No installation, downloads, or local setup required!*
> 
> *(Note: The `github.com` page is the source code repository showing project files. The link above runs the actual live program via `github.io`.)*

---

## 🚀 How to Run in Any Desktop Web Browser

The application is completely self-contained with **zero external dependencies** and works **100% offline**. You can run it via either of the following two options:

### Option 1: Direct File Opening (No Installation Required)
Simply double-click:
```
index.html
```
or open your browser (Chrome, Edge, Firefox, Brave, Safari) and navigate to:
```
file:///H:/My Drive/RPG development/BESM 4E/index.html
```

### Option 2: Local HTTP Server (One-Click Launcher)
If you prefer running through `http://localhost:3000`:
1. Double-click **`start.bat`**, **OR**
2. In your terminal, run:
   ```bash
   node server.js
   ```
3. Open your browser to `http://localhost:3000`.

---

## 🌟 Key Features & BESM 4E Implementation

### 1. 🛠️ Character Builder & Clean Blank Start
- **Clean Blank Sheet**: Every new character starts completely blank with no pre-loaded or pre-made character template (as requested).
- **Table 01: Character Power Levels**:
  - *Sub-Human* (0–24 CP, default 20) — Young teens, children, small animals, pixies
  - *Human* (25–49 CP, default 35) — High school students, detectives, soldiers
  - *Adventurer* (50–74 CP, default 60) — Valiant action heroes, martial artists
  - *Heroic* (75–99 CP, default 75) — The BESM 4E "Sweet Spot": Peak humans, magical girls, mecha pilots
  - *Mythical* (100–149 CP, default 125) — Vampires, cyborgs, demons, elite sorcerers
  - *Superhuman* (150–199 CP, default 175) — Arch-mages, elder vampires, dragons
  - *Superpowered* (200–249 CP, default 200) — Demigods, towering mecha masters, world-shakers
  - *Godlike* (250+ CP, default 250) — Forces of nature with cosmic power
  - *Custom* — Custom Game Master point allowance

### 2. ⚡ The Three Core Stats & Accurate Cost Scaling
- **Body (BOD)**: Physical strength, health, stamina, quickness, manual dexterity, endurance.
- **Mind (MND)**: Intellectual capability, critical thinking, wit, perception, memory, deduction.
- **Soul (SOL)**: Luck, willpower, spirit, presence, empathy, life force, determination.
- **Non-Linear Stat Costing (BESM 4E Rules)**:
  - Values **1 to 12** cost **2 Character Points (CP)** per Stat point.
  - Values **13+** cost **4 Character Points (CP)** per Stat point.
- **Human Baseline**: Normal adult human average is **4** in each stat (costing 24 CP total). Includes a 1-click **"Human Baseline (4/4/4)"** button.

### 3. 🎯 Derived Values & Combat Mathematics (Chapter 8)
- **Combat Value (CV)**: `⌊(Body + Mind + Soul) / 3⌋`
- **Attack Combat Value (ACV)**: `CV + Attack Mastery Level` (minus Inept Attack)
- **Defence Combat Value (DCV)**: `CV + Defence Mastery Level` (minus Inept Defence)
- **Health Points (HP)**: `(Body + Soul) × 5 + (Tough Level × 10)` (minus Fragile)
- **Energy Points (EP)**: `(Mind + Soul) × 5 + (Energised Level × 10)`
- **Damage Multiplier (DM)**: `Base 5 + Massive Damage Level`
- **Melee Damage Multiplier**: `DM + Superstrength Level`
- **Armour Rating (AR)**: `(Armour Level × 5) + (Force Field Level × 10)`
- **Shock Threshold**: `Max(10, ⌊HP / 5⌋)` — Single-hit damage staggering threshold.

### 4. 📚 Catalogs: Attributes, Skill Groups & Defects
- **Table 07: Attributes & Powers**: Full catalog with official point costs (1 to 10 CP/level) categorized into Combat, Defence, Physical, Mental, Supernatural, and Social.
- **Skill Groups (BESM 4E p. 120-122)**:
  - *Background Skill Groups* (1 CP / level): Academic, Artistic, Domestic, Occupation.
  - *Field Skill Groups* (2 CP / level): Business, Social, Street, Technical.
  - *Action Skill Groups* (3 CP / level): Adventuring, Detective, Military, Scientific.
- **Table 14: Defects & Hindrances**:
  - *Lesser Defects*: 1 CP refund per Rank (-1 / -2 / -3 CP)
  - *Greater Defects*: 2 CP refund per Rank (-2 / -4 / -6 CP)
  - *Serious Defects*: 3 CP refund per Rank (-3 / -6 / -9 CP)
- **Weapons & Attack Builder**: Base Damage = `Weapon Level × Damage Multiplier` (or Melee DM), with enhancements (Armour-Piercing, Area, Accurate, Stun) and limiters (Charges, Melee, Concentration).

### 5. 📈 Character Updating & Advancement (XP Tracking)
- **XP Pool Management**: Award session and milestone XP with descriptions.
- **Instant Upgrades**: XP expands your Character Point pool directly in the builder tab.
- **Audit Changelog**: Timestamped journal of every level-up, point modification, and campaign milestone.

### 6. ⚔️ Live In-Play Tracker & Tactical Companion
- **Health & Energy Bars**: Real-time progress bars with quick damage, heal, and EP spend controls.
- **Armour Absorption Resolver**: Enter incoming damage to automatically absorb via Armour Rating (AR), calculate damage through to Health, and alert if the **Shock Threshold** was exceeded or if incapacitated.
- **Dramatic Feats (EP Burn)**: Burn 10 Energy Points to grant a +1 bonus on any roll (up to Soul Stat limit).
- **Tactical Conditions**: Stunned, Shocked, Prone, Blinded, Bleeding, Restrained, and Concealed toggles.
- **1-Click Rolls**: Immediate roll shortcuts for every Stat check, attack, defence, and trained skill group.

### 7. 🎲 BESM 4E Interactive Dice Roller
- **2d6 Roll-Over System**: `2d6 + Stat/CV vs Target Number (TN)`.
- **Table 16 Target Numbers**:
  - Routine (6), Easy (8), Moderate (10), Challenging (12), Difficult (14), Extreme (16), Heroic (18), Mythical (20).
- **Minor Edge & Major Edge**: Roll 3d6 (or 4d6), keep the **2 highest** dice.
- **Minor Obstacle & Major Obstacle**: Roll 3d6 (or 4d6), keep the **2 lowest** dice.
- **Critical Outcomes**: Detects Natural 12 (**Critical Triumph**) and Natural 2 (**Critical Fumble**).
- **Procedural Dice Audio**: Web Audio API synthesized clicking rattle without external audio files.

### 8. 📜 Tabletop Character Sheet & Print / Export
- **Print / PDF Sheet**: Clean layout formatted for standard printing (`Ctrl+P`).
- **Copy Markdown**: Export sheet directly to Discord, Obsidian, or forum posts.
- **JSON Backup & Share**: Export your characters to `.json` or import files from players and GMs.

---

## 📁 Project Directory Structure

```
H:\My Drive\RPG development\BESM 4E\
├── index.html          # Main application interface
├── start.bat           # One-click Windows desktop launcher
├── server.js           # Lightweight local Node.js HTTP server
├── test_suite.js       # 10 automated BESM 4E rules & calculation tests
├── README.md           # Documentation & user manual
├── css/
│   └── app.css         # Styling, dark/light themes, responsive layout, print sheet
└── js/
    ├── rules.js        # BESM 4E rules catalog (Table 01, 07, 14, 16, Skill Groups)
    ├── character.js    # BESM4ECharacter data model, derived stats, point accounting
    ├── storage.js      # BESM4EStorage multi-character persistence & export/import
    ├── roller.js       # BESM4EDiceRoller (2d6 roll-over, Edges, Obstacles, Feats)
    └── app.js          # Controller connecting UI, builder, sheet, play tracker, modals
```

---

*Based on Big Eyes, Small Mouth 4th Edition (BESM 4E) created by Mark MacKinnon and published by Dyskami Publishing Company / White Wolf.*
