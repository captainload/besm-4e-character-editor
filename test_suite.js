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
  enhancements: "Armour-Piercing"
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

console.log("\n=======================================================");
console.log("🎉 ALL 14 BESM 4E & BESM EXTRAS TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================\n");
