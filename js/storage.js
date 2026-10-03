/**
 * Big Eyes, Small Mouth (BESM) 4th Edition - Storage & Persistence
 */

const STORAGE_KEYS = {
  CHARACTERS: "besm4e_characters_v1",
  ACTIVE_ID: "besm4e_active_char_id_v1",
  THEME: "besm4e_color_theme"
};

const BESM4EStorage = {
  getRawList() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load characters from localStorage:", e);
      return [];
    }
  },

  saveRawList(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error("Failed to save characters to localStorage:", e);
      return false;
    }
  },

  getCharacterSummaries() {
    const list = this.getRawList();
    return list.map(c => ({
      id: c.id,
      name: c.name || "Untitled Character",
      concept: c.concept || "No concept specified",
      tier: c.tier || "heroic",
      updatedAt: c.updatedAt || c.createdAt || new Date().toISOString()
    }));
  },

  loadCharacter(id) {
    const list = this.getRawList();
    const found = list.find(c => c.id === id);
    if (found) {
      return new BESM4ECharacter(found);
    }
    return null;
  },

  saveCharacter(charInstance) {
    if (!charInstance || !charInstance.id) return false;
    charInstance.updatedAt = new Date().toISOString();
    const json = charInstance.toJSON();

    const list = this.getRawList();
    const index = list.findIndex(c => c.id === charInstance.id);
    if (index >= 0) {
      list[index] = json;
    } else {
      list.push(json);
    }

    this.saveRawList(list);
    this.setActiveId(charInstance.id);
    return true;
  },

  deleteCharacter(id) {
    let list = this.getRawList();
    list = list.filter(c => c.id !== id);
    this.saveRawList(list);

    if (this.getActiveId() === id) {
      const newActive = list.length > 0 ? list[0].id : null;
      this.setActiveId(newActive);
    }
  },

  getActiveId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  },

  setActiveId(id) {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  },

  /**
   * Load active character or initialize a clean blank character
   */
  getActiveCharacter() {
    const activeId = this.getActiveId();
    if (activeId) {
      const char = this.loadCharacter(activeId);
      if (char) return char;
    }

    const list = this.getRawList();
    if (list.length > 0) {
      this.setActiveId(list[0].id);
      return new BESM4ECharacter(list[0]);
    }

    // Clean blank character
    const newChar = new BESM4ECharacter({
      name: "",
      player: "",
      campaign: "",
      concept: "",
      tier: "heroic", // Heroic 75 CP is the BESM 4E "sweet spot"
      customPointBudget: 75,
      stats: { body: 0, mind: 0, soul: 0 },
      attributes: [],
      skillGroups: [],
      defects: [],
      weapons: [],
      gear: "",
      backstory: "",
      appearance: "",
      alliesEnemies: "",
      earnedXP: 0
    });
    this.saveCharacter(newChar);
    return newChar;
  },

  downloadJSON(charInstance) {
    const jsonStr = JSON.stringify(charInstance.toJSON(), null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (charInstance.name || "character").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    a.href = url;
    a.download = `${safeName}_besm4e.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  generateMarkdown(charInstance) {
    const derived = charInstance.getDerived();
    const points = charInstance.getPointBreakdown();

    let md = `# ${charInstance.name || "Untitled Character"}\n`;
    md += `**Concept:** ${charInstance.concept || "N/A"} | **Power Level:** ${charInstance.tier.toUpperCase()} (${points.totalBudget} CP Budget)\n`;
    if (charInstance.player || charInstance.campaign) {
      md += `**Player:** ${charInstance.player || "N/A"} | **Campaign:** ${charInstance.campaign || "N/A"}\n`;
    }
    md += `\n---\n\n`;

    md += `### Core Stats (Points Spent: ${points.stats.total} CP)\n`;
    md += `- **Body:** ${charInstance.stats.body} (${points.stats.body} CP)\n`;
    md += `- **Mind:** ${charInstance.stats.mind} (${points.stats.mind} CP)\n`;
    md += `- **Soul:** ${charInstance.stats.soul} (${points.stats.soul} CP)\n\n`;

    md += `### Derived Combat & Vital Values\n`;
    md += `- **Combat Value (CV):** ${derived.baseCV}\n`;
    md += `- **Attack Combat Value (ACV):** ${derived.acv}\n`;
    md += `- **Defence Combat Value (DCV):** ${derived.dcv}\n`;
    md += `- **Health Points (HP):** ${charInstance.currentHealth} / ${derived.maxHealth}\n`;
    md += `- **Energy Points (EP):** ${charInstance.currentEnergy} / ${derived.maxEnergy}\n`;
    md += `- **Damage Multiplier (DM):** ${derived.damageMultiplier} (Melee/Muscle: ${derived.meleeDamageMultiplier})\n`;
    md += `- **Armour Rating (AR):** ${derived.armorRating}\n`;
    md += `- **Shock Threshold:** ${derived.shockThreshold}\n\n`;

    md += `### Attributes (${points.attributesTotal} CP)\n`;
    if (charInstance.attributes.length === 0) {
      md += `*None*\n`;
    } else {
      charInstance.attributes.forEach(a => {
        if (a.isContainer) {
          const cpInfo = charInstance.getContainerPoints(a);
          let costTag = "";
          if (a.containerType === "item" || a.id.startsWith("item")) {
            costTag = `[${cpInfo.effectiveCharacterCost} CP | Contained: ${cpInfo.netContainedPoints} CP (1/2 cost applied)]`;
          } else if (a.containerType === "companion" || a.containerType === "alternate_form") {
            costTag = `[${cpInfo.effectiveCharacterCost} CP | Budget: ${cpInfo.budgetAllowance} CP (Spent: ${cpInfo.netContainedPoints} CP, Left: ${cpInfo.remainingBudget} CP)]`;
          } else {
            costTag = `[${cpInfo.effectiveCharacterCost} CP]`;
          }

          md += `- **${a.name} (Level ${a.level} Container):** ${a.customDesc || ""} ${costTag}\n`;

          // Container Stats
          if (a.containerStats && (a.containerStats.body > 0 || a.containerStats.mind > 0 || a.containerStats.soul > 0)) {
            md += `  - *Stats:* Body ${a.containerStats.body}, Mind ${a.containerStats.mind}, Soul ${a.containerStats.soul} (${cpInfo.statsCost} CP)\n`;
          }

          // Container Sub-Traits
          const traits = a.containerTraits || {};
          (traits.attributes || []).forEach(ca => {
            md += `  - *Attribute:* ${ca.name} (Level ${ca.level}) [${ca.level * ca.costPerLevel} CP]\n`;
          });
          (traits.skillGroups || []).forEach(cs => {
            md += `  - *Skill Group:* ${cs.name} Group (Level ${cs.level}) [${cs.level * cs.costPerLevel} CP]\n`;
          });
          (traits.defects || []).forEach(cd => {
            md += `  - *Defect:* ${cd.name} (Rank ${cd.rank}) [${cd.rank * cd.refundPerRank} CP refund]\n`;
          });
          (traits.weapons || []).forEach(cw => {
            md += `  - *Weapon:* ${cw.name} (Level ${cw.level}) | Range: ${cw.range} | Enhancements: ${cw.enhancements}\n`;
          });
        } else {
          md += `- **${a.name} (Level ${a.level}):** ${a.customDesc || "N/A"} [${a.level * a.costPerLevel} CP]\n`;
        }
      });
    }
    md += `\n`;

    md += `### Skill Groups (${points.skillGroupsTotal} CP)\n`;
    if (charInstance.skillGroups.length === 0) {
      md += `*None*\n`;
    } else {
      charInstance.skillGroups.forEach(s => {
        md += `- **${s.name} Group (Level ${s.level}):** (+${s.level} to skill rolls) [${s.level * s.costPerLevel} CP]\n`;
      });
    }
    md += `\n`;

    md += `### Defects (+${points.defectsRefund} CP Refund)\n`;
    if (charInstance.defects.length === 0) {
      md += `*None*\n`;
    } else {
      charInstance.defects.forEach(d => {
        const refund = d.rank * d.refundPerRank;
        md += `- **${d.name} (Rank ${d.rank}):** ${d.customDesc || "N/A"} [${refund} CP refund]\n`;
      });
    }
    md += `\n`;

    const allWeapons = charInstance.getAllWeapons ? charInstance.getAllWeapons() : charInstance.weapons;
    if (allWeapons.length > 0) {
      md += `### Weapons & Attacks\n`;
      allWeapons.forEach(w => {
        const isMelee = (w.range || "").toLowerCase().includes("melee");
        const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
        const dmg = w.level * dm;
        const sourceTag = w.containerName ? ` (from ${w.containerName})` : "";
        md += `- **${w.name} (Level ${w.level}${sourceTag}):** Base Damage ${dmg} (${w.level} × ${dm} DM) | Range: ${w.range} | Enhancements: ${w.enhancements} | Limiters: ${w.limiters}\n`;
      });
      md += `\n`;
    }

    if (charInstance.gear) {
      md += `### Equipment & Possessions\n${charInstance.gear}\n\n`;
    }

    if (charInstance.backstory) {
      md += `### Background\n${charInstance.backstory}\n\n`;
    }

    md += `---\n*Generated by Big Eyes, Small Mouth 4th Edition Character Architect*\n`;
    return md;
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
};

// Backwards compatibility alias
const TriStatStorage = BESM4EStorage;

if (typeof module !== "undefined" && module.exports) {
  module.exports = BESM4EStorage;
  global.BESM4EStorage = BESM4EStorage;
  global.TriStatStorage = BESM4EStorage;
}
