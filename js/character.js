/**
 * Big Eyes, Small Mouth (BESM) 4th Edition - Character Model & Business Logic
 */

class BESM4ECharacter {
  constructor(data = {}) {
    this.id = data.id || "char_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    this.name = typeof data.name === "string" ? data.name : "";
    this.player = data.player || "";
    this.campaign = data.campaign || "";
    this.concept = data.concept || "";
    this.tier = data.tier || "heroic"; // heroic is the BESM "sweet spot" (75 CP)
    this.customPointBudget = typeof data.customPointBudget === "number" ? data.customPointBudget : 75;

    // Core Stats (In BESM 4E, normal human baseline is 4; blank sheet starts with 0 or 4)
    this.stats = {
      body: typeof data.stats?.body === "number" ? data.stats.body : 0,
      mind: typeof data.stats?.mind === "number" ? data.stats.mind : 0,
      soul: typeof data.stats?.soul === "number" ? data.stats.soul : 0
    };

    // Attributes, Skill Groups, Defects, Weapons
    this.attributes = Array.isArray(data.attributes) ? JSON.parse(JSON.stringify(data.attributes)) : [];
    this.skillGroups = Array.isArray(data.skillGroups) ? JSON.parse(JSON.stringify(data.skillGroups)) : [];
    this.defects = Array.isArray(data.defects) ? JSON.parse(JSON.stringify(data.defects)) : [];
    this.weapons = Array.isArray(data.weapons) ? JSON.parse(JSON.stringify(data.weapons)) : [];
    
    this.gear = data.gear || "";
    this.backstory = data.backstory || "";
    this.appearance = data.appearance || "";
    this.alliesEnemies = data.alliesEnemies || "";

    // Experience & Advancement tracking
    this.earnedXP = typeof data.earnedXP === "number" ? data.earnedXP : 0;
    this.advancementLog = Array.isArray(data.advancementLog) ? JSON.parse(JSON.stringify(data.advancementLog)) : [
      {
        date: new Date().toISOString().split("T")[0],
        action: "Character Created",
        xpChange: 0,
        notes: `Created under ${this.tier.toUpperCase()} power level.`
      }
    ];

    // Live In-Play Status Tracker
    const derived = this.getDerived();
    this.currentHealth = typeof data.currentHealth === "number" ? data.currentHealth : derived.maxHealth;
    this.currentEnergy = typeof data.currentEnergy === "number" ? data.currentEnergy : derived.maxEnergy;
    this.conditions = Array.isArray(data.conditions) ? [...data.conditions] : [];
    this.sessionNotes = data.sessionNotes || "";

    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Calculate Character Point cost for a specific stat value
   * BESM 4E: 1-12 costs 2 CP per point; 13+ costs 4 CP per point.
   */
  calculateStatCost(value) {
    const val = Math.max(0, parseInt(value, 10) || 0);
    if (val <= 12) {
      return val * 2;
    }
    // 12 * 2 = 24 points for first 12, then 4 per point above 12
    return 24 + ((val - 12) * 4);
  }

  /**
   * Get the maximum starting point budget based on tier or custom value
   */
  getBaseBudget() {
    const tierObj = BESM4E_RULES.tiers.find(t => t.id === this.tier);
    if (this.tier === "custom") {
      return this.customPointBudget;
    }
    return tierObj ? tierObj.defaultPoints : 75;
  }

  /**
   * Total budget = Base Tier Budget + Total Earned XP
   */
  getTotalBudget() {
    return this.getBaseBudget() + (this.earnedXP || 0);
  }

  /**
   * Full Character Point breakdown
   */
  getPointBreakdown() {
    // Stats Cost
    const bodyCost = this.calculateStatCost(this.stats.body);
    const mindCost = this.calculateStatCost(this.stats.mind);
    const soulCost = this.calculateStatCost(this.stats.soul);
    const statsTotal = bodyCost + mindCost + soulCost;

    // Attributes Cost
    const attributesTotal = this.attributes.reduce((sum, attr) => {
      const cost = (attr.level || 1) * (attr.costPerLevel || 1);
      return sum + cost;
    }, 0);

    // Skill Groups Cost
    const skillGroupsTotal = this.skillGroups.reduce((sum, sg) => {
      const cost = (sg.level || 1) * (sg.costPerLevel || 1);
      return sum + cost;
    }, 0);

    // Defects Refund (positive number representing points refunded to the character)
    const defectsRefund = this.defects.reduce((sum, defect) => {
      const refund = (defect.rank || 1) * (defect.refundPerRank || 1);
      return sum + refund;
    }, 0);

    const netSpent = statsTotal + attributesTotal + skillGroupsTotal - defectsRefund;
    const totalBudget = this.getTotalBudget();
    const remaining = totalBudget - netSpent;

    return {
      stats: {
        body: bodyCost,
        mind: mindCost,
        soul: soulCost,
        total: statsTotal
      },
      attributesTotal,
      skillGroupsTotal,
      defectsRefund,
      netSpent,
      baseBudget: this.getBaseBudget(),
      earnedXP: this.earnedXP,
      totalBudget,
      remaining,
      isOverBudget: remaining < 0
    };
  }

  /**
   * Calculate derived BESM 4E game statistics (Chapter 8, p. 168-171)
   */
  getDerived() {
    const body = this.stats.body || 0;
    const mind = this.stats.mind || 0;
    const soul = this.stats.soul || 0;

    // Base Combat Value (CV) = (Body + Mind + Soul) / 3
    const baseCV = Math.floor((body + mind + soul) / 3);

    // Attack Combat Value (ACV) = CV + Attack Mastery Level
    let acv = baseCV;
    const attackMastery = this.attributes.find(a => a.id === "attack_mastery");
    if (attackMastery) acv += (attackMastery.level || 0);

    // Inept Attack Defect penalty
    const ineptAttack = this.defects.find(d => d.id === "inept_attack");
    if (ineptAttack) acv -= (ineptAttack.rank || 0);

    // Defence Combat Value (DCV) = CV + Defence Mastery Level
    let dcv = baseCV;
    const defenceMastery = this.attributes.find(a => a.id === "defence_mastery");
    if (defenceMastery) dcv += (defenceMastery.level || 0);

    // Inept Defence Defect penalty
    const ineptDefence = this.defects.find(d => d.id === "inept_defence");
    if (ineptDefence) dcv -= (ineptDefence.rank || 0);

    // Health Points (HP) = (Body + Soul) * 5 + (Tough Level * 10)
    let maxHealth = (body + soul) * 5;
    const toughAttr = this.attributes.find(a => a.id === "tough");
    if (toughAttr) maxHealth += (toughAttr.level || 0) * 10;

    // Fragile Defect penalty
    const fragileDefect = this.defects.find(d => d.id === "fragile");
    if (fragileDefect) maxHealth -= (fragileDefect.rank || 0) * 5;
    maxHealth = Math.max(1, maxHealth);

    // Energy Points (EP) = (Mind + Soul) * 5 + (Energised Level * 10)
    let maxEnergy = (mind + soul) * 5;
    const energisedAttr = this.attributes.find(a => a.id === "energised");
    if (energisedAttr) maxEnergy += (energisedAttr.level || 0) * 10;
    maxEnergy = Math.max(1, maxEnergy);

    // Damage Multiplier (DM) = Base 5 + Massive Damage Level
    let damageMultiplier = 5;
    const massiveDmg = this.attributes.find(a => a.id === "massive_damage");
    if (massiveDmg) damageMultiplier += (massiveDmg.level || 0);

    const reducedDmg = this.defects.find(d => d.id === "reduced_damage");
    if (reducedDmg) damageMultiplier = Math.max(1, damageMultiplier - (reducedDmg.rank || 0));

    // Superstrength bonus for melee/muscle attacks
    let superstrengthLevel = 0;
    const superstr = this.attributes.find(a => a.id === "superstrength");
    if (superstr) superstrengthLevel = superstr.level || 0;
    const meleeDamageMultiplier = damageMultiplier + superstrengthLevel;

    // Armour Rating (AR) = (Armour Level * 5) + (Force Field Level * 10)
    let armorRating = 0;
    const armorAttr = this.attributes.find(a => a.id === "armour");
    if (armorAttr) armorRating += (armorAttr.level || 0) * 5;
    const forceFieldAttr = this.attributes.find(a => a.id === "force_field");
    if (forceFieldAttr) armorRating += (forceFieldAttr.level || 0) * 10;

    // Shock Threshold (damage in a single hit causing stagger)
    const shockThreshold = Math.max(10, Math.floor(maxHealth / 5));

    return {
      baseCV,
      acv,
      dcv,
      maxHealth,
      maxEnergy,
      damageMultiplier,
      meleeDamageMultiplier,
      superstrengthLevel,
      armorRating,
      shockThreshold
    };
  }

  /**
   * Set stat value
   */
  setStat(statName, value) {
    if (["body", "mind", "soul"].includes(statName)) {
      this.stats[statName] = Math.max(0, Math.min(30, parseInt(value, 10) || 0));
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Set all stats to standard adult human average (Body 4, Mind 4, Soul 4)
   */
  setHumanAverageStats() {
    this.stats.body = 4;
    this.stats.mind = 4;
    this.stats.soul = 4;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Attribute Management
   */
  addAttribute(attributeDef, level = 1, customName = null, customDesc = null) {
    const existing = this.attributes.find(a => a.id === attributeDef.id);
    if (existing) {
      existing.level = Math.min(attributeDef.maxLevel || 10, existing.level + 1);
    } else {
      this.attributes.push({
        id: attributeDef.id,
        name: customName || attributeDef.name,
        category: attributeDef.category || "supernatural",
        level: Math.min(attributeDef.maxLevel || 10, level),
        costPerLevel: attributeDef.costPerLevel || 2,
        customDesc: customDesc || attributeDef.description || "",
        isCustom: !BESM4E_RULES.attributes.some(a => a.id === attributeDef.id)
      });
    }
    this.updatedAt = new Date().toISOString();
  }

  updateAttributeLevel(attrId, newLevel) {
    const item = this.attributes.find(a => a.id === attrId);
    if (item) {
      if (newLevel <= 0) {
        this.removeAttribute(attrId);
      } else {
        item.level = newLevel;
        this.updatedAt = new Date().toISOString();
      }
    }
  }

  removeAttribute(attrId) {
    this.attributes = this.attributes.filter(a => a.id !== attrId);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Skill Groups Management (BESM 4E p. 120-122)
   */
  addSkillGroup(skillDef, level = 1) {
    const existing = this.skillGroups.find(s => s.id === skillDef.id);
    if (existing) {
      existing.level = Math.min(skillDef.maxLevel || 6, existing.level + 1);
    } else {
      this.skillGroups.push({
        id: skillDef.id,
        name: skillDef.name,
        tier: skillDef.tier || "field",
        level: Math.min(skillDef.maxLevel || 6, level),
        costPerLevel: skillDef.costPerLevel || 2,
        isCustom: !BESM4E_RULES.skillGroups.some(s => s.id === skillDef.id)
      });
    }
    this.updatedAt = new Date().toISOString();
  }

  updateSkillGroupLevel(skillId, newLevel) {
    const item = this.skillGroups.find(s => s.id === skillId);
    if (item) {
      if (newLevel <= 0) {
        this.removeSkillGroup(skillId);
      } else {
        item.level = newLevel;
        this.updatedAt = new Date().toISOString();
      }
    }
  }

  removeSkillGroup(skillId) {
    this.skillGroups = this.skillGroups.filter(s => s.id !== skillId);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Defects Management (BESM 4E p. 155)
   */
  addDefect(defectDef, rank = 1, customDesc = null) {
    const existing = this.defects.find(d => d.id === defectDef.id);
    if (existing) {
      existing.rank = Math.min(defectDef.maxRank || 3, existing.rank + 1);
    } else {
      this.defects.push({
        id: defectDef.id,
        name: defectDef.name,
        category: defectDef.category || "lesser",
        rank: Math.min(defectDef.maxRank || 3, rank),
        refundPerRank: defectDef.refundPerRank || 1,
        customDesc: customDesc || defectDef.description || "",
        isCustom: !BESM4E_RULES.defects.some(d => d.id === defectDef.id)
      });
    }
    this.updatedAt = new Date().toISOString();
  }

  updateDefectRank(defectId, newRank) {
    const item = this.defects.find(d => d.id === defectId);
    if (item) {
      if (newRank <= 0) {
        this.removeDefect(defectId);
      } else {
        item.rank = newRank;
        this.updatedAt = new Date().toISOString();
      }
    }
  }

  removeDefect(defectId) {
    this.defects = this.defects.filter(d => d.id !== defectId);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Weapons & Attacks Management
   */
  addWeapon(weapon) {
    this.weapons.push({
      id: "wpn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: weapon.name || "Signature Attack",
      level: parseInt(weapon.level, 10) || 1,
      range: weapon.range || "Melee",
      enhancements: weapon.enhancements || "None",
      limiters: weapon.limiters || "None",
      notes: weapon.notes || ""
    });
    this.updatedAt = new Date().toISOString();
  }

  removeWeapon(weaponId) {
    this.weapons = this.weapons.filter(w => w.id !== weaponId);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Live In-Play Damage and Healing
   */
  applyDamage(amount, bypassArmor = false) {
    const derived = this.getDerived();
    let effectiveDamage = amount;

    if (!bypassArmor && derived.armorRating > 0) {
      effectiveDamage = Math.max(0, amount - derived.armorRating);
    }

    this.currentHealth = Math.max(0, this.currentHealth - effectiveDamage);
    this.updatedAt = new Date().toISOString();
    return {
      damageDealt: effectiveDamage,
      absorbedByArmor: Math.min(amount, derived.armorRating),
      remainingHealth: this.currentHealth,
      isShocked: effectiveDamage >= derived.shockThreshold,
      isIncapacitated: this.currentHealth <= 0
    };
  }

  applyHealing(amount) {
    const derived = this.getDerived();
    this.currentHealth = Math.min(derived.maxHealth, this.currentHealth + amount);
    this.updatedAt = new Date().toISOString();
    return this.currentHealth;
  }

  spendEnergy(amount) {
    if (this.currentEnergy >= amount) {
      this.currentEnergy -= amount;
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  restoreEnergy(amount) {
    const derived = this.getDerived();
    this.currentEnergy = Math.min(derived.maxEnergy, this.currentEnergy + amount);
    this.updatedAt = new Date().toISOString();
    return this.currentEnergy;
  }

  fullRest() {
    const derived = this.getDerived();
    this.currentHealth = derived.maxHealth;
    this.currentEnergy = derived.maxEnergy;
    this.conditions = [];
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Advancement & XP Recording
   */
  recordAdvancement(actionText, xpCost = 0, notes = "") {
    this.advancementLog.unshift({
      date: new Date().toISOString().split("T")[0],
      action: actionText,
      xpChange: xpCost,
      notes: notes
    });
    this.updatedAt = new Date().toISOString();
  }

  addXP(amount, notes = "Session reward") {
    const pts = parseInt(amount, 10) || 0;
    if (pts > 0) {
      this.earnedXP += pts;
      this.recordAdvancement(`Awarded ${pts} XP`, pts, notes);
    }
  }

  /**
   * Clone character
   */
  clone() {
    const copy = new BESM4ECharacter(JSON.parse(JSON.stringify(this)));
    copy.id = "char_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    copy.name = this.name ? `${this.name} (Copy)` : "Untitled Character (Copy)";
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    return copy;
  }

  /**
   * Serialization
   */
  toJSON() {
    return {
      version: BESM4E_RULES.version,
      system: BESM4E_RULES.systemName,
      id: this.id,
      name: this.name,
      player: this.player,
      campaign: this.campaign,
      concept: this.concept,
      tier: this.tier,
      customPointBudget: this.customPointBudget,
      stats: { ...this.stats },
      attributes: JSON.parse(JSON.stringify(this.attributes)),
      skillGroups: JSON.parse(JSON.stringify(this.skillGroups)),
      defects: JSON.parse(JSON.stringify(this.defects)),
      weapons: JSON.parse(JSON.stringify(this.weapons)),
      gear: this.gear,
      backstory: this.backstory,
      appearance: this.appearance,
      alliesEnemies: this.alliesEnemies,
      earnedXP: this.earnedXP,
      advancementLog: JSON.parse(JSON.stringify(this.advancementLog)),
      currentHealth: this.currentHealth,
      currentEnergy: this.currentEnergy,
      conditions: [...this.conditions],
      sessionNotes: this.sessionNotes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Load an archetype template preset
   */
  loadTemplate(templateId) {
    const tmpl = BESM4E_RULES.templates.find(t => t.id === templateId);
    if (!tmpl) return false;

    this.concept = tmpl.concept || this.concept;
    this.tier = tmpl.tier || "heroic";
    this.stats = { ...tmpl.stats };
    this.attributes = JSON.parse(JSON.stringify(tmpl.attributes || []));
    this.skillGroups = JSON.parse(JSON.stringify(tmpl.skillGroups || []));
    this.defects = JSON.parse(JSON.stringify(tmpl.defects || []));
    this.weapons = JSON.parse(JSON.stringify(tmpl.weapons || []));
    this.gear = tmpl.gear || "";

    const derived = this.getDerived();
    this.currentHealth = derived.maxHealth;
    this.currentEnergy = derived.maxEnergy;

    this.recordAdvancement("Template Loaded", 0, `Loaded archetype: ${tmpl.name}`);
    this.updatedAt = new Date().toISOString();
    return true;
  }
}

// Backwards compatibility alias
const TriStatCharacter = BESM4ECharacter;

if (typeof module !== "undefined" && module.exports) {
  module.exports = BESM4ECharacter;
  global.BESM4ECharacter = BESM4ECharacter;
  global.TriStatCharacter = BESM4ECharacter;
}
