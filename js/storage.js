/**
 * Big Eyes, Small Mouth (BESM) 4th Edition - Storage & Persistence
 */

const STORAGE_KEYS = {
  CHARACTERS: "besm4e_characters_v1",
  ACTIVE_ID: "besm4e_active_char_id_v1",
  THEME: "besm4e_color_theme",
  DEFAULT_FOLDER: "besm4e_default_folder_name"
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
      skills: [],
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

  DEFAULT_EXTENSION: ".besm4e",
  _defaultFolderHandle: null,
  _currentFileHandle: null,
  _currentFileName: null,

  getCurrentFileName() {
    return this._currentFileName || "";
  },

  hasCurrentFileHandle() {
    return Boolean(this._currentFileHandle);
  },

  clearCurrentFileHandle() {
    this._currentFileHandle = null;
    this._currentFileName = null;
  },

  setCurrentFileHandle(handle, filename = "") {
    this._currentFileHandle = handle || null;
    this._currentFileName = filename || (handle && handle.name) || "";
  },

  getDefaultFolderName() {
    try {
      return localStorage.getItem(STORAGE_KEYS.DEFAULT_FOLDER) || "";
    } catch (e) {
      return "";
    }
  },

  setDefaultFolderName(name) {
    try {
      if (name) {
        localStorage.setItem(STORAGE_KEYS.DEFAULT_FOLDER, name);
      } else {
        localStorage.removeItem(STORAGE_KEYS.DEFAULT_FOLDER);
      }
    } catch (e) {}
  },

  clearDefaultFolder() {
    this._defaultFolderHandle = null;
    this.setDefaultFolderName("");
    this._persistDirHandle(null);
  },

  async _openDB() {
    if (typeof window === "undefined" || !window.indexedDB) return null;
    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open("besm4e_storage_db", 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore("settings");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  async _persistDirHandle(handle) {
    const db = await this._openDB();
    if (!db) return;
    try {
      const tx = db.transaction("settings", "readwrite");
      if (handle) {
        tx.objectStore("settings").put(handle, "defaultSaveDir");
      } else {
        tx.objectStore("settings").delete("defaultSaveDir");
      }
    } catch (e) {
      console.warn("Could not persist directory handle:", e);
    }
  },

  async getDefaultFolderHandle() {
    if (this._defaultFolderHandle) return this._defaultFolderHandle;
    const db = await this._openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction("settings", "readonly");
        const req = tx.objectStore("settings").get("defaultSaveDir");
        req.onsuccess = async () => {
          const handle = req.result;
          if (handle) {
            this._defaultFolderHandle = handle;
            resolve(handle);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  async selectDefaultSaveFolder() {
    if (typeof window !== "undefined" && window.showDirectoryPicker) {
      try {
        let dirHandle;
        try {
          dirHandle = await window.showDirectoryPicker({
            mode: "readwrite"
          });
        } catch (optErr) {
          dirHandle = await window.showDirectoryPicker();
        }
        this._defaultFolderHandle = dirHandle;
        this.setDefaultFolderName(dirHandle.name);
        await this._persistDirHandle(dirHandle);
        return { success: true, folderName: dirHandle.name, handle: dirHandle };
      } catch (err) {
        if (err.name === "AbortError") return { cancelled: true };
        console.warn("showDirectoryPicker error:", err);
        return { unsupported: true, error: err };
      }
    }
    return { unsupported: true };
  },

  formatSafeFilename(charInstance, ext = ".besm4e") {
    const name = charInstance && charInstance.name ? charInstance.name : "character";
    const clean = name.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "character";
    return `${clean}${ext}`;
  },

  downloadBESM4E(charInstance, customFilename) {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const jsonStr = JSON.stringify(charInstance.toJSON ? charInstance.toJSON() : charInstance, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    let filename = customFilename || this.formatSafeFilename(charInstance, ".besm4e");
    if (!filename.endsWith(".besm4e") && !filename.endsWith(".json")) filename += ".besm4e";
    this._currentFileName = filename;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async saveToFileHandle(handle, charInstance) {
    if (!handle || typeof handle.createWritable !== "function") {
      return { success: false, error: "Invalid file handle" };
    }
    try {
      if (typeof handle.queryPermission === "function") {
        let status = await handle.queryPermission({ mode: "readwrite" });
        if (status !== "granted" && typeof handle.requestPermission === "function") {
          status = await handle.requestPermission({ mode: "readwrite" });
          if (status !== "granted") {
            return { permissionDenied: true };
          }
        }
      }
      const writable = await handle.createWritable();
      const jsonStr = JSON.stringify(charInstance.toJSON ? charInstance.toJSON() : charInstance, null, 2);
      await writable.write(jsonStr);
      await writable.close();
      this.setCurrentFileHandle(handle, handle.name);
      return { success: true, filename: handle.name, direct: true };
    } catch (err) {
      console.warn("Direct save to handle failed:", err);
      return { error: err };
    }
  },

  async saveBESM4EWithPicker(charInstance, customFilename) {
    if (typeof window !== "undefined" && window.showSaveFilePicker) {
      try {
        let suggestedName = customFilename || this.formatSafeFilename(charInstance, ".besm4e");
        if (!suggestedName.endsWith(".besm4e") && !suggestedName.endsWith(".json")) suggestedName += ".besm4e";
        const pickerOptions = {
          suggestedName,
          types: [{
            description: "BESM 4E Character File (*.besm4e)",
            accept: { "application/json": [".besm4e", ".json"] }
          }]
        };
        const dirHandle = await this.getDefaultFolderHandle();
        if (dirHandle) {
          try {
            pickerOptions.startIn = dirHandle;
          } catch (e) {}
        }
        const fileHandle = await window.showSaveFilePicker(pickerOptions);
        const writable = await fileHandle.createWritable();
        const jsonStr = JSON.stringify(charInstance.toJSON ? charInstance.toJSON() : charInstance, null, 2);
        await writable.write(jsonStr);
        await writable.close();
        this.setCurrentFileHandle(fileHandle, fileHandle.name);
        return { success: true, filename: fileHandle.name };
      } catch (err) {
        if (err.name === "AbortError") {
          return { cancelled: true };
        }
        console.warn("showSaveFilePicker failed, falling back to download:", err);
      }
    }
    // Fallback
    this.downloadBESM4E(charInstance, customFilename);
    const fname = customFilename || this.formatSafeFilename(charInstance, ".besm4e");
    return { success: true, fallback: true, filename: fname };
  },

  async saveCurrentFile(charInstance) {
    if (this._currentFileHandle) {
      const res = await this.saveToFileHandle(this._currentFileHandle, charInstance);
      if (res && res.success) {
        return res;
      }
      if (res && res.permissionDenied) {
        return res;
      }
    }
    return await this.saveBESM4EWithPicker(charInstance, this._currentFileName);
  },

  async openBESM4EWithPicker() {
    if (typeof window !== "undefined" && window.showOpenFilePicker) {
      try {
        const pickerOptions = {
          types: [{
            description: "BESM 4E Character File (*.besm4e, *.json)",
            accept: { "application/json": [".besm4e", ".json"] }
          }],
          multiple: false
        };
        const dirHandle = await this.getDefaultFolderHandle();
        if (dirHandle) {
          try {
            pickerOptions.startIn = dirHandle;
          } catch (e) {}
        }
        const [fileHandle] = await window.showOpenFilePicker(pickerOptions);
        const file = await fileHandle.getFile();
        const text = await file.text();
        this.setCurrentFileHandle(fileHandle, file.name);
        return { success: true, text, filename: file.name, handle: fileHandle };
      } catch (err) {
        if (err.name === "AbortError") return { cancelled: true };
        throw err;
      }
    }
    return { unsupported: true };
  },

  parseCharacter(jsonText) {
    const data = JSON.parse(jsonText);
    return new BESM4ECharacter(data);
  },

  downloadJSON(charInstance) {
    this.downloadBESM4E(charInstance);
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

    const cmpTraits = (typeof compareTraitsAlphabetically === "function") 
      ? compareTraitsAlphabetically 
      : (typeof BESM4ECharacter !== "undefined" && BESM4ECharacter.compareTraitsAlphabetically)
        ? BESM4ECharacter.compareTraitsAlphabetically
        : (a, b) => ((a.name || a.id || "").localeCompare(b.name || b.id || ""));

    md += `### Attributes (${points.attributesTotal} CP)\n`;
    if (charInstance.attributes.length === 0) {
      md += `*None*\n`;
    } else {
      const sortedAttrs = charInstance.getSortedAttributes ? charInstance.getSortedAttributes() : [...charInstance.attributes].sort(cmpTraits);
      sortedAttrs.forEach(a => {
        if (a.isContainer) {
          const cpInfo = charInstance.getContainerPoints(a);
          let cType = a.containerType || "item";
          if (cType === "alternate" || a.id === "alternate_form" || (typeof a.id === "string" && a.id.startsWith("alternate_form_")) || a.attributeId === "alternate_form") {
            cType = "alternate_form";
          }
          let costTag = "";
          if (cType === "chassis") {
            costTag = `[${cpInfo.effectiveCharacterCost} CP | Contained: ${cpInfo.netContainedPoints} CP (1/2 cost applied)]`;
          } else if (cType === "item" || a.id.startsWith("item")) {
            costTag = `[${cpInfo.effectiveCharacterCost} CP | Contained: ${cpInfo.netContainedPoints} CP (1/2 cost applied)]`;
          } else if (cType === "companion" || cType === "alternate_form") {
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
          const sortedSubAttrs = [...(traits.attributes || [])].sort(cmpTraits);
          sortedSubAttrs.forEach(ca => {
            let caName = ca.name;
            if (ca.subTrait) caName += ` (${ca.subTrait})`;
            if (ca.detail) caName += ` [${ca.detail}]`;

            if (ca.isContainer) {
              const caCpInfo = charInstance.getContainerPoints(ca);
              md += `  - *Transformed State / Alternate Form:* **${caName}** (Level ${ca.level}) [${ca.level * ca.costPerLevel} CP Contained | Budget: ${caCpInfo.budgetAllowance} CP]\n`;
              if (ca.containerStats && (ca.containerStats.body > 0 || ca.containerStats.mind > 0 || ca.containerStats.soul > 0)) {
                md += `    - *Stats:* Body ${ca.containerStats.body}, Mind ${ca.containerStats.mind}, Soul ${ca.containerStats.soul}\n`;
              }
              const nestedTraits = ca.containerTraits || {};
              const nestedAttrs = [...(nestedTraits.attributes || [])].sort(cmpTraits);
              nestedAttrs.forEach(nca => {
                let ncaName = nca.name;
                if (nca.subTrait) ncaName += ` (${nca.subTrait})`;
                if (nca.detail) ncaName += ` [${nca.detail}]`;
              const ncaCostInfo = (typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.calculateAttributeCost)
                ? BESM4E_RULES.calculateAttributeCost(nca)
                : { totalCost: (nca.level || 1) * (nca.costPerLevel || 1), enhancements: [], limiters: [] };
              let nmodDesc = "";
              const nenhNames = (ncaCostInfo.enhancements || []).map(e => `${e.name} (Rk ${e.rank})`);
              const nlimNames = (ncaCostInfo.limiters || []).map(l => `${l.name} (Rk ${l.rank})`);
              if (nenhNames.length > 0 || nlimNames.length > 0) {
                const parts = [];
                if (nenhNames.length > 0) parts.push(`Enhancements: ${nenhNames.join(', ')}`);
                if (nlimNames.length > 0) parts.push(`Limiters: ${nlimNames.join(', ')}`);
                nmodDesc = ` {${parts.join('; ')}}`;
              }
              md += `    - *Attribute:* ${ncaName} (Level ${nca.level})${nmodDesc} [${ncaCostInfo.totalCost} CP]\n`;
            });
            const nestedSgs = [...(nestedTraits.skillGroups || [])].sort(cmpTraits);
            nestedSgs.forEach(ncs => {
              md += `    - *Skill Group:* ${ncs.name} Group (Level ${ncs.level}) [${ncs.level * ncs.costPerLevel} CP]\n`;
            });
            const nestedSkills = [...(nestedTraits.skills || [])].sort(cmpTraits);
            nestedSkills.forEach(ncsk => {
              const spec = ncsk.specialization ? ` (${ncsk.specialization})` : "";
              md += `    - *Skill:* ${ncsk.name}${spec} [${ncsk.stat}] (Level ${ncsk.level}) [${ncsk.level * (ncsk.costPerLevel || 1)} CP]\n`;
            });
            const nestedDefs = [...(nestedTraits.defects || [])].sort(cmpTraits);
            nestedDefs.forEach(ncd => {
              let ncdName = ncd.name;
              if (ncd.detail) ncdName += ` [${ncd.detail}]`;
              md += `    - *Defect:* ${ncdName} (Rank ${ncd.rank}) [${ncd.rank * ncd.refundPerRank} CP refund]\n`;
            });
            (nestedTraits.weapons || []).forEach(ncw => {
              md += `    - *Weapon:* ${ncw.name} (Level ${ncw.level}) | Range: ${ncw.range} | Enhancements: ${ncw.enhancements}\n`;
            });
          } else {
            const caCostInfo = (typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.calculateAttributeCost)
              ? BESM4E_RULES.calculateAttributeCost(ca)
              : { totalCost: (ca.level || 1) * (ca.costPerLevel || 1), enhancements: [], limiters: [] };
            let modDesc = "";
            const enhNames = (caCostInfo.enhancements || []).map(e => `${e.name} (Rk ${e.rank})`);
            const limNames = (caCostInfo.limiters || []).map(l => `${l.name} (Rk ${l.rank})`);
            if (enhNames.length > 0 || limNames.length > 0) {
              const parts = [];
              if (enhNames.length > 0) parts.push(`Enhancements: ${enhNames.join(', ')}`);
              if (limNames.length > 0) parts.push(`Limiters: ${limNames.join(', ')}`);
              modDesc = ` {${parts.join('; ')}}`;
            }
            md += `  - *Attribute:* ${caName} (Level ${ca.level})${modDesc} [${caCostInfo.totalCost} CP]\n`;
          }
        });
        const sortedSubSgs = [...(traits.skillGroups || [])].sort(cmpTraits);
        sortedSubSgs.forEach(cs => {
          md += `  - *Skill Group:* ${cs.name} Group (Level ${cs.level}) [${cs.level * cs.costPerLevel} CP]\n`;
        });
        const sortedSubSkills = [...(traits.skills || [])].sort(cmpTraits);
        sortedSubSkills.forEach(csk => {
          const spec = csk.specialization ? ` (${csk.specialization})` : "";
          md += `  - *Skill:* ${csk.name}${spec} [${csk.stat}] (Level ${csk.level}) [${csk.level * (csk.costPerLevel || 1)} CP]\n`;
        });
        const sortedSubDefs = [...(traits.defects || [])].sort(cmpTraits);
        sortedSubDefs.forEach(cd => {
          let cdName = cd.name;
          if (cd.detail) cdName += ` [${cd.detail}]`;
          md += `  - *Defect:* ${cdName} (Rank ${cd.rank}) [${cd.rank * cd.refundPerRank} CP refund]\n`;
        });
        (traits.weapons || []).forEach(cw => {
          md += `  - *Weapon:* ${cw.name} (Level ${cw.level}) | Range: ${cw.range} | Enhancements: ${cw.enhancements}\n`;
        });
      } else {
        const aCostInfo = (typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.calculateAttributeCost)
          ? BESM4E_RULES.calculateAttributeCost(a)
          : { totalCost: (a.level || 1) * (a.costPerLevel || 1), enhancements: [], limiters: [] };
        let aName = a.name;
        if (a.subTrait) aName += ` (${a.subTrait})`;
        if (a.detail) aName += ` [${a.detail}]`;
        let aModDesc = "";
        const enhNames = (aCostInfo.enhancements || []).map(e => `${e.name} (Rk ${e.rank})`);
        const limNames = (aCostInfo.limiters || []).map(l => `${l.name} (Rk ${l.rank})`);
        if (enhNames.length > 0 || limNames.length > 0) {
          const parts = [];
          if (enhNames.length > 0) parts.push(`Enhancements: ${enhNames.join(', ')}`);
          if (limNames.length > 0) parts.push(`Limiters: ${limNames.join(', ')}`);
          aModDesc = ` {${parts.join('; ')}}`;
        }
        md += `- **${aName} (Level ${a.level}):** ${a.customDesc || "N/A"}${aModDesc} [${aCostInfo.totalCost} CP]\n`;
      }
    });
    }
    md += `\n`;

    const totalSkillsCost = points.skillGroupsTotal + (points.skillsTotal || 0);
    md += `### Skills & Skill Groups (${totalSkillsCost} CP)\n`;
    if (charInstance.skillGroups.length === 0 && (!charInstance.skills || charInstance.skills.length === 0)) {
      md += `*None*\n`;
    } else {
      const sortedSkillGroups = charInstance.getSortedSkillGroups ? charInstance.getSortedSkillGroups() : [...charInstance.skillGroups].sort(cmpTraits);
      sortedSkillGroups.forEach(s => {
        md += `- **${s.name} Group (Level ${s.level}):** (+${s.level} to skill rolls) [${s.level * s.costPerLevel} CP]\n`;
      });
      const sortedSkills = charInstance.getSortedSkills ? charInstance.getSortedSkills() : [...(charInstance.skills || [])].sort(cmpTraits);
      sortedSkills.forEach(sk => {
        const spec = sk.specialization ? ` (${sk.specialization})` : "";
        md += `- **${sk.name}${spec} [${sk.stat}] (Level ${sk.level}):** (+${sk.level} to skill rolls) [${sk.level * (sk.costPerLevel || 1)} CP]\n`;
      });
    }
    md += `\n`;

    md += `### Defects (+${points.defectsRefund} CP Refund)\n`;
    if (charInstance.defects.length === 0) {
      md += `*None*\n`;
    } else {
      const sortedDefects = charInstance.getSortedDefects ? charInstance.getSortedDefects() : [...charInstance.defects].sort(cmpTraits);
      sortedDefects.forEach(d => {
        const refund = d.rank * d.refundPerRank;
        let dName = d.name;
        if (d.detail) dName += ` [${d.detail}]`;
        md += `- **${dName} (Rank ${d.rank}):** ${d.customDesc || "N/A"} [${refund} CP refund]\n`;
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

    if (charInstance.appearance) {
      md += `### Appearance\n${charInstance.appearance}\n\n`;
    }

    if (charInstance.backstory) {
      md += `### Background\n${charInstance.backstory}\n\n`;
    }

    if (charInstance.alliesEnemies) {
      md += `### Allies & Enemies\n${charInstance.alliesEnemies}\n\n`;
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
