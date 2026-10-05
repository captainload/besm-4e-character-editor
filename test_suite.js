const assert = require('assert');

// Mock localStorage and window for headless node testing
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.window = {};

require('./js/rules.js');
require('./js/character.js');
require('./js/storage.js');
require('./js/roller.js');

console.log("=======================================================");
console.log("  BESM 4th Edition - Test & Verification Suite");
console.log("=======================================================\n");

// 1. Test Base Blank Character Creation
console.log("Testing 1: Base Blank Character Initial State...");
const char = new BESM4ECharacter();
assert.strictEqual(char.name, "", "Clean sheet must have empty name");
assert.strictEqual(char.stats.body, 0);
assert.strictEqual(char.stats.mind, 0);
assert.strictEqual(char.stats.soul, 0);
assert.strictEqual(char.tier, "heroic", "Default tier must be Heroic (sweet spot)");
assert.strictEqual(char.getBaseBudget(), 75, "Heroic default budget is 75 CP");
assert.strictEqual(char.attributes.length, 0, "No attributes by default");
assert.strictEqual(char.skillGroups.length, 0, "No skill groups by default");
assert.strictEqual(char.defects.length, 0, "No defects by default");
assert.strictEqual(char.weapons.length, 0, "No weapons by default");
console.log("✓ Test 1 Passed: Blank character initializes cleanly with no premade content.");

// 2. Test Human Baseline Stats (4/4/4) and Derived Stats
console.log("Testing 2: Human Baseline Stats (4/4/4) & Derived Formulas...");
char.setHumanAverageStats();
assert.strictEqual(char.stats.body, 4);
assert.strictEqual(char.stats.mind, 4);
assert.strictEqual(char.stats.soul, 4);

let pt = char.getPointBreakdown();
// 4 * 2 = 8 CP per stat; 3 * 8 = 24 CP
assert.strictEqual(pt.stats.body, 8);
assert.strictEqual(pt.stats.mind, 8);
assert.strictEqual(pt.stats.soul, 8);
assert.strictEqual(pt.stats.total, 24);
assert.strictEqual(pt.remaining, 51, "75 - 24 = 51 CP remaining");

let derived = char.getDerived();
// CV = floor((4 + 4 + 4) / 3) = 4
assert.strictEqual(derived.baseCV, 4, "CV must be 4");
assert.strictEqual(derived.acv, 4, "ACV must be 4 without mastery");
assert.strictEqual(derived.dcv, 4, "DCV must be 4 without mastery");
// HP = (4 + 4) * 5 = 40
assert.strictEqual(derived.maxHealth, 40, "HP must be 40 at Body 4, Soul 4");
// EP = (4 + 4) * 5 = 40
assert.strictEqual(derived.maxEnergy, 40, "EP must be 40 at Mind 4, Soul 4");
// DM = 5
assert.strictEqual(derived.damageMultiplier, 5, "Base DM must be 5");
assert.strictEqual(derived.meleeDamageMultiplier, 5, "Base Melee DM must be 5");
assert.strictEqual(derived.armorRating, 0, "Base AR must be 0");
assert.strictEqual(derived.shockThreshold, 10, "Shock threshold must be Max(10, 40/5) = 10");
console.log("✓ Test 2 Passed: Human baseline (4/4/4) and derived statistics verified.");

// 3. Test Stat Cost Formula (1-12 = 2 CP, 13+ = 4 CP)
console.log("Testing 3: Non-Linear Stat Point Costing...");
assert.strictEqual(char.calculateStatCost(10), 20, "Stat 10 = 10 * 2 = 20 CP");
assert.strictEqual(char.calculateStatCost(12), 24, "Stat 12 = 12 * 2 = 24 CP");
assert.strictEqual(char.calculateStatCost(13), 28, "Stat 13 = 24 + 4 = 28 CP");
assert.strictEqual(char.calculateStatCost(15), 36, "Stat 15 = 24 + 3*4 = 36 CP");
console.log("✓ Test 3 Passed: 2 CP (≤12) and 4 CP (>12) stat progression verified.");

// 4. Test Attributes and Derived Impact
console.log("Testing 4: Attributes & Derived Modifiers...");
// Add Attack Mastery Level 2 (+2 ACV, 2 CP)
const atkMastery = BESM4E_RULES.attributes.find(a => a.id === "attack_mastery");
char.addAttribute(atkMastery, 2);
// Add Defence Mastery Level 1 (+1 DCV, 1 CP)
const defMastery = BESM4E_RULES.attributes.find(a => a.id === "defence_mastery");
char.addAttribute(defMastery, 1);
// Add Armour Level 2 (AR +10, 4 CP)
const armour = BESM4E_RULES.attributes.find(a => a.id === "armour");
char.addAttribute(armour, 2);
// Add Force Field Level 1 (AR +10, 4 CP)
const forceField = BESM4E_RULES.attributes.find(a => a.id === "force_field");
char.addAttribute(forceField, 1);
// Add Tough Level 2 (+20 HP, 2 CP)
const tough = BESM4E_RULES.attributes.find(a => a.id === "tough");
char.addAttribute(tough, 2);
// Add Energised Level 1 (+10 EP, 1 CP)
const energised = BESM4E_RULES.attributes.find(a => a.id === "energised");
char.addAttribute(energised, 1);
// Add Massive Damage Level 2 (+2 DM, 6 CP)
const massiveDmg = BESM4E_RULES.attributes.find(a => a.id === "massive_damage");
char.addAttribute(massiveDmg, 2);
// Add Superstrength Level 1 (+1 Melee DM, 4 CP)
const superstrength = BESM4E_RULES.attributes.find(a => a.id === "superstrength");
char.addAttribute(superstrength, 1);

derived = char.getDerived();
assert.strictEqual(derived.acv, 6, "ACV: 4 + 2 = 6");
assert.strictEqual(derived.dcv, 5, "DCV: 4 + 1 = 5");
assert.strictEqual(derived.maxHealth, 60, "HP: 40 + (2 * 10) = 60");
assert.strictEqual(derived.maxEnergy, 50, "EP: 40 + (1 * 10) = 50");
assert.strictEqual(derived.damageMultiplier, 7, "DM: 5 + 2 = 7");
assert.strictEqual(derived.meleeDamageMultiplier, 8, "Melee DM: 7 + 1 = 8");
assert.strictEqual(derived.armorRating, 20, "AR: (2 * 5) + (1 * 10) = 20");
console.log("✓ Test 4 Passed: Attributes modify combat values, HP, EP, DM, and Armour accurately.");

// 5. Test Skill Groups (BESM 4E p. 120-122)
console.log("Testing 5: Skill Groups (Background, Field, Action)...");
// Background: Artistic Level 2 (1 CP/lvl = 2 CP)
const artistic = BESM4E_RULES.skillGroups.find(s => s.id === "artistic");
char.addSkillGroup(artistic, 2);
// Field: Technical Level 3 (2 CP/lvl = 6 CP)
const technical = BESM4E_RULES.skillGroups.find(s => s.id === "technical");
char.addSkillGroup(technical, 3);
// Action: Detective Level 2 (3 CP/lvl = 6 CP)
const detective = BESM4E_RULES.skillGroups.find(s => s.id === "detective");
char.addSkillGroup(detective, 2);

pt = char.getPointBreakdown();
assert.strictEqual(pt.skillGroupsTotal, 14, "Skill groups: 2 + 6 + 6 = 14 CP");
console.log("✓ Test 5 Passed: Skill Groups tier costs calculated correctly.");

// 6. Test Defects and Point Refunds (Table 14)
console.log("Testing 6: Defects and Refund Calculations...");
// Lesser: Phobia Rank 1 (1 CP refund)
const phobia = BESM4E_RULES.defects.find(d => d.id === "phobia");
char.addDefect(phobia, 1);
// Greater: Wanted Rank 2 (2 * 2 = 4 CP refund)
const wanted = BESM4E_RULES.defects.find(d => d.id === "wanted");
char.addDefect(wanted, 2);
// Serious: Sensory Impairment Rank 1 (3 CP refund)
const sensory = BESM4E_RULES.defects.find(d => d.id === "sensory_impairment");
char.addDefect(sensory, 1);

pt = char.getPointBreakdown();
assert.strictEqual(pt.defectsRefund, 8, "Defects refund: 1 + 4 + 3 = 8 CP");
// Check net spent: Stats(24) + Attribs(24) + Skills(14) - Defects(8) = 54 CP
assert.strictEqual(pt.attributesTotal, 24);
assert.strictEqual(pt.netSpent, 54);
assert.strictEqual(pt.remaining, 21, "75 - 54 = 21 CP remaining");
assert.strictEqual(pt.isOverBudget, false);
console.log("✓ Test 6 Passed: Defect refunds and net budget tracking verified.");

// 7. Test Character Advancement & XP
console.log("Testing 7: Advancement and XP Tracking...");
char.addXP(10, "Defeated Shadow Syndicate Boss");
pt = char.getPointBreakdown();
assert.strictEqual(char.earnedXP, 10);
assert.strictEqual(pt.totalBudget, 85, "75 base + 10 XP = 85 CP");
assert.strictEqual(pt.remaining, 31, "85 - 54 = 31 CP available");
assert.strictEqual(char.advancementLog.length >= 2, true);
console.log("✓ Test 7 Passed: XP awarding and audit logging verified.");

// 8. Test Live In-Play Damage and Armour Absorption
console.log("Testing 8: In-Play Combat Damage Resolution...");
char.currentHealth = 60;
// Incoming attack of 28 damage against 20 AR
const dmg = char.applyDamage(28, false);
assert.strictEqual(dmg.absorbedByArmor, 20, "Armour absorbs 20 damage");
assert.strictEqual(dmg.damageDealt, 8, "28 - 20 = 8 damage dealt to Health");
assert.strictEqual(char.currentHealth, 52, "Health reduced to 52");
assert.strictEqual(dmg.isShocked, false, "8 < 10 shock threshold");

// Big hit bypassing armor: 15 damage
const bigHit = char.applyDamage(15, true);
assert.strictEqual(bigHit.damageDealt, 15);
assert.strictEqual(char.currentHealth, 37);
assert.strictEqual(bigHit.isShocked, true, "15 >= 10 shock threshold!");

// Dramatic Feat EP Spend
char.currentEnergy = 50;
const spendSuccess = char.spendEnergy(20);
assert.strictEqual(spendSuccess, true);
assert.strictEqual(char.currentEnergy, 30);
console.log("✓ Test 8 Passed: Tactical damage, armor absorption, shock threshold, and EP spending verified.");

// 9. Test BESM 4E Dice Roller (Roll-Over, Edges, Obstacles, Dramatic Feats, TNs)
console.log("Testing 9: Dice Roller (Roll-Over, Edges, Obstacles, Dramatic Feats)...");
const roller = new BESM4EDiceRoller();
roller.soundEnabled = false;

// Standard Roll
const roll1 = roller.roll({ label: "Combat Strike", mode: "standard", modifier: 6, targetNumber: 12 });
assert.strictEqual(roll1.diceRolls.length, 2);
assert.strictEqual(roll1.total, roll1.diceSum + 6);
assert.strictEqual(roll1.success, roll1.total >= 12);

// Minor Edge: 3d6, keep 2 highest
const rollEdge = roller.roll({ label: "Edge Check", mode: "minor_edge", modifier: 4, targetNumber: 10 });
assert.strictEqual(rollEdge.diceRolls.length, 3);
const keptEdge = rollEdge.diceRolls.filter(d => d.isKept).map(d => d.val);
const discEdge = rollEdge.diceRolls.filter(d => !d.isKept).map(d => d.val);
assert.strictEqual(keptEdge.length, 2);
assert.strictEqual(discEdge.length, 1);
assert.strictEqual(Math.min(...keptEdge) >= discEdge[0], true, "Kept dice must be >= discarded die");

// Major Obstacle: 4d6, keep 2 lowest
const rollObst = roller.roll({ label: "Major Obstacle Check", mode: "major_obstacle", modifier: 2 });
assert.strictEqual(rollObst.diceRolls.length, 4);
const keptObst = rollObst.diceRolls.filter(d => d.isKept).map(d => d.val);
const discObst = rollObst.diceRolls.filter(d => !d.isKept).map(d => d.val);
assert.strictEqual(keptObst.length, 2);
assert.strictEqual(discObst.length, 2);
assert.strictEqual(Math.max(...keptObst) <= Math.min(...discObst), true, "Kept dice must be <= discarded dice");

// Dramatic Feat bonus (+2 bonus for 20 EP)
const rollFeat = roller.roll({ label: "Soul Feat", modifier: 5, dramaticFeatBonus: 2, targetNumber: 14 });
assert.strictEqual(rollFeat.dramaticFeatBonus, 2);
assert.strictEqual(rollFeat.epCost, 20);
assert.strictEqual(rollFeat.modifier, 7);
assert.strictEqual(rollFeat.total, rollFeat.diceSum + 7);
console.log("✓ Test 9 Passed: BESM 4E 2d6 roll-over, edges, obstacles, and dramatic feats verified.");

// 10. Test Archetype Presets & Storage
console.log("Testing 10: Archetype Presets & LocalStorage...");
const presetChar = new BESM4ECharacter();
const loaded = presetChar.loadTemplate("magical_girl");
assert.strictEqual(loaded, true);
assert.strictEqual(presetChar.tier, "heroic");
assert.strictEqual(presetChar.stats.body, 4);
assert.strictEqual(presetChar.stats.mind, 5);
assert.strictEqual(presetChar.stats.soul, 8);
assert.strictEqual(presetChar.attributes.length > 0, true);
assert.strictEqual(presetChar.skillGroups.length > 0, true);
assert.strictEqual(presetChar.defects.length > 0, true);

// Save and reload
BESM4EStorage.saveCharacter(presetChar);
const reloaded = BESM4EStorage.loadCharacter(presetChar.id);
assert.strictEqual(reloaded.id, presetChar.id);
assert.strictEqual(reloaded.stats.soul, 8);
assert.strictEqual(reloaded.attributes.length, presetChar.attributes.length);
console.log("✓ Test 10 Passed: Archetype preset loading and storage persistence verified.");

// 11. Test Container Attributes (Item, Companion, Minions, Alternate Form)
console.log("Testing 11: Container Attributes (Item Half-Cost & Companion Budget)...");
const contChar = new BESM4ECharacter();
contChar.setHumanAverageStats(); // 24 CP spent on 4/4/4, 51 CP remaining

// Add Item: "Powered Exo-Suit"
const itemDef = BESM4E_RULES.attributes.find(a => a.id === "item");
contChar.addAttribute(itemDef, 1, "Powered Exo-Suit", "High-tech combat armor");
const suit = contChar.attributes.find(a => a.name === "Powered Exo-Suit");
assert.strictEqual(suit.isContainer, true);
assert.strictEqual(suit.containerType, "item");

// Add Contained Traits to Item:
// 1. Armour Level 4 (4 * 2 = 8 CP)
const armourDef = BESM4E_RULES.attributes.find(a => a.id === "armour");
contChar.addContainerTrait(suit.id, "attributes", armourDef, 4);

// 2. Force Field Level 2 (2 * 4 = 8 CP)
const ffDef = BESM4E_RULES.attributes.find(a => a.id === "force_field");
contChar.addContainerTrait(suit.id, "attributes", ffDef, 2);

// 3. Defect: Weak Point Rank 2 (2 * 2 = 4 CP refund)
const defectDef = BESM4E_RULES.defects.find(d => d.id === "weak_point");
contChar.addContainerTrait(suit.id, "defects", defectDef, 2);

// 4. Weapon: Plasma Blaster Level 3 (3 * 2 = 6 CP weapon value)
contChar.addContainerTrait(suit.id, "weapons", {
  name: "Plasma Blaster",
  level: 3,
  range: "50m",
  enhancements: "Armour-Piercing",
  limiters: "Charges"
});

// Net contained points = 8 + 8 - 4 + 6 = 18 CP
const suitPts = contChar.getContainerPoints(suit);
assert.strictEqual(suitPts.attributesCost, 16); // 8 + 8
assert.strictEqual(suitPts.defectsRefund, 4);
assert.strictEqual(suitPts.weaponsCost, 6);
assert.strictEqual(suitPts.netContainedPoints, 18);
// BESM 4E p. 101: Item cost is strictly half the net contained value rounded down
assert.strictEqual(suitPts.effectiveCharacterCost, 9, "18 / 2 = 9 CP character cost");

// Verify Point Breakdown includes Item half-cost
const ptCont = contChar.getPointBreakdown();
// Attributes total should be 9 CP
assert.strictEqual(ptCont.attributesTotal, 9);
assert.strictEqual(ptCont.netSpent, 24 + 9, "24 stats + 9 item = 33 CP total net spent");

// Verify Item Armour & Force Field enhance character's Derived Stats
// Armour 4 (20 AR) + Force Field 2 (20 AR) = 40 AR
const contDerived = contChar.getDerived();
assert.strictEqual(contDerived.armorRating, 40, "Character derives 40 AR from Item's Armour & Force Field");

// Verify getAllWeapons() includes Item weapon
const allWpns = contChar.getAllWeapons();
assert.strictEqual(allWpns.length, 1);
assert.strictEqual(allWpns[0].name, "Plasma Blaster");
assert.strictEqual(allWpns[0].containerName, "Powered Exo-Suit");

// Add Companion: "Cyber-Hound" (Level 2 = 8 CP character cost, 20 CP budget)
const compDef = BESM4E_RULES.attributes.find(a => a.id === "companion");
contChar.addAttribute(compDef, 2, "Cyber-Hound", "Robotic combat pet");
const hound = contChar.attributes.find(a => a.name === "Cyber-Hound");
assert.strictEqual(hound.isContainer, true);
assert.strictEqual(hound.containerType, "companion");

// Set Companion Stats: Body 3, Mind 3, Soul 3 = 6 + 6 + 6 = 18 CP
contChar.setContainerStat(hound.id, "body", 3);
contChar.setContainerStat(hound.id, "mind", 3);
contChar.setContainerStat(hound.id, "soul", 3);

// Add Companion Sub-Trait: Armour Level 1 (2 CP)
contChar.addContainerTrait(hound.id, "attributes", armourDef, 1);

const houndPts = contChar.getContainerPoints(hound);
assert.strictEqual(houndPts.effectiveCharacterCost, 8, "Level 2 Companion costs 8 CP");
assert.strictEqual(houndPts.budgetAllowance, 20, "Level 2 grants 20 CP budget");
assert.strictEqual(houndPts.statsCost, 18, "Body 3, Mind 3, Soul 3 = 18 CP");
assert.strictEqual(houndPts.attributesCost, 2, "Armour 1 = 2 CP");
assert.strictEqual(houndPts.netContainedPoints, 20);
assert.strictEqual(houndPts.remainingBudget, 0, "20 budget - 20 spent = 0 CP remaining");

// Companion Derived Stats
const houndDerived = contChar.getContainerDerived(hound.id);
assert.strictEqual(houndDerived.baseCV, 3, "(3+3+3)/3 = 3");
assert.strictEqual(houndDerived.maxHealth, 30, "(3+3)*5 = 30 HP");
assert.strictEqual(houndDerived.maxEnergy, 30, "(3+3)*5 = 30 EP");
assert.strictEqual(houndDerived.armorRating, 5, "Companion has 5 AR from Armour 1");

console.log("✓ Test 11 Passed: Container Attributes (Item 1/2 cost, Companion budget & stats, weapons) verified.");

// 12. Test Storage Persistence & Markdown Generation with Containers
console.log("Testing 12: Container Storage Persistence & Markdown Generation...");
BESM4EStorage.saveCharacter(contChar);
const reloadedCont = BESM4EStorage.loadCharacter(contChar.id);
assert.strictEqual(reloadedCont.attributes.length, 2);
const reloadedSuit = reloadedCont.attributes.find(a => a.name === "Powered Exo-Suit");
assert.strictEqual(reloadedSuit.containerTraits.attributes.length, 2);
assert.strictEqual(reloadedSuit.containerTraits.defects.length, 1);
assert.strictEqual(reloadedSuit.containerTraits.weapons.length, 1);

const reloadedHound = reloadedCont.attributes.find(a => a.name === "Cyber-Hound");
assert.strictEqual(reloadedHound.containerStats.body, 3);
assert.strictEqual(reloadedHound.containerStats.mind, 3);
assert.strictEqual(reloadedHound.containerStats.soul, 3);
assert.strictEqual(reloadedHound.containerTraits.attributes.length, 1);

// Test Markdown Generation contains container details
const md = BESM4EStorage.generateMarkdown(contChar);
assert.strictEqual(md.includes("Powered Exo-Suit"), true);
assert.strictEqual(md.includes("Cyber-Hound"), true);
assert.strictEqual(md.includes("1/2 cost applied"), true);
assert.strictEqual(md.includes("Plasma Blaster"), true);
console.log("✓ Test 12 Passed: Container storage persistence and Markdown generation verified.");

// 13. Test BESM 4th Edition Extras Content & Expansion Catalogs
console.log("Testing 13: BESM Extras Attributes, Defects, Chassis, and Catalogs...");

// 13.1 Check Attributes Expansion (94 attributes)
assert.strictEqual(BESM4E_RULES.attributes.length >= 94, true, `Must have >= 94 attributes, found ${BESM4E_RULES.attributes.length}`);
const extrasAttrs = ["chassis", "expertise", "extra_defenses", "immovable", "social_mastery", "taunt", "unassailable", "death_dodge", "debilitate", "flank_defense", "speed_burst"];
extrasAttrs.forEach(id => {
  const def = BESM4E_RULES.getAttributeDef(id);
  assert.ok(def, `Attribute "${id}" from BESM Extras must exist`);
  assert.ok(def.name, `Attribute "${id}" must have a name`);
  assert.ok(def.costPerLevel > 0, `Attribute "${id}" must have a valid cost`);
  assert.ok(def.description && def.description.length > 10, `Attribute "${id}" must have a detailed description`);
});

// 13.2 Check Defects Expansion (38 defects)
assert.strictEqual(BESM4E_RULES.defects.length >= 38, true, `Must have >= 38 defects, found ${BESM4E_RULES.defects.length}`);
const extrasDefects = ["no_healing", "demure", "unsettled", "awkward_size"];
extrasDefects.forEach(id => {
  const def = BESM4E_RULES.getDefectDef(id);
  assert.ok(def, `Defect "${id}" from BESM Extras must exist`);
  assert.ok(def.name, `Defect "${id}" must have a name`);
  assert.ok(def.refundPerRank > 0, `Defect "${id}" must have a refund`);
  assert.ok(def.description && def.description.length > 10, `Defect "${id}" must have a detailed description`);
});

// 13.3 Check Weapon Enhancements & Limiters Catalogs
assert.strictEqual(BESM4E_RULES.weaponEnhancements.length >= 38, true, `Must have >= 38 weapon enhancements, found ${BESM4E_RULES.weaponEnhancements.length}`);
assert.strictEqual(BESM4E_RULES.weaponLimiters.length >= 35, true, `Must have >= 35 weapon limiters, found ${BESM4E_RULES.weaponLimiters.length}`);

// Check specific enhancements
const sampleEnh = ["Autofire", "Piercing", "Penetrating", "Area Effect", "Homing", "Spreading", "Vampiric"];
sampleEnh.forEach(name => {
  const enh = BESM4E_RULES.weaponEnhancements.find(e => e.name.toLowerCase() === name.toLowerCase());
  assert.ok(enh, `Enhancement "${name}" must exist in catalog`);
  const cost = enh.costPerRank || enh.costPerLevel;
  assert.ok(cost > 0, `Enhancement "${name}" must have cost > 0`);
});

// Check specific limiters
const sampleLim = ["Activation", "Ammo", "Backlash", "Charges", "Consumable", "Hands", "Recoil"];
sampleLim.forEach(name => {
  const lim = BESM4E_RULES.weaponLimiters.find(l => l.name.toLowerCase() === name.toLowerCase());
  assert.ok(lim, `Limiter "${name}" must exist in catalog`);
  assert.ok(lim.refundPerRank > 0, `Limiter "${name}" must have refundPerRank > 0`);
});

// 13.4 Check Constituent Skills within Skill Groups
assert.strictEqual(BESM4E_RULES.skillGroups.length, 12, "Must have exactly 12 standard skill groups");
let totalSkillsCount = 0;
BESM4E_RULES.skillGroups.forEach(sg => {
  const constituents = BESM4E_RULES.getConstituentSkills(sg.id);
  assert.ok(constituents.length >= 3, `Skill group "${sg.name}" must contain constituent skills (found ${constituents.length})`);
  totalSkillsCount += constituents.length;
  constituents.forEach(skill => {
    assert.ok(skill.name, "Skill must have a name");
    assert.ok(["Body", "Mind", "Soul"].includes(skill.stat), `Skill "${skill.name}" must have valid stat (Body, Mind, or Soul), found: ${skill.stat}`);
    assert.ok(Array.isArray(skill.specializations) && skill.specializations.length > 0, `Skill "${skill.name}" must have specializations`);
    assert.ok(skill.description && skill.description.length > 5, `Skill "${skill.name}" must have a description`);
  });
});
assert.strictEqual(totalSkillsCount >= 106, true, `Must have >= 106 constituent skills across all 12 groups, found ${totalSkillsCount}`);

console.log("✓ Test 13 Passed: BESM Extras attributes, defects, constituent skills, and weapon catalogs verified.");

// 14. Test Chassis Container Attribute Mechanics & Contained Descriptions
console.log("Testing 14: Chassis Container (BESM Extras) Mechanics & Descriptions...");
const mechaChar = new BESM4ECharacter();
mechaChar.setHumanAverageStats(); // 24 CP spent, 51 remaining

// Add Chassis Attribute (Level 1)
const chassisDef = BESM4E_RULES.getAttributeDef("chassis");
mechaChar.addAttribute(chassisDef, 1, "Type-99 Valkyrie Frame", "Heavy transformable combat mecha");
const mecha = mechaChar.attributes.find(a => a.name === "Type-99 Valkyrie Frame");
assert.ok(mecha, "Chassis container attribute must exist on character");
assert.strictEqual(mecha.isContainer, true);
assert.strictEqual(mecha.containerType, "chassis");

// Contained trait descriptions check
assert.strictEqual(mecha.customDesc, "Heavy transformable combat mecha");

// Add Contained Traits to Chassis:
// 1. Armour Level 6 (6 * 2 = 12 CP)
const chassisArmour = BESM4E_RULES.getAttributeDef("armour");
mechaChar.addContainerTrait(mecha.id, "attributes", chassisArmour, 6);
const containedArmour = mecha.containerTraits.attributes[0];
assert.strictEqual(containedArmour.name, "Armour");
assert.ok(containedArmour.customDesc.includes("reduces damage") || containedArmour.customDesc.length > 0, "Contained Armour must preserve description");

// 2. Immovable Level 2 (2 * 1 = 2 CP) [BESM Extras]
const chassisImmovable = BESM4E_RULES.getAttributeDef("immovable");
mechaChar.addContainerTrait(mecha.id, "attributes", chassisImmovable, 2);

// 3. Technical Skill Group Level 2 (2 * 2 = 4 CP)
const chassisTechnical = BESM4E_RULES.getSkillGroupDef("technical");
mechaChar.addContainerTrait(mecha.id, "skillGroups", chassisTechnical, 2);

// 4. Defect: Awkward Size Rank 2 (2 * 1 = 2 CP refund) [BESM Extras]
const chassisAwkward = BESM4E_RULES.getDefectDef("awkward_size");
mechaChar.addContainerTrait(mecha.id, "defects", chassisAwkward, 2);

// 5. Weapon: Heavy Railgun Level 4 (4 * 2 = 8 CP weapon value)
mechaChar.addContainerTrait(mecha.id, "weapons", {
  name: "Heavy Railgun",
  level: 4,
  range: "1 km",
  enhancements: "Armour-Piercing, Piercing",
  limiters: "Ammo, Recoil"
});

// Net Contained Value: 14 (attributes) + 4 (technical) - 4 (awkward size rank 2) + 8 (weapon) = 22 CP
const mechaPts = mechaChar.getContainerPoints(mecha);
assert.strictEqual(mechaPts.attributesCost, 14); // 12 + 2
assert.strictEqual(mechaPts.skillGroupsCost, 4);
assert.strictEqual(mechaPts.defectsRefund, 4); // Rank 2 * 2 CP/rk
assert.strictEqual(mechaPts.weaponsCost, 8);
assert.strictEqual(mechaPts.netContainedPoints, 22);

// Chassis cost: floor(22 / 2) = 11 CP
assert.strictEqual(mechaPts.effectiveCharacterCost, 11, "Chassis cost is floor(22 / 2) = 11 CP");

// Character derived AR integrates Chassis Armour: 6 * 5 = 30 AR
const mechaDerived = mechaChar.getDerived();
assert.strictEqual(mechaDerived.armorRating, 30, "Character derived stats must integrate Chassis Armour (30 AR)");

// getAllWeapons() includes Chassis weapon with container attribution
const mechaWeapons = mechaChar.getAllWeapons();
assert.strictEqual(mechaWeapons.length, 1);
assert.strictEqual(mechaWeapons[0].name, "Heavy Railgun");
assert.strictEqual(mechaWeapons[0].containerName, "Type-99 Valkyrie Frame");
assert.strictEqual(mechaWeapons[0].enhancements, "Armour-Piercing, Piercing");
assert.strictEqual(mechaWeapons[0].limiters, "Ammo, Recoil");

console.log("✓ Test 14 Passed: Chassis container (BESM Extras) half-cost, derived stats, and trait descriptions verified.");

// -------------------------------------------------------------
// Test 15: Individual Constituent Skills & Container Skills (BESM 4E p. 120-123)
// -------------------------------------------------------------
console.log("Testing 15: Individual Constituent Skills & Container Skills...");
const indivChar = new BESM4ECharacter({ name: "Detective Inspector", tier: "heroic" });

// 1. Verify getSkillDef and getAllConstituentSkills lookups
const stealthDef = BESM4E_RULES.getSkillDef("stealth");
assert.ok(stealthDef, "getSkillDef must locate stealth");
assert.strictEqual(stealthDef.name, "Stealth");
assert.strictEqual(stealthDef.costPerLevel, 1, "Individual constituent skill costs 1 CP/level");
assert.strictEqual(stealthDef.stat, "Body");

const allConstituents = BESM4E_RULES.getAllConstituentSkills();
assert.ok(allConstituents.length >= 100, `Must have all constituent skills (found ${allConstituents.length})`);

// 2. Add individual skills to character
indivChar.addSkill(stealthDef, 2, "Shadowing");
const forensicsDef = BESM4E_RULES.getSkillDef("forensics");
indivChar.addSkill(forensicsDef, 3, "Ballistics");

assert.strictEqual(indivChar.skills.length, 2);
assert.strictEqual(indivChar.skills[0].name, "Stealth");
assert.strictEqual(indivChar.skills[0].level, 2);
assert.strictEqual(indivChar.skills[0].specialization, "Shadowing");
assert.strictEqual(indivChar.skills[1].name, "Forensics");
assert.strictEqual(indivChar.skills[1].level, 3);
assert.strictEqual(indivChar.skills[1].specialization, "Ballistics");

// Point cost: Stealth (2 * 1 = 2 CP) + Forensics (3 * 1 = 3 CP) = 5 CP
const indivBreakdown = indivChar.getPointBreakdown();
assert.strictEqual(indivBreakdown.skillsTotal, 5, "Individual skills cost 1 CP per level (2 + 3 = 5 CP)");
assert.strictEqual(indivBreakdown.netSpent, 5);

// 3. Level steppers and removal
indivChar.updateSkillLevel("stealth", 1); // Level 3
assert.strictEqual(indivChar.skills.find(s => s.id === "stealth").level, 3);
assert.strictEqual(indivChar.getPointBreakdown().skillsTotal, 6);

indivChar.removeSkill("stealth");
assert.strictEqual(indivChar.skills.length, 1);
assert.strictEqual(indivChar.getPointBreakdown().skillsTotal, 3);

// 4. Add individual skills to a container (Item container)
const toolBelt = {
  id: "item_utility_belt",
  name: "Forensic Utility Rig",
  isContainer: true,
  containerType: "item",
  level: 1,
  costPerLevel: 0.5,
  containerTraits: { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] }
};
indivChar.addAttribute(toolBelt, 1);

// Add Computers skill (Level 2 = 2 CP) and Electronics (Level 2 = 2 CP) to container
const compSkillDef = BESM4E_RULES.getSkillDef("computers");
const elecSkillDef = BESM4E_RULES.getSkillDef("electronics");
indivChar.addContainerTrait(toolBelt.id, "skills", compSkillDef, 2, null, null, "Hacking");
indivChar.addContainerTrait(toolBelt.id, "skills", elecSkillDef, 2, null, null, "Bug Sweeping");

const beltContained = indivChar.getContainerAttribute(toolBelt.id);
assert.strictEqual(beltContained.containerTraits.skills.length, 2);
assert.strictEqual(beltContained.containerTraits.skills[0].name, "Computers");
assert.strictEqual(beltContained.containerTraits.skills[0].specialization, "Hacking");
assert.strictEqual(beltContained.containerTraits.skills[1].name, "Electronics");

// Container Points: 2 + 2 = 4 CP contained -> half-cost floor(4 / 2) = 2 CP for Item
const beltPts = indivChar.getContainerPoints(toolBelt.id);
assert.strictEqual(beltPts.skillsCost, 4, "Contained skills cost 4 CP (2 * 1 + 2 * 1)");
assert.strictEqual(beltPts.netContainedPoints, 4);
assert.strictEqual(beltPts.effectiveCharacterCost, 2, "Item half-cost applied to contained skills: floor(4/2) = 2 CP");

// Update container skill level
indivChar.updateContainerTraitLevel(toolBelt.id, "skills", "computers", 1); // Level 3
assert.strictEqual(beltContained.containerTraits.skills[0].level, 3);
assert.strictEqual(indivChar.getContainerPoints(toolBelt.id).skillsCost, 5); // 3 + 2 = 5 CP -> floor(5/2) = 2 CP

// Remove container skill
indivChar.removeContainerTrait(toolBelt.id, "skills", "electronics");
assert.strictEqual(beltContained.containerTraits.skills.length, 1);
assert.strictEqual(indivChar.getContainerPoints(toolBelt.id).skillsCost, 3);

// 5. Add individual skills to Companion container
const drone = {
  id: "companion_scout_drone",
  name: "AI Recon Drone",
  isContainer: true,
  containerType: "companion",
  level: 2,
  costPerLevel: 4,
  containerStats: { body: 2, mind: 4, soul: 1 },
  containerTraits: { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] }
};
indivChar.addAttribute(drone, 2);

// Add Navigation skill (Level 2 = 2 CP) to Drone
const navDef = BESM4E_RULES.getSkillDef("navigation");
indivChar.addContainerTrait(drone.id, "skills", navDef, 2, null, null, "Air");
const dronePts = indivChar.getContainerPoints(drone.id);
assert.strictEqual(dronePts.skillsCost, 2);
assert.strictEqual(dronePts.budgetAllowance, 20, "Level 2 Companion has 20 CP budget");
// Stats: 2*2 + 4*2 + 1*2 = 14 CP + 2 CP skills = 16 CP spent, 4 CP left
assert.strictEqual(dronePts.netContainedPoints, 16);
assert.strictEqual(dronePts.remainingBudget, 4);

// 6. Serialization and Markdown export
const json = indivChar.toJSON();
assert.ok(Array.isArray(json.skills), "toJSON must output skills array");
assert.strictEqual(json.skills.length, 1);
assert.strictEqual(json.skills[0].name, "Forensics");

const restoredChar = new BESM4ECharacter(json);
assert.strictEqual(restoredChar.skills.length, 1);
assert.strictEqual(restoredChar.skills[0].name, "Forensics");
assert.strictEqual(restoredChar.skills[0].specialization, "Ballistics");

const indivMd = BESM4EStorage.generateMarkdown(indivChar);
assert.ok(indivMd.includes("Forensics (Ballistics)"), "Markdown must contain individual skill with specialization");
assert.ok(indivMd.includes("*Skill:* Computers (Hacking)"), "Markdown must contain container individual skill");
assert.ok(indivMd.includes("*Skill:* Navigation (Air)"), "Markdown must contain companion individual skill");

console.log("✓ Test 15 Passed: Individual constituent skills & container skills (1 CP/lvl), half-cost, and markdown verified.");

// 16. Test Trait Sub-Traits, User Details, Multi-Instance, and Persistence
console.log("Testing 16: Sub-Traits Dropdowns, User-Supplied Details & Multi-Instance Traits...");
const detailChar = new BESM4ECharacter();
detailChar.setHumanAverageStats();

// 1. Multi-instance Combat Technique with distinct sub-traits
const ctDef = BESM4E_RULES.getAttributeDef("combat_technique");
detailChar.addAttribute(ctDef, 1, null, null, "Deflection");
detailChar.addAttribute(ctDef, 1, null, null, "Lightning Reflexes");

assert.strictEqual(detailChar.attributes.length, 2);
assert.strictEqual(detailChar.attributes[0].name, "Combat Technique");
assert.strictEqual(detailChar.attributes[0].subTrait, "Deflection");
assert.strictEqual(detailChar.attributes[1].name, "Combat Technique");
assert.strictEqual(detailChar.attributes[1].subTrait, "Lightning Reflexes");
assert.notStrictEqual(detailChar.attributes[0].id, detailChar.attributes[1].id, "Multi-instance traits must have unique IDs");

// 2. Multi-instance traits with user-supplied details (Melee Attack)
const meleeDef = BESM4E_RULES.getAttributeDef("melee_attack");
detailChar.addAttribute(meleeDef, 2, null, null, "", "Katana");
detailChar.addAttribute(meleeDef, 1, null, null, "", "Judo");

assert.strictEqual(detailChar.attributes.length, 4);
const katanaAtk = detailChar.attributes.find(a => a.detail === "Katana");
const judoAtk = detailChar.attributes.find(a => a.detail === "Judo");
assert.ok(katanaAtk, "Katana attack must exist");
assert.ok(judoAtk, "Judo attack must exist");
assert.strictEqual(katanaAtk.level, 2);
assert.strictEqual(judoAtk.level, 1);

// 3. Multi-instance defects with user-supplied details (Achilles Heel, Nemesis)
const achillesDef = BESM4E_RULES.getDefectDef("achilles_heel");
detailChar.addDefect(achillesDef, 1, null, "Silver");
detailChar.addDefect(achillesDef, 2, null, "Cold Iron");
const nemesisDef = BESM4E_RULES.getDefectDef("nemesis");
detailChar.addDefect(nemesisDef, 1, null, "High School Rival");

assert.strictEqual(detailChar.defects.length, 3);
const silverDef = detailChar.defects.find(d => d.detail === "Silver");
const ironDef = detailChar.defects.find(d => d.detail === "Cold Iron");
const nemesis = detailChar.defects.find(d => d.detail === "High School Rival");
assert.ok(silverDef);
assert.ok(ironDef);
assert.ok(nemesis);
assert.notStrictEqual(silverDef.id, ironDef.id, "Multi-instance defects must have unique IDs");

// 4. Update methods: sub-traits and details
detailChar.updateAttributeSubTrait(detailChar.attributes[0].id, "Critical Strike");
assert.strictEqual(detailChar.attributes[0].subTrait, "Critical Strike");

detailChar.updateAttributeDetail(katanaAtk.id, "Naginata");
assert.strictEqual(katanaAtk.detail, "Naginata");

detailChar.updateDefectDetail(nemesis.id, "Shadow Syndicate Executive");
assert.strictEqual(nemesis.detail, "Shadow Syndicate Executive");

// 5. Container attributes with sub-traits and details
const armorItem = {
  id: "item_cyber_armor",
  name: "Cybernetic Exo-Suit",
  isContainer: true,
  containerType: "item",
  level: 1,
  costPerLevel: 0.5,
  containerTraits: { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] }
};
detailChar.addAttribute(armorItem, 1);

const augDef = BESM4E_RULES.getAttributeDef("augmented");
detailChar.addContainerTrait(armorItem.id, "attributes", augDef, 2, null, null, "", "Body");

const enemyDef = BESM4E_RULES.getAttributeDef("enemy_defence");
detailChar.addContainerTrait(armorItem.id, "attributes", enemyDef, 1, null, null, "", "", "Demons");

const baneDef = BESM4E_RULES.getDefectDef("bane");
detailChar.addContainerTrait(armorItem.id, "defects", baneDef, 2, null, null, "", "", "Holy Water");

const cyberContainer = detailChar.getContainerAttribute(armorItem.id);
assert.strictEqual(cyberContainer.containerTraits.attributes.length, 2);
assert.strictEqual(cyberContainer.containerTraits.attributes[0].subTrait, "Body");
assert.strictEqual(cyberContainer.containerTraits.attributes[1].detail, "Demons");
assert.strictEqual(cyberContainer.containerTraits.defects.length, 1);
assert.strictEqual(cyberContainer.containerTraits.defects[0].detail, "Holy Water");

// Update container traits sub-trait and detail
detailChar.updateContainerTraitSubTrait(armorItem.id, cyberContainer.containerTraits.attributes[0].id, "Mind");
assert.strictEqual(cyberContainer.containerTraits.attributes[0].subTrait, "Mind");

detailChar.updateContainerTraitDetail(armorItem.id, "attributes", cyberContainer.containerTraits.attributes[1].id, "Undead");
assert.strictEqual(cyberContainer.containerTraits.attributes[1].detail, "Undead");

detailChar.updateContainerTraitDetail(armorItem.id, "defects", cyberContainer.containerTraits.defects[0].id, "Sunlight");
assert.strictEqual(cyberContainer.containerTraits.defects[0].detail, "Sunlight");

// 6. Serialization and restoration
const detailJson = detailChar.toJSON();
const restoredDetailChar = new BESM4ECharacter(detailJson);

assert.strictEqual(restoredDetailChar.attributes[0].subTrait, "Critical Strike");
const restoredNaginata = restoredDetailChar.attributes.find(a => a.detail === "Naginata");
assert.ok(restoredNaginata);
assert.strictEqual(restoredNaginata.level, 2);

const restoredNemesis = restoredDetailChar.defects.find(d => d.detail === "Shadow Syndicate Executive");
assert.ok(restoredNemesis);

const restoredCont = restoredDetailChar.getContainerAttribute(armorItem.id);
assert.strictEqual(restoredCont.containerTraits.attributes[0].subTrait, "Mind");
assert.strictEqual(restoredCont.containerTraits.attributes[1].detail, "Undead");
assert.strictEqual(restoredCont.containerTraits.defects[0].detail, "Sunlight");

// 7. Markdown export verification
const detailMd = BESM4EStorage.generateMarkdown(detailChar);
assert.ok(detailMd.includes("Combat Technique (Critical Strike)"), "Markdown must format sub-trait in parentheses");
assert.ok(detailMd.includes("Melee Attack [Naginata]"), "Markdown must format detail in brackets");
assert.ok(detailMd.includes("Nemesis [Shadow Syndicate Executive]"), "Markdown must format defect detail");
assert.ok(detailMd.includes("*Attribute:* Augmented (Mind)"), "Markdown must include contained sub-trait");
assert.ok(detailMd.includes("*Attribute:* Enemy Defence [Undead]"), "Markdown must include contained detail");
assert.ok(detailMd.includes("*Defect:* Bane [Sunlight]"), "Markdown must include contained defect detail");

console.log("✓ Test 16 Passed: Sub-traits dropdowns, user-supplied details, multi-instances, and markdown export verified.");

// 17. Test Dead Eye & Sub-Trait Catalog Selection & UI Verification
console.log("Testing 17: Dead Eye, Catalog Sub-Trait Picker & Multi-Techniques Verification...");
const deChar = new BESM4ECharacter();
deChar.setHumanAverageStats();

// 1. Verify Dead Eye exists in Combat Technique rule definition
const ctRulesDef = BESM4E_RULES.getAttributeDef("combat_technique");
assert.ok(ctRulesDef, "Combat Technique definition must exist");
assert.ok(Array.isArray(ctRulesDef.subTraits), "Combat Technique must have subTraits array");
assert.ok(ctRulesDef.subTraits.includes("Dead Eye"), "Combat Technique subTraits MUST contain 'Dead Eye'");
assert.strictEqual(ctRulesDef.subTraitLabel, "Martial Technique");

// 2. Add Combat Technique with Dead Eye directly
deChar.addAttribute(ctRulesDef, 1, null, null, "Dead Eye");
assert.strictEqual(deChar.attributes.length, 1);
assert.strictEqual(deChar.attributes[0].name, "Combat Technique");
assert.strictEqual(deChar.attributes[0].subTrait, "Dead Eye");

// 3. Add second Combat Technique with Two Weapons
deChar.addAttribute(ctRulesDef, 1, null, null, "Two Weapons");
assert.strictEqual(deChar.attributes.length, 2);
assert.strictEqual(deChar.attributes[1].subTrait, "Two Weapons");
assert.notStrictEqual(deChar.attributes[0].id, deChar.attributes[1].id, "Multi-technique instances must have unique IDs");

// 4. Verify Catalog Search logic for 'dead eye' matches Combat Technique
const searchQuery = "dead eye";
const matchedAttributes = BESM4E_RULES.attributes.filter(a => {
  const matchSubTraits = Array.isArray(a.subTraits) && a.subTraits.some(st => st.toLowerCase().includes(searchQuery));
  return a.name.toLowerCase().includes(searchQuery) || matchSubTraits;
});
assert.strictEqual(matchedAttributes.length, 1);
assert.strictEqual(matchedAttributes[0].id, "combat_technique");
const matchedSubTrait = matchedAttributes[0].subTraits.find(st => st.toLowerCase().includes(searchQuery));
assert.strictEqual(matchedSubTrait, "Dead Eye");

// 5. Verify adding Dead Eye inside an Item container
const sniperRifle = {
  id: "item_sniper_rifle",
  name: "Anti-Materiel Sniper Rifle",
  isContainer: true,
  containerType: "item",
  level: 1,
  costPerLevel: 0.5,
  containerTraits: { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] }
};
deChar.addAttribute(sniperRifle, 1);
deChar.addContainerTrait(sniperRifle.id, "attributes", ctRulesDef, 1, null, null, "", "Dead Eye");

const contSniper = deChar.getContainerAttribute(sniperRifle.id);
assert.strictEqual(contSniper.containerTraits.attributes.length, 1);
assert.strictEqual(contSniper.containerTraits.attributes[0].subTrait, "Dead Eye");

// 6. Verify serialization and Markdown formatting for Dead Eye
const deJson = deChar.toJSON();
const restoredDeChar = new BESM4ECharacter(deJson);
assert.strictEqual(restoredDeChar.attributes[0].subTrait, "Dead Eye");
assert.strictEqual(restoredDeChar.attributes[1].subTrait, "Two Weapons");
const restoredSniperCont = restoredDeChar.getContainerAttribute(sniperRifle.id);
assert.strictEqual(restoredSniperCont.containerTraits.attributes[0].subTrait, "Dead Eye");

const deMd = BESM4EStorage.generateMarkdown(deChar);
assert.ok(deMd.includes("Combat Technique (Dead Eye)"), "Markdown must format Combat Technique (Dead Eye)");
assert.ok(deMd.includes("Combat Technique (Two Weapons)"), "Markdown must format Combat Technique (Two Weapons)");
assert.ok(deMd.includes("*Attribute:* Combat Technique (Dead Eye)"), "Container markdown must format Combat Technique (Dead Eye)");

console.log("✓ Test 17 Passed: Dead Eye, Catalog Sub-Trait Picker & Multi-Techniques verified successfully.");

// 18. Test Conventional File System, .besm4e Extension & Default Save Folder
console.log("Testing 18: .besm4e Extension, Default Save Folder & File Parsing...");
assert.strictEqual(BESM4EStorage.DEFAULT_EXTENSION, ".besm4e", "Default file extension must be .besm4e");

const testCharFile = new BESM4ECharacter({ name: "Kaito Senju", concept: "Cyber Ninja", tier: "heroic" });
const safeName = BESM4EStorage.formatSafeFilename(testCharFile);
assert.strictEqual(safeName, "kaito_senju.besm4e", "Safe filename must be kaito_senju.besm4e");

BESM4EStorage.setDefaultFolderName("H:\\My Drive\\RPG development\\BESM 4E");
assert.strictEqual(BESM4EStorage.getDefaultFolderName(), "H:\\My Drive\\RPG development\\BESM 4E", "Default folder must be persisted");
BESM4EStorage.clearDefaultFolder();
assert.strictEqual(BESM4EStorage.getDefaultFolderName(), "", "Default folder cleared successfully");

const serialized = JSON.stringify(testCharFile.toJSON());
const parsedChar = BESM4EStorage.parseCharacter(serialized);
assert.strictEqual(parsedChar.name, "Kaito Senju");
assert.strictEqual(parsedChar.concept, "Cyber Ninja");
assert.strictEqual(parsedChar.tier, "heroic");

console.log("✓ Test 18 Passed: .besm4e custom extension, safe file naming, folder persistence, and character parsing verified.");

// 19. Test Desktop File Menu Bar, Header Layout & Minimum 12pt Font Compliance
console.log("Testing 19: Desktop File Menu Bar, Title Row Alignment & 12pt Font Compliance...");
const fs = require('fs');
const htmlContent = fs.readFileSync('./index.html', 'utf8');
const cssContent = fs.readFileSync('./css/app.css', 'utf8');

// A. File Menu Structure & Title Row Placement
assert.ok(htmlContent.includes('class="brand-title-row"'), "brand-title-row must exist");
assert.ok(htmlContent.includes('class="app-menu-bar"'), "app-menu-bar must exist");
assert.ok(htmlContent.includes('id="menu-file-trigger"'), "File menu trigger button must exist");
assert.ok(htmlContent.includes('id="menu-file-dropdown"'), "File menu dropdown panel must exist");

// B. Save/Load Functions in File Menu
assert.ok(htmlContent.includes('id="btn-new-char"'), "New Character button must exist in File menu");
assert.ok(htmlContent.includes('id="btn-quick-save"'), "Quick Save button must exist in File menu");
assert.ok(htmlContent.includes('id="btn-save-as-file"'), "Save As button must exist in File menu");
assert.ok(htmlContent.includes('id="btn-open-load-dialog"'), "Open / Load button must exist in File menu");
assert.ok(htmlContent.includes('id="btn-header-set-folder"'), "Set Default Save Folder button must exist in File menu");
assert.ok(htmlContent.includes('id="btn-open-library-menu"'), "Manage Library button must exist in File menu");
assert.ok(htmlContent.includes('id="btn-menu-export-md"'), "Export Markdown button must exist in File menu");

// C. Header Actions Streamlined
assert.ok(!htmlContent.includes('class="header-file-actions"'), "header-file-actions must be removed from header-actions");
assert.ok(htmlContent.includes('id="char-select-dropdown"'), "Character dropdown must exist in header-actions");
assert.ok(htmlContent.includes('id="points-chip"'), "Points chip must exist in header-actions");
assert.ok(htmlContent.includes('id="btn-toggle-roller"'), "Dice roller toggle must exist in header-actions");
assert.ok(htmlContent.includes('id="btn-toggle-theme"'), "Theme toggle must exist in header-actions");

// D. Markdown Export File Generation
const exportChar = new BESM4ECharacter({ name: "Ryu Hazuki", concept: "Martial Artist", tier: "heroic" });
const mdOutput = BESM4EStorage.generateMarkdown(exportChar);
assert.ok(mdOutput.includes("# Ryu Hazuki"), "Generated markdown must contain character title");
assert.ok(mdOutput.includes("Martial Artist"), "Generated markdown must contain concept");

// E. App-Wide Minimum Font Size (12pt / 16px) Compliance Check
const ptMatches = [...cssContent.matchAll(/font-size:\s*([0-9.]+)pt/gi)];
for (const match of ptMatches) {
  const val = parseFloat(match[1]);
  assert.ok(val >= 12, `CSS font-size ${val}pt is below minimum 12pt`);
}
const pxMatches = [...cssContent.matchAll(/font-size:\s*([0-9.]+)px/gi)];
for (const match of pxMatches) {
  const val = parseFloat(match[1]);
  assert.ok(val >= 16, `CSS font-size ${val}px is below minimum 16px (12pt equivalent)`);
}

console.log("✓ Test 19 Passed: Desktop File Menu on title row, save/load consolidation & 12pt font compliance verified.");

// 20. Test Default Folder Tree Browser & Character Sheet Print Preview on File Menu
console.log("Testing 20: System Folder Tree Browser & Print Preview on File Menu...");
// A. Character Sheet Print Preview moved from tab to File Menu
assert.ok(!htmlContent.includes('data-tab="sheet-pane"'), "sheet-pane tab must NOT exist in nav-tabs");
assert.ok(htmlContent.includes('id="btn-menu-print-preview"'), "Print Preview button must exist in File Menu");
assert.ok(htmlContent.includes('id="modal-print-preview"'), "modal-print-preview must exist in DOM");
assert.ok(htmlContent.includes('id="btn-modal-print-sheet"'), "Modal print sheet button must exist");
assert.ok(htmlContent.includes('id="btn-modal-copy-markdown"'), "Modal copy markdown button must exist");
assert.ok(htmlContent.includes('id="print-sheet-content"'), "Print sheet content container must exist");

// B. System Folder Tree Browser & Settings Modal
assert.ok(htmlContent.includes('id="native-folder-picker-input"'), "Native folder picker input must exist");
assert.ok(htmlContent.includes('webkitdirectory'), "Native folder input must have webkitdirectory attribute");
assert.ok(htmlContent.includes('id="modal-folder-settings"'), "modal-folder-settings must exist");
assert.ok(htmlContent.includes('id="btn-browse-folder-tree"'), "Browse folder tree button must exist");
assert.ok(htmlContent.includes('id="input-folder-path"'), "Manual folder path input must exist");
assert.ok(htmlContent.includes('id="btn-save-folder-path"'), "Set folder path button must exist");
assert.ok(htmlContent.includes('btn-folder-preset'), "Quick folder preset buttons must exist");

// C. Print Media Query Verification
assert.ok(cssContent.includes('#modal-print-preview'), "Print CSS must configure #modal-print-preview");
assert.ok(cssContent.includes('.print-sheet'), "Print CSS must configure .print-sheet");

console.log("✓ Test 20 Passed: System Folder Tree Browser & Print Preview in File Menu verified.");

// 21. Test Single-Column Full-Width Builder Layout, Point Accounting Top, and Identity Order
console.log("Testing 21: Sidebar Elimination, Point Accounting Top & Identity Order...");
assert.ok(!htmlContent.includes('class="builder-sidebar"'), "builder-sidebar must NOT exist in index.html");
assert.ok(htmlContent.includes('id="card-point-accounting"'), "card-point-accounting must exist");
assert.ok(htmlContent.includes('id="card-identity"'), "card-identity must exist");
assert.ok(htmlContent.includes('class="point-accounting-grid"'), "point-accounting-grid must exist");

const pointAccountingIdx = htmlContent.indexOf('id="card-point-accounting"');
const identityIdx = htmlContent.indexOf('id="card-identity"');
const coreStatsIdx = htmlContent.indexOf('id="card-core-stats"');

assert.ok(pointAccountingIdx !== -1, "card-point-accounting must be found");
assert.ok(identityIdx !== -1, "card-identity must be found");
assert.ok(pointAccountingIdx < identityIdx, "card-point-accounting must appear before card-identity");
assert.ok(identityIdx < coreStatsIdx, "card-identity must appear before card-core-stats");

assert.ok(cssContent.includes('.point-accounting-grid'), "CSS must define .point-accounting-grid");
assert.ok(cssContent.includes('.accounting-item'), "CSS must define .accounting-item");

console.log("✓ Test 21 Passed: Sidebar eliminated, point accounting at top, and identity order verified.");

// 22. Test Condensed Point Accounting & Core Stats Blocks
console.log("Testing 22: Condensed Point Accounting & Core Stats Layout...");
const updatedHtml = fs.readFileSync('./index.html', 'utf8');
const updatedCss = fs.readFileSync('./css/app.css', 'utf8');

assert.ok(updatedHtml.includes('class="stat-card-row"'), "stat-card-row must exist for condensed horizontal stat cards");
assert.ok(updatedHtml.includes('class="stat-ident"'), "stat-ident must exist for condensed stat name + badge");
assert.ok(updatedCss.includes('grid-template-columns: repeat(4, 1fr)'), "point-accounting-grid must use condensed 4-column layout");
assert.ok(updatedCss.includes('grid-template-columns: repeat(9, 1fr)'), "derived-pills must use condensed 9-column single-row layout");
assert.ok(updatedCss.includes('.accounting-item:nth-child(7)'), "7th accounting item must span 2 columns to completely fill row 2");

// Verify app-wide font size minimum 12pt / 16px is still 100% compliant
const allPtMatches = [...updatedCss.matchAll(/font-size:\s*([0-9.]+)pt/gi)];
for (const match of allPtMatches) {
  const val = parseFloat(match[1]);
  assert.ok(val >= 12, `CSS font-size ${val}pt is below minimum 12pt`);
}
const allPxMatches = [...updatedCss.matchAll(/font-size:\s*([0-9.]+)px/gi)];
for (const match of allPxMatches) {
  const val = parseFloat(match[1]);
  assert.ok(val >= 16, `CSS font-size ${val}px is below minimum 16px (12pt equivalent)`);
}

console.log("✓ Test 22 Passed: Condensed Point Accounting & Core Stats verified with 12pt font compliance.");

// 23. Test Unified Combo Steppers App-Wide & Elimination of Tiny Arrows / Separated Buttons
console.log("Testing 23: Unified Combo Steppers App-Wide & Tiny Arrow Elimination...");
const appJsContent = fs.readFileSync('./js/app.js', 'utf8');

// A. CSS Combo Stepper Styles & Browser Arrow Suppression
assert.ok(updatedCss.includes('-webkit-appearance: none'), "CSS must hide webkit number spinners");
assert.ok(updatedCss.includes('-moz-appearance: textfield'), "CSS must hide firefox number spinners");
assert.ok(updatedCss.includes('.combo-stepper {'), "CSS must define .combo-stepper container");
assert.ok(updatedCss.includes('.combo-stepper-btn {'), "CSS must define .combo-stepper-btn");
assert.ok(updatedCss.includes('.combo-stepper-minus {'), "CSS must define .combo-stepper-minus with divider");
assert.ok(updatedCss.includes('.combo-stepper-plus {'), "CSS must define .combo-stepper-plus with divider");
assert.ok(updatedCss.includes('.combo-stepper-input {'), "CSS must define .combo-stepper-input");
assert.ok(updatedCss.includes('.combo-stepper-lg {'), "CSS must define .combo-stepper-lg variation");
assert.ok(updatedCss.includes('.combo-stepper-sm {'), "CSS must define .combo-stepper-sm variation");

// B. Core Stats in index.html use unified combo steppers with contiguous minus/plus
assert.ok(updatedHtml.includes('id="val-body"') && updatedHtml.includes('id="btn-body-minus"') && updatedHtml.includes('id="btn-body-plus"'), "Body must have contiguous stepper buttons and input");
assert.ok(updatedHtml.includes('id="val-mind"') && updatedHtml.includes('id="btn-mind-minus"') && updatedHtml.includes('id="btn-mind-plus"'), "Mind must have contiguous stepper buttons and input");
assert.ok(updatedHtml.includes('id="val-soul"') && updatedHtml.includes('id="btn-soul-minus"') && updatedHtml.includes('id="btn-soul-plus"'), "Soul must have contiguous stepper buttons and input");

// C. Standalone & Modal number adjusters in index.html use .combo-stepper and .combo-stepper-auto
const modalStepperIds = [
  "char-custom-budget",
  "play-incoming-dmg",
  "adv-xp-amount",
  "roller-modifier",
  "roller-dramatic-feat",
  "custom-attr-cost",
  "custom-attr-rank",
  "custom-skill-rank",
  "custom-indiv-skill-rank",
  "custom-defect-rank",
  "weapon-level"
];
for (const id of modalStepperIds) {
  assert.ok(updatedHtml.includes(`id="${id}"`), `Input with id="${id}" must exist in HTML`);
  assert.ok(updatedHtml.includes(`class="combo-stepper-input" id="${id}"`) || updatedHtml.includes(`id="${id}" class="combo-stepper-input"`), `Input id="${id}" must have class="combo-stepper-input"`);
}

// D. Dynamic Trait Generation in js/app.js uses combo steppers
assert.ok(appJsContent.includes('combo-stepper-input input-attr-level'), "Attributes & containers must render combo-stepper-input input-attr-level");
assert.ok(appJsContent.includes('combo-stepper-input input-sg-level'), "Skill Groups must render combo-stepper-input input-sg-level");
assert.ok(appJsContent.includes('combo-stepper-input input-sk-level'), "Individual Skills must render combo-stepper-input input-sk-level");
assert.ok(appJsContent.includes('combo-stepper-input input-defect-rank'), "Defects must render combo-stepper-input input-defect-rank");
assert.ok(appJsContent.includes('combo-stepper-input input-cont-stat'), "Companion stats must render combo-stepper-input input-cont-stat");
assert.ok(appJsContent.includes('combo-stepper-input input-cont-trait-level'), "Contained traits must render combo-stepper-input input-cont-trait-level");

// E. Delegated Auto Combo Stepper & Direct Typing Handlers in js/app.js
assert.ok(appJsContent.includes('.combo-stepper-auto'), "js/app.js must handle .combo-stepper-auto clicks");
assert.ok(appJsContent.includes('.input-attr-level'), "js/app.js must attach change listener to .input-attr-level");
assert.ok(appJsContent.includes('.input-sg-level'), "js/app.js must attach change listener to .input-sg-level");
assert.ok(appJsContent.includes('.input-sk-level'), "js/app.js must attach change listener to .input-sk-level");
assert.ok(appJsContent.includes('.input-defect-rank'), "js/app.js must attach change listener to .input-defect-rank");

// F. Verify No Remaining Isolated stepper-btn in HTML or Dynamic JS Generation
const leftoverOldMinus = [...appJsContent.matchAll(/class="stepper-btn btn-sm btn-/g)];
assert.strictEqual(leftoverOldMinus.length, 0, "No old separated stepper-btn should remain in js/app.js dynamic HTML");

console.log("✓ Test 23 Passed: Unified combo steppers, direct typing, and tiny arrow elimination verified app-wide.");

// 24. Test Weapon Attribute Full System: Legal Modifiers Filtering, Dropdowns & Point Accounting
console.log("Testing 24: Weapon Attribute Full System, Legal Modifiers Filtering & Point Costs...");

// A. Weapon Point Cost Calculation with Enhancements & Limiters
const testWpn = {
  name: "Heavy Plasma Carbine",
  level: 3,
  attackType: "ranged",
  range: "50m",
  enhancements: [
    { id: "autofire", name: "Autofire", rank: 1, costPerRank: 3 },
    { id: "armour_piercing", name: "Armour-Piercing", rank: 2, costPerRank: 1 }
  ],
  limiters: [
    { id: "ammo", name: "Ammo", rank: 1, refundPerRank: 1 },
    { id: "recoil", name: "Recoil", rank: 2, refundPerRank: 1 }
  ]
};

const wpnCostInfo = BESM4E_RULES.calculateWeaponCost(testWpn);
assert.strictEqual(wpnCostInfo.baseCost, 6, "Base cost is 3 * 2 = 6 CP");
assert.strictEqual(wpnCostInfo.enhCost, 5, "Autofire (3) + Armour-Piercing x2 (2) = 5 CP");
assert.strictEqual(wpnCostInfo.limRefund, 3, "Ammo (1) + Recoil x2 (2) = 3 CP refund");
assert.strictEqual(wpnCostInfo.totalCost, 8, "Net cost is 6 + 5 - 3 = 8 CP");
assert.strictEqual(wpnCostInfo.effectiveLevel, 3, "Effective level is 3 - 3 + 3 = 3");

// Minimum 1 CP net cost rule
const heavilyLimitedWpn = {
  name: "Crude Club",
  level: 1,
  limiters: [
    { id: "fragile", rank: 1, refundPerRank: 1 },
    { id: "slow", rank: 1, refundPerRank: 1 },
    { id: "recoil", rank: 1, refundPerRank: 1 }
  ]
};
const crudeCost = BESM4E_RULES.calculateWeaponCost(heavilyLimitedWpn);
assert.strictEqual(crudeCost.baseCost, 2);
assert.strictEqual(crudeCost.limRefund, 3);
assert.strictEqual(crudeCost.totalCost, 1, "Minimum net cost for weapon attribute is 1 CP");

// B. Legal vs Illegal Modifiers Filtering
assert.strictEqual(BESM4E_RULES.attributeAcceptsModifiers("weapon"), true, "Weapon attribute accepts modifiers");
assert.strictEqual(BESM4E_RULES.getModifierTypeForAttribute("weapon"), "weapon");
const legalWpnEnh = BESM4E_RULES.getLegalEnhancementsForAttribute("weapon");
assert.ok(legalWpnEnh.length >= 38, "Weapon must have >= 38 legal enhancements");
assert.ok(legalWpnEnh.some(e => e.id === "piercing" || e.name === "Piercing"));
assert.ok(BESM4E_RULES.getWeaponEnhancementDef("armour_piercing"), "Armour-Piercing alias must resolve");

const legalWpnLim = BESM4E_RULES.getLegalLimitersForAttribute("weapon");
assert.ok(legalWpnLim.length >= 35, "Weapon must have >= 35 legal limiters");
assert.ok(legalWpnLim.some(l => l.id === "recoil" || l.name === "Recoil"));
assert.ok(legalWpnLim.some(l => l.id === "ammo" || l.name === "Ammo"));

// General Power Modifiers (Flight, Force Field, Teleport, etc.)
assert.strictEqual(BESM4E_RULES.attributeAcceptsModifiers("flight"), true, "Flight power accepts modifiers");
assert.strictEqual(BESM4E_RULES.getModifierTypeForAttribute("flight"), "general");
const legalFlightEnh = BESM4E_RULES.getLegalEnhancementsForAttribute("flight");
assert.ok(legalFlightEnh.some(e => e.id === "continuing" || e.name.includes("Continuing")));
assert.ok(!legalFlightEnh.some(e => e.name === "Autofire"), "General powers must NOT have weapon Autofire enhancement");

const legalFlightLim = BESM4E_RULES.getLegalLimitersForAttribute("flight");
assert.strictEqual(legalFlightLim.length, 18, "General powers have 18 legal limiters");
assert.ok(legalFlightLim.some(l => l.name === "Activation"));
assert.ok(!legalFlightLim.some(l => l.name === "Recoil"), "General powers must NOT have weapon Recoil limiter");

// Non-Modifier Attributes (Wealth, Combat Technique, Tough)
assert.strictEqual(BESM4E_RULES.attributeAcceptsModifiers("wealth"), false, "Wealth must not accept modifiers");
assert.strictEqual(BESM4E_RULES.attributeAcceptsModifiers("combat_technique"), false, "Combat Technique must not accept modifiers");
assert.strictEqual(BESM4E_RULES.attributeAcceptsModifiers("tough"), false, "Tough must not accept modifiers");
assert.strictEqual(BESM4E_RULES.getLegalEnhancementsForAttribute("wealth").length, 0);
assert.strictEqual(BESM4E_RULES.getLegalLimitersForAttribute("wealth").length, 0);

// C. Character Model Integration & Attribute/Weapon Synchronization
const wpnChar = new BESM4ECharacter();
wpnChar.setHumanAverageStats(); // 24 CP stats

// Add weapon via addWeapon
wpnChar.addWeapon({
  name: "Particle Rifle",
  level: 3,
  range: "100m",
  attackType: "ranged",
  enhancements: [{ id: "armour_piercing", name: "Armour-Piercing", rank: 1, costPerRank: 1 }],
  limiters: [{ id: "ammo", name: "Ammo", rank: 1, refundPerRank: 1 }]
});

assert.strictEqual(wpnChar.weapons.length, 1);
assert.strictEqual(wpnChar.attributes.length, 1);
const wpnAttr = wpnChar.attributes[0];
assert.strictEqual(wpnAttr.attributeId, "weapon");
assert.strictEqual(wpnChar.getAttributeCost(wpnAttr), 6, "3*2 + 1 - 1 = 6 CP");

let wpnBreakdown = wpnChar.getPointBreakdown();
assert.strictEqual(wpnBreakdown.attributesTotal, 6);
assert.strictEqual(wpnBreakdown.netSpent, 30, "24 stats + 6 weapon = 30 CP net spent");

// Add Autofire enhancement to the weapon
wpnChar.addAttributeEnhancement(wpnAttr.id, "autofire", 1);
assert.strictEqual(wpnChar.getAttributeCost(wpnAttr), 9, "6 + 3 autofire = 9 CP");
assert.strictEqual(wpnChar.getPointBreakdown().attributesTotal, 9);
assert.ok(wpnChar.weapons[0].enhancements.some(e => e.name === "Autofire"), "Weapon syncs enhancements");

// Attempt to add illegal modifier to flight vs valid modifier
wpnChar.addAttribute(BESM4E_RULES.getAttributeDef("flight"), 2);
const flightAttr = wpnChar.attributes.find(a => a.id === "flight" || a.attributeId === "flight");
assert.strictEqual(wpnChar.addAttributeEnhancement(flightAttr.id, "autofire", 1), false, "Autofire cannot be added to Flight");
assert.strictEqual(wpnChar.addAttributeEnhancement(flightAttr.id, "continuing", 1), true, "Continuing can be added to Flight");
assert.strictEqual(wpnChar.addAttributeLimiter(flightAttr.id, "activation", 1), true, "Activation can be added to Flight");

// Attempt to add modifier to tough (non-modifier attribute)
wpnChar.addAttribute(BESM4E_RULES.getAttributeDef("tough"), 1);
const toughAttr = wpnChar.attributes.find(a => a.id === "tough" || a.attributeId === "tough");
assert.strictEqual(wpnChar.addAttributeEnhancement(toughAttr.id, "continuing", 1), false, "Tough cannot accept enhancements");

// D. HTML UI Elements & CSS Class Verification
const finalHtml = fs.readFileSync('./index.html', 'utf8');
const finalCss = fs.readFileSync('./css/app.css', 'utf8');
const finalAppJs = fs.readFileSync('./js/app.js', 'utf8');

assert.ok(finalHtml.includes('id="weapon-cost-summary"'), "HTML must include weapon cost summary box");
assert.ok(finalHtml.includes('id="weapon-modal-enh-select"'), "HTML must include weapon enhancement select dropdown");
assert.ok(finalHtml.includes('id="weapon-modal-lim-select"'), "HTML must include weapon limiter select dropdown");
assert.ok(finalHtml.includes('id="weapon-assigned-pills"'), "HTML must include weapon assigned pills container");

assert.ok(finalCss.includes('.attribute-modifiers-panel'), "CSS must define .attribute-modifiers-panel");
assert.ok(finalCss.includes('.modifier-pill-enhancement'), "CSS must define .modifier-pill-enhancement");
assert.ok(finalCss.includes('.modifier-pill-limiter'), "CSS must define .modifier-pill-limiter");
assert.ok(finalCss.includes('.weapon-cost-summary-box'), "CSS must define .weapon-cost-summary-box");

assert.ok(finalAppJs.includes('.attr-enh-select'), "js/app.js must handle .attr-enh-select");
assert.ok(finalAppJs.includes('.attr-lim-select'), "js/app.js must handle .attr-lim-select");
assert.ok(finalAppJs.includes('openWeaponModal'), "js/app.js must define openWeaponModal");

console.log("✓ Test 24 Passed: Weapon full system, legal modifiers filtering, and point costs verified.");

// 25. Test 16 Anime Archetypes Presets Library, Rule Integrity & Point Balance
console.log("Testing 25: 16 Anime Archetypes Presets Library, Rule Integrity & Point Balance...");
assert.strictEqual(BESM4E_RULES.templates.length, 16, "Must define exactly 16 anime archetype presets");

const requiredCategories = ["action", "scifi", "magic", "supernatural", "modern"];
const foundCategories = new Set(BESM4E_RULES.templates.map(t => t.category));
requiredCategories.forEach(cat => {
  const hasCat = [...foundCategories].some(c => c === cat || (cat === "magic" && c === "fantasy") || (cat === "modern" && c === "adventurer") || (cat === "scifi" && c === "cyberpunk"));
  assert.ok(hasCat, `Rules templates must include ${cat} category archetypes`);
});

BESM4E_RULES.templates.forEach((tmpl, idx) => {
  assert.ok(tmpl.id, `Template #${idx + 1} must have an id`);
  assert.ok(tmpl.name, `Template #${idx + 1} must have a name`);
  assert.ok(tmpl.concept, `Template ${tmpl.name} must have a concept`);
  assert.ok(tmpl.tier, `Template ${tmpl.name} must have a tier`);
  assert.strictEqual(tmpl.points, 75, `Template ${tmpl.name} must target 75 CP`);
  assert.ok(tmpl.stats && tmpl.stats.body && tmpl.stats.mind && tmpl.stats.soul, `Template ${tmpl.name} must have body, mind, soul stats`);

  // Verify all attribute IDs exist in rules
  (tmpl.attributes || []).forEach(a => {
    const attrDef = BESM4E_RULES.attributes.find(x => x.id === a.id);
    assert.ok(attrDef, `Template ${tmpl.name} attribute ${a.id} must be recognized in BESM4E_RULES.attributes`);
  });

  // Verify all skill group IDs exist in rules
  (tmpl.skillGroups || []).forEach(sg => {
    const sgDef = BESM4E_RULES.skillGroups.find(x => x.id === sg.id);
    assert.ok(sgDef, `Template ${tmpl.name} skillGroup ${sg.id} must be recognized in BESM4E_RULES.skillGroups`);
  });

  // Verify all defect IDs exist in rules
  (tmpl.defects || []).forEach(d => {
    const dDef = BESM4E_RULES.defects.find(x => x.id === d.id);
    assert.ok(dDef, `Template ${tmpl.name} defect ${d.id} must be recognized in BESM4E_RULES.defects`);
  });

  // Load into character and check points & weapon sync
  const testChar = new BESM4ECharacter();
  const loaded = testChar.loadTemplate(tmpl.id);
  assert.strictEqual(loaded, true, `Character must load template ${tmpl.id}`);

  // Point accounting check
  const breakdown = testChar.getPointBreakdown();
  assert.strictEqual(breakdown.netSpent, 75, `Template ${tmpl.name} must spend exactly 75 net CP (was ${breakdown.netSpent})`);

  // Weapon sync check
  (tmpl.weapons || []).forEach(w => {
    const charWpn = testChar.weapons.find(cw => cw.name === w.name);
    assert.ok(charWpn, `Character must contain weapon ${w.name}`);
    assert.ok(charWpn.id, `Character weapon ${w.name} must have an ID`);
    const charAttr = testChar.attributes.find(ca => ca.id === charWpn.id || ca.weaponId === charWpn.id);
    assert.ok(charAttr, `Character attributes must have mirrored entry for weapon ${w.name}`);
  });
});

// UI elements check
const testHtml = fs.readFileSync('./index.html', 'utf8');
const testCss = fs.readFileSync('./css/app.css', 'utf8');
const testAppJs = fs.readFileSync('./js/app.js', 'utf8');

assert.ok(testHtml.includes('id="template-search-input"'), "HTML must include template search input");
assert.ok(testHtml.includes('class="btn btn-sm btn-secondary archetype-filter-btn'), "HTML must include archetype category filter buttons");
assert.ok(testHtml.includes('id="archetype-count-badge"'), "HTML must include archetype count badge");

assert.ok(testCss.includes('.archetype-card'), "CSS must define .archetype-card");
assert.ok(testCss.includes('.archetype-stats-ribbon'), "CSS must define .archetype-stats-ribbon");
assert.ok(testCss.includes('.archetype-pill'), "CSS must define .archetype-pill");

assert.ok(testAppJs.includes('renderTemplateCatalog'), "app.js must define renderTemplateCatalog");
assert.ok(testAppJs.includes('matchesArchetypeCategory'), "app.js must handle archetype category matching");

console.log("✓ Test 25 Passed: 16 Anime Archetypes Presets Library, Rule Integrity & Point Balance verified.");

// 26. Test ? Trait Info Buttons, Description Modal & Dropdown Tooltips
console.log("Testing 26: ? Trait Info Buttons, Description Modal & Dropdown Tooltips...");

// A. Rules engine modifier lookup helper
assert.strictEqual(typeof BESM4E_RULES.getModifierDef, "function", "BESM4E_RULES.getModifierDef must be a function");

const accDef = BESM4E_RULES.getModifierDef("weapon", "enhancement", "accurate");
assert.ok(accDef, "getModifierDef must find 'accurate' enhancement");
assert.strictEqual(accDef.name, "Accurate");
assert.ok(accDef.description && accDef.description.length > 5, "'accurate' must have non-empty description");
assert.strictEqual(accDef.costPerRank, 1);

const chargesDef = BESM4E_RULES.getModifierDef("weapon", "limiter", "charges");
assert.ok(chargesDef, "getModifierDef must find 'charges' limiter");
assert.strictEqual(chargesDef.name, "Charges");
assert.ok(chargesDef.description && chargesDef.description.length > 5, "'charges' must have non-empty description");
assert.strictEqual(chargesDef.refundPerRank, 1);

const areaDef = BESM4E_RULES.getModifierDef("flight", "enhancement", "area");
assert.ok(areaDef, "getModifierDef must find 'area' general enhancement for flight");
assert.strictEqual(areaDef.name, "Area Effect");

const condDef = BESM4E_RULES.getModifierDef("flight", "limiter", "conditional");
assert.ok(condDef, "getModifierDef must find 'conditional' general limiter for flight");
assert.ok(condDef.description && condDef.description.length > 5);

// Verify all modifiers have valid descriptions
BESM4E_RULES.weaponEnhancements.forEach(e => {
  assert.ok(e.description && e.description.trim().length > 0, `Weapon enhancement ${e.name} must have a description`);
});
BESM4E_RULES.weaponLimiters.forEach(l => {
  assert.ok(l.description && l.description.trim().length > 0, `Weapon limiter ${l.name} must have a description`);
});
BESM4E_RULES.generalEnhancements.forEach(e => {
  assert.ok(e.description && e.description.trim().length > 0, `General enhancement ${e.name} must have a description`);
});
BESM4E_RULES.generalLimiters.forEach(l => {
  assert.ok(l.description && l.description.trim().length > 0, `General limiter ${l.name} must have a description`);
});

// B. HTML UI verification
const t26Html = fs.readFileSync('./index.html', 'utf8');
assert.ok(t26Html.includes('id="btn-weapon-modal-enh-info"'), "HTML must include #btn-weapon-modal-enh-info");
assert.ok(t26Html.includes('id="btn-weapon-modal-lim-info"'), "HTML must include #btn-weapon-modal-lim-info");
assert.ok(t26Html.includes('id="modal-trait-info"'), "HTML must include #modal-trait-info");
assert.ok(t26Html.includes('id="trait-info-modal-title"'), "HTML must include #trait-info-modal-title");
assert.ok(t26Html.includes('id="trait-info-modal-badge"'), "HTML must include #trait-info-modal-badge");
assert.ok(t26Html.includes('id="trait-info-modal-cost"'), "HTML must include #trait-info-modal-cost");
assert.ok(t26Html.includes('id="trait-info-modal-desc"'), "HTML must include #trait-info-modal-desc");
assert.ok(t26Html.includes('id="trait-info-modal-source"'), "HTML must include #trait-info-modal-source");

// C. CSS verification
const t26Css = fs.readFileSync('./css/app.css', 'utf8');
assert.ok(t26Css.includes('.btn-trait-info'), "CSS must define .btn-trait-info");
assert.ok(t26Css.includes('.attr-modifier-desc-box'), "CSS must define .attr-modifier-desc-box");
assert.ok(t26Css.includes('.modifier-pill.btn-trait-pill-info'), "CSS must define .modifier-pill.btn-trait-pill-info");

// Check 12pt font compliance in trait info CSS
const traitInfoCssBlock = t26Css.slice(t26Css.indexOf('.btn-trait-info'), t26Css.indexOf('.archetype-filter-btn'));
assert.ok(traitInfoCssBlock.includes('font-size: 12pt;'), ".btn-trait-info block must comply with 12pt font");

// D. JavaScript verification
const t26Js = fs.readFileSync('./js/app.js', 'utf8');
assert.ok(t26Js.includes('function showTraitInfoModal('), "js/app.js must define showTraitInfoModal");
assert.ok(t26Js.includes('btn-weapon-modal-enh-info'), "js/app.js must handle btn-weapon-modal-enh-info");
assert.ok(t26Js.includes('btn-weapon-modal-lim-info'), "js/app.js must handle btn-weapon-modal-lim-info");
assert.ok(t26Js.includes('btn-attr-enh-info'), "js/app.js must render and handle btn-attr-enh-info");
assert.ok(t26Js.includes('btn-attr-lim-info'), "js/app.js must render and handle btn-attr-lim-info");
assert.ok(t26Js.includes('attr-modifier-desc-box'), "js/app.js must update attr-modifier-desc-box");
assert.ok(t26Js.includes('btn-trait-pill-info'), "js/app.js must make modifier pills clickable with btn-trait-pill-info");

console.log("✓ Test 26 Passed: ? Trait Info Buttons, Description Modal & Dropdown Tooltips verified.");

// 27. Test Attribute Enhancement & Limiter Field Rank Steppers & Live Pill Steppers
console.log("Testing 27: Attribute Enhancement & Limiter Field Rank Steppers & Live Pill Steppers...");

// A. Model Logic & Rank Updates
const t27Char = new BESM4ECharacter();
const t27FlightDef = BESM4E_RULES.attributes.find(a => a.id === "flight");
assert.ok(t27FlightDef, "Flight attribute must exist in rules");
t27Char.addAttribute(t27FlightDef, 2);
const t27FlightAttr = t27Char.attributes.find(a => a.id.startsWith("flight"));
assert.ok(t27FlightAttr, "Flight attribute must be added to character");

// Add enhancement and test rank stepper delta / direct updates
assert.ok(t27Char.addAttributeEnhancement(t27FlightAttr.id, "area", 1), "addAttributeEnhancement must return true");
let t27EnhItem = t27FlightAttr.enhancements.find(e => e.id === "area");
assert.strictEqual(t27EnhItem.rank, 1, "Initial enhancement rank must be 1");

// Increment rank (+1 delta)
assert.ok(t27Char.updateAttributeEnhancementRank(t27FlightAttr.id, "area", 1, true));
assert.strictEqual(t27EnhItem.rank, 2, "Rank after +1 increment must be 2");

// Decrement rank (-1 delta)
assert.ok(t27Char.updateAttributeEnhancementRank(t27FlightAttr.id, "area", -1, true));
assert.strictEqual(t27EnhItem.rank, 1, "Rank after -1 decrement must be 1");

// Direct rank update
assert.ok(t27Char.updateAttributeEnhancementRank(t27FlightAttr.id, "area", 4));
assert.strictEqual(t27EnhItem.rank, 4, "Direct rank update to 4 must succeed");

// Clamp to max 5
assert.ok(t27Char.updateAttributeEnhancementRank(t27FlightAttr.id, "area", 99));
assert.strictEqual(t27EnhItem.rank, 5, "Rank update > 5 must clamp to 5");

// Decrement to 0 removes enhancement
assert.ok(t27Char.updateAttributeEnhancementRank(t27FlightAttr.id, "area", 0));
assert.strictEqual(t27FlightAttr.enhancements.find(e => e.id === "area"), undefined, "Rank 0 must remove enhancement");

// Add limiter and test rank updates
assert.ok(t27Char.addAttributeLimiter(t27FlightAttr.id, "conditional", 1), "addAttributeLimiter must return true");
let t27LimItem = t27FlightAttr.limiters.find(l => l.id === "conditional");
assert.strictEqual(t27LimItem.rank, 1, "Initial limiter rank must be 1");

assert.ok(t27Char.updateAttributeLimiterRank(t27FlightAttr.id, "conditional", 1, true));
assert.strictEqual(t27LimItem.rank, 2, "Limiter rank after +1 must be 2");

assert.ok(t27Char.updateAttributeLimiterRank(t27FlightAttr.id, "conditional", 0));
assert.strictEqual(t27FlightAttr.limiters.find(l => l.id === "conditional"), undefined, "Limiter rank 0 must remove limiter");

// Test weapon synchronization with attribute rank steppers
t27Char.addWeapon({ name: "Pulse Blaster", level: 3 });
const t27Wpn = t27Char.weapons.find(w => w.name === "Pulse Blaster");
assert.ok(t27Wpn, "Weapon must be created");
assert.ok(t27Char.addAttributeEnhancement(t27Wpn.id, "accurate", 1), "Must add enhancement to weapon via attribute method");
assert.strictEqual(t27Wpn.enhancements[0].rank, 1);

assert.ok(t27Char.updateAttributeEnhancementRank(t27Wpn.id, "accurate", 1, true));
assert.strictEqual(t27Wpn.enhancements[0].rank, 2, "Weapon enhancement rank must sync to 2");

// B. HTML / Template verification in js/app.js
const t27Js = fs.readFileSync('./js/app.js', 'utf8');

// Attribute selection fields combo steppers
assert.ok(t27Js.includes('btn-attr-enh-rank-minus'), "js/app.js must define .btn-attr-enh-rank-minus stepper");
assert.ok(t27Js.includes('btn-attr-enh-rank-plus'), "js/app.js must define .btn-attr-enh-rank-plus stepper");
assert.ok(t27Js.includes('attr-enh-rank'), "js/app.js must define .attr-enh-rank numeric input");

assert.ok(t27Js.includes('btn-attr-lim-rank-minus'), "js/app.js must define .btn-attr-lim-rank-minus stepper");
assert.ok(t27Js.includes('btn-attr-lim-rank-plus'), "js/app.js must define .btn-attr-lim-rank-plus stepper");
assert.ok(t27Js.includes('attr-lim-rank'), "js/app.js must define .attr-lim-rank numeric input");

// Attribute assigned pills live steppers
assert.ok(t27Js.includes('btn-attr-enh-pill-minus'), "js/app.js must define .btn-attr-enh-pill-minus");
assert.ok(t27Js.includes('btn-attr-enh-pill-plus'), "js/app.js must define .btn-attr-enh-pill-plus");
assert.ok(t27Js.includes('input-attr-enh-pill-rank'), "js/app.js must define .input-attr-enh-pill-rank");

assert.ok(t27Js.includes('btn-attr-lim-pill-minus'), "js/app.js must define .btn-attr-lim-pill-minus");
assert.ok(t27Js.includes('btn-attr-lim-pill-plus'), "js/app.js must define .btn-attr-lim-pill-plus");
assert.ok(t27Js.includes('input-attr-lim-pill-rank'), "js/app.js must define .input-attr-lim-pill-rank");

// Weapon Modal assigned pills live steppers
assert.ok(t27Js.includes('btn-modal-enh-pill-minus'), "js/app.js must define .btn-modal-enh-pill-minus");
assert.ok(t27Js.includes('btn-modal-enh-pill-plus'), "js/app.js must define .btn-modal-enh-pill-plus");
assert.ok(t27Js.includes('input-modal-enh-pill-rank'), "js/app.js must define .input-modal-enh-pill-rank");

assert.ok(t27Js.includes('btn-modal-lim-pill-minus'), "js/app.js must define .btn-modal-lim-pill-minus");
assert.ok(t27Js.includes('btn-modal-lim-pill-plus'), "js/app.js must define .btn-modal-lim-pill-plus");
assert.ok(t27Js.includes('input-modal-lim-pill-rank'), "js/app.js must define .input-modal-lim-pill-rank");

// C. CSS verification & 12pt Font Compliance
const t27Css = fs.readFileSync('./css/app.css', 'utf8');
assert.ok(t27Css.includes('.modifier-pill .combo-stepper'), "CSS must define .modifier-pill .combo-stepper");
assert.ok(t27Css.includes('.modifier-pill .combo-stepper .combo-stepper-btn'), "CSS must define .modifier-pill .combo-stepper .combo-stepper-btn");
assert.ok(t27Css.includes('.modifier-pill .combo-stepper .combo-stepper-input'), "CSS must define .modifier-pill .combo-stepper .combo-stepper-input");

// Check 12pt font compliance in modifier-pill combo-stepper CSS
const pillStepperCssBlock = t27Css.slice(t27Css.indexOf('.modifier-pill .combo-stepper'));
assert.ok(pillStepperCssBlock.includes('font-size: 12pt;'), ".modifier-pill .combo-stepper CSS must comply with 12pt font standard");

console.log("✓ Test 27 Passed: Attribute Enhancement & Limiter Field Rank Steppers & Live Pill Steppers verified.");

// 28. Test Multi-Skill Addition without Dialog Closing & Manual Close Controls (X, ESC, Backdrop)
console.log("Testing 28: Multi-Skill Addition without Dialog Closing & Manual Close Controls...");

// A. Verify Character Model Supports Adding Multiple Skills & Leveling
const t28Char = new BESM4ECharacter();
t28Char.setHumanAverageStats(); // 24 CP in stats, 51 remaining

// Add first constituent skill: Stealth (Mind, 1 CP/lvl)
const t28StealthDef = BESM4E_RULES.getSkillDef ? BESM4E_RULES.getSkillDef("stealth") : { id: "stealth", name: "Stealth", stat: "Mind", costPerLevel: 1 };
assert.ok(t28Char.addSkill(t28StealthDef, 1), "Should add first skill");
assert.strictEqual(t28Char.skills.length, 1);
assert.strictEqual(t28Char.skills[0].id, "stealth");
assert.strictEqual(t28Char.skills[0].level, 1);

// Add second constituent skill: Computers (Mind, 1 CP/lvl) without resetting
const t28CompDef = BESM4E_RULES.getSkillDef ? BESM4E_RULES.getSkillDef("computers") : { id: "computers", name: "Computers", stat: "Mind", costPerLevel: 1 };
assert.ok(t28Char.addSkill(t28CompDef, 1), "Should add second skill in same session");
assert.strictEqual(t28Char.skills.length, 2);
assert.strictEqual(t28Char.skills[1].id, "computers");

// Add skill group: Detective (Field, 2 CP/lvl)
const t28GroupDef = BESM4E_RULES.skillGroups.find(sg => sg.id === "detective");
assert.ok(t28GroupDef, "Detective skill group must exist");
t28Char.addSkillGroup(t28GroupDef, 1);
assert.strictEqual(t28Char.skillGroups.length, 1);
assert.strictEqual(t28Char.skillGroups[0].id, "detective");

// Re-click Stealth: Level up to Level 2
assert.ok(t28Char.addSkill(t28StealthDef, 1), "Re-adding existing skill should level up");
assert.strictEqual(t28Char.skills.length, 2, "Skill count should remain 2");
assert.strictEqual(t28Char.skills[0].level, 2, "Stealth level should increase to 2");

// Verify Point Breakdown: 24 (stats) + 2 (stealth lvl 2) + 1 (computers lvl 1) + 3 (detective group lvl 1, Action tier) = 30 CP spent
const t28Pt = t28Char.getPointBreakdown();
assert.strictEqual(t28Pt.skillsTotal, 3, "Individual skills total should be 3 CP");
assert.strictEqual(t28Pt.skillGroupsTotal, 3, "Skill groups total should be 3 CP (Action tier)");
assert.strictEqual(t28Pt.netSpent, 30, "Total net spent CP should be 30 CP");

// B. Code Verification in js/app.js: Ensure closeModal("modal-add-skill") is removed from skill add actions
const t28AppJs = fs.readFileSync('./js/app.js', 'utf8');

// Ensure modal-add-skill is NOT closed automatically inside skill handlers
assert.ok(!t28AppJs.includes('showToast(`Added skill "${s.name}" (Level 1, 1 CP)`);\n          renderBuilderSkillGroups();\n          renderBuilderAttributes();\n          renderDerivedStats();\n          renderPointBreakdown();\n          saveCurrentCharacter(true);\n          closeModal("modal-add-skill");'), "Individual skill handler must not close modal-add-skill");

// Verify in-place feedback tags
assert.ok(t28AppJs.includes('btn.textContent = `✓ Added (Lvl ${curLvl})`'), "Individual skill and group buttons must give in-place level feedback");
assert.ok(t28AppJs.includes('pill.innerHTML = `<strong>${escapeHtml(s.name)}</strong> ✓ Lvl ${curLvl}`') || t28AppJs.includes('pill.innerHTML = `<strong>${escapeHtml(sDef.name)}</strong> ✓ Lvl ${curLvl}`'), "Pills must give in-place level feedback");
assert.ok(t28AppJs.includes('saveBtn.textContent = "✓ Added!"'), "Custom skill save button must give in-place feedback");

// C. Verify Manual Closing Controls (X, ESC, Backdrop Click)
// 1. ESC Key closes open modals
assert.ok(t28AppJs.includes('e.key === "Escape"'), "Escape key handler must be registered");
assert.ok(t28AppJs.includes('const openModals = document.querySelectorAll(".modal-backdrop.open");'), "Escape key must check for open modals");
assert.ok(t28AppJs.includes('topModal.classList.remove("open");'), "Escape key must close topmost open modal");

// 2. Backdrop click closes modal
assert.ok(t28AppJs.includes('if (e.target === backdrop)'), "Backdrop click must detect clicks outside modal content");

// 3. X button closes modal
assert.ok(t28AppJs.includes('const modal = btn.closest(".modal-backdrop");'), "modal-close-btn must close parent modal");

// D. HTML Verification in index.html
const t28Html = fs.readFileSync('./index.html', 'utf8');
assert.ok(t28Html.includes('id="modal-add-skill"'), "HTML must define #modal-add-skill");
assert.ok(t28Html.includes('🎯 Add Skills & Skill Groups (BESM 4E)'), "HTML modal title must reflect Skills & Skill Groups");
assert.ok(t28Html.includes('class="btn btn-secondary btn-sm modal-close-btn" title="Close Dialog (ESC)">✕</button>'), "Modal header must have ✕ close button");
assert.ok(t28Html.includes('class="btn btn-secondary modal-close-btn" style="font-size: 12pt; min-width: 100px;">Done / Close</button>'), "Modal bottom must provide a Done / Close button");

console.log("✓ Test 28 Passed: Multi-Skill Addition without Dialog Closing & Manual Close Controls verified.");

// 29. Test Weapon Attribute Direct Addition, Two-Way Synchronization, and Container Context Isolation
console.log("Testing 29: Weapon Attribute Addition, Two-Way Sync & Container Context Isolation...");

// A. Character Model: Direct Weapon Attribute Addition & Synchronized Attack Creation
const t29Char = new BESM4ECharacter();
t29Char.setHumanAverageStats();

const t29WeaponDef = BESM4E_RULES.attributes.find(a => a.id === "weapon");
assert.ok(t29WeaponDef, "Weapon attribute definition must exist in BESM4E_RULES");

// Add Weapon attribute (Level 2, 4 CP) with detail "Katana"
t29Char.addAttribute(t29WeaponDef, 2, "Weapon", null, "", "Katana");
assert.strictEqual(t29Char.attributes.length, 1, "Character must have 1 attribute");
const t29WpnAttr = t29Char.attributes[0];
assert.strictEqual(t29WpnAttr.attributeId, "weapon");
assert.strictEqual(t29WpnAttr.level, 2);
assert.strictEqual(t29WpnAttr.isWeaponAttr, true);
assert.strictEqual(t29WpnAttr.acceptsModifiers, true);
assert.strictEqual(t29WpnAttr.modifierType, "weapon");

// Verify automatic synchronization into this.weapons
assert.strictEqual(t29Char.weapons.length, 1, "Character must have 1 synchronized weapon attack");
const t29WpnAttack = t29Char.weapons[0];
assert.strictEqual(t29WpnAttack.id, t29WpnAttr.id, "Weapon attack ID must match attribute ID");
assert.strictEqual(t29WpnAttack.name, "Katana", "Weapon attack name must match detail");
assert.strictEqual(t29WpnAttack.level, 2, "Weapon attack level must match attribute level");

// Verify Point Breakdown: 24 CP stats + 4 CP weapon (Level 2 @ 2 CP/level) = 28 CP
const t29Pt = t29Char.getPointBreakdown();
assert.strictEqual(t29Pt.attributesTotal, 4, "Weapon attribute Level 2 must cost 4 CP");
assert.strictEqual(t29Pt.netSpent, 28, "Total CP spent must be 28 CP");

// B. Two-Way Level Synchronization
t29Char.updateAttributeLevel(t29WpnAttr.id, 4);
assert.strictEqual(t29WpnAttr.level, 4, "Attribute level must update to 4");
assert.strictEqual(t29WpnAttack.level, 4, "Paired weapon attack level must synchronize to 4");

// C. Modifier Synchronization (Enhancements & Limiters)
t29Char.addAttributeEnhancement(t29WpnAttr.id, "accurate", 2);
assert.strictEqual(t29WpnAttr.enhancements.length, 1, "Attribute should have 1 enhancement");
assert.strictEqual(t29WpnAttr.enhancements[0].id, "accurate");
assert.strictEqual(t29WpnAttr.enhancements[0].rank, 2);
assert.strictEqual(t29WpnAttack.enhancements.length, 1, "Weapon attack should mirror enhancement");
assert.strictEqual(t29WpnAttack.enhancements[0].id, "accurate");
assert.strictEqual(t29WpnAttack.enhancements[0].rank, 2);

// D. Attribute & Weapon Removal Synchronization
t29Char.removeAttribute(t29WpnAttr.id);
assert.strictEqual(t29Char.attributes.length, 0, "Removing attribute must clear attributes");
assert.strictEqual(t29Char.weapons.length, 0, "Removing weapon attribute must clear paired weapon attack");

// E. Container Trait Weapon Mirroring
const t29ItemDef = BESM4E_RULES.attributes.find(a => a.id === "item");
assert.ok(t29ItemDef, "Item container definition must exist");
t29Char.addAttribute(t29ItemDef, 2); // Container
const t29ContainerId = t29Char.attributes[0].id;

// Weapon attribute cannot be targeted as a container
assert.strictEqual(t29Char.getContainerAttribute(t29WpnAttr.id), undefined, "Non-container ID must return undefined from getContainerAttribute");
assert.ok(t29Char.getContainerAttribute(t29ContainerId)?.isContainer, "Container attribute must have isContainer: true");

// Add weapon attribute to container
t29Char.addContainerTrait(t29ContainerId, "attributes", t29WeaponDef, 2, "Weapon", null, "", "", "Laser Blaster");
const t29Cont = t29Char.getContainerAttribute(t29ContainerId);
assert.strictEqual(t29Cont.containerTraits.attributes.length, 1, "Container must have 1 attribute");
assert.strictEqual(t29Cont.containerTraits.weapons.length, 1, "Container must mirror weapon attack");
assert.strictEqual(t29Cont.containerTraits.weapons[0].name, "Laser Blaster");
assert.strictEqual(t29Cont.containerTraits.weapons[0].level, 2);

// F. Code Verification in js/app.js: Container Isolation & Modal Flow
const t29AppJs = fs.readFileSync('./js/app.js', 'utf8').replace(/\r\n/g, '\n');

// 1. closeModal unconditionally clears activeContainerTarget
assert.ok(t29AppJs.includes('function closeModal(modalId) {\n    const modal = document.getElementById(modalId);\n    if (modal) {\n      modal.classList.remove("open");\n      clearActiveContainerTarget();\n    }\n  }'), "closeModal must unconditionally clear activeContainerTarget");

// 2. Backdrop & Close Button clicks unconditionally clear activeContainerTarget
assert.ok(t29AppJs.includes('if (e.target === backdrop) {\n        backdrop.classList.remove("open");\n        clearActiveContainerTarget();\n      }'), "Backdrop click must unconditionally clear activeContainerTarget");

assert.ok(t29AppJs.includes('if (modal) {\n        modal.classList.remove("open");\n        clearActiveContainerTarget();\n      }'), "Close button must unconditionally clear activeContainerTarget");

// 3. Escape key unconditionally clears activeContainerTarget
assert.ok(t29AppJs.includes('topModal.classList.remove("open");\n        clearActiveContainerTarget();'), "Escape key must unconditionally clear activeContainerTarget");

// 4. setActiveContainerTarget validates container
assert.ok(t29AppJs.includes('const container = currentCharacter ? currentCharacter.getContainerAttribute(attrId) : null;\n    if (!container || !container.isContainer) {\n      clearActiveContainerTarget();\n      return;\n    }'), "setActiveContainerTarget must reject non-containers");

// 5. Primary add buttons call clearActiveContainerTarget()
assert.ok(t29AppJs.includes('document.getElementById("btn-add-attribute").addEventListener("click", () => {\n    clearActiveContainerTarget();'), "#btn-add-attribute must clear active container target");
assert.ok(t29AppJs.includes('document.getElementById("btn-add-skill").addEventListener("click", () => {\n    clearActiveContainerTarget();'), "#btn-add-skill must clear active container target");
assert.ok(t29AppJs.includes('document.getElementById("btn-add-defect").addEventListener("click", () => {\n    clearActiveContainerTarget();'), "#btn-add-defect must clear active container target");
assert.ok(t29AppJs.includes('document.getElementById("btn-add-weapon").addEventListener("click", () => {\n    clearActiveContainerTarget();'), "#btn-add-weapon must clear active container target");

// 6. Direct Weapon addition in renderAttributeCatalog
assert.ok(t29AppJs.includes('const initLevel = attr.id === "weapon" ? 2 : 1;'), "renderAttributeCatalog must initialize Weapon at Level 2");
assert.ok(!t29AppJs.includes('if (attr.id === "weapon") {\n          closeModal("modal-add-attribute");\n          openWeaponModal'), "renderAttributeCatalog must not redirect weapon addition to openWeaponModal");

// 7. Catalogs validate activeContainerTarget
assert.ok(t29AppJs.includes('function renderAttributeCatalog() {\n    if (activeContainerTarget && (!currentCharacter || !currentCharacter.getContainerAttribute(activeContainerTarget)?.isContainer)) {\n      clearActiveContainerTarget();\n    }'), "renderAttributeCatalog must auto-clear invalid container target");
assert.ok(t29AppJs.includes('function renderSkillCatalog() {\n    if (activeContainerTarget && (!currentCharacter || !currentCharacter.getContainerAttribute(activeContainerTarget)?.isContainer)) {\n      clearActiveContainerTarget();\n    }'), "renderSkillCatalog must auto-clear invalid container target");
assert.ok(t29AppJs.includes('function renderDefectCatalog() {\n    if (activeContainerTarget && (!currentCharacter || !currentCharacter.getContainerAttribute(activeContainerTarget)?.isContainer)) {\n      clearActiveContainerTarget();\n    }'), "renderDefectCatalog must auto-clear invalid container target");

console.log("✓ Test 29 Passed: Weapon Attribute Addition, Two-Way Sync & Container Context Isolation verified.");

// 30. Test Modal HTML Nesting Independence & Sibling Isolation
console.log("Testing 30: Modal HTML Nesting Independence & Sibling Isolation...");

const t30Html = fs.readFileSync('./index.html', 'utf8');
const t30Lines = t30Html.split(/\r?\n/);
let t30Depth = 0;
const modalDepths = {};

t30Lines.forEach((line, i) => {
  const opens = (line.match(/<div[\s>]/gi) || []).length;
  const closes = (line.match(/<\/div>/gi) || []).length;
  const mMatch = line.match(/id="(modal-[a-z0-9_-]+|dice-roller-drawer)"/);
  if (mMatch && line.includes('class="modal-backdrop')) {
    modalDepths[mMatch[1]] = t30Depth;
  }
  t30Depth += opens - closes;
});

// A. Assert every single modal backdrop is defined at root depth 0 (siblings, never nested)
assert.strictEqual(modalDepths['modal-add-attribute'], 0, "modal-add-attribute must be at root depth 0");
assert.strictEqual(modalDepths['modal-add-skill'], 0, "modal-add-skill must be at root depth 0");
assert.strictEqual(modalDepths['modal-add-defect'], 0, "modal-add-defect must be at root depth 0");
assert.strictEqual(modalDepths['modal-add-weapon'], 0, "modal-add-weapon must be at root depth 0");
assert.strictEqual(modalDepths['modal-trait-info'], 0, "modal-trait-info must be at root depth 0");
assert.strictEqual(modalDepths['modal-templates'], 0, "modal-templates must be at root depth 0");
assert.strictEqual(modalDepths['modal-saveload'], 0, "modal-saveload must be at root depth 0");
assert.strictEqual(modalDepths['modal-folder-settings'], 0, "modal-folder-settings must be at root depth 0");
assert.strictEqual(modalDepths['modal-print-preview'], 0, "modal-print-preview must be at root depth 0");
assert.strictEqual(t30Depth, 0, "Total HTML document div depth must be balanced at 0");

// B. Assert openModal in js/app.js isolates primary catalog modals
const t30AppJs = fs.readFileSync('./js/app.js', 'utf8').replace(/\r\n/g, '\n');
assert.ok(t30AppJs.includes('if (modalId === "modal-add-attribute" || modalId === "modal-add-skill" || modalId === "modal-add-defect" || modalId === "modal-add-weapon") {'), "openModal must check for primary catalog modals");
assert.ok(t30AppJs.includes('if (other) other.classList.remove("open");'), "openModal must close other catalog modals to prevent crosstalk");

console.log("✓ Test 30 Passed: Modal HTML Nesting Independence & Sibling Isolation verified.");

console.log("\n=======================================================");
console.log("🎉 ALL 30 BESM 4E & BESM EXTRAS TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================\n");

