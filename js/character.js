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

    // Attributes, Skill Groups, Individual Skills, Defects, Weapons
    this.attributes = Array.isArray(data.attributes) ? JSON.parse(JSON.stringify(data.attributes)) : [];
    this.skillGroups = Array.isArray(data.skillGroups) ? JSON.parse(JSON.stringify(data.skillGroups)) : [];
    this.skills = Array.isArray(data.skills) ? JSON.parse(JSON.stringify(data.skills)) : [];
    this.defects = Array.isArray(data.defects) ? JSON.parse(JSON.stringify(data.defects)) : [];
    this.weapons = Array.isArray(data.weapons) ? JSON.parse(JSON.stringify(data.weapons)) : [];
    
    // Normalize any container attributes (Item, Companion, Alternate Form, Minions)
    this.normalizeContainerAttributes();

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
   * Normalize container attributes so they have valid sub-trait arrays & stats
   */
  normalizeContainerAttributes() {
    if (!Array.isArray(this.attributes)) return;
    this.attributes.forEach(attr => {
      const isCont = attr.isContainer || 
                     ['item', 'companion', 'alternate_form', 'minions', 'chassis'].includes(attr.id) || 
                     (attr.attributeId && ['item', 'companion', 'alternate_form', 'minions', 'chassis'].includes(attr.attributeId));
      if (isCont) {
        attr.isContainer = true;
        if (!attr.containerType) {
          attr.containerType = attr.attributeId || attr.id.split('_')[0];
        }
        if (!attr.containerStats) {
          attr.containerStats = { body: 0, mind: 0, soul: 0 };
        }
        if (!attr.containerTraits) {
          attr.containerTraits = { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] };
        } else {
          if (!Array.isArray(attr.containerTraits.attributes)) attr.containerTraits.attributes = [];
          if (!Array.isArray(attr.containerTraits.skillGroups)) attr.containerTraits.skillGroups = [];
          if (!Array.isArray(attr.containerTraits.skills)) attr.containerTraits.skills = [];
          if (!Array.isArray(attr.containerTraits.defects)) attr.containerTraits.defects = [];
          if (!Array.isArray(attr.containerTraits.weapons)) attr.containerTraits.weapons = [];
        }
      }
    });
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
   * Calculate sub-point costs and effective character costs for a container attribute
   * Supports: Item (half normal value), Companion (10 CP budget/lvl), Alternate Form, Minions
   */
  getContainerPoints(attrOrId) {
    let attr = attrOrId;
    if (typeof attrOrId === "string") {
      attr = this.getContainerAttribute(attrOrId);
    }
    if (!attr) {
      return {
        statsCost: 0,
        attributesCost: 0,
        skillGroupsCost: 0,
        skillsCost: 0,
        defectsRefund: 0,
        weaponsCost: 0,
        netContainedPoints: 0,
        effectiveCharacterCost: 0,
        budgetAllowance: 0,
        remainingBudget: 0
      };
    }

    const stats = attr.containerStats || { body: 0, mind: 0, soul: 0 };
    const statsCost = this.calculateStatCost(stats.body) + this.calculateStatCost(stats.mind) + this.calculateStatCost(stats.soul);

    const traits = attr.containerTraits || { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] };

    const attributesCost = (traits.attributes || []).reduce((sum, a) => sum + ((a.level || 1) * (a.costPerLevel || 1)), 0);
    const skillGroupsCost = (traits.skillGroups || []).reduce((sum, s) => sum + ((s.level || 1) * (s.costPerLevel || 1)), 0);
    const skillsCost = (traits.skills || []).reduce((sum, s) => sum + ((s.level || 1) * (s.costPerLevel !== undefined ? s.costPerLevel : 1)), 0);
    const defectsRefund = (traits.defects || []).reduce((sum, d) => sum + ((d.rank || 1) * (d.refundPerRank || 1)), 0);
    // Weapons built directly into an item or companion cost 2 CP per Level (Weapon attribute cost in BESM 4E Table 07)
    const weaponsCost = (traits.weapons || []).reduce((sum, w) => sum + ((w.level || 1) * 2), 0);

    const netContainedPoints = statsCost + attributesCost + skillGroupsCost + skillsCost + weaponsCost - defectsRefund;

    let effectiveCharacterCost = 0;
    let budgetAllowance = 0;
    let remainingBudget = 0;

    const cType = attr.containerType || attr.id.split('_')[0];
    if (cType === "item" || cType === "chassis") {
      // BESM 4E p. 101 & BESM Extras: Total point cost of all Attributes, Defects, and Weapons built into Item/Chassis, divided by two (round down, min 0)
      if (netContainedPoints > 0) {
        effectiveCharacterCost = Math.floor(netContainedPoints / 2);
      } else {
        effectiveCharacterCost = Math.max(0, Math.floor((attr.level || 0) * (attr.costPerLevel || 0.5)));
      }
      budgetAllowance = netContainedPoints;
      remainingBudget = 0;
    } else if (cType === "companion" || cType === "alternate_form") {
      effectiveCharacterCost = (attr.level || 1) * (attr.costPerLevel || 4);
      budgetAllowance = (attr.level || 1) * 10;
      remainingBudget = budgetAllowance - netContainedPoints;
    } else if (cType === "minions") {
      effectiveCharacterCost = (attr.level || 1) * (attr.costPerLevel || 2);
      budgetAllowance = Math.floor(this.getTotalBudget() / 5);
      remainingBudget = budgetAllowance - netContainedPoints;
    } else {
      effectiveCharacterCost = (attr.level || 1) * (attr.costPerLevel || 1);
    }

    return {
      statsCost,
      attributesCost,
      skillGroupsCost,
      skillsCost,
      defectsRefund,
      weaponsCost,
      netContainedPoints,
      effectiveCharacterCost,
      budgetAllowance,
      remainingBudget
    };
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

    // Attributes Cost (Containers like Item & Chassis calculate half-cost dynamically)
    const attributesTotal = this.attributes.reduce((sum, attr) => {
      if (attr.isContainer && (attr.containerType === "item" || attr.id.startsWith("item") || attr.containerType === "chassis" || attr.id.startsWith("chassis"))) {
        const itemPts = this.getContainerPoints(attr);
        return sum + itemPts.effectiveCharacterCost;
      }
      const cost = (attr.level || 1) * (attr.costPerLevel || 1);
      return sum + cost;
    }, 0);

    // Skill Groups Cost
    const skillGroupsTotal = this.skillGroups.reduce((sum, sg) => {
      const cost = (sg.level || 1) * (sg.costPerLevel || 1);
      return sum + cost;
    }, 0);

    // Individual Skills Cost (BESM 4E p. 120: 1 CP per Level)
    const skillsTotal = (this.skills || []).reduce((sum, s) => {
      const cost = (s.level || 1) * (s.costPerLevel !== undefined ? s.costPerLevel : 1);
      return sum + cost;
    }, 0);

    // Defects Refund (positive number representing points refunded to the character)
    const defectsRefund = this.defects.reduce((sum, defect) => {
      const refund = (defect.rank || 1) * (defect.refundPerRank || 1);
      return sum + refund;
    }, 0);

    const netSpent = statsTotal + attributesTotal + skillGroupsTotal + skillsTotal - defectsRefund;
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
      skillsTotal,
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
    const attackMastery = this.attributes.find(a => a.id === "attack_mastery" || a.attributeId === "attack_mastery");
    if (attackMastery) acv += (attackMastery.level || 0);

    // Inept Attack Defect penalty
    const ineptAttack = this.defects.find(d => d.id === "inept_attack" || d.defectId === "inept_attack");
    if (ineptAttack) acv -= (ineptAttack.rank || 0);

    // Defence Combat Value (DCV) = CV + Defence Mastery Level
    let dcv = baseCV;
    const defenceMastery = this.attributes.find(a => a.id === "defence_mastery" || a.attributeId === "defence_mastery");
    if (defenceMastery) dcv += (defenceMastery.level || 0);

    // Inept Defence Defect penalty
    const ineptDefence = this.defects.find(d => d.id === "inept_defence" || d.defectId === "inept_defence");
    if (ineptDefence) dcv -= (ineptDefence.rank || 0);

    // Health Points (HP) = (Body + Soul) * 5 + (Tough Level * 10)
    let maxHealth = (body + soul) * 5;
    const toughAttr = this.attributes.find(a => a.id === "tough" || a.attributeId === "tough");
    if (toughAttr) maxHealth += (toughAttr.level || 0) * 10;

    // Fragile Defect penalty
    const fragileDefect = this.defects.find(d => d.id === "fragile" || d.defectId === "fragile");
    if (fragileDefect) maxHealth -= (fragileDefect.rank || 0) * 5;
    maxHealth = Math.max(1, maxHealth);

    // Energy Points (EP) = (Mind + Soul) * 5 + (Energised Level * 10)
    let maxEnergy = (mind + soul) * 5;
    const energisedAttr = this.attributes.find(a => a.id === "energised" || a.attributeId === "energised");
    if (energisedAttr) maxEnergy += (energisedAttr.level || 0) * 10;
    maxEnergy = Math.max(1, maxEnergy);

    // Damage Multiplier (DM) = Base 5 + Massive Damage Level
    let damageMultiplier = 5;
    const massiveDmg = this.attributes.find(a => a.id === "massive_damage" || a.attributeId === "massive_damage");
    if (massiveDmg) damageMultiplier += (massiveDmg.level || 0);

    const reducedDmg = this.defects.find(d => d.id === "reduced_damage" || d.defectId === "reduced_damage");
    if (reducedDmg) damageMultiplier = Math.max(1, damageMultiplier - (reducedDmg.rank || 0));

    // Superstrength bonus for melee/muscle attacks
    let superstrengthLevel = 0;
    const superstr = this.attributes.find(a => a.id === "superstrength" || a.attributeId === "superstrength");
    if (superstr) superstrengthLevel = superstr.level || 0;

    // Armour Rating (AR) = (Armour Level * 5) + (Force Field Level * 10)
    let armorRating = 0;
    const armorAttr = this.attributes.find(a => a.id === "armour" || a.attributeId === "armour");
    if (armorAttr) armorRating += (armorAttr.level || 0) * 5;
    const forceFieldAttr = this.attributes.find(a => a.id === "force_field" || a.attributeId === "force_field");
    if (forceFieldAttr) armorRating += (forceFieldAttr.level || 0) * 10;

    // Items & Chassis with Armour, Force Field, or Damage Multipliers benefit the user directly
    this.attributes.forEach(attr => {
      if (attr.isContainer && (attr.containerType === "item" || attr.id.startsWith("item") || attr.containerType === "chassis" || attr.id.startsWith("chassis"))) {
        const subAttrs = attr.containerTraits?.attributes || [];
        const subArmour = subAttrs.find(a => a.id === "armour" || a.attributeId === "armour");
        if (subArmour) armorRating += (subArmour.level || 0) * 5;
        const subFF = subAttrs.find(a => a.id === "force_field" || a.attributeId === "force_field");
        if (subFF) armorRating += (subFF.level || 0) * 10;
        const subMassive = subAttrs.find(a => a.id === "massive_damage" || a.attributeId === "massive_damage");
        if (subMassive) damageMultiplier += (subMassive.level || 0);
        const subSuperstr = subAttrs.find(a => a.id === "superstrength" || a.attributeId === "superstrength");
        if (subSuperstr) superstrengthLevel += (subSuperstr.level || 0);
      }
    });

    const meleeDamageMultiplier = damageMultiplier + superstrengthLevel;

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
  addAttribute(attributeDef, level = 1, customName = null, customDesc = null, subTrait = "", detail = "") {
    const isCont = attributeDef.isContainer || 
                   ['item', 'companion', 'alternate_form', 'minions', 'chassis'].includes(attributeDef.id);

    const defLookup = typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.getAttributeDef ? BESM4E_RULES.getAttributeDef(attributeDef.id) : null;
    const allowsMulti = isCont || attributeDef.allowMultiple || (defLookup && defLookup.allowMultiple) || (defLookup && defLookup.subTraits && defLookup.subTraits.length > 0) || (defLookup && !!defLookup.detailLabel);

    // If it's a container or allows multiple and an instance already exists, generate a unique ID
    let attrId = attributeDef.id;
    if (allowsMulti && this.attributes.some(a => a.id === attrId)) {
      const baseId = attributeDef.id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '');
      attrId = `${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    }

    const existing = this.attributes.find(a => a.id === attrId);
    if (existing) {
      existing.level = Math.min(attributeDef.maxLevel || 20, existing.level + 1);
    } else {
      const chosenSubTrait = subTrait || attributeDef.subTrait || (defLookup && defLookup.subTraits ? defLookup.subTraits[0] : "");
      const chosenDetail = detail || attributeDef.detail || "";
      const newAttr = {
        id: attrId,
        attributeId: defLookup ? defLookup.id : attributeDef.id,
        name: customName || attributeDef.name,
        category: attributeDef.category || (defLookup ? defLookup.category : "supernatural"),
        level: Math.min(attributeDef.maxLevel || 20, level),
        costPerLevel: attributeDef.costPerLevel !== undefined ? attributeDef.costPerLevel : (defLookup ? defLookup.costPerLevel : 2),
        subTrait: chosenSubTrait,
        detail: chosenDetail,
        customDesc: customDesc || attributeDef.description || (defLookup ? defLookup.description : ""),
        isCustom: !BESM4E_RULES.attributes.some(a => a.id === attributeDef.id)
      };

      if (isCont) {
        newAttr.isContainer = true;
        newAttr.containerType = attributeDef.containerType || attributeDef.id;
        newAttr.containerStats = attributeDef.containerStats ? { ...attributeDef.containerStats } : { body: 0, mind: 0, soul: 0 };
        newAttr.containerTraits = attributeDef.containerTraits ? JSON.parse(JSON.stringify(attributeDef.containerTraits)) : {
          attributes: [],
          skillGroups: [],
          skills: [],
          defects: [],
          weapons: []
        };
        if (!Array.isArray(newAttr.containerTraits.skills)) {
          newAttr.containerTraits.skills = [];
        }
      }

      this.attributes.push(newAttr);
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

  updateAttributeSubTrait(attrId, subTrait) {
    const item = this.attributes.find(a => a.id === attrId);
    if (item) {
      item.subTrait = subTrait || "";
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  updateAttributeDetail(attrId, detail) {
    const item = this.attributes.find(a => a.id === attrId);
    if (item) {
      item.detail = detail || "";
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  removeAttribute(attrId) {
    this.attributes = this.attributes.filter(a => a.id !== attrId);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Container Sub-Trait Management
   */
  getContainerAttribute(containerAttrId) {
    return this.attributes.find(a => a.id === containerAttrId && a.isContainer);
  }

  addContainerTrait(containerAttrId, traitType, traitDef, levelOrRank = 1, customName = null, customDesc = null, specialization = "", subTrait = "", detail = "") {
    const container = this.getContainerAttribute(containerAttrId);
    if (!container || !traitDef) return false;

    if (!container.containerTraits) {
      container.containerTraits = { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] };
    }

    let traitId = traitDef.id || (`trait_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`);

    if (traitType === "attributes") {
      const defLookup = typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.getAttributeDef ? BESM4E_RULES.getAttributeDef(traitDef.id) : null;
      const allowsMulti = traitDef.allowMultiple || (defLookup && defLookup.allowMultiple) || (defLookup && defLookup.subTraits && defLookup.subTraits.length > 0) || (defLookup && !!defLookup.detailLabel);

      if (allowsMulti && container.containerTraits.attributes.some(a => a.id === traitId)) {
        const baseId = (traitDef.id || "attr").replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '');
        traitId = `${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      }

      const existing = container.containerTraits.attributes.find(a => a.id === traitId);
      if (existing) {
        existing.level = Math.min(traitDef.maxLevel || 10, existing.level + 1);
      } else {
        const chosenSubTrait = subTrait || traitDef.subTrait || (defLookup && defLookup.subTraits ? defLookup.subTraits[0] : "");
        const chosenDetail = detail || traitDef.detail || "";
        container.containerTraits.attributes.push({
          id: traitId,
          attributeId: defLookup ? defLookup.id : traitDef.id,
          name: customName || traitDef.name || "Contained Attribute",
          category: traitDef.category || (defLookup ? defLookup.category : "supernatural"),
          level: Math.min(traitDef.maxLevel || 10, levelOrRank),
          costPerLevel: traitDef.costPerLevel !== undefined ? traitDef.costPerLevel : (defLookup ? defLookup.costPerLevel : 2),
          subTrait: chosenSubTrait,
          detail: chosenDetail,
          customDesc: customDesc || traitDef.description || (defLookup ? defLookup.description : "")
        });
      }
    } else if (traitType === "skillGroups") {
      const existing = container.containerTraits.skillGroups.find(s => s.id === traitId);
      if (existing) {
        existing.level = Math.min(traitDef.maxLevel || 6, existing.level + 1);
      } else {
        const defLookup = typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.getSkillGroupDef ? BESM4E_RULES.getSkillGroupDef(traitDef.id) : null;
        container.containerTraits.skillGroups.push({
          id: traitId,
          name: customName || traitDef.name || "Contained Skill Group",
          tier: traitDef.tier || "field",
          level: Math.min(traitDef.maxLevel || 6, levelOrRank),
          costPerLevel: traitDef.costPerLevel || 2,
          customDesc: customDesc || traitDef.description || (defLookup ? defLookup.description : "")
        });
      }
    } else if (traitType === "skills" || traitType === "skill") {
      if (!Array.isArray(container.containerTraits.skills)) {
        container.containerTraits.skills = [];
      }
      const existing = container.containerTraits.skills.find(s => s.id === traitId);
      if (existing) {
        existing.level = Math.min(traitDef.maxLevel || 6, existing.level + 1);
        if (specialization && !existing.specialization) existing.specialization = specialization;
      } else {
        const defLookup = typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.getSkillDef ? BESM4E_RULES.getSkillDef(traitDef.id) : null;
        container.containerTraits.skills.push({
          id: traitId,
          name: customName || traitDef.name || "Contained Skill",
          stat: traitDef.stat || (defLookup ? defLookup.stat : "Mind"),
          groupId: traitDef.groupId || (defLookup ? defLookup.groupId : ""),
          groupName: traitDef.groupName || (defLookup ? defLookup.groupName : ""),
          level: Math.min(traitDef.maxLevel || 6, Math.max(1, levelOrRank)),
          costPerLevel: traitDef.costPerLevel !== undefined ? traitDef.costPerLevel : 1, // 1 CP / Level in BESM 4E
          specialization: specialization || traitDef.specialization || "",
          customDesc: customDesc || traitDef.description || (defLookup ? defLookup.description : "")
        });
      }
    } else if (traitType === "defects") {
      const defLookup = typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.getDefectDef ? BESM4E_RULES.getDefectDef(traitDef.id) : null;
      const allowsMulti = traitDef.allowMultiple || (defLookup && defLookup.allowMultiple) || (defLookup && !!defLookup.detailLabel);

      if (allowsMulti && container.containerTraits.defects.some(d => d.id === traitId)) {
        const baseId = (traitDef.id || "def").replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '');
        traitId = `${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      }

      const existing = container.containerTraits.defects.find(d => d.id === traitId);
      if (existing) {
        existing.rank = Math.min(traitDef.maxRank || 3, existing.rank + 1);
      } else {
        const chosenDetail = detail || traitDef.detail || "";
        container.containerTraits.defects.push({
          id: traitId,
          defectId: defLookup ? defLookup.id : traitDef.id,
          name: customName || traitDef.name || "Contained Defect",
          category: traitDef.category || (defLookup ? defLookup.category : "lesser"),
          rank: Math.min(traitDef.maxRank || 3, levelOrRank),
          refundPerRank: traitDef.refundPerRank || (defLookup ? defLookup.refundPerRank : 1),
          detail: chosenDetail,
          customDesc: customDesc || traitDef.description || (defLookup ? defLookup.description : "")
        });
      }
    } else if (traitType === "weapons") {
      container.containerTraits.weapons.push({
        id: "wpn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        name: customName || traitDef.name || "Contained Attack",
        level: parseInt(traitDef.level, 10) || 1,
        range: traitDef.range || "Melee",
        enhancements: traitDef.enhancements || "None",
        limiters: traitDef.limiters || "None",
        notes: customDesc || traitDef.notes || ""
      });
    }

    this.updatedAt = new Date().toISOString();
    return true;
  }

  updateContainerTraitLevel(containerAttrId, traitType, traitId, deltaOrNewLevel) {
    const container = this.getContainerAttribute(containerAttrId);
    if (!container || !container.containerTraits || !Array.isArray(container.containerTraits[traitType])) return false;

    const list = container.containerTraits[traitType];
    const item = list.find(t => t.id === traitId);
    if (!item) return false;

    const isDefect = traitType === "defects";
    const currentVal = isDefect ? item.rank : item.level;
    const newVal = typeof deltaOrNewLevel === "number" && Math.abs(deltaOrNewLevel) <= 1 
      ? currentVal + deltaOrNewLevel 
      : deltaOrNewLevel;

    if (newVal <= 0) {
      container.containerTraits[traitType] = list.filter(t => t.id !== traitId);
    } else {
      if (isDefect) {
        item.rank = Math.min(3, newVal);
      } else if (traitType === "skills" || traitType === "skillGroups") {
        item.level = Math.min(6, newVal);
      } else {
        item.level = Math.min(10, newVal);
      }
    }
    this.updatedAt = new Date().toISOString();
    return true;
  }

  updateContainerTraitSubTrait(containerAttrId, traitId, subTrait) {
    const container = this.getContainerAttribute(containerAttrId);
    if (!container || !container.containerTraits || !Array.isArray(container.containerTraits.attributes)) return false;
    const item = container.containerTraits.attributes.find(a => a.id === traitId);
    if (item) {
      item.subTrait = subTrait || "";
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  updateContainerTraitDetail(containerAttrId, traitType, traitId, detail) {
    const container = this.getContainerAttribute(containerAttrId);
    if (!container || !container.containerTraits || !Array.isArray(container.containerTraits[traitType])) return false;
    const item = container.containerTraits[traitType].find(t => t.id === traitId);
    if (item) {
      item.detail = detail || "";
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  updateSkillSpecialization(skillId, specialization) {
    const item = this.skills.find(s => s.id === skillId);
    if (item) {
      item.specialization = specialization || "";
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  updateContainerSkillSpecialization(containerAttrId, skillId, specialization) {
    const container = this.getContainerAttribute(containerAttrId);
    if (!container || !container.containerTraits || !Array.isArray(container.containerTraits.skills)) return false;
    const item = container.containerTraits.skills.find(s => s.id === skillId);
    if (item) {
      item.specialization = specialization || "";
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  removeContainerTrait(containerAttrId, traitType, traitId) {
    const container = this.getContainerAttribute(containerAttrId);
    if (!container || !container.containerTraits || !Array.isArray(container.containerTraits[traitType])) return false;
    container.containerTraits[traitType] = container.containerTraits[traitType].filter(t => t.id !== traitId);
    this.updatedAt = new Date().toISOString();
    return true;
  }

  setContainerStat(containerAttrId, statName, value) {
    const container = this.getContainerAttribute(containerAttrId);
    if (!container) return false;
    if (!container.containerStats) {
      container.containerStats = { body: 0, mind: 0, soul: 0 };
    }
    if (["body", "mind", "soul"].includes(statName)) {
      container.containerStats[statName] = Math.max(0, Math.min(30, parseInt(value, 10) || 0));
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  getContainerDerived(attrOrId) {
    let attr = attrOrId;
    if (typeof attrOrId === "string") {
      attr = this.getContainerAttribute(attrOrId);
    }
    if (!attr) return null;
    const stats = attr.containerStats || { body: 0, mind: 0, soul: 0 };
    const traits = attr.containerTraits || {};
    const subAttrs = traits.attributes || [];

    const baseCV = Math.floor((stats.body + stats.mind + stats.soul) / 3);
    let acv = baseCV;
    let dcv = baseCV;

    const atkM = subAttrs.find(a => a.id === "attack_mastery");
    if (atkM) acv += (atkM.level || 0);

    const defM = subAttrs.find(a => a.id === "defence_mastery");
    if (defM) dcv += (defM.level || 0);

    let hp = (stats.body + stats.soul) * 5;
    const tough = subAttrs.find(a => a.id === "tough");
    if (tough) hp += (tough.level || 0) * 10;

    let ep = (stats.mind + stats.soul) * 5;
    const energised = subAttrs.find(a => a.id === "energised");
    if (energised) ep += (energised.level || 0) * 10;

    let dm = 5;
    const massive = subAttrs.find(a => a.id === "massive_damage");
    if (massive) dm += (massive.level || 0);

    let superstr = 0;
    const sstr = subAttrs.find(a => a.id === "superstrength");
    if (sstr) superstr = (sstr.level || 0);
    const meleeDm = dm + superstr;

    let ar = 0;
    const arm = subAttrs.find(a => a.id === "armour");
    if (arm) ar += (arm.level || 0) * 5;
    const ff = subAttrs.find(a => a.id === "force_field");
    if (ff) ar += (ff.level || 0) * 10;

    const maxHp = Math.max(hp, 1);
    const maxEp = Math.max(ep, 1);

    return {
      baseCV,
      acv,
      dcv,
      hp: maxHp,
      ep: maxEp,
      maxHealth: maxHp,
      maxEnergy: maxEp,
      dm,
      meleeDm,
      damageMultiplier: dm,
      ar,
      armorRating: ar
    };
  }

  /**
   * Returns all weapons (direct character weapons + weapons in container attributes)
   */
  getAllWeapons() {
    const list = [...this.weapons];
    this.attributes.forEach(attr => {
      if (attr.isContainer && attr.containerTraits?.weapons) {
        attr.containerTraits.weapons.forEach(w => {
          list.push({
            ...w,
            containerId: attr.id,
            containerName: attr.name,
            displayName: `${w.name} [From ${attr.name}]`
          });
        });
      }
    });
    return list;
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
   * Individual Constituent Skills Management (BESM 4E p. 120-123)
   * 1 CP per Level (max level 6)
   */
  addSkill(skillDef, level = 1, specialization = "") {
    const existing = this.skills.find(s => s.id === skillDef.id);
    if (existing) {
      existing.level = Math.min(skillDef.maxLevel || 6, existing.level + 1);
      if (specialization && !existing.specialization) {
        existing.specialization = specialization;
      }
    } else {
      const defLookup = typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.getSkillDef ? BESM4E_RULES.getSkillDef(skillDef.id) : null;
      this.skills.push({
        id: skillDef.id,
        name: skillDef.name,
        stat: skillDef.stat || (defLookup ? defLookup.stat : "Mind"),
        groupId: skillDef.groupId || (defLookup ? defLookup.groupId : ""),
        groupName: skillDef.groupName || (defLookup ? defLookup.groupName : ""),
        level: Math.min(skillDef.maxLevel || 6, Math.max(1, level)),
        costPerLevel: skillDef.costPerLevel !== undefined ? skillDef.costPerLevel : 1, // 1 CP per Level in BESM 4E
        specialization: specialization || skillDef.specialization || "",
        customDesc: skillDef.description || (defLookup ? defLookup.description : ""),
        isCustom: !defLookup
      });
    }
    this.updatedAt = new Date().toISOString();
    return true;
  }

  updateSkillLevel(skillId, deltaOrNewLevel) {
    const item = this.skills.find(s => s.id === skillId);
    if (!item) return false;
    const newVal = typeof deltaOrNewLevel === "number" && Math.abs(deltaOrNewLevel) <= 1
      ? item.level + deltaOrNewLevel
      : deltaOrNewLevel;
    if (newVal <= 0) {
      this.removeSkill(skillId);
    } else {
      item.level = Math.min(6, Math.max(1, newVal));
      this.updatedAt = new Date().toISOString();
    }
    return true;
  }

  removeSkill(skillId) {
    this.skills = this.skills.filter(s => s.id !== skillId);
    this.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Defects Management (BESM 4E p. 155)
   */
  addDefect(defectDef, rank = 1, customDesc = null, detail = "") {
    const defLookup = typeof BESM4E_RULES !== "undefined" && BESM4E_RULES.getDefectDef ? BESM4E_RULES.getDefectDef(defectDef.id) : null;
    const allowsMulti = defectDef.allowMultiple || (defLookup && defLookup.allowMultiple) || (defLookup && !!defLookup.detailLabel);

    let defectId = defectDef.id;
    if (allowsMulti && this.defects.some(d => d.id === defectId)) {
      const baseId = defectDef.id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '');
      defectId = `${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    }

    const existing = this.defects.find(d => d.id === defectId);
    if (existing) {
      existing.rank = Math.min(defectDef.maxRank || 3, existing.rank + 1);
    } else {
      const chosenDetail = detail || defectDef.detail || "";
      this.defects.push({
        id: defectId,
        defectId: defLookup ? defLookup.id : defectDef.id,
        name: defectDef.name,
        category: defectDef.category || (defLookup ? defLookup.category : "lesser"),
        rank: Math.min(defectDef.maxRank || 3, rank),
        refundPerRank: defectDef.refundPerRank || (defLookup ? defLookup.refundPerRank : 1),
        detail: chosenDetail,
        customDesc: customDesc || defectDef.description || (defLookup ? defLookup.description : ""),
        isCustom: !BESM4E_RULES.defects.some(d => d.id === defectDef.id)
      });
    }
    this.updatedAt = new Date().toISOString();
  }

  updateDefectDetail(defectId, detail) {
    const item = this.defects.find(d => d.id === defectId);
    if (item) {
      item.detail = detail || "";
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
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
      skills: JSON.parse(JSON.stringify(this.skills || [])),
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
    this.normalizeContainerAttributes();
    this.skillGroups = JSON.parse(JSON.stringify(tmpl.skillGroups || []));
    this.skills = JSON.parse(JSON.stringify(tmpl.skills || []));
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
