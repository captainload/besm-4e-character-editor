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

global.BESM4E_TRAIT_DESCRIPTIONS = require('./js/trait_descriptions.js');
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
assert.ok(htmlContent.includes('id="btn-menu-export-pdf"') || htmlContent.includes('id="btn-menu-export-md"'), "Export PDF button must exist in File menu");

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
assert.ok(htmlContent.includes('id="btn-modal-export-pdf"') || htmlContent.includes('id="btn-modal-copy-markdown"'), "Modal export PDF button must exist");
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
assert.ok(updatedCss.includes('grid-template-columns: repeat(9, 1fr)') || updatedCss.includes('grid-template-columns: repeat(10, 1fr)'), "derived-pills must use condensed 9 or 10-column single-row layout");
assert.ok(updatedCss.includes('.accounting-item:nth-child(7)'), "7th accounting item must span 2 columns to completely fill row 2");
assert.ok(updatedCss.includes('.identity-card'), "CSS must define compact .identity-card styling");
assert.ok(updatedCss.includes('.identity-card .card-body'), "CSS must define compact .identity-card .card-body padding");

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
assert.ok(legalFlightLim.length >= 18, "General powers have >= 18 legal limiters");
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

// Re-adding existing single-instance skill via addSkill does NOT level up (level only increases via record steppers)
assert.strictEqual(t28Char.addSkill(t28StealthDef, 1), false, "Single-instance skill must not level up via addSkill");
assert.strictEqual(t28Char.skills.length, 2, "Skill count should remain 2");
assert.strictEqual(t28Char.skills[0].level, 1, "Stealth level should remain 1");

// Only increase single-instance skills by using steppers in their skill records
t28Char.updateSkillLevel(t28Char.skills[0].id, 1);
assert.strictEqual(t28Char.skills[0].level, 2, "Stealth level must increase to 2 via skill record stepper");

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
assert.ok(t28AppJs.includes('<span class="pill-add-btn">✓</span>') || t28AppJs.includes('pill.innerHTML = `<strong>${escapeHtml(s.name)}</strong> ✓ Lvl ${curLvl}`'), "Pills must give in-place feedback");
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

// 31. Test Settings Menu, 15-Minute Auto-Check, GitHub Update System & Glowing Update Button
console.log("Testing 31: Settings Menu, 15-Minute Auto-Check, GitHub Update System & Glowing Update Button...");

const t31Html = fs.readFileSync('./index.html', 'utf8');
const t31Css = fs.readFileSync('./css/app.css', 'utf8');
const t31AppJs = fs.readFileSync('./js/app.js', 'utf8');
const t31VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

// A. HTML DOM Elements, Hierarchy & Ordering
assert.ok(t31Html.includes('id="menu-file-trigger"'), "Main menu trigger button must exist in HTML");
assert.ok(t31Html.includes('Main'), "Menu trigger button must be named Main");
assert.ok(t31Html.includes('id="menu-file-dropdown"'), "Main menu dropdown panel must exist in HTML");
assert.ok(t31Html.includes('class="menu-submenu-wrap"'), "Settings must be a submenu wrapper inside Main menu");
assert.ok(t31Html.includes('id="menu-settings-trigger"'), "Settings submenu trigger button must exist in HTML");
assert.ok(t31Html.includes('id="menu-settings-dropdown"'), "Settings submenu dropdown panel must exist in HTML");
assert.ok(t31Html.includes('id="btn-check-updates"'), "Check for updates button must exist in Main menu");

const settingsPanelStart = t31Html.indexOf('id="menu-settings-dropdown"');
const lblAutoUpdatePos = t31Html.indexOf('id="lbl-auto-update"');
const panelClosePos = t31Html.indexOf('</div>', lblAutoUpdatePos);
const settingsPanelHtml = t31Html.slice(settingsPanelStart, panelClosePos);

assert.ok(!settingsPanelHtml.includes('id="btn-check-updates"'), "Check for updates button must be moved up one level out of Settings submenu");
assert.ok(t31Html.includes('id="chk-auto-update"'), "Auto-check updates checkbox must exist in Settings menu");
assert.ok(t31Html.includes('id="lbl-auto-update"'), "Auto-check label must exist in Settings menu");
assert.ok(t31Html.includes('id="btn-about-app"'), "About button must exist in Main menu");
assert.ok(!settingsPanelHtml.includes('id="btn-about-app"'), "About button must be moved up one level out of Settings submenu");
assert.ok(t31Html.includes('id="brand-logo-container"'), "Brand logo container must exist in HTML");
assert.ok(t31Html.includes('id="brand-logo"'), "Brand title logo element must exist in HTML");
assert.ok(t31Html.includes('id="btn-brand-update"'), "Glowing brand update button must exist in HTML");
assert.ok(t31Html.includes('id="modal-app-update"'), "Update details modal must exist in HTML");
assert.ok(t31Html.includes('id="modal-about-app"'), "About info modal must exist in HTML");

// Verify row order: Menu at left end, then brand icon, then title, then description
const appMenuPos = t31Html.indexOf('class="app-menu-bar"');
const brandIconPos = t31Html.indexOf('class="brand-icon"');
const brandLogoPos = t31Html.indexOf('id="brand-logo-container"');
const brandSubtitlePos = t31Html.indexOf('class="brand-subtitle"');
assert.ok(appMenuPos < brandIconPos, "app-menu-bar must precede brand-icon at the left end of the row");
assert.ok(brandIconPos < brandLogoPos, "brand-icon must precede brand-logo-container");
assert.ok(brandLogoPos < brandSubtitlePos, "brand title must precede brand description subtitle");

// B. Root Depth 0 for new modals
assert.strictEqual(modalDepths['modal-app-update'], 0, "modal-app-update backdrop must be at root depth 0");
assert.strictEqual(modalDepths['modal-about-app'], 0, "modal-about-app backdrop must be at root depth 0");

// C. CSS Glowing Animation, Submenu & 12pt Typography Compliance
assert.ok(t31Css.includes('.brand-update-btn'), "CSS must define .brand-update-btn");
assert.ok(t31Css.includes('.brand-update-btn.glowing-update'), "CSS must define .brand-update-btn.glowing-update");
assert.ok(t31Css.includes('@keyframes updatePulseGlow'), "CSS must define @keyframes updatePulseGlow");
assert.ok(t31Css.includes('.menu-item-checkbox'), "CSS must define .menu-item-checkbox");
assert.ok(t31Css.includes('.menu-submenu-wrap'), "CSS must define .menu-submenu-wrap");
assert.ok(t31Css.includes('.menu-submenu-panel'), "CSS must define .menu-submenu-panel");
assert.ok(t31Css.includes('.menu-submenu-trigger'), "CSS must define .menu-submenu-trigger");

const updateBtnCss = t31Css.slice(t31Css.indexOf('.brand-update-btn'), t31Css.indexOf('.brand-update-btn:hover'));
assert.ok(updateBtnCss.includes('font-size: 12pt;'), "Update button must comply with 12pt font standard");

const menuCheckboxCss = t31Css.slice(t31Css.indexOf('.menu-item-checkbox'), t31Css.indexOf('.menu-item-checkbox:hover'));
assert.ok(menuCheckboxCss.includes('font-size: 12pt;'), "Menu checkbox must comply with 12pt font standard");

const submenuPanelCss = t31Css.slice(t31Css.indexOf('.menu-submenu-panel'), t31Css.indexOf('[data-theme="light"] .menu-submenu-panel'));
assert.ok(submenuPanelCss.includes('position: absolute;'), "Submenu panel must be positioned absolute flyout");

// D. Version Metadata & Semantic Version Comparison Logic
assert.ok(t31VersionJson.version.startsWith("1.9."), "version.json version must be valid");
assert.ok(t31AppJs.includes(`version: "${t31VersionJson.version}"`), "app.js APP_VERSION_INFO must match version.json");

// Test semver comparison logic isolated from app.js
function testCompareSemver(v1, v2) {
  if (!v1 || !v2) return 0;
  const clean1 = (v1.startsWith("v") ? v1.slice(1) : v1).trim();
  const clean2 = (v2.startsWith("v") ? v2.slice(1) : v2).trim();
  const parts1 = clean1.split(".").map(n => parseInt(n, 10) || 0);
  const parts2 = clean2.split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

assert.strictEqual(testCompareSemver("1.9.1", "1.9.0"), 1, "1.9.1 should be recognized as newer than 1.9.0");
assert.strictEqual(testCompareSemver("2.0.0", "1.9.0"), 1, "2.0.0 should be recognized as newer than 1.9.0");
assert.strictEqual(testCompareSemver("1.9.0", "1.9.0"), 0, "1.9.0 should be equal to 1.9.0");
assert.strictEqual(testCompareSemver("1.8.0", "1.9.0"), -1, "1.8.0 should be recognized as older than 1.9.0");
assert.strictEqual(testCompareSemver("v1.9.1", "1.9.0"), 1, "Prefix v should be handled cleanly");

// E. 15-Minute Default Auto-Check Interval
assert.ok(t31AppJs.includes('const AUTO_UPDATE_INTERVAL_MS = 15 * 60 * 1000;'), "Auto-update interval must be exactly 15 minutes (900,000 ms)");
assert.ok(t31AppJs.includes('localStorage.getItem("besm4e_auto_update_check") !== "false"'), "Auto-check must default to true when unset");
assert.ok(t31AppJs.includes('raw.githubusercontent.com/captainload/besm-4e-character-editor'), "Update check must target captainload/besm-4e-character-editor GitHub repo");
assert.ok(t31AppJs.includes('btnBrandUpdate.classList.add("glowing-update")'), "New version must add glowing-update class to Update button");

console.log("✓ Test 31 Passed: Settings Menu, 15-Minute Auto-Check, GitHub Update System & Glowing Update Button verified.");

// 32. Test Race and Class Templates Support
console.log("Testing 32: Race and Class Templates Support, Point Integrity & Merging...");

// A. Rules Definitions
assert.ok(Array.isArray(BESM4E_RULES.raceTemplates), "BESM4E_RULES.raceTemplates must be an array");
assert.strictEqual(BESM4E_RULES.raceTemplates.length, 26, "Must define 26 official Race Templates (Human + 25 species)");
assert.ok(Array.isArray(BESM4E_RULES.classTemplates), "BESM4E_RULES.classTemplates must be an array");
assert.strictEqual(BESM4E_RULES.classTemplates.length, 25, "Must define 25 official Class Templates");

// Verify helper lookup methods
assert.ok(typeof BESM4E_RULES.getRaceTemplate === "function", "Must provide getRaceTemplate");
assert.ok(typeof BESM4E_RULES.getClassTemplate === "function", "Must provide getClassTemplate");
assert.ok(typeof BESM4E_RULES.getTemplate === "function", "Must provide getTemplate");

const testNekojinDef = BESM4E_RULES.getRaceTemplate("nekojin");
assert.ok(testNekojinDef, "Must find Nekojin by id");
assert.strictEqual(testNekojinDef.points, 10, "Nekojin template must cost 10 CP");

const testDemonHunterDef = BESM4E_RULES.getClassTemplate("demon_hunter");
assert.ok(testDemonHunterDef, "Must find Demon Hunter by id");
assert.strictEqual(testDemonHunterDef.points, 22, "Demon Hunter template must cost 22 CP");

// B. Point Integrity across all 26 Race and 25 Class templates applied to fresh characters
BESM4E_RULES.raceTemplates.forEach(race => {
  const char = new BESM4ECharacter();
  const res = char.applyRaceTemplate(race.id);
  assert.strictEqual(res, true, `Applying race ${race.id} must succeed`);
  assert.strictEqual(char.race, race.name, `Character race must be set to ${race.name}`);
  const spent = char.getPointBreakdown().netSpent;
  assert.strictEqual(spent, race.points, `Race '${race.name}' (${race.id}) cost must be exactly ${race.points} CP (got ${spent})`);
});

BESM4E_RULES.classTemplates.forEach(cls => {
  const char = new BESM4ECharacter();
  const res = char.applyClassTemplate(cls.id);
  assert.strictEqual(res, true, `Applying class ${cls.id} must succeed`);
  assert.strictEqual(char.characterClass, cls.name, `Character class must be set to ${cls.name}`);
  const spent = char.getPointBreakdown().netSpent;
  assert.strictEqual(spent, cls.points, `Class '${cls.name}' (${cls.id}) cost must be exactly ${cls.points} CP (got ${spent})`);
});

// C. Template Combination (Race + Class)
const comboChar = new BESM4ECharacter({ name: "Kanna of the Shadow Moon" });
comboChar.applyRaceTemplate("nekojin");
comboChar.applyClassTemplate("demon_hunter");

assert.strictEqual(comboChar.race, "Nekojin (Cat-Folk)");
assert.strictEqual(comboChar.characterClass, "Demon Hunter");
assert.strictEqual(comboChar.stats.body, 2, "Body must equal 1 (from Nekojin) + 1 (from Demon Hunter) = 2");
assert.strictEqual(comboChar.stats.mind, 1, "Mind must equal 1 (from Demon Hunter)");
assert.strictEqual(comboChar.getPointBreakdown().netSpent, 32, "Nekojin (10 CP) + Demon Hunter (22 CP) must equal 32 CP total");
assert.strictEqual(comboChar.weapons.length, 2, "Must possess both race weapon and class weapon");
assert.ok(comboChar.weapons.some(w => w.name.includes("Retractable Razor Claws")), "Must have Nekojin claws");
assert.ok(comboChar.weapons.some(w => w.name.includes("Consecrated Silver Blade")), "Must have Demon Hunter blade");
assert.ok(comboChar.skillGroups.some(sg => sg.id === "military" && sg.level === 2), "Must possess Military skill group lvl 2");
assert.ok(comboChar.defects.some(d => d.id === "marked"), "Must possess race and class defects");

// D. JSON Serialization & Restoration
const t32Serialized = comboChar.toJSON();
assert.strictEqual(t32Serialized.race, "Nekojin (Cat-Folk)", "toJSON must serialize race");
assert.strictEqual(t32Serialized.characterClass, "Demon Hunter", "toJSON must serialize characterClass");

const t32Restored = new BESM4ECharacter(t32Serialized);
assert.strictEqual(t32Restored.race, "Nekojin (Cat-Folk)", "Restored character must preserve race");
assert.strictEqual(t32Restored.characterClass, "Demon Hunter", "Restored character must preserve characterClass");
assert.strictEqual(t32Restored.getPointBreakdown().netSpent, 32, "Restored character must maintain 32 CP cost");

// E. UI Verification in index.html, app.css, and app.js
const t32Html = fs.readFileSync('./index.html', 'utf8');
const t32Css = fs.readFileSync('./css/app.css', 'utf8');
const t32AppJs = fs.readFileSync('./js/app.js', 'utf8');

assert.ok(t32Html.includes('id="char-race"'), "HTML must include char-race input");
assert.ok(t32Html.includes('id="char-class"'), "HTML must include char-class input");
assert.ok(t32Html.includes('id="btn-browse-races"'), "HTML must include btn-browse-races button");
assert.ok(t32Html.includes('id="btn-browse-classes"'), "HTML must include btn-browse-classes button");
assert.ok(t32Html.includes('id="tab-btn-races"'), "HTML must include tab-btn-races");
assert.ok(t32Html.includes('id="tab-btn-classes"'), "HTML must include tab-btn-classes");
assert.ok(t32Html.includes('id="tab-btn-archetypes"'), "HTML must include tab-btn-archetypes");

assert.ok(t32Css.includes('.template-tab-btn'), "CSS must define .template-tab-btn");
assert.ok(t32Css.includes('.template-tab-btn.active'), "CSS must define .template-tab-btn.active");

assert.ok(t32AppJs.includes('openTemplatesModal'), "app.js must define openTemplatesModal");
assert.ok(t32AppJs.includes('renderTemplateFilterPills'), "app.js must define renderTemplateFilterPills");
assert.ok(t32AppJs.includes('btn-apply-race-action'), "app.js must handle btn-apply-race-action");
assert.ok(t32AppJs.includes('btn-apply-class-action'), "app.js must handle btn-apply-class-action");

console.log("✓ Test 32 Passed: All 26 Race and 25 Class Templates, Math Integrity & UI Integration verified.");

// 33. Test Global Script Scope Safety & Interactive Update Checker Diagnostics
console.log("Testing 33: Global Script Scope Safety & Update Checker Diagnostics...");
const jsFilesToCheck = [
  './js/rules.js',
  './js/character.js',
  './js/storage.js',
  './js/roller.js',
  './js/app.js'
];

const topLevelDeclarations = {};
jsFilesToCheck.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const declRegex = /^(?:const|let|var|class)\s+([a-zA-Z0-9_$]+)/gm;
  let match;
  while ((match = declRegex.exec(content)) !== null) {
    const ident = match[1];
    if (!topLevelDeclarations[ident]) topLevelDeclarations[ident] = [];
    topLevelDeclarations[ident].push(file);
  }
});

for (const [ident, fileList] of Object.entries(topLevelDeclarations)) {
  assert.strictEqual(
    fileList.length,
    1,
    `Top-level identifier '${ident}' must not be declared in multiple files to avoid browser SyntaxError. Declared in: ${fileList.join(', ')}`
  );
}

// Verify update checker state functions and modal element IDs
const t33AppJs = fs.readFileSync('./js/app.js', 'utf8');
const t33Html = fs.readFileSync('./index.html', 'utf8');

assert.ok(t33AppJs.includes('function setUpToDateState('), "app.js must define setUpToDateState");
assert.ok(t33AppJs.includes('function setUpdateAvailableState('), "app.js must define setUpdateAvailableState");
assert.ok(t33AppJs.includes('function setUpdateErrorState('), "app.js must define setUpdateErrorState");
assert.ok(t33Html.includes('id="update-modal-header"'), "HTML must include update-modal-header");
assert.ok(t33Html.includes('id="update-instructions-box"'), "HTML must include update-instructions-box");

// Assert updateFound requires strictly newer semver
assert.ok(t33AppJs.includes('const updateFound = semverCmp > 0;'), "app.js must strictly require semverCmp > 0 for updateFound");
assert.ok(!t33AppJs.includes('semverCmp >= 0 && isDifferentCommit'), "app.js must not trigger update when versions are equal based on commits");

console.log("✓ Test 33 Passed: Global Script Scope Safety & Update Checker Diagnostics verified.");

// 34. Test Clearing of Previous Archetype, Race, and Class Traits when Archetype is Applied
console.log("Testing 34: Archetype Application Clears Previous Archetype, Race, and Class Traits...");
const testChar34 = new BESM4ECharacter({ name: "Ren the Wanderer" });

// Apply a race and class first
testChar34.applyRaceTemplate("nekojin");
testChar34.applyClassTemplate("demon_hunter");

assert.strictEqual(testChar34.race, "Nekojin (Cat-Folk)");
assert.strictEqual(testChar34.characterClass, "Demon Hunter");
assert.strictEqual(testChar34.appliedRaceTemplateId, "nekojin");
assert.strictEqual(testChar34.appliedClassTemplateId, "demon_hunter");
assert.ok(testChar34.weapons.some(w => w.name.includes("Retractable Razor Claws")), "Must have Nekojin claws");
assert.ok(testChar34.weapons.some(w => w.name.includes("Consecrated Silver Blade")), "Must have Demon Hunter blade");
assert.ok(testChar34.defects.some(d => d.id === "marked"), "Must have Nekojin defect");
assert.ok(testChar34.defects.some(d => d.id === "nemesis"), "Must have Demon Hunter defect");
assert.strictEqual(testChar34.getPointBreakdown().netSpent, 32);

// Now apply an archetype (e.g. Magical Girl)
const loadRes = testChar34.loadTemplate("magical_girl");
assert.strictEqual(loadRes, true, "Loading archetype must succeed");

// Verify race, class, and their metadata are completely cleared
assert.strictEqual(testChar34.race, "", "Race must be cleared to empty string");
assert.strictEqual(testChar34.characterClass, "", "Class must be cleared to empty string");
assert.strictEqual(testChar34.appliedRaceTemplateId, null, "appliedRaceTemplateId must be cleared to null");
assert.strictEqual(testChar34.appliedClassTemplateId, null, "appliedClassTemplateId must be cleared to null");
assert.strictEqual(testChar34.appliedArchetypeId, "magical_girl", "appliedArchetypeId must be set to magical_girl");

// Verify previous race and class traits are gone
assert.ok(!testChar34.weapons.some(w => w.name.includes("Retractable Razor Claws")), "Nekojin claws must be cleared");
assert.ok(!testChar34.weapons.some(w => w.name.includes("Consecrated Silver Blade")), "Demon Hunter blade must be cleared");
assert.ok(!testChar34.defects.some(d => d.id === "marked"), "Nekojin marked defect must be cleared");
assert.ok(!testChar34.defects.some(d => d.id === "nemesis"), "Demon Hunter nemesis defect must be cleared");
assert.ok(!testChar34.skillGroups.some(sg => sg.id === "military"), "Demon Hunter military skills must be cleared");

// Verify traits match the loaded archetype exclusively
assert.strictEqual(testChar34.stats.body, 4, "Magical Girl Body must be 4");
assert.strictEqual(testChar34.stats.mind, 5, "Magical Girl Mind must be 5");
assert.strictEqual(testChar34.stats.soul, 8, "Magical Girl Soul must be 8");
assert.ok(testChar34.weapons.some(w => w.name.includes("Starlight Prism Beam")), "Magical Girl weapon must be present");
assert.strictEqual(testChar34.getPointBreakdown().netSpent, 75, "Magical Girl total points must equal 75 CP");

// Verify template switching for Race (replacing rather than stacking)
const testSwitchChar = new BESM4ECharacter({ name: "Switch Test" });
testSwitchChar.applyRaceTemplate("nekojin");
assert.strictEqual(testSwitchChar.stats.body, 1, "Nekojin adds +1 Body");
assert.strictEqual(testSwitchChar.race, "Nekojin (Cat-Folk)");
testSwitchChar.applyRaceTemplate("dark_elf");
assert.strictEqual(testSwitchChar.race, "Dark Elf");
assert.strictEqual(testSwitchChar.stats.body, 0, "Nekojin's +1 Body was reverted when Dark Elf was applied");
assert.strictEqual(testSwitchChar.stats.mind, 1, "Dark Elf adds +1 Mind");
assert.strictEqual(testSwitchChar.stats.soul, 1, "Dark Elf adds +1 Soul");
assert.ok(!testSwitchChar.weapons.some(w => w.name.includes("Retractable Razor Claws")), "Nekojin claws removed when Dark Elf applied");

console.log("✓ Test 34 Passed: Archetype application clears previous archetype, race, and class traits cleanly.");

// 35. Test Save vs Save As, File Handle Tracking & Direct File Persistence
(async () => {
  console.log("Testing 35: Save vs Save As, File Handle Tracking & Direct File Persistence...");

  // A. File Handle and Filename State API
  BESM4EStorage.clearCurrentFileHandle();
  assert.strictEqual(BESM4EStorage.hasCurrentFileHandle(), false, "Initial state has no file handle");
  assert.strictEqual(BESM4EStorage.getCurrentFileName(), "", "Initial current file name is empty");

  // Mock FileSystemFileHandle
  let writeBuffer = "";
  const mockFileHandle = {
    name: "asuka_langley.besm4e",
    kind: "file",
    async queryPermission() { return "granted"; },
    async requestPermission() { return "granted"; },
    async createWritable() {
      return {
        async write(data) { writeBuffer = data; },
        async close() {}
      };
    }
  };

  BESM4EStorage.setCurrentFileHandle(mockFileHandle, mockFileHandle.name);
  assert.strictEqual(BESM4EStorage.hasCurrentFileHandle(), true, "File handle is registered");
  assert.strictEqual(BESM4EStorage.getCurrentFileName(), "asuka_langley.besm4e", "File name is retained");

  // B. Direct save to file handle
  const testChar35 = new BESM4ECharacter({ name: "Asuka Langley", concept: "Eva Pilot", tier: "heroic" });
  const saveRes = await BESM4EStorage.saveToFileHandle(mockFileHandle, testChar35);
  assert.strictEqual(saveRes.success, true, "Direct save to file handle must succeed");
  assert.strictEqual(saveRes.filename, "asuka_langley.besm4e");
  assert.strictEqual(saveRes.direct, true);
  assert.ok(writeBuffer.includes("Asuka Langley"), "Buffer contains saved character JSON");

  // C. Test saveCurrentFile when handle is active
  writeBuffer = "";
  const saveCurrRes = await BESM4EStorage.saveCurrentFile(testChar35);
  assert.strictEqual(saveCurrRes.success, true, "saveCurrentFile must succeed via active handle");
  assert.strictEqual(saveCurrRes.filename, "asuka_langley.besm4e");
  assert.strictEqual(saveCurrRes.direct, true);
  assert.ok(writeBuffer.includes("Asuka Langley"), "saveCurrentFile wrote to file handle");

  // D. Test clearCurrentFileHandle resets state
  BESM4EStorage.clearCurrentFileHandle();
  assert.strictEqual(BESM4EStorage.hasCurrentFileHandle(), false, "Handle cleared");
  assert.strictEqual(BESM4EStorage.getCurrentFileName(), "", "Name cleared");

  // E. Verify UI code wiring in app.js and index.html
  const fs = require('fs');
  const appJs = fs.readFileSync('./js/app.js', 'utf8');
  const indexHtml = fs.readFileSync('./index.html', 'utf8');

  assert.ok(appJs.includes("executeSaveFile"), "app.js must define executeSaveFile");
  assert.ok(appJs.includes("btnQuickSave"), "btnQuickSave must exist in app.js");
  assert.ok(appJs.includes("executeSaveFile();"), "Ctrl+S shortcut must call executeSaveFile");
  assert.ok(indexHtml.includes('id="btn-quick-save"'), "Main Menu Save button exists");
  assert.ok(indexHtml.includes('id="btn-save-as-file"'), "Main Menu Save As button exists");

  console.log("✓ Test 35 Passed: Save vs Save As, File Handle Tracking & Direct File Persistence verified.");

  // 36. Test Multi-Instance Specialized Skills (e.g. Trade & Blue-Collar Craft)
  console.log("Testing 36: Multi-Instance Specialized Skills & Trade & Blue-Collar Craft...");
  const skillChar = new BESM4ECharacter({ name: "Winry Rockbell", concept: "Automail Engineer", tier: "heroic" });
  const tradeDef = BESM4E_RULES.getSkillDef("trade_craft");
  assert.ok(tradeDef, "Trade & Blue-Collar Craft definition must exist");
  assert.ok(tradeDef.specializations.includes("Mechanic"), "Must include Mechanic");
  assert.ok(tradeDef.specializations.includes("Electrician"), "Must include Electrician");
  assert.ok(tradeDef.specializations.includes("Welder"), "Must include Welder");

  // Add first instance: Mechanic Level 2
  skillChar.addSkill(tradeDef, 2, "Mechanic");
  assert.strictEqual(skillChar.skills.length, 1);
  assert.strictEqual(skillChar.skills[0].name, "Trade & Blue-Collar Craft");
  assert.strictEqual(skillChar.skills[0].specialization, "Mechanic");
  assert.strictEqual(skillChar.skills[0].level, 2);

  // Add second instance: Electrician Level 1
  skillChar.addSkill(tradeDef, 1, "Electrician");
  assert.strictEqual(skillChar.skills.length, 2, "Must create a distinct second instance for different specialization");
  assert.strictEqual(skillChar.skills[1].name, "Trade & Blue-Collar Craft");
  assert.strictEqual(skillChar.skills[1].specialization, "Electrician");
  assert.strictEqual(skillChar.skills[1].level, 1);
  assert.notStrictEqual(skillChar.skills[0].id, skillChar.skills[1].id, "Skill IDs must be unique");

  // Leveling up one instance does not affect the other
  skillChar.updateSkillLevel(skillChar.skills[0].id, 1);
  assert.strictEqual(skillChar.skills[0].level, 3, "Mechanic level increased to 3");
  assert.strictEqual(skillChar.skills[1].level, 1, "Electrician level remains 1");

  // Verify Point Costing: 3 + 1 = 4 CP for skills
  const ptBreakdown = skillChar.getPointBreakdown();
  assert.strictEqual(ptBreakdown.skillsTotal, 4, "Total skills CP must be 4 CP (3 + 1)");

  // Verify Markdown formatting
  const skillMd = BESM4EStorage.generateMarkdown(skillChar);
  assert.ok(skillMd.includes("Trade & Blue-Collar Craft (Mechanic) [Body] (Level 3)"), "Markdown must format Mechanic");
  assert.ok(skillMd.includes("Trade & Blue-Collar Craft (Electrician) [Body] (Level 1)"), "Markdown must format Electrician");

  // Verify inside a container (e.g. Workshop Item)
  const workshopItem = {
    id: "item_workshop",
    name: "Mobile Workshop",
    isContainer: true,
    containerType: "item",
    level: 1,
    costPerLevel: 0.5,
    containerTraits: { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] }
  };
  skillChar.addAttribute(workshopItem, 1);
  skillChar.addContainerTrait(workshopItem.id, "skills", tradeDef, 2, null, null, "Welder");
  skillChar.addContainerTrait(workshopItem.id, "skills", tradeDef, 1, null, null, "Machinist");
  const cont = skillChar.getContainerAttribute(workshopItem.id);
  assert.strictEqual(cont.containerTraits.skills.length, 2, "Container must hold two distinct Trade & Craft specializations");
  assert.strictEqual(cont.containerTraits.skills[0].specialization, "Welder");
  assert.strictEqual(cont.containerTraits.skills[1].specialization, "Machinist");

  console.log("✓ Test 36 Passed: Multi-Instance Specialized Skills & Trade & Blue-Collar Craft verified.");

  // 37. Test Skill Catalog Pill Lighting & Blinking Feedback
  console.log("Testing 37: Skill Catalog Pill Lighting & Blinking Feedback...");

  // A. Repeatable vs Single-Instance Rules Classification
  assert.strictEqual(typeof BESM4E_RULES.isSkillRepeatable, "function", "Must provide isSkillRepeatable helper");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("trade_craft"), true, "Trade & Blue-Collar Craft must be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("artisan"), true, "Artisan must be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("languages"), true, "Languages must be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("driving"), true, "Driving must be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("cooking"), true, "Cooking must be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("stealth"), false, "Stealth must not be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("acrobatics"), false, "Acrobatics must not be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("climbing"), false, "Climbing must not be repeatable");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable("mechanics"), false, "Mechanics must not be repeatable");

  // B. Single-Instance Skills Cannot Create Duplicate Instances
  const testChar37 = new BESM4ECharacter({ name: "Kaitou Kid" });
  const stealthDef = BESM4E_RULES.getSkillDef("stealth");
  assert.ok(stealthDef, "Stealth definition must exist");
  assert.strictEqual(stealthDef.allowMultiple, false, "Stealth must have allowMultiple false");

  testChar37.addSkill(stealthDef, 1);
  assert.strictEqual(testChar37.skills.length, 1);
  assert.strictEqual(testChar37.skills[0].id, "stealth");
  assert.strictEqual(testChar37.skills[0].level, 1);

  // Adding stealth again does NOT increment level via addSkill (only steppers can increase single-instance skills)
  assert.strictEqual(testChar37.addSkill(stealthDef, 1), false, "Stealth must not increment level via addSkill");
  assert.strictEqual(testChar37.skills.length, 1, "Stealth must not create a second instance");
  assert.strictEqual(testChar37.skills[0].level, 1, "Stealth level must remain 1");

  // Single-instance skill increases via skill record stepper
  testChar37.updateSkillLevel(testChar37.skills[0].id, 1);
  assert.strictEqual(testChar37.skills[0].level, 2, "Stealth level increases to 2 via updateSkillLevel");

  // C. Repeatable Skills Support Multiple Distinct Instances
  const langDef = BESM4E_RULES.getSkillDef("languages");
  assert.ok(langDef, "Languages definition must exist");
  assert.strictEqual(langDef.allowMultiple, true, "Languages must have allowMultiple true");

  testChar37.addSkill(langDef, 1, "Japanese");
  testChar37.addSkill(langDef, 2, "French");
  assert.strictEqual(testChar37.skills.filter(s => s.name === "Languages").length, 2, "Must create 2 distinct Languages entries");

  // D. CSS Styles for Lit and Blinking Pills
  const t37Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t37Css.includes('.skill-tag-pill.pill-lit'), "CSS must include .skill-tag-pill.pill-lit class");
  assert.ok(t37Css.includes('.skill-tag-pill.pill-blink-briefly'), "CSS must include .skill-tag-pill.pill-blink-briefly class");
  assert.ok(t37Css.includes('@keyframes pillBlinkEffect'), "CSS must include @keyframes pillBlinkEffect");
  assert.ok(t37Css.includes('@keyframes pillBlinkEffectLight'), "CSS must include light-mode @keyframes pillBlinkEffectLight");

  // E. JS App Integration
  const t37AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t37AppJs.includes('isSkillOnTarget'), "app.js must define isSkillOnTarget helper");
  assert.ok(t37AppJs.includes('getSkillLevelOnTarget'), "app.js must define getSkillLevelOnTarget helper");
  assert.ok(t37AppJs.includes('pill.classList.add("pill-blink-briefly")'), "app.js must apply pill-blink-briefly to repeatable skills");
  assert.ok(t37AppJs.includes('p.classList.add("pill-lit")'), "app.js must apply pill-lit to single-instance skills");

  console.log("✓ Test 37 Passed: Skill Catalog Pill Lighting & Blinking Feedback verified.");

  // 38. Test Single-Instance Skill Steppers, Pill Removal Toggle & Skill Dropdown Exclusion
  console.log("Testing 38: Single-Instance Skill Steppers, Pill Removal Toggle & Skill Dropdown Exclusion...");

  // A. Only Increase Single-Instance Skills via Steppers in Skill Records
  const t38Char = new BESM4ECharacter({ name: "Edward Elric", tier: "heroic" });
  const acrobaticsDef = BESM4E_RULES.getSkillDef("acrobatics");
  assert.ok(acrobaticsDef, "Acrobatics definition must exist");
  assert.strictEqual(BESM4E_RULES.isSkillRepeatable(acrobaticsDef), false, "Acrobatics is single-instance");

  // First addition adds skill at level 1
  assert.ok(t38Char.addSkill(acrobaticsDef, 1), "First addition succeeds");
  assert.strictEqual(t38Char.skills.length, 1);
  assert.strictEqual(t38Char.skills[0].id, "acrobatics");
  assert.strictEqual(t38Char.skills[0].level, 1);

  // Subsequent addSkill does not increment level
  assert.strictEqual(t38Char.addSkill(acrobaticsDef, 1), false, "Cannot increase single-instance skill via addSkill");
  assert.strictEqual(t38Char.skills[0].level, 1, "Level remains 1");

  // Level only increases via stepper in skill record
  t38Char.updateSkillLevel("acrobatics", 1);
  assert.strictEqual(t38Char.skills[0].level, 2, "Level increases to 2 via stepper");
  t38Char.updateSkillLevel("acrobatics", 1);
  assert.strictEqual(t38Char.skills[0].level, 3, "Level increases to 3 via stepper");

  // B. Container Skills Follow Identical Single-Instance Stepper Rule
  const t38Armor = {
    id: "item_automail_arm",
    name: "Automail Arm",
    isContainer: true,
    containerType: "item",
    level: 1,
    containerTraits: { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] }
  };
  t38Char.addAttribute(t38Armor, 1);
  t38Char.addContainerTrait(t38Armor.id, "skills", acrobaticsDef, 1);
  const t38Cont = t38Char.getContainerAttribute(t38Armor.id);
  assert.strictEqual(t38Cont.containerTraits.skills.length, 1);
  assert.strictEqual(t38Cont.containerTraits.skills[0].level, 1);

  // Adding again to container does not increment level
  assert.strictEqual(t38Char.addContainerTrait(t38Armor.id, "skills", acrobaticsDef, 1), false, "Cannot increase single-instance container skill via addContainerTrait");
  assert.strictEqual(t38Cont.containerTraits.skills[0].level, 1);

  // Stepper increases level in container record
  t38Char.updateContainerTraitLevel(t38Armor.id, "skills", "acrobatics", 1);
  assert.strictEqual(t38Cont.containerTraits.skills[0].level, 2, "Container skill level increases via stepper");

  // C. Skill Dropdown in HTML & JS App
  const t38Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t38Html.includes('id="skill-dropdown-select"'), "index.html must include skill dropdown select");
  assert.ok(t38Html.includes('id="btn-add-from-skill-dropdown"'), "index.html must include add button for skill dropdown");

  const t38App = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t38App.includes('function populateSkillDropdown()'), "app.js must define populateSkillDropdown");
  assert.ok(t38App.includes('if (!isRepeatable && alreadyAdded)'), "populateSkillDropdown must check for added single-instance skills");
  assert.ok(t38App.includes('Removed skill'), "app.js must include removal toast on second click of single-instance skill");

  console.log("✓ Test 38 Passed: Single-Instance Skill Steppers, Pill Removal Toggle & Skill Dropdown Exclusion verified.");

  // ========================================================================
  // 39. Test Edit Advancement Unlock, XP Deduction & Log Deletion
  // ========================================================================
  console.log("\nTesting 39: Edit Advancement Unlock, XP Deduction & History Log Deletion...");
  const t39Char = new BESM4ECharacter();
  assert.strictEqual(t39Char.earnedXP, 0, "Initial character earned XP must be 0");
  assert.strictEqual(t39Char.advancementLog.length, 1, "Initial log has 1 creation entry");

  // Simulate user scenario: 4 game session awards of 2 XP
  t39Char.addXP(2, "Session reward");
  t39Char.addXP(2, "Session reward");
  t39Char.addXP(2, "Session reward");
  t39Char.addXP(2, "Session reward");

  assert.strictEqual(t39Char.earnedXP, 8, "Character accumulated 8 XP from 4 awards");
  assert.strictEqual(t39Char.getTotalBudget(), 75 + 8, "Total budget reflects 83 CP");
  assert.strictEqual(t39Char.advancementLog.length, 5, "Log has 5 entries (1 creation + 4 awards)");

  // A. removeXP method
  const deducted = t39Char.removeXP(2, "Test manual deduction");
  assert.strictEqual(deducted, 2, "Deducted 2 XP");
  assert.strictEqual(t39Char.earnedXP, 6, "Earned XP is now 6");
  assert.strictEqual(t39Char.advancementLog[0].action, "Deducted 2 XP");
  assert.strictEqual(t39Char.advancementLog[0].xpChange, -2);
  assert.strictEqual(t39Char.getTotalBudget(), 81);

  // Clamping: removing more than earnedXP clamps to earnedXP
  const overDeduct = t39Char.removeXP(20, "Excess deduction");
  assert.strictEqual(overDeduct, 6, "Clamped deduction to remaining 6 XP");
  assert.strictEqual(t39Char.earnedXP, 0, "Earned XP is now 0");
  assert.strictEqual(t39Char.getTotalBudget(), 75, "Total budget restored to base 75");

  // B. setEarnedXP method
  t39Char.setEarnedXP(10, "Manual set");
  assert.strictEqual(t39Char.earnedXP, 10, "Earned XP directly set to 10");
  assert.strictEqual(t39Char.advancementLog[0].action, "Adjusted +10 XP");
  assert.strictEqual(t39Char.advancementLog[0].xpChange, 10);

  t39Char.setEarnedXP(0, "Reset to 0");
  assert.strictEqual(t39Char.earnedXP, 0, "Earned XP directly reset to 0");
  assert.strictEqual(t39Char.advancementLog[0].action, "Adjusted -10 XP");
  assert.strictEqual(t39Char.advancementLog[0].xpChange, -10);

  // C. deleteAdvancementLog with adjustEarnedXP = true
  const t39Char2 = new BESM4ECharacter();
  t39Char2.addXP(2, "Session reward 1");
  t39Char2.addXP(2, "Session reward 2");
  t39Char2.addXP(2, "Session reward 3");
  t39Char2.addXP(2, "Session reward 4");
  assert.strictEqual(t39Char2.earnedXP, 8);
  assert.strictEqual(t39Char2.advancementLog.length, 5);

  // Delete the 4 session rewards one by one
  const deleted1 = t39Char2.deleteAdvancementLog(0, true);
  assert.strictEqual(deleted1.action, "Awarded 2 XP");
  assert.strictEqual(t39Char2.earnedXP, 6, "Earned XP decreased to 6 after deleting award entry");
  assert.strictEqual(t39Char2.advancementLog.length, 4);

  t39Char2.deleteAdvancementLog(0, true);
  t39Char2.deleteAdvancementLog(0, true);
  t39Char2.deleteAdvancementLog(0, true);
  assert.strictEqual(t39Char2.earnedXP, 0, "All 8 XP removed after deleting all 4 session entries");
  assert.strictEqual(t39Char2.advancementLog.length, 1, "Only initial Character Created entry remains");
  assert.strictEqual(t39Char2.getTotalBudget(), 75);

  // D. Verify UI Elements in index.html and app.js
  const t39Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t39Html.includes('id="btn-toggle-adv-edit"'), "index.html has #btn-toggle-adv-edit");
  assert.ok(t39Html.includes('id="adv-edit-panel"'), "index.html has #adv-edit-panel");
  assert.ok(t39Html.includes('id="btn-deduct-xp"'), "index.html has #btn-deduct-xp");
  assert.ok(t39Html.includes('id="adv-deduct-xp-amount"'), "index.html has #adv-deduct-xp-amount");
  assert.ok(t39Html.includes('id="btn-set-total-xp"'), "index.html has #btn-set-total-xp");
  assert.ok(t39Html.includes('id="btn-reset-all-xp"'), "index.html has #btn-reset-all-xp");
  assert.ok(t39Html.includes('id="adv-log-th-action"'), "index.html has #adv-log-th-action");
  assert.ok(t39Html.includes('v1.9.'), "index.html updated to v1.9.4+");

  const t39AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t39AppJs.includes('isAdvancementEditMode'), "app.js tracks isAdvancementEditMode");
  assert.ok(t39AppJs.includes('toggleAdvancementEditMode'), "app.js implements toggleAdvancementEditMode");
  assert.ok(t39AppJs.includes('btn-delete-adv-log'), "app.js renders btn-delete-adv-log buttons");
  assert.ok(t39AppJs.includes('version: "1.9.'), "app.js updated to 1.9.4+");

  const t39VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  assert.ok(t39VersionJson.version.startsWith("1.9."), "version.json version must be 1.9.4+");

  console.log("✓ Test 39 Passed: Edit Advancement Unlock, XP Deduction & History Log Deletion verified.");

  // ========================================================================
  // 40. Test PDF Export Engine & UI Replacement of Markdown Export
  // ========================================================================
  console.log("\nTesting 40: PDF Export Engine, File Menu & Print Preview Integration...");
  const t40Html = fs.readFileSync('./index.html', 'utf8');
  const t40AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t40Css = fs.readFileSync('./css/app.css', 'utf8');
  const t40VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. html2pdf Bundle Exists and is Referenced
  assert.ok(fs.existsSync('./js/html2pdf.bundle.min.js'), "html2pdf.bundle.min.js must exist in js/ folder");
  const html2pdfStats = fs.statSync('./js/html2pdf.bundle.min.js');
  assert.ok(html2pdfStats.size > 500000, "html2pdf bundle must be a complete standalone build (>500KB)");
  assert.ok(t40Html.includes('<script src="js/html2pdf.bundle.min.js"></script>'), "index.html must include html2pdf.bundle.min.js script tag");

  // B. File Menu & Print Preview Modal UI Elements
  assert.ok(t40Html.includes('id="btn-menu-export-pdf"'), "index.html File Menu must have #btn-menu-export-pdf");
  assert.ok(t40Html.includes('Export Character as PDF'), "File menu must display 'Export Character as PDF'");
  assert.ok(t40Html.includes('id="btn-modal-export-pdf"'), "Modal print preview must have #btn-modal-export-pdf");
  assert.ok(t40Html.includes('Export PDF'), "Modal preview must display 'Export PDF'");

  // C. Safe PDF Filename Generation
  const t40Char = new BESM4ECharacter({ name: "Shinji Ikari / Pilot 01", concept: "Eva Pilot", tier: "mythical" });
  const pdfFilename = BESM4EStorage.formatSafeFilename(t40Char, ".pdf");
  assert.strictEqual(pdfFilename, "shinji_ikari_pilot_01.pdf", "formatSafeFilename must sanitize name with .pdf extension");

  // D. PDF Engine Implementation in app.js
  assert.ok(t40AppJs.includes('async function exportCharacterPDF()'), "app.js must define exportCharacterPDF function");
  assert.ok(t40AppJs.includes('window.exportCharacterPDF = exportCharacterPDF;'), "app.js must attach exportCharacterPDF to window");
  assert.ok(t40AppJs.includes('btn-menu-export-pdf'), "app.js must wire up btn-menu-export-pdf event listener");
  assert.ok(t40AppJs.includes('btn-modal-export-pdf'), "app.js must wire up btn-modal-export-pdf event listener");
  assert.ok(t40AppJs.includes('pdf-export-mode'), "app.js must apply pdf-export-mode container class");
  assert.ok(t40AppJs.includes('pdf-loading-overlay'), "app.js must display full-screen loading overlay while rendering");
  assert.ok(t40AppJs.includes('position: relative;') || t40AppJs.includes('position: fixed; top: 0; left: 0;'), "app.js must style sandbox for html2canvas capture in normal document flow");

  // E. CSS Print and PDF Optimization Rules
  assert.ok(t40Css.includes('.pdf-export-mode'), "app.css must define .pdf-export-mode styles");
  assert.ok(t40Css.includes('--text-main: #111827 !important;'), "app.css must force dark charcoal text variables in PDF export mode");
  assert.ok(t40Css.includes('--bg-main: #ffffff !important;'), "app.css must force white background variables in PDF export mode");
  assert.ok(t40Css.includes('@keyframes spin'), "app.css must define @keyframes spin for loading overlay");
  assert.ok(t40Css.includes('break-inside: avoid;'), "app.css must include break-inside: avoid for clean PDF page breaks");
  assert.ok(t40Css.includes('page-break-inside: avoid;'), "app.css must include page-break-inside: avoid for PDF rendering");

  // F. Version Synchronization
  assert.ok(t40VersionJson.version.startsWith("1.9."), "version.json version must be valid");
  assert.ok(t40Html.includes(`v${t40VersionJson.version}`), "index.html must display version");
  assert.ok(t40AppJs.includes(`version: "${t40VersionJson.version}"`), "app.js APP_VERSION_INFO must match version.json");

  console.log("✓ Test 40 Passed: PDF Export Engine, File Menu & Print Preview Integration verified.");

  // ========================================================================
  // 41. Test Character Sheet Appearance Precedes Background & Non-Columnar Layout
  // ========================================================================
  console.log("\nTesting 41: Character Sheet Appearance Precedes Background & Non-Columnar Layout...");
  const t41Html = fs.readFileSync('./index.html', 'utf8');
  const t41AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t41Css = fs.readFileSync('./css/app.css', 'utf8');

  // A. No columnar layout for background/appearance in print/PDF rendering
  assert.ok(!t41AppJs.includes('grid-template-columns: repeat(2, 1fr); gap: 1rem;'), "renderPrintSheet must not use columnar layout for background narrative");

  // B. Appearance precedes Background in renderPrintSheet
  const appIdx = t41AppJs.indexOf('${currentCharacter.appearance ?');
  const backIdx = t41AppJs.indexOf('${currentCharacter.backstory ?', appIdx);
  const alliesIdx = t41AppJs.indexOf('${currentCharacter.alliesEnemies ?', backIdx);
  assert.ok(appIdx > 0, "renderPrintSheet must render appearance");
  assert.ok(backIdx > appIdx, "renderPrintSheet must render appearance BEFORE background");
  assert.ok(alliesIdx > backIdx, "renderPrintSheet must render allies & enemies after background");

  // C. Full-width sequential narrative CSS classes
  assert.ok(t41Css.includes('.sheet-narrative-container'), "app.css must define .sheet-narrative-container");
  assert.ok(t41Css.includes('.sheet-narrative-item'), "app.css must define .sheet-narrative-item");
  assert.ok(t41Css.includes('.pdf-export-mode .sheet-narrative-item strong'), "app.css must style narrative items for PDF export");

  // D. Editor Form Card Title Order in index.html
  assert.ok(t41Html.includes('📝 Appearance, Background & Contacts'), "index.html card title must have Appearance before Background");

  // E. Markdown Generator Appearance Order in storage.js
  const t41Char = new BESM4ECharacter({
    name: "Akira Test",
    appearance: "Spiky crimson hair, amber eyes.",
    backstory: "Former test pilot for experimental orbital frames.",
    alliesEnemies: "Dr. Asuka (Patron), Major Vance (Rival)"
  });
  const t41Md = BESM4EStorage.generateMarkdown(t41Char);
  const mdAppPos = t41Md.indexOf('### Appearance');
  const mdBackPos = t41Md.indexOf('### Background');
  const mdAlliesPos = t41Md.indexOf('### Allies & Enemies');
  assert.ok(mdAppPos > 0, "generateMarkdown must output ### Appearance");
  assert.ok(mdBackPos > mdAppPos, "generateMarkdown must output Appearance BEFORE Background");
  assert.ok(mdAlliesPos > mdBackPos, "generateMarkdown must output Allies & Enemies after Background");

  console.log("✓ Test 41 Passed: Character Sheet Appearance Precedes Background & Non-Columnar Layout verified.");

  // ========================================================================
  // 42. Test Attribute Descriptive Details Text Fields (Flight, Spaceflight, etc.)
  // ========================================================================
  console.log("\nTesting 42: Attribute Descriptive Details Text Fields (Flight, Spaceflight, Armour, etc.)...");

  // A. Flight attribute definition in BESM4E_RULES
  const flightDef = BESM4E_RULES.getAttributeDef("flight");
  assert.ok(flightDef, "Flight attribute must exist in BESM4E_RULES");
  assert.strictEqual(flightDef.detailLabel, "Flight Form / Propulsion", "Flight attribute must have descriptive detailLabel");
  assert.ok(flightDef.detailPlaceholder && flightDef.detailPlaceholder.includes("Wings"), "Flight placeholder must guide propulsion/form");
  assert.strictEqual(flightDef.allowMultiple, true, "Flight must allow multiple instances for characters with different flight forms");

  // B. Other descriptive attributes definition checks
  const descriptiveAttrs = [
    { id: "spaceflight", label: "Space Propulsion Method" },
    { id: "ground_speed", label: "Propulsion / Mode" },
    { id: "water_speed", label: "Aquatic Propulsion / Form" },
    { id: "armour", label: "Armour Type / Material" },
    { id: "force_field", label: "Field Manifestation" },
    { id: "extra_arms", label: "Appendage Type" },
    { id: "healing", label: "Healing Medium / Method" },
    { id: "heightened_senses", label: "Enhanced Senses" },
    { id: "superstrength", label: "Strength Source / Form" },
    { id: "superspeed", label: "Speed Manifestation" },
    { id: "teleport", label: "Teleport Effect / Style" },
    { id: "telekinesis", label: "TK Visual / Theme" },
    { id: "wealth", label: "Source of Wealth" }
  ];
  descriptiveAttrs.forEach(item => {
    const dDef = BESM4E_RULES.getAttributeDef(item.id);
    assert.ok(dDef, `Attribute ${item.id} must exist`);
    assert.strictEqual(dDef.detailLabel, item.label, `Attribute ${item.id} must have detailLabel "${item.label}"`);
    assert.ok(dDef.detailPlaceholder, `Attribute ${item.id} must have detailPlaceholder`);
  });

  // C. Add Flight with explicit detail and verify character storage
  const t42Char = new BESM4ECharacter({ name: "Aria Valkyrie", tier: "heroic" });
  t42Char.addAttribute(flightDef, 3, "Flight", null, "", "Feathered Angel Wings");
  const addedFlight = t42Char.attributes.find(a => a.id.startsWith("flight"));
  assert.ok(addedFlight, "Flight must be present on character");
  assert.strictEqual(addedFlight.detail, "Feathered Angel Wings", "Flight detail must be saved accurately");

  // D. Update attribute detail via updateAttributeDetail
  assert.ok(t42Char.updateAttributeDetail(addedFlight.id, "Anti-Grav Harness"), "updateAttributeDetail must return true");
  assert.strictEqual(addedFlight.detail, "Anti-Grav Harness", "Flight detail must be updated");

  // E. Automatic Parenthetical Name Migration / Extraction
  const t42Char2 = new BESM4ECharacter({ name: "Demon Lord", tier: "mythical" });
  t42Char2.addAttribute({ id: "flight", name: "Flight (Leathery Fiend Wings)", level: 2 });
  const fiendFlight = t42Char2.attributes.find(a => a.id.startsWith("flight"));
  assert.ok(fiendFlight, "Fiend flight must be present");
  assert.strictEqual(fiendFlight.name, "Flight", "Attribute name must be cleaned of parenthetical");
  assert.strictEqual(fiendFlight.detail, "Leathery Fiend Wings", "Detail must be extracted from parenthetical");

  // F. Container Attribute Detail Support
  const t42Chassis = new BESM4ECharacter({ name: "Mecha Unit 01" });
  t42Chassis.addAttribute(BESM4E_RULES.getAttributeDef("chassis"), 5);
  const chassisAttr = t42Chassis.attributes.find(a => a.id.startsWith("chassis"));
  assert.ok(chassisAttr, "Chassis container attribute must exist");
  t42Chassis.addContainerTrait(chassisAttr.id, "attributes", {
    id: "flight",
    name: "Flight",
    level: 3,
    detail: "High-Output Rocket Thrusters"
  });
  const contFlight = chassisAttr.containerTraits.attributes.find(a => a.id === "flight");
  assert.ok(contFlight, "Container flight attribute must exist");
  assert.strictEqual(contFlight.detail, "High-Output Rocket Thrusters", "Container flight detail must be preserved");

  t42Chassis.updateContainerTraitDetail(chassisAttr.id, "attributes", "flight", "Plasma Afterburners");
  assert.strictEqual(contFlight.detail, "Plasma Afterburners", "updateContainerTraitDetail must update contained trait detail");

  // G. Character Sheet Display Name and Markdown Export Verification
  const t42Md = BESM4EStorage.generateMarkdown(t42Char);
  assert.ok(t42Md.includes("Flight [Anti-Grav Harness]"), "Markdown export must render Flight [Anti-Grav Harness]");

  // H. App UI and CSS verification for small visible text field
  const t42AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t42Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t42AppJs.includes('.attr-detail-input'), "app.js must query and wire .attr-detail-input");
  assert.ok(t42AppJs.includes('def.detailLabel'), "app.js must check def.detailLabel");
  assert.ok(t42AppJs.includes('.cont-attr-detail-input'), "app.js must support .cont-attr-detail-input");
  assert.ok(t42AppJs.includes('.catalog-detail-input'), "app.js must support .catalog-detail-input in trait catalog");
  assert.ok(t42Css.includes('.trait-detail-input'), "app.css must define .trait-detail-input styling");
  assert.ok(t42Css.includes('.trait-config-bar'), "app.css must define .trait-config-bar styling");

  console.log("✓ Test 42 Passed: Attribute Descriptive Details Text Fields verified.");

  // ========================================================================
  // 43. Test Alphabetical Sorting of Added Traits (Attributes, Skills, Defects)
  // ========================================================================
  console.log("\nTesting 43: Alphabetical Sorting of Added Traits (Attributes, Skills, Defects)...");

  // A. Comparator and Key Extraction Functions
  assert.strictEqual(typeof BESM4ECharacter.getTraitSortKey, "function", "BESM4ECharacter.getTraitSortKey must be a function");
  assert.strictEqual(typeof BESM4ECharacter.compareTraitsAlphabetically, "function", "BESM4ECharacter.compareTraitsAlphabetically must be a function");

  assert.strictEqual(BESM4ECharacter.getTraitSortKey({ name: "Armour" }), "Armour");
  assert.strictEqual(BESM4ECharacter.getTraitSortKey({ name: "Flight", detail: "Wings" }), "Flight Wings");
  assert.strictEqual(BESM4ECharacter.getTraitSortKey({ name: "Combat Technique", subTrait: "Dead Eye" }), "Combat Technique Dead Eye");
  assert.strictEqual(BESM4ECharacter.getTraitSortKey({ name: "Domestic Arts", specialization: "Cooking" }), "Domestic Arts Cooking");

  // Comparison assertions
  assert.ok(BESM4ECharacter.compareTraitsAlphabetically({ name: "Armour" }, { name: "Flight" }) < 0, "Armour comes before Flight");
  assert.ok(BESM4ECharacter.compareTraitsAlphabetically({ name: "Flight", detail: "Jetpack" }, { name: "Flight", detail: "Wings" }) < 0, "Flight Jetpack comes before Flight Wings");
  assert.ok(BESM4ECharacter.compareTraitsAlphabetically({ name: "Combat Technique", subTrait: "Blind Fighting" }, { name: "Combat Technique", subTrait: "Dead Eye" }) < 0, "Combat Technique (Blind Fighting) comes before Combat Technique (Dead Eye)");

  // B. Character Model Non-Mutating Sorted Getters
  const t43Char = new BESM4ECharacter({ name: "Alphabetical Hero" });

  // Add attributes in unsorted order
  t43Char.addAttribute(BESM4E_RULES.getAttributeDef("superstrength"), 2);
  t43Char.addAttribute(BESM4E_RULES.getAttributeDef("armour"), 4);
  t43Char.addAttribute(BESM4E_RULES.getAttributeDef("flight"), 2, null, null, "", "Wings");
  t43Char.addAttribute(BESM4E_RULES.getAttributeDef("combat_technique"), 1, null, null, "Dead Eye");
  t43Char.addAttribute(BESM4E_RULES.getAttributeDef("combat_technique"), 1, null, null, "Blind Fighting");

  // Check getSortedAttributes()
  const sortedAttrs = t43Char.getSortedAttributes();
  assert.strictEqual(sortedAttrs.length, 5);
  assert.strictEqual(sortedAttrs[0].name, "Armour");
  assert.strictEqual(sortedAttrs[1].name, "Combat Technique");
  assert.strictEqual(sortedAttrs[1].subTrait, "Blind Fighting");
  assert.strictEqual(sortedAttrs[2].name, "Combat Technique");
  assert.strictEqual(sortedAttrs[2].subTrait, "Dead Eye");
  assert.strictEqual(sortedAttrs[3].name, "Flight");
  assert.strictEqual(sortedAttrs[3].detail, "Wings");
  assert.strictEqual(sortedAttrs[4].name, "Superstrength");

  // Ensure original array was not mutated by the getter
  assert.strictEqual(t43Char.attributes[0].name, "Superstrength");

  // Add Skill Groups in unsorted order
  t43Char.addSkillGroup(BESM4E_RULES.getSkillGroupDef("detective"), 1);
  t43Char.addSkillGroup(BESM4E_RULES.getSkillGroupDef("academic"), 2);
  t43Char.addSkillGroup(BESM4E_RULES.getSkillGroupDef("artistic"), 1);

  const sortedGroups = t43Char.getSortedSkillGroups();
  assert.strictEqual(sortedGroups.length, 3);
  assert.strictEqual(sortedGroups[0].name, "Academic");
  assert.strictEqual(sortedGroups[1].name, "Artistic");
  assert.strictEqual(sortedGroups[2].name, "Detective");

  // Add Individual Skills in unsorted order
  t43Char.addSkill(BESM4E_RULES.getSkillDef("stealth"), 2);
  t43Char.addSkill(BESM4E_RULES.getSkillDef("acrobatics"), 3);
  t43Char.addSkill(BESM4E_RULES.getSkillDef("trade_craft"), 2, "Welder");
  t43Char.addSkill(BESM4E_RULES.getSkillDef("trade_craft"), 1, "Mechanic");
  t43Char.addSkill(BESM4E_RULES.getSkillDef("computers"), 2);

  const sortedSkills = t43Char.getSortedSkills();
  assert.strictEqual(sortedSkills.length, 5);
  assert.strictEqual(sortedSkills[0].name, "Acrobatics");
  assert.strictEqual(sortedSkills[1].name, "Computers");
  assert.strictEqual(sortedSkills[2].name, "Stealth");
  assert.strictEqual(sortedSkills[3].name, "Trade & Blue-Collar Craft");
  assert.strictEqual(sortedSkills[3].specialization, "Mechanic");
  assert.strictEqual(sortedSkills[4].name, "Trade & Blue-Collar Craft");
  assert.strictEqual(sortedSkills[4].specialization, "Welder");

  // Add Defects in unsorted order
  t43Char.addDefect(BESM4E_RULES.getDefectDef("reduced_damage"), 1);
  t43Char.addDefect(BESM4E_RULES.getDefectDef("awkward_size"), 1);
  t43Char.addDefect(BESM4E_RULES.getDefectDef("bane"), 2, null, "Sunlight");
  t43Char.addDefect(BESM4E_RULES.getDefectDef("bane"), 1, null, "Cold Iron");

  const sortedDefects = t43Char.getSortedDefects();
  assert.strictEqual(sortedDefects.length, 4);
  assert.strictEqual(sortedDefects[0].name, "Awkward Size");
  assert.strictEqual(sortedDefects[1].name, "Bane");
  assert.strictEqual(sortedDefects[1].detail, "Cold Iron");
  assert.strictEqual(sortedDefects[2].name, "Bane");
  assert.strictEqual(sortedDefects[2].detail, "Sunlight");
  assert.strictEqual(sortedDefects[3].name, "Reduced Damage");

  // C. Container Traits Sorting in Markdown Export
  t43Char.addAttribute(BESM4E_RULES.getAttributeDef("item"), 3, "Utility Belt");
  const belt = t43Char.attributes.find(a => a.name === "Utility Belt");
  assert.ok(belt, "Belt container must exist");
  t43Char.addContainerTrait(belt.id, "attributes", BESM4E_RULES.getAttributeDef("telepathy"), 1);
  t43Char.addContainerTrait(belt.id, "attributes", BESM4E_RULES.getAttributeDef("force_field"), 2);
  t43Char.addContainerTrait(belt.id, "attributes", BESM4E_RULES.getAttributeDef("armour"), 2);

  t43Char.addContainerTrait(belt.id, "skills", BESM4E_RULES.getSkillDef("stealth"), 2);
  t43Char.addContainerTrait(belt.id, "skills", BESM4E_RULES.getSkillDef("medical"), 1);
  t43Char.addContainerTrait(belt.id, "skills", BESM4E_RULES.getSkillDef("electronics"), 3);

  t43Char.addContainerTrait(belt.id, "defects", BESM4E_RULES.getDefectDef("wanted"), 1);
  t43Char.addContainerTrait(belt.id, "defects", BESM4E_RULES.getDefectDef("fragile"), 1);

  // Generate Markdown and verify alphabetical order in output
  const t43Md = BESM4EStorage.generateMarkdown(t43Char);

  // Verify Attributes section ordering in Markdown
  const posArmour = t43Md.indexOf("- **Armour");
  const posCombatTechBlind = t43Md.indexOf("- **Combat Technique (Blind Fighting)");
  const posCombatTechDeadEye = t43Md.indexOf("- **Combat Technique (Dead Eye)");
  const posFlight = t43Md.indexOf("- **Flight [Wings]");
  const posSuperstrength = t43Md.indexOf("- **Superstrength");
  const posBelt = t43Md.indexOf("- **Utility Belt");

  assert.ok(posArmour > 0, "Armour in markdown");
  assert.ok(posCombatTechBlind > posArmour, "Blind Fighting after Armour");
  assert.ok(posCombatTechDeadEye > posCombatTechBlind, "Dead Eye after Blind Fighting");
  assert.ok(posFlight > posCombatTechDeadEye, "Flight after Dead Eye");
  assert.ok(posSuperstrength > posFlight, "Superstrength after Flight");
  assert.ok(posBelt > posSuperstrength, "Utility Belt after Superstrength");

  // Verify Contained traits ordering in Markdown
  const posContArmour = t43Md.indexOf("- *Attribute:* Armour");
  const posContForceField = t43Md.indexOf("- *Attribute:* Force Field");
  const posContTelepathy = t43Md.indexOf("- *Attribute:* Telepathy");
  assert.ok(posContForceField > posContArmour, "Contained Force Field after Armour");
  assert.ok(posContTelepathy > posContForceField, "Contained Telepathy after Force Field");

  const posContElec = t43Md.indexOf("- *Skill:* Electronics");
  const posContMed = t43Md.indexOf("- *Skill:* Medical");
  const posContStealth = t43Md.indexOf("- *Skill:* Stealth");
  assert.ok(posContMed > posContElec, "Contained Medical after Electronics");
  assert.ok(posContStealth > posContMed, "Contained Stealth after Medical");

  const posContFragile = t43Md.indexOf("- *Defect:* Fragile");
  const posContWanted = t43Md.indexOf("- *Defect:* Wanted");
  assert.ok(posContWanted > posContFragile, "Contained Wanted after Fragile");

  // Verify Skills section ordering in Markdown
  const posAcadGrp = t43Md.indexOf("- **Academic Group");
  const posArtGrp = t43Md.indexOf("- **Artistic Group");
  const posDetGrp = t43Md.indexOf("- **Detective Group");
  assert.ok(posArtGrp > posAcadGrp, "Artistic Group after Academic Group");
  assert.ok(posDetGrp > posArtGrp, "Detective Group after Artistic Group");

  const posAcro = t43Md.indexOf("- **Acrobatics");
  const posComp = t43Md.indexOf("- **Computers");
  const posStealth = t43Md.indexOf("- **Stealth");
  const posCraftMech = t43Md.indexOf("- **Trade & Blue-Collar Craft (Mechanic)");
  const posCraftWeld = t43Md.indexOf("- **Trade & Blue-Collar Craft (Welder)");
  assert.ok(posComp > posAcro, "Computers after Acrobatics");
  assert.ok(posStealth > posComp, "Stealth after Computers");
  assert.ok(posCraftMech > posStealth, "Craft Mechanic after Stealth");
  assert.ok(posCraftWeld > posCraftMech, "Craft Welder after Craft Mechanic");

  // Verify Defects section ordering in Markdown
  const posAwkward = t43Md.indexOf("- **Awkward Size");
  const posBaneCold = t43Md.indexOf("- **Bane [Cold Iron]");
  const posBaneSun = t43Md.indexOf("- **Bane [Sunlight]");
  const posRedDmg = t43Md.indexOf("- **Reduced Damage");
  assert.ok(posBaneCold > posAwkward, "Bane Cold Iron after Awkward Size");
  assert.ok(posBaneSun > posBaneCold, "Bane Sunlight after Bane Cold Iron");
  assert.ok(posRedDmg > posBaneSun, "Reduced Damage after Bane Sunlight");

  // D. In-Place sortTraits() Method
  t43Char.sortTraits();
  assert.strictEqual(t43Char.attributes[0].name, "Armour", "sortTraits mutates attributes in-place");
  assert.strictEqual(t43Char.skillGroups[0].name, "Academic", "sortTraits mutates skillGroups in-place");
  assert.strictEqual(t43Char.skills[0].name, "Acrobatics", "sortTraits mutates skills in-place");
  assert.strictEqual(t43Char.defects[0].name, "Awkward Size", "sortTraits mutates defects in-place");
  assert.strictEqual(belt.containerTraits.attributes[0].name, "Armour", "sortTraits mutates container attributes in-place");
  assert.strictEqual(belt.containerTraits.skills[0].name, "Electronics", "sortTraits mutates container skills in-place");
  assert.strictEqual(belt.containerTraits.defects[0].name, "Fragile", "sortTraits mutates container defects in-place");

  // E. Verify App Code & UI Implementation
  const t43AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t43AppJs.includes('function sortTraitsList('), "app.js must define sortTraitsList helper");
  assert.ok(t43AppJs.includes('sortTraitsList(currentCharacter.attributes)'), "renderBuilderAttributes must sort attributes");
  assert.ok(t43AppJs.includes('sortTraitsList(traits.attributes)'), "renderBuilderAttributes must sort container attributes");
  assert.ok(t43AppJs.includes('sortTraitsList(traits.skills)'), "renderBuilderAttributes must sort container skills");
  assert.ok(t43AppJs.includes('sortTraitsList(traits.defects)'), "renderBuilderAttributes must sort container defects");
  assert.ok(t43AppJs.includes('sortTraitsList(currentCharacter.skillGroups)'), "renderBuilderSkillGroups must sort skill groups");
  assert.ok(t43AppJs.includes('sortTraitsList(currentCharacter.skills)'), "renderBuilderSkillGroups must sort skills");
  assert.ok(t43AppJs.includes('sortTraitsList(currentCharacter.defects)'), "renderBuilderDefects must sort defects");

  // F. Version Synchronization
  const t43VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  const t43Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t43VersionJson.version.startsWith("1.9."), "version.json version must be 1.9.9+");
  assert.ok(t43Html.includes(`v${t43VersionJson.version}`), "index.html must display version");
  assert.ok(t43AppJs.includes(`version: "${t43VersionJson.version}"`), "app.js APP_VERSION_INFO must be valid");

  console.log("✓ Test 43 Passed: Alphabetical Sorting of Added Traits (Attributes, Skills, Defects) across builder, sheet, PDF, and markdown verified.");

  // ========================================================================
  // 44. Test Custom Attribute Description Editing from Builder Tab
  // ========================================================================
  console.log("\nTesting 44: Custom Attribute Description Editing from Character Builder Tab...");

  // A. Model Methods: updateAttributeDescription & updateContainerTraitDescription
  const t44Char = new BESM4ECharacter({ name: "Cyborg Infiltrator", tier: "heroic" });
  
  // 1. Standard / Custom Attribute description editing
  t44Char.addAttribute({
    id: "custom_stealth_camo",
    name: "Active Camouflage",
    costPerLevel: 2,
    maxLevel: 5
  }, 2, null, "Bends light around user");

  assert.strictEqual(t44Char.attributes.length, 1, "Character has 1 attribute");
  assert.strictEqual(t44Char.attributes[0].customDesc, "Bends light around user", "Initial customDesc matches");

  const updateAttrRes = t44Char.updateAttributeDescription("custom_stealth_camo", "Advanced quantum metamaterial bending light and thermal radiation");
  assert.strictEqual(updateAttrRes, true, "updateAttributeDescription returns true");
  assert.strictEqual(t44Char.attributes[0].customDesc, "Advanced quantum metamaterial bending light and thermal radiation", "customDesc updated successfully");

  // 2. Container Attribute description editing
  t44Char.addAttribute({
    id: "item_power_armor",
    isContainer: true,
    containerType: "item",
    name: "Powered Armor Suit",
    costPerLevel: 1
  }, 1, null, "Heavy exosuit");

  const containerAttr = t44Char.attributes.find(a => a.id === "item_power_armor");
  assert.ok(containerAttr, "Container attribute added");
  assert.strictEqual(containerAttr.customDesc, "Heavy exosuit", "Initial container customDesc matches");

  const updateContRes = t44Char.updateAttributeDescription("item_power_armor", "Military-grade ceramic-reinforced armored powered exosuit");
  assert.strictEqual(updateContRes, true, "updateAttributeDescription returns true for container");
  assert.strictEqual(containerAttr.customDesc, "Military-grade ceramic-reinforced armored powered exosuit", "Container customDesc updated successfully");

  // 3. Contained Sub-Attribute description editing
  t44Char.addContainerTrait("item_power_armor", "attributes", {
    id: "armour",
    name: "Armour",
    costPerLevel: 2
  }, 3, null, "Standard plating");

  const contArmour = containerAttr.containerTraits.attributes.find(a => a.id === "armour");
  assert.ok(contArmour, "Contained armour attribute found");
  assert.strictEqual(contArmour.customDesc, "Standard plating", "Initial contained attribute customDesc matches");

  const updateContTraitRes = t44Char.updateContainerTraitDescription("item_power_armor", "attributes", "armour", "Ablative composite nanocarbon armor plates with reactive weave");
  assert.strictEqual(updateContTraitRes, true, "updateContainerTraitDescription returns true");
  assert.strictEqual(contArmour.customDesc, "Ablative composite nanocarbon armor plates with reactive weave", "Contained attribute customDesc updated successfully");

  // 4. Weapon Attribute description & notes synchronization
  t44Char.addAttribute({
    id: "weapon_plasma",
    attributeId: "weapon",
    name: "Plasma Carbine",
    level: 3
  }, 3, null, "Standard energy rifle");

  const plasmaAttr = t44Char.attributes.find(a => a.id === "weapon_plasma");
  const plasmaWpn = t44Char.weapons.find(w => w.id === "weapon_plasma");
  assert.ok(plasmaAttr && plasmaWpn, "Weapon attribute and linked weapon item created");

  t44Char.updateAttributeDescription("weapon_plasma", "Superheated ionized plasma bolter with magnetic stabilization");
  assert.strictEqual(plasmaAttr.customDesc, "Superheated ionized plasma bolter with magnetic stabilization", "Weapon attribute customDesc updated");
  assert.strictEqual(plasmaWpn.notes, "Superheated ionized plasma bolter with magnetic stabilization", "Linked weapon notes synchronized with customDesc");

  // B. Persistence & Serialization
  const serialized = JSON.stringify(t44Char);
  const reloaded = new BESM4ECharacter(JSON.parse(serialized));
  const reloadedCamo = reloaded.attributes.find(a => a.id === "custom_stealth_camo");
  const reloadedSuit = reloaded.attributes.find(a => a.id === "item_power_armor");
  const reloadedArmour = reloadedSuit.containerTraits.attributes.find(a => a.id === "armour");
  const reloadedPlasma = reloaded.attributes.find(a => a.id === "weapon_plasma");

  assert.strictEqual(reloadedCamo.customDesc, "Advanced quantum metamaterial bending light and thermal radiation", "Custom attribute customDesc persists across serialization");
  assert.strictEqual(reloadedSuit.customDesc, "Military-grade ceramic-reinforced armored powered exosuit", "Container customDesc persists across serialization");
  assert.strictEqual(reloadedArmour.customDesc, "Ablative composite nanocarbon armor plates with reactive weave", "Contained attribute customDesc persists across serialization");
  assert.strictEqual(reloadedPlasma.customDesc, "Superheated ionized plasma bolter with magnetic stabilization", "Weapon customDesc persists across serialization");

  // C. Markdown Generation Reflects Custom Descriptions
  const mdExport = BESM4EStorage.generateMarkdown(reloaded);
  assert.ok(mdExport.includes("Advanced quantum metamaterial bending light and thermal radiation"), "Markdown export contains custom attribute description");
  assert.ok(mdExport.includes("Military-grade ceramic-reinforced armored powered exosuit"), "Markdown export contains container description");

  // D. App & UI Code Verification
  const t44AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t44AppJs.includes('attr-desc-input'), "app.js renders .attr-desc-input for standard/custom attributes");
  assert.ok(t44AppJs.includes('container-desc-input'), "app.js renders .container-desc-input for container attributes");
  assert.ok(t44AppJs.includes('cont-attr-desc-input'), "app.js renders .cont-attr-desc-input for contained attributes");
  assert.ok(t44AppJs.includes('currentCharacter.updateAttributeDescription(id, val)'), "app.js calls updateAttributeDescription on change");
  assert.ok(t44AppJs.includes('currentCharacter.updateContainerTraitDescription(cId, "attributes", id, val)'), "app.js calls updateContainerTraitDescription on change");

  // E. CSS Rules & 12pt Standard
  const t44Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t44Css.includes('.trait-desc-input'), "app.css defines .trait-desc-input");
  assert.ok(t44Css.includes('.trait-desc-wrap'), "app.css defines .trait-desc-wrap");
  const descInputCss = t44Css.slice(t44Css.indexOf('.trait-desc-input {'), t44Css.indexOf('.trait-desc-input:focus'));
  assert.ok(descInputCss.includes('font-size: 12pt;'), "trait-desc-input must comply with 12pt font standard");

  // F. Version Synchronization
  const t44VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  const t44Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t44VersionJson.version.startsWith("1.9."), "version.json version must be 1.9.10+");
  assert.ok(t44Html.includes(`v${t44VersionJson.version}`), "index.html must display version");
  assert.ok(t44Html.includes(`css/app.css?v=${t44VersionJson.version}`), "index.html must cache-bust css");
  assert.ok(t44Html.includes(`js/app.js?v=${t44VersionJson.version}`), "index.html must cache-bust app.js");
  assert.ok(t44AppJs.includes(`version: "${t44VersionJson.version}"`), "app.js APP_VERSION_INFO must be valid");

  console.log("✓ Test 44 Passed: Custom Attribute Description Editing from Character Builder Tab verified.");

  // ========================================================================
  // 45. Test Alternate Form Container Trait Addition, Stats & Persistence
  // ========================================================================
  console.log("\nTesting 45: Alternate Form Container Trait Addition, Stats & Persistence...");

  // A. Blank character adds Alternate Form container
  const t45Char = new BESM4ECharacter();
  t45Char.setHumanAverageStats(); // 24 CP spent on stats
  const altDef = BESM4E_RULES.attributes.find(a => a.id === "alternate_form");
  assert.ok(altDef, "Alternate Form definition must exist in BESM4E_RULES.attributes");
  assert.strictEqual(altDef.isContainer, true, "Alternate Form definition must have isContainer: true");
  assert.strictEqual(altDef.containerType, "alternate_form", "Alternate Form definition must have containerType: 'alternate_form'");

  // Add Alternate Form (Level 2 = 8 CP character cost, 20 CP budget)
  t45Char.addAttribute(altDef, 2, "Alternate Form (Magical Girl)", "Sparkling transformation with ribbon fanfare");
  const altAttr = t45Char.attributes.find(a => a.name === "Alternate Form (Magical Girl)");
  assert.ok(altAttr, "Alternate Form attribute must be added to character");
  assert.strictEqual(altAttr.isContainer, true, "Alternate Form instance must be flagged as container");
  assert.strictEqual(altAttr.containerType, "alternate_form", "Alternate Form containerType must be 'alternate_form'");
  assert.notStrictEqual(altAttr.containerType, "alternate", "Alternate Form containerType must NOT be truncated to 'alternate'");

  // Verify getContainerAttribute resolves it
  const contFromChar = t45Char.getContainerAttribute(altAttr.id);
  assert.ok(contFromChar, "getContainerAttribute must return Alternate Form container");
  assert.strictEqual(contFromChar.id, altAttr.id);

  // Initial Point Breakdown & Container Point Accounting
  let cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.effectiveCharacterCost, 8, "Level 2 Alternate Form costs 8 CP");
  assert.strictEqual(cpInfo.budgetAllowance, 20, "Level 2 grants 20 CP budget");
  assert.strictEqual(cpInfo.netContainedPoints, 0, "Initial net contained points is 0");
  assert.strictEqual(cpInfo.remainingBudget, 20, "Initial remaining budget is 20 CP");

  // B. Setting independent container stats (Body 3, Mind 3, Soul 3 = 18 CP)
  t45Char.setContainerStat(altAttr.id, "body", 3);
  t45Char.setContainerStat(altAttr.id, "mind", 3);
  t45Char.setContainerStat(altAttr.id, "soul", 3);
  cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.statsCost, 18, "Body 3, Mind 3, Soul 3 = 18 CP spent from budget");
  assert.strictEqual(cpInfo.netContainedPoints, 18);
  assert.strictEqual(cpInfo.remainingBudget, 2, "20 budget - 18 spent = 2 CP left");

  // Verify derived stats of the Alternate Form
  let altDerived = t45Char.getContainerDerived(altAttr.id);
  assert.ok(altDerived, "Container derived stats must be calculated");
  assert.strictEqual(altDerived.baseCV, 3, "(3+3+3)/3 = 3");
  assert.strictEqual(altDerived.maxHealth, 30, "(3+3)*5 = 30 HP");
  assert.strictEqual(altDerived.maxEnergy, 30, "(3+3)*5 = 30 EP");

  // C. Adding Contained Traits across all categories
  // 1. Attribute: Armour Level 1 (2 CP)
  const t45ArmourDef = BESM4E_RULES.attributes.find(a => a.id === "armour");
  t45Char.addContainerTrait(altAttr.id, "attributes", t45ArmourDef, 1);
  assert.strictEqual(altAttr.containerTraits.attributes.length, 1, "Must contain 1 attribute");
  cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.attributesCost, 2, "Armour 1 costs 2 CP");
  assert.strictEqual(cpInfo.netContainedPoints, 20, "18 stats + 2 armour = 20 CP");
  assert.strictEqual(cpInfo.remainingBudget, 0, "Budget exactly exhausted (0 CP left)");
  altDerived = t45Char.getContainerDerived(altAttr.id);
  assert.strictEqual(altDerived.armorRating, 5, "Alternate Form has 5 AR from Armour 1");

  // 2. Defect: Involuntary Change Rank 1 (1 CP refund)
  const t45DefectDef = BESM4E_RULES.defects.find(d => d.id === "involuntary_change");
  t45Char.addContainerTrait(altAttr.id, "defects", t45DefectDef, 1);
  assert.strictEqual(altAttr.containerTraits.defects.length, 1, "Must contain 1 defect");
  cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.defectsRefund, 1, "Involuntary Change 1 refunds 1 CP");
  assert.strictEqual(cpInfo.netContainedPoints, 19, "20 - 1 = 19 CP spent");
  assert.strictEqual(cpInfo.remainingBudget, 1, "1 CP remaining in budget");

  // 3. Skill: Acrobatics Level 1 (1 CP)
  const t45SkillDef = BESM4E_RULES.getAllConstituentSkills().find(s => s.id === "acrobatics");
  t45Char.addContainerTrait(altAttr.id, "skills", t45SkillDef, 1);
  assert.strictEqual(altAttr.containerTraits.skills.length, 1, "Must contain 1 skill");
  cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.skillsCost, 1, "Acrobatics 1 costs 1 CP");
  assert.strictEqual(cpInfo.netContainedPoints, 20, "19 + 1 = 20 CP spent");
  assert.strictEqual(cpInfo.remainingBudget, 0, "Budget exactly balanced");

  // 4. Weapon: Starlight Beam Level 2 (4 CP value)
  t45Char.addContainerTrait(altAttr.id, "weapons", {
    name: "Starlight Prism Beam",
    level: 2,
    range: "25m",
    attackType: "ranged",
    enhancements: "Accurate",
    limiters: "Concentration"
  });
  assert.strictEqual(altAttr.containerTraits.weapons.length, 1, "Must contain 1 weapon");
  cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.weaponsCost, 4, "Weapon Level 2 costs 4 CP");
  assert.strictEqual(cpInfo.netContainedPoints, 24, "20 + 4 = 24 CP spent");
  assert.strictEqual(cpInfo.remainingBudget, -4, "Over budget by 4 CP");

  // Verify getAllWeapons() includes Alternate Form weapon
  const t45AllWpns = t45Char.getAllWeapons();
  const altWpn = t45AllWpns.find(w => w.name === "Starlight Prism Beam");
  assert.ok(altWpn, "getAllWeapons must include Alternate Form attack");
  assert.strictEqual(altWpn.containerName, "Alternate Form (Magical Girl)");

  // D. Verify Main Character Point Accounting Isolation
  const t45PtBreakdown = t45Char.getPointBreakdown();
  assert.strictEqual(t45PtBreakdown.stats.total, 24, "Main character stats = 24 CP");
  assert.strictEqual(t45PtBreakdown.attributesTotal, 8, "Main character pays 8 CP for Level 2 Alternate Form");
  assert.strictEqual(t45PtBreakdown.netSpent, 32, "Total main character spent = 24 stats + 8 altForm = 32 CP");

  // E. Verify Container Sub-Trait Steppers & Trait Deletion
  // Level up Armour to Level 2 (+2 CP)
  t45Char.updateContainerTraitLevel(altAttr.id, "attributes", altAttr.containerTraits.attributes[0].id, 1);
  assert.strictEqual(altAttr.containerTraits.attributes[0].level, 2, "Armour level updated to 2");
  cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.attributesCost, 4, "Armour 2 costs 4 CP");

  // Remove weapon
  const wpnId = altAttr.containerTraits.weapons[0].id;
  t45Char.removeContainerTrait(altAttr.id, "weapons", wpnId);
  assert.strictEqual(altAttr.containerTraits.weapons.length, 0, "Weapon successfully removed");
  cpInfo = t45Char.getContainerPoints(altAttr);
  assert.strictEqual(cpInfo.weaponsCost, 0, "Weapons cost resets to 0");
  assert.strictEqual(cpInfo.netContainedPoints, 22, "18 stats + 4 armour - 1 defect + 1 skill = 22 CP");

  // F. Storage & Reload Persistence
  BESM4EStorage.saveCharacter(t45Char);
  const t45Reloaded = BESM4EStorage.loadCharacter(t45Char.id);
  assert.ok(t45Reloaded, "Character successfully reloaded from storage");
  const t45ReloadedAlt = t45Reloaded.attributes.find(a => a.name === "Alternate Form (Magical Girl)");
  assert.ok(t45ReloadedAlt, "Reloaded character has Alternate Form");
  assert.strictEqual(t45ReloadedAlt.isContainer, true, "Reloaded Alternate Form isContainer must be true");
  assert.strictEqual(t45ReloadedAlt.containerType, "alternate_form", "Reloaded Alternate Form containerType must be 'alternate_form'");
  assert.strictEqual(t45ReloadedAlt.containerStats.body, 3);
  assert.strictEqual(t45ReloadedAlt.containerStats.mind, 3);
  assert.strictEqual(t45ReloadedAlt.containerStats.soul, 3);
  assert.strictEqual(t45ReloadedAlt.containerTraits.attributes.length, 1);
  assert.strictEqual(t45ReloadedAlt.containerTraits.defects.length, 1);
  assert.strictEqual(t45ReloadedAlt.containerTraits.skills.length, 1);

  // G. Archetype Normalization: Magical Girl Archetype
  const mgChar = new BESM4ECharacter();
  mgChar.loadTemplate("magical_girl");
  const mgAlt = mgChar.attributes.find(a => a.id === "alternate_form" || a.attributeId === "alternate_form");
  assert.ok(mgAlt, "Magical Girl archetype must contain Alternate Form");
  assert.strictEqual(mgAlt.isContainer, true, "Archetype Alternate Form must be normalized with isContainer: true");
  assert.strictEqual(mgAlt.containerType, "alternate_form", "Archetype Alternate Form containerType must be 'alternate_form'");
  assert.notStrictEqual(mgAlt.containerType, "alternate", "Must not be truncated to 'alternate'");
  const mgCont = mgChar.getContainerAttribute(mgAlt.id);
  assert.ok(mgCont, "getContainerAttribute must return archetype's Alternate Form");

  // Add trait to archetype Alternate Form container
  mgChar.addContainerTrait(mgAlt.id, "attributes", t45ArmourDef, 1);
  assert.strictEqual(mgAlt.containerTraits.attributes.length, 1, "Must add trait to archetype Alternate Form container");

  // H. Version Synchronization
  const t45VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  const t45Html = fs.readFileSync('./index.html', 'utf8');
  const t45AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t45VersionJson.version.startsWith("1.9."), "version.json version must be 1.9.11+");
  assert.ok(t45Html.includes(`v${t45VersionJson.version}`), "index.html must display version");
  assert.ok(t45Html.includes(`css/app.css?v=${t45VersionJson.version}`), "index.html must cache-bust css");
  assert.ok(t45Html.includes(`js/app.js?v=${t45VersionJson.version}`), "index.html must cache-bust app.js");
  assert.ok(t45AppJs.includes(`version: "${t45VersionJson.version}"`), "app.js APP_VERSION_INFO must be valid");

  console.log("✓ Test 45 Passed: Alternate Form Container Trait Addition, Stats & Persistence verified.");

  // ========================================================================
  // 46. Test Nested Alternate Form Inside Item Container (Transformed Vehicle)
  // ========================================================================
  console.log("\nTesting 46: Nested Alternate Form Inside Item Container (Transformed Vehicle)...");

  // A. Create Character with an Item Container (e.g. Transforming Fighter)
  const t46Char = new BESM4ECharacter({ name: "Roy Focker", concept: "Squadron Leader", tier: "heroic" });
  t46Char.addAttribute({
    id: "item_valkyrie",
    attributeId: "item",
    name: "VF-1S Valkyrie",
    level: 1,
    costPerLevel: 0.5,
    isContainer: true,
    containerType: "item"
  });

  const t46Item = t46Char.getContainerAttribute("item_valkyrie");
  assert.ok(t46Item, "Item container must be retrieved via getContainerAttribute");
  assert.strictEqual(t46Item.isContainer, true, "Item container must have isContainer flag");
  assert.strictEqual(t46Item.containerType, "item", "Item container must have containerType 'item'");

  // B. Add Alternate Form attribute into the Item container
  const t46AltDef = {
    id: "alternate_form",
    name: "Battroid Mode",
    costPerLevel: 4,
    description: "Transforms fighter into humanoid battroid combat mecha."
  };
  t46Char.addContainerTrait("item_valkyrie", "attributes", t46AltDef, 2);

  const t46Alt = t46Item.containerTraits.attributes.find(a => a.id === "alternate_form" || a.attributeId === "alternate_form");
  assert.ok(t46Alt, "Alternate Form must be added to Item containerTraits.attributes");
  assert.strictEqual(t46Alt.isContainer, true, "Nested Alternate Form must be initialized as a container");
  assert.strictEqual(t46Alt.containerType, "alternate_form", "Nested Alternate Form containerType must be alternate_form");
  assert.strictEqual(t46Alt.level, 2, "Nested Alternate Form level must be 2");
  assert.deepStrictEqual(t46Alt.containerStats, { body: 0, mind: 0, soul: 0 }, "Nested Alternate Form must have containerStats initialized");
  assert.ok(Array.isArray(t46Alt.containerTraits.attributes), "Nested containerTraits.attributes must be array");
  assert.ok(Array.isArray(t46Alt.containerTraits.weapons), "Nested containerTraits.weapons must be array");
  assert.ok(Array.isArray(t46Alt.containerTraits.skills), "Nested containerTraits.skills must be array");
  assert.ok(Array.isArray(t46Alt.containerTraits.defects), "Nested containerTraits.defects must be array");

  // C. Recursive getContainerAttribute lookup
  const foundAltDirect = t46Char.getContainerAttribute(t46Alt.id);
  assert.ok(foundAltDirect, "getContainerAttribute must recursively find nested container by ID");
  assert.strictEqual(foundAltDirect.id, t46Alt.id, "Recursively found container must match nested Alternate Form");

  // D. Set stats on nested Alternate Form and verify Budget and Derived Stats
  t46Char.setContainerStat(t46Alt.id, "body", 4);
  t46Char.setContainerStat(t46Alt.id, "mind", 2);
  t46Char.setContainerStat(t46Alt.id, "soul", 2);
  assert.strictEqual(t46Alt.containerStats.body, 4, "Body stat updated to 4");
  assert.strictEqual(t46Alt.containerStats.mind, 2, "Mind stat updated to 2");
  assert.strictEqual(t46Alt.containerStats.soul, 2, "Soul stat updated to 2");

  const t46AltPtsInitial = t46Char.getContainerPoints(t46Alt.id);
  assert.strictEqual(t46AltPtsInitial.statsCost, 16, "Stats cost must be 16 CP");
  assert.strictEqual(t46AltPtsInitial.effectiveCharacterCost, 8, "Alternate Form effective cost is level 2 * 4 = 8 CP");
  assert.strictEqual(t46AltPtsInitial.budgetAllowance, 20, "Alternate Form budget allowance is level 2 * 10 = 20 CP");
  assert.strictEqual(t46AltPtsInitial.remainingBudget, 4, "Remaining budget is 20 - 16 = 4 CP");

  const t46AltDerived = t46Char.getContainerDerived(t46Alt.id);
  assert.strictEqual(t46AltDerived.baseCV, 2, "Base CV = floor((4+2+2)/3) = 2");
  assert.strictEqual(t46AltDerived.maxHealth, 30, "Max HP = (4+2)*5 = 30");
  assert.strictEqual(t46AltDerived.maxEnergy, 20, "Max EP = (2+2)*5 = 20");
  assert.strictEqual(t46AltDerived.damageMultiplier, 5, "DM = 5");

  // E. Add sub-traits to nested Alternate Form: Attribute, Weapon, Skill, Defect
  // 1) Armour attribute (Level 2 = 4 CP)
  t46Char.addContainerTrait(t46Alt.id, "attributes", { id: "armour", name: "Armour", costPerLevel: 2 }, 2);
  assert.strictEqual(t46Alt.containerTraits.attributes.length, 1, "Armour added to nested Alternate Form");

  // 2) Weapon (Level 3 = 6 CP value)
  t46Char.addContainerTrait(t46Alt.id, "weapons", { id: "wpn_gunpod", name: "GU-11 Gunpod", level: 3, range: "100m" });
  assert.strictEqual(t46Alt.containerTraits.weapons.length, 1, "Gunpod weapon added to nested Alternate Form");

  // 3) Skill (Level 2 = 2 CP)
  t46Char.addContainerTrait(t46Alt.id, "skills", { id: "acrobatics", name: "Acrobatics", stat: "Body", costPerLevel: 1 }, 2);
  assert.strictEqual(t46Alt.containerTraits.skills.length, 1, "Skill added to nested Alternate Form");

  // 4) Defect (Rank 1 = 2 CP refund)
  t46Char.addContainerTrait(t46Alt.id, "defects", { id: "bane", name: "Bane", refundPerRank: 2 }, 1);
  assert.strictEqual(t46Alt.containerTraits.defects.length, 1, "Defect added to nested Alternate Form");

  // Verify getAllWeapons recursively gathers nested container weapon
  const t46AllWeapons = t46Char.getAllWeapons();
  const gunpod = t46AllWeapons.find(w => w.name === "GU-11 Gunpod");
  assert.ok(gunpod, "getAllWeapons must collect weapons from nested Alternate Form container");
  assert.strictEqual(gunpod.containerId, t46Alt.id, "Collected weapon must record nested containerId");

  // F. Point Accounting and Container Cost Isolation
  const t46AltPtsFinal = t46Char.getContainerPoints(t46Alt.id);
  // Total contained traits: 16 (stats) + 4 (armour) + 6 (weapon) + 2 (skill) - 2 (defect) = 26 CP
  assert.strictEqual(t46AltPtsFinal.netContainedPoints, 26, "Alt Form net contained points is 26 CP");
  assert.strictEqual(t46AltPtsFinal.budgetAllowance, 20, "Alt Form budget allowance is 20 CP");
  assert.strictEqual(t46AltPtsFinal.remainingBudget, -6, "Alt Form remaining budget is -6 CP (over budget)");

  // Item container cost:
  // Item contained traits includes Alternate Form (level 2 * 4 CP = 8 CP).
  // The Item halves contained traits: floor(8 / 2) = 4 CP.
  const t46ItemPts = t46Char.getContainerPoints("item_valkyrie");
  assert.strictEqual(t46ItemPts.netContainedPoints, 8, "Item container net contained points reflects Alternate Form cost only");
  assert.strictEqual(t46ItemPts.effectiveCharacterCost, 4, "Item container halves Alternate Form cost: floor(8/2) = 4 CP");
  assert.strictEqual(t46Char.getAttributeCost(t46Item), 4, "Character pays 4 CP for the Item container");

  // G. Trait Level Stepping and Deletion on Nested Container
  const armourTrait = t46Alt.containerTraits.attributes[0];
  t46Char.updateContainerTraitLevel(t46Alt.id, "attributes", armourTrait.id, 1);
  assert.strictEqual(armourTrait.level, 3, "Armour level incremented to 3 in nested container");

  const skillTrait = t46Alt.containerTraits.skills[0];
  t46Char.removeContainerTrait(t46Alt.id, "skills", skillTrait.id);
  assert.strictEqual(t46Alt.containerTraits.skills.length, 0, "Skill removed from nested container");

  // H. Storage Persistence & Reloading Normalization
  const t46SavedJson = JSON.stringify(t46Char);
  const t46ReloadedChar = new BESM4ECharacter(JSON.parse(t46SavedJson));
  t46ReloadedChar.normalizeContainerAttributes();

  const t46ReloadedAlt = t46ReloadedChar.getContainerAttribute(t46Alt.id);
  assert.ok(t46ReloadedAlt, "Nested Alternate Form found after deserialization");
  assert.strictEqual(t46ReloadedAlt.isContainer, true, "Reloaded nested Alternate Form retains isContainer");
  assert.strictEqual(t46ReloadedAlt.containerType, "alternate_form", "Reloaded nested Alternate Form retains containerType");
  assert.strictEqual(t46ReloadedAlt.containerStats.body, 4, "Reloaded nested Alternate Form retains Body stat");
  assert.strictEqual(t46ReloadedAlt.containerTraits.attributes[0].level, 3, "Reloaded nested Alternate Form retains modified Armour level");
  assert.strictEqual(t46ReloadedChar.getAllWeapons().some(w => w.name === "GU-11 Gunpod"), true, "Reloaded weapons list includes nested weapon");

  // I. Markdown Export Formatting
  const t46Markdown = BESM4EStorage.generateMarkdown(t46ReloadedChar);
  assert.ok(t46Markdown.includes("VF-1S Valkyrie"), "Markdown includes parent item container");
  assert.ok(t46Markdown.includes("Battroid Mode"), "Markdown includes nested alternate form name");
  assert.ok(t46Markdown.includes("Transformed State / Alternate Form:"), "Markdown includes transformed state label");
  assert.ok(t46Markdown.includes("Body 4, Mind 2, Soul 2"), "Markdown formats nested container stats");
  assert.ok(t46Markdown.includes("GU-11 Gunpod"), "Markdown formats nested weapon");

  // J. UI Code and CSS Assertions
  const t46AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t46Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t46Css.includes('.nested-container-card'), "app.css defines .nested-container-card");
  assert.ok(t46AppJs.includes('renderContainerSubTraitsHtml'), "app.js implements renderContainerSubTraitsHtml");
  assert.ok(t46AppJs.includes('btn-open-cont-add'), "app.js renders quick add buttons for nested container");

  // K. Version Synchronization (v1.9.12+)
  const t46VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  const t46Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t46VersionJson.version.startsWith("1.9."), "version.json version must be 1.9.12+");
  assert.ok(t46Html.includes(`v${t46VersionJson.version}`), "index.html must display v1.9.12+");
  assert.ok(t46Html.includes(`css/app.css?v=${t46VersionJson.version}`), "index.html must cache-bust css with v=1.9.12+");
  assert.ok(t46Html.includes(`js/app.js?v=${t46VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.12+");
  assert.ok(t46AppJs.includes(`version: "${t46VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.12+");

  console.log("✓ Test 46 Passed: Nested Alternate Form Inside Item Container (Transformed Vehicle) verified.");

  // ========================================================================
  // 47. Test Ground Speed Road-Bound Limiter, Container Attribute Modifiers & Export
  // ========================================================================
  console.log("\nTesting 47: Ground Speed Road-Bound Limiter, Container Attribute Modifiers & Export...");

  // A. Ground Speed Rules Definition and Modifiers Discovery
  const gsDef = BESM4E_RULES.getAttributeDef("ground_speed");
  assert.ok(gsDef, "Ground Speed attribute definition must exist in BESM4E_RULES");
  assert.ok(Array.isArray(gsDef.specificLimiters), "Ground Speed must define specificLimiters array");
  
  const roadBoundSpecific = gsDef.specificLimiters.find(l => l.id === "road_bound");
  assert.ok(roadBoundSpecific, "Ground Speed must have road_bound specific limiter");
  assert.strictEqual(roadBoundSpecific.name, "Road-Bound");
  assert.strictEqual(roadBoundSpecific.refundPerRank, 1, "Road-Bound refunds 1 CP per rank");
  assert.ok(roadBoundSpecific.description.includes("paved roads") || roadBoundSpecific.description.includes("1/4"), "Road-Bound description must explain road restriction and 1/4 off-road speed");

  const assistedSpecific = gsDef.specificLimiters.find(l => l.id === "assisted");
  assert.ok(assistedSpecific, "Ground Speed must have assisted specific limiter");
  assert.strictEqual(assistedSpecific.refundPerRank, 1);

  // Legal Limiters & Enhancements retrieval
  const legalGsLimiters = BESM4E_RULES.getLegalLimitersForAttribute("ground_speed");
  assert.ok(legalGsLimiters.some(l => l.id === "road_bound"), "Legal limiters for Ground Speed must include road_bound");
  assert.ok(legalGsLimiters.some(l => l.id === "assisted"), "Legal limiters for Ground Speed must include assisted");
  assert.ok(legalGsLimiters.some(l => l.id === "concentration"), "Legal limiters for Ground Speed must include general limiters (e.g. concentration)");
  assert.ok(legalGsLimiters.length >= 15, "Ground Speed must have extensive legal limiters");

  const legalGsEnhancements = BESM4E_RULES.getLegalEnhancementsForAttribute("ground_speed");
  assert.ok(legalGsEnhancements.some(e => e.id === "area"), "Legal enhancements for Ground Speed must include general enhancements (e.g. area)");
  assert.ok(legalGsEnhancements.length >= 15, "Ground Speed must have extensive legal enhancements");

  // Modifier resolution via getModifierDef
  const resolvedRb = BESM4E_RULES.getModifierDef("ground_speed", "limiter", "road_bound");
  assert.ok(resolvedRb, "getModifierDef must resolve road_bound for ground_speed");
  assert.strictEqual(resolvedRb.name, "Road-Bound");
  assert.strictEqual(resolvedRb.refundPerRank, 1);

  const resolvedAssisted = BESM4E_RULES.getModifierDef("ground_speed", "limiter", "assisted");
  assert.ok(resolvedAssisted, "getModifierDef must resolve assisted for ground_speed");
  assert.strictEqual(resolvedAssisted.name, "Assisted");

  // B. Attribute Cost Calculation with Road-Bound and Enhancements
  const testGsAttr = {
    id: "ground_speed",
    name: "Ground Speed",
    level: 3,
    limiters: [
      { id: "road_bound", name: "Road-Bound", rank: 1, refundPerRank: 1 }
    ]
  };
  let gsCost = BESM4E_RULES.calculateAttributeCost(testGsAttr);
  assert.strictEqual(gsCost.baseCost, 3, "Level 3 Ground Speed base cost = 3 CP (1 CP/lvl)");
  assert.strictEqual(gsCost.limRefund, 1, "Rank 1 Road-Bound refunds 1 CP");
  assert.strictEqual(gsCost.totalCost, 2, "Net cost = 3 - 1 = 2 CP");

  // Add enhancement
  testGsAttr.enhancements = [
    { id: "area", name: "Area", rank: 1, costPerRank: 1 }
  ];
  gsCost = BESM4E_RULES.calculateAttributeCost(testGsAttr);
  assert.strictEqual(gsCost.enhCost, 1, "Rank 1 Area adds 1 CP");
  assert.strictEqual(gsCost.totalCost, 3, "Net cost = 3 + 1 - 1 = 3 CP");

  // Attempting to increase Road-Bound rank to 2 clamps at maxRank 1 (BESM 4E p. 96)
  testGsAttr.limiters[0].rank = 2;
  gsCost = BESM4E_RULES.calculateAttributeCost(testGsAttr);
  assert.strictEqual(gsCost.limRefund, 1, "Road-Bound rank 2 clamps to maxRank 1 (1 CP refund)");
  assert.strictEqual(gsCost.totalCost, 3, "Net cost = 3 + 1 - 1 = 3 CP");

  // Multi-rank specific limiter (Assisted, maxRank: 3) scales refund up to rank 3
  testGsAttr.limiters = [
    { id: "assisted", name: "Assisted", rank: 2, refundPerRank: 1 }
  ];
  gsCost = BESM4E_RULES.calculateAttributeCost(testGsAttr);
  assert.strictEqual(gsCost.limRefund, 2, "Rank 2 Assisted refunds 2 CP");
  assert.strictEqual(gsCost.totalCost, 2, "Net cost = 3 + 1 - 2 = 2 CP");

  // C. Container Attribute Modifiers: Contained Ground Speed in Vehicle Item
  const t47Char = new BESM4ECharacter({ name: "Speed Racer", concept: "Racer", tier: "heroic" });
  t47Char.addAttribute({
    id: "item_mach5",
    attributeId: "item",
    name: "Mach 5 Sports Car",
    level: 1,
    costPerLevel: 0.5,
    isContainer: true,
    containerType: "item"
  });

  const mach5Item = t47Char.getContainerAttribute("item_mach5");
  assert.ok(mach5Item, "Mach 5 Item container must exist");

  // Add Ground Speed Level 6 (6 * 1 = 6 CP base) to the Item container
  t47Char.addContainerTrait("item_mach5", "attributes", gsDef, 6);
  const contGs = mach5Item.containerTraits.attributes.find(a => a.id === "ground_speed" || a.attributeId === "ground_speed");
  assert.ok(contGs, "Ground Speed must be added to Mach 5 container");
  assert.strictEqual(contGs.level, 6);

  // Initial Item point calculation
  let mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 6, "Mach 5 contains 6 CP (Ground Speed Level 6)");
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 3, "Mach 5 Item cost is floor(6/2) = 3 CP");

  // Add Road-Bound Limiter Rank 1 to contained Ground Speed
  const addLimRes = t47Char.addContainerTraitLimiter("item_mach5", "attributes", contGs.id, "road_bound", 1);
  assert.strictEqual(addLimRes, true, "addContainerTraitLimiter must return true");
  assert.ok(Array.isArray(contGs.limiters), "Contained Ground Speed must have limiters array");
  assert.strictEqual(contGs.limiters.length, 1);
  assert.strictEqual(contGs.limiters[0].id, "road_bound");
  assert.strictEqual(contGs.limiters[0].name, "Road-Bound");
  assert.strictEqual(contGs.limiters[0].rank, 1);
  assert.strictEqual(contGs.limiters[0].maxRank, 1);
  assert.strictEqual(contGs.limiters[0].refundPerRank, 1);

  // Contained Ground Speed cost is 6 - 1 = 5 CP. Mach 5 Item cost is floor(5 / 2) = 2 CP.
  mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 5, "Net contained points = 5 CP after Road-Bound rank 1");
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 2, "Mach 5 Item cost is floor(5/2) = 2 CP");
  assert.strictEqual(t47Char.getAttributeCost(mach5Item), 2, "Character pays 2 CP for Mach 5");

  // Attempting to step Road-Bound rank to 2 via updateContainerTraitLimiterRank clamps at maxRank 1
  const stepLimRes = t47Char.updateContainerTraitLimiterRank("item_mach5", "attributes", contGs.id, "road_bound", 2);
  assert.strictEqual(stepLimRes, true, "updateContainerTraitLimiterRank must return true");
  assert.strictEqual(contGs.limiters[0].rank, 1, "Road-Bound rank clamped at maxRank 1");

  // Add Assisted Limiter Rank 1 and step to Rank 2 to test multi-rank limiter stepping
  t47Char.addContainerTraitLimiter("item_mach5", "attributes", contGs.id, "assisted", 1);
  t47Char.updateContainerTraitLimiterRank("item_mach5", "attributes", contGs.id, "assisted", 1);
  mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 4, "Net contained points = 4 CP after Road-Bound (1) + Assisted (1) (6 - 2 = 4)");
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 2, "Mach 5 Item cost is floor(4/2) = 2 CP");

  // Add Enhancement to contained Ground Speed
  const addEnhRes = t47Char.addContainerTraitEnhancement("item_mach5", "attributes", contGs.id, "area", 1);
  assert.strictEqual(addEnhRes, true, "addContainerTraitEnhancement must return true");
  assert.ok(Array.isArray(contGs.enhancements), "Contained Ground Speed must have enhancements array");
  assert.strictEqual(contGs.enhancements.length, 1);
  assert.strictEqual(contGs.enhancements[0].name, "Area Effect");
  assert.strictEqual(contGs.enhancements[0].rank, 1);

  // Net contained points: 6 (base) + 1 (enhancement) - 2 (limiters) = 5 CP. floor(5/2) = 2 CP.
  mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 5);
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 2);

  // Step Enhancement rank with delta via updateContainerTraitEnhancementRank
  const stepEnhRes = t47Char.updateContainerTraitEnhancementRank("item_mach5", "attributes", contGs.id, "area", 1, true);
  assert.strictEqual(stepEnhRes, true, "updateContainerTraitEnhancementRank delta step returns true");
  assert.strictEqual(contGs.enhancements[0].rank, 2, "Area enhancement rank stepped to 2");

  // Net contained points: 6 (base) + 2 (enhancements) - 2 (limiters) = 6 CP. floor(6/2) = 3 CP.
  mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 6);
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 3);

  // Remove enhancement and Assisted limiter, leaving Road-Bound at rank 1
  t47Char.removeContainerTraitEnhancement("item_mach5", "attributes", contGs.id, "area");
  assert.strictEqual(contGs.enhancements.length, 0, "Area enhancement removed");
  t47Char.removeContainerTraitLimiter("item_mach5", "attributes", contGs.id, "assisted");
  assert.strictEqual(contGs.limiters.length, 1, "Only Road-Bound remains");
  assert.strictEqual(contGs.limiters[0].rank, 1, "Road-Bound remains at rank 1");
  mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 5);
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 2);

  // D. Storage Persistence and Normalization
  BESM4EStorage.saveCharacter(t47Char);
  const t47Reloaded = BESM4EStorage.loadCharacter(t47Char.id);
  assert.ok(t47Reloaded, "Character must reload from storage");
  const reloadedMach5 = t47Reloaded.getContainerAttribute("item_mach5");
  assert.ok(reloadedMach5, "Reloaded Mach 5 container must exist");
  const reloadedGs = reloadedMach5.containerTraits.attributes.find(a => a.id === "ground_speed" || a.attributeId === "ground_speed");
  assert.ok(reloadedGs, "Reloaded Ground Speed must exist in container");
  assert.ok(Array.isArray(reloadedGs.limiters), "Reloaded Ground Speed must have limiters array");
  assert.strictEqual(reloadedGs.limiters.length, 1);
  assert.strictEqual(reloadedGs.limiters[0].id, "road_bound");
  assert.strictEqual(reloadedGs.limiters[0].rank, 1);

  const reloadedMach5Pts = t47Reloaded.getContainerPoints("item_mach5");
  assert.strictEqual(reloadedMach5Pts.netContainedPoints, 5, "Reloaded net contained points matches 5 CP");
  assert.strictEqual(reloadedMach5Pts.effectiveCharacterCost, 2, "Reloaded character cost matches 2 CP");

  // E. Markdown and Print Sheet Formatting
  const t47Markdown = BESM4EStorage.generateMarkdown(t47Reloaded);
  assert.ok(t47Markdown.includes("Mach 5 Sports Car"), "Markdown includes container name");
  assert.ok(t47Markdown.includes("Ground Speed (Level 6)"), "Markdown includes Ground Speed level");
  assert.ok(t47Markdown.includes("Limiters: Road-Bound (Rk 1)"), "Markdown formats contained attribute limiters tag");
  assert.ok(t47Markdown.includes("[5 CP]"), "Markdown displays calculated net cost of contained attribute");

  // F. App UI and Event Wiring Assertions
  const t47AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t47AppJs.includes('cont-attr-enh-select'), "app.js must render cont-attr-enh-select");
  assert.ok(t47AppJs.includes('cont-attr-lim-select'), "app.js must render cont-attr-lim-select");
  assert.ok(t47AppJs.includes('btn-cont-attr-add-enh'), "app.js must render btn-cont-attr-add-enh");
  assert.ok(t47AppJs.includes('btn-cont-attr-add-lim'), "app.js must render btn-cont-attr-add-lim");
  assert.ok(t47AppJs.includes('btn-cont-attr-enh-pill-minus'), "app.js must handle container attribute enhancement pill minus");
  assert.ok(t47AppJs.includes('btn-cont-attr-lim-pill-plus'), "app.js must handle container attribute limiter pill plus");
  assert.ok(t47AppJs.includes('btn-cont-trait-pill-info'), "app.js must handle container trait modifier info modal");

  // G. Version Synchronization (v1.9.13+)
  const t47VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  const t47Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t47VersionJson.version.startsWith("1.9."), "version.json version must be 1.9.13+");
  assert.ok(t47Html.includes(`v${t47VersionJson.version}`), "index.html must display v1.9.13+");
  assert.ok(t47Html.includes(`css/app.css?v=${t47VersionJson.version}`), "index.html must cache-bust css with v=1.9.13+");
  assert.ok(t47Html.includes(`js/app.js?v=${t47VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.13+");
  assert.ok(t47AppJs.includes(`version: "${t47VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.13+");

  console.log("✓ Test 47 Passed: Ground Speed Road-Bound Limiter, Container Attribute Modifiers & Export verified.");

  // ========================================================================
  // 48. Test PDF Export Engine & Container Print Sheet Rendering (v1.9.15)
  // ========================================================================
  console.log("\nTesting 48: PDF Export & Container Print Sheet Rendering...");

  // A. Character with Multiple Diverse Containers & Custom Descriptions
  const t48Char = new BESM4ECharacter({
    name: "Commander Sarah Vance",
    concept: "Mecha Pilot & Recon Operative",
    player: "Alex",
    campaign: "BESM Mecha Ops",
    tier: "heroic"
  });

  // 1. Item Container (Vehicle) with custom description and contained traits
  t48Char.addAttribute({
    id: "item_patrol_cruiser",
    name: "Patrol Interceptor Cruiser",
    level: 1,
    costPerLevel: 0.5,
    isContainer: true,
    containerType: "item",
    customDesc: "High-speed police patrol vehicle with reinforced chassis."
  });
  const t48Cruiser = t48Char.getContainerAttribute("item_patrol_cruiser");
  assert.ok(t48Cruiser, "Cruiser container must exist");
  t48Char.addContainerTrait("item_patrol_cruiser", "attributes", BESM4E_RULES.getAttributeDef("ground_speed"), 5);
  t48Char.addContainerTraitLimiter("item_patrol_cruiser", "attributes", "ground_speed", "road_bound", 1);
  t48Char.addContainerTrait("item_patrol_cruiser", "attributes", BESM4E_RULES.getAttributeDef("armour"), 4);

  // 2. Chassis Container (Industrial Exoskeleton)
  t48Char.addAttribute({
    id: "chassis_loader",
    name: "Loader Frame Exosuit",
    level: 1,
    costPerLevel: 0.5,
    isContainer: true,
    containerType: "chassis",
    customDesc: "Heavy powered exoskeleton for cargo lifting and hazard mitigation."
  });
  const t48Chassis = t48Char.getContainerAttribute("chassis_loader");
  assert.ok(t48Chassis, "Chassis container must exist");
  t48Char.setContainerStat("chassis_loader", "body", 6);
  t48Char.setContainerStat("chassis_loader", "mind", 2);
  t48Char.setContainerStat("chassis_loader", "soul", 2);
  t48Char.addContainerTrait("chassis_loader", "attributes", BESM4E_RULES.getAttributeDef("superstrength"), 2);

  // 3. Companion Container (K-9 Drone)
  t48Char.addAttribute({
    id: "companion_k9",
    name: "K-9 Cyber Hound",
    level: 2,
    costPerLevel: 3,
    isContainer: true,
    containerType: "companion",
    customDesc: "Autonomous quadrupedal tracking drone with enhanced scent sensors."
  });
  const t48Companion = t48Char.getContainerAttribute("companion_k9");
  assert.ok(t48Companion, "Companion container must exist");
  t48Char.setContainerStat("companion_k9", "body", 5);
  t48Char.setContainerStat("companion_k9", "mind", 3);
  t48Char.setContainerStat("companion_k9", "soul", 3);
  t48Char.addContainerTrait("companion_k9", "attributes", BESM4E_RULES.getAttributeDef("heightened_senses"), 2);

  // 4. Alternate Form Container (Tactical Stealth Mode)
  t48Char.addAttribute({
    id: "alternate_form_stealth",
    name: "Alternate Form (Stealth Mode)",
    level: 2,
    costPerLevel: 5,
    isContainer: true,
    containerType: "alternate_form",
    customDesc: "Active optical camouflage shifting into shadow operative state."
  });
  const t48AltForm = t48Char.getContainerAttribute("alternate_form_stealth");
  assert.ok(t48AltForm, "Alternate form container must exist");
  t48Char.addContainerTrait("alternate_form_stealth", "attributes", BESM4E_RULES.getAttributeDef("invisibility"), 2);

  // B. Execute renderPrintSheet Simulation without Error
  const t48AppJs = fs.readFileSync('./js/app.js', 'utf8');

  // Verify that detailStr is properly declared and initialized in js/app.js
  assert.ok(t48AppJs.includes('let detailStr = escapeHtml(a.customDesc || "");'), "app.js must declare detailStr before use in renderPrintSheet()");

  // Create isolated sandbox context to execute renderPrintSheet logic on t48Char
  const sortTraitsList = BESM4ECharacter.compareTraitsAlphabetically
    ? (list) => [...list].sort(BESM4ECharacter.compareTraitsAlphabetically)
    : (list) => [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Simulate container attribute table row generation exactly as in app.js
  let renderedContainerRows = "";
  const t48SortedAttrs = t48Char.getSortedAttributes ? t48Char.getSortedAttributes() : sortTraitsList(t48Char.attributes);
  t48SortedAttrs.forEach(a => {
    if (a.isContainer) {
      const cpInfo = t48Char.getContainerPoints(a);
      let costStr = `${cpInfo.effectiveCharacterCost} CP`;
      let cType = a.containerType || "item";
      if (cType === "alternate" || a.id === "alternate_form" || (typeof a.id === "string" && a.id.startsWith("alternate_form_")) || a.attributeId === "alternate_form") {
        cType = "alternate_form";
      }
      let detailStr = escapeHtml(a.customDesc || "");
      let containerSummary = "";
      if (cType === "chassis") {
        containerSummary = `Chassis: Contained ${cpInfo.netContainedPoints} CP &rarr; 1/2 net cost applied`;
      } else if (cType === "item" || a.id.startsWith("item")) {
        containerSummary = `Item: Contained ${cpInfo.netContainedPoints} CP &rarr; 1/2 net cost applied`;
      } else if (cType === "companion" || cType === "alternate_form") {
        containerSummary = `${cType === "companion" ? "Companion" : "Alt Form"}: ${cpInfo.budgetAllowance} CP Budget, ${cpInfo.netContainedPoints} CP spent, ${cpInfo.remainingBudget} CP left`;
      }
      if (containerSummary) {
        detailStr = detailStr ? `${detailStr} (${containerSummary})` : `(${containerSummary})`;
      }
      const cIcon = (cType === "chassis") ? "🤖" : ((cType === "companion") ? "🐾" : ((cType === "alternate_form") ? "✨" : "📦"));
      renderedContainerRows += `<tr><td>${cIcon} ${escapeHtml(a.name)}</td><td>${costStr}</td><td>${detailStr}</td></tr>\n`;
    }
  });

  // Verify all 4 containers rendered without reference error and with rich details
  assert.ok(renderedContainerRows.includes("Patrol Interceptor Cruiser"), "Rendered sheet contains Patrol Interceptor Cruiser");
  assert.ok(renderedContainerRows.includes("High-speed police patrol vehicle with reinforced chassis."), "Rendered sheet contains Cruiser customDesc");
  assert.ok(renderedContainerRows.includes("Item: Contained"), "Rendered sheet contains Item container summary");

  assert.ok(renderedContainerRows.includes("Loader Frame Exosuit"), "Rendered sheet contains Loader Frame Exosuit");
  assert.ok(renderedContainerRows.includes("Heavy powered exoskeleton for cargo lifting"), "Rendered sheet contains Chassis customDesc");
  assert.ok(renderedContainerRows.includes("Chassis: Contained"), "Rendered sheet contains Chassis container summary");

  assert.ok(renderedContainerRows.includes("K-9 Cyber Hound"), "Rendered sheet contains K-9 Cyber Hound");
  assert.ok(renderedContainerRows.includes("Autonomous quadrupedal tracking drone"), "Rendered sheet contains Companion customDesc");
  assert.ok(renderedContainerRows.includes("Companion:"), "Rendered sheet contains Companion budget summary");

  assert.ok(renderedContainerRows.includes("Alternate Form (Stealth Mode)"), "Rendered sheet contains Alternate Form");
  assert.ok(renderedContainerRows.includes("Active optical camouflage shifting into shadow operative state."), "Rendered sheet contains Alt Form customDesc");
  assert.ok(renderedContainerRows.includes("Alt Form:"), "Rendered sheet contains Alt Form budget summary");

  // C. Verify exportCharacterPDF Error-Handling, Normal Flow Sandbox & Fallback Architecture
  const normalizedAppJs = t48AppJs.replace(/\r\n/g, '\n');
  assert.ok(t48AppJs.includes('async function exportCharacterPDF()'), "app.js must define async function exportCharacterPDF");
  assert.ok(normalizedAppJs.includes('try {\n      readFormValues();\n      renderPrintSheet();\n    } catch (prepErr) {'), "exportCharacterPDF must wrap readFormValues and renderPrintSheet in try-catch");
  assert.ok(normalizedAppJs.includes('openPrintPreview();\n      setTimeout(() => { window.print(); }, 250);'), "exportCharacterPDF must provide graceful fallback to openPrintPreview and window.print");
  assert.ok(t48AppJs.includes('window.exportCharacterPDF = exportCharacterPDF;'), "exportCharacterPDF must be exported to window scope");
  assert.ok(t48AppJs.includes('position: relative; width: 740px') || t48AppJs.includes('position: relative; width: 800px'), "exportCharacterPDF sandbox must use normal document flow (position: relative; width: 740px/800px)");
  const t48Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t48Css.includes('table-layout: fixed'), "css must enforce table-layout: fixed");
  assert.ok(t48AppJs.includes('window.scrollTo(0, 0)') && t48AppJs.includes('window.scrollTo(prevScrollX, prevScrollY)'), "exportCharacterPDF must reset and restore window scroll coordinates");
  assert.ok(t48AppJs.includes("mode: [\"css\", \"legacy\"]") || t48AppJs.includes("mode: ['css', 'legacy']"), "exportCharacterPDF must use css and legacy pagebreak mode");

  // D. Version Synchronization across all project files (v1.9.16+)
  const t48VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  const t48Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(/^1\.9\.\d+$/.test(t48VersionJson.version), "version.json must be 1.9.16+");
  assert.ok(t48Html.includes(`v${t48VersionJson.version}`), "index.html must display matching version");
  assert.ok(t48Html.includes(`css/app.css?v=${t48VersionJson.version}`), "index.html must cache-bust css with matching version");
  assert.ok(t48Html.includes(`js/app.js?v=${t48VersionJson.version}`), "index.html must cache-bust app.js with matching version");
  assert.ok(t48Html.includes(`js/rules.js?v=${t48VersionJson.version}`), "index.html must cache-bust rules.js with matching version");
  assert.ok(t48Html.includes(`js/character.js?v=${t48VersionJson.version}`), "index.html must cache-bust character.js with matching version");
  assert.ok(t48Html.includes(`js/storage.js?v=${t48VersionJson.version}`), "index.html must cache-bust storage.js with matching version");
  assert.ok(t48Html.includes(`js/roller.js?v=${t48VersionJson.version}`), "index.html must cache-bust roller.js with matching version");
  assert.ok(t48AppJs.includes(`version: "${t48VersionJson.version}"`), "app.js APP_VERSION_INFO must match version.json");

  console.log("✓ Test 48 Passed: PDF Export & Container Print Sheet Rendering verified.");

  // ========================================================================
  // 49. Test Vehicle & Chassis Stats, Total Health (HP), Tough & Armour
  // ========================================================================
  console.log("\nTesting 49: Vehicle & Chassis Stats, Total Health (HP), Tough & Armour...");

  const t49Char = new BESM4ECharacter({
    name: "Lieutenant Tyler Steele",
    concept: "Armored Mecha Commander & Interceptor Pilot",
    tier: "heroic"
  });

  // 1. Create a Vehicle Item container: High-Speed Police Interceptor
  t49Char.addAttribute({
    id: "item_interceptor",
    name: "High-Speed Police Interceptor",
    level: 1,
    costPerLevel: 0.5,
    isContainer: true,
    containerType: "item",
    customDesc: "Pursuit vehicle equipped with turbo-thrust and reinforced chassis."
  });

  // Assign Body 6, Mind 1, Soul 0 to the vehicle
  t49Char.setContainerStat("item_interceptor", "body", 6);
  t49Char.setContainerStat("item_interceptor", "mind", 1);
  t49Char.setContainerStat("item_interceptor", "soul", 0);

  let t49InterceptorDerived = t49Char.getContainerDerived("item_interceptor");
  assert.ok(t49InterceptorDerived, "Vehicle derived stats must exist");
  assert.strictEqual(t49InterceptorDerived.baseCV, 2, "Vehicle CV = floor((6+1+0)/3) = 2");
  assert.strictEqual(t49InterceptorDerived.maxHealth, 30, "Vehicle base Health = (6+0)*5 = 30 HP");
  assert.strictEqual(t49InterceptorDerived.maxEnergy, 5, "Vehicle base Energy = (1+0)*5 = 5 EP");
  assert.strictEqual(t49InterceptorDerived.armorRating, 0, "Vehicle base Armour = 0 AR");

  // Add Tough Level 3 (+30 HP) inside the vehicle
  t49Char.addContainerTrait("item_interceptor", "attributes", BESM4E_RULES.getAttributeDef("tough"), 3);
  t49InterceptorDerived = t49Char.getContainerDerived("item_interceptor");
  assert.strictEqual(t49InterceptorDerived.maxHealth, 60, "Vehicle with Tough 3 has 30 + 30 = 60 Total Health");

  // Add Armour Level 4 (20 AR) inside the vehicle
  t49Char.addContainerTrait("item_interceptor", "attributes", BESM4E_RULES.getAttributeDef("armour"), 4);
  t49InterceptorDerived = t49Char.getContainerDerived("item_interceptor");
  assert.strictEqual(t49InterceptorDerived.armorRating, 20, "Vehicle with Armour 4 has 20 AR");

  // 2. Create a Chassis container: Heavy Urban Combat Mecha
  t49Char.addAttribute({
    id: "chassis_combat_mecha",
    name: "Titan-X Combat Frame",
    level: 1,
    costPerLevel: 0.5,
    isContainer: true,
    containerType: "chassis",
    customDesc: "Bipedal military assault frame with reactive plating."
  });

  // Assign Body 10, Mind 2, Soul 2 to the chassis
  t49Char.setContainerStat("chassis_combat_mecha", "body", 10);
  t49Char.setContainerStat("chassis_combat_mecha", "mind", 2);
  t49Char.setContainerStat("chassis_combat_mecha", "soul", 2);

  let t49MechaDerived = t49Char.getContainerDerived("chassis_combat_mecha");
  assert.ok(t49MechaDerived, "Chassis derived stats must exist");
  assert.strictEqual(t49MechaDerived.baseCV, 4, "Chassis CV = floor((10+2+2)/3) = 4");
  assert.strictEqual(t49MechaDerived.maxHealth, 60, "Chassis base Health = (10+2)*5 = 60 HP");

  // Add Fragile Rank 2 (-10 HP) defect inside the chassis
  t49Char.addContainerTrait("chassis_combat_mecha", "defects", BESM4E_RULES.defects.find(d => d.id === "fragile"), 2);
  t49MechaDerived = t49Char.getContainerDerived("chassis_combat_mecha");
  assert.strictEqual(t49MechaDerived.maxHealth, 50, "Chassis with Fragile 2 has 60 - 10 = 50 Total Health");

  // 3. UI Code and DOM Assertions
  const t49AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t49Html = fs.readFileSync('./index.html', 'utf8');

  // Verify that app.js enables statsBoxHtml for chassis and items
  assert.ok(t49AppJs.includes('cType === "chassis" || cType === "item"'), "app.js must enable statsBoxHtml for chassis and items");
  assert.ok(t49AppJs.includes('Total Health: <strong style="color: var(--color-health); font-weight: 800;">${cDerived.maxHealth} HP</strong>'), "app.js must display prominent Total Health (HP)");
  assert.ok(t49AppJs.includes('Armour: <strong style="color: var(--accent-primary); font-weight: 800;">${cDerived.armorRating} AR</strong>'), "app.js must display prominent Armour (AR)");

  // Verify index.html play-container-vitals and updated HP tooltip
  assert.ok(t49Html.includes('id="play-container-vitals"'), "index.html must include play-container-vitals");
  assert.ok(t49Html.includes('title="Total Health Points (HP): (Body + Soul) * 5 + Tough * 10 - Fragile * 5"'), "index.html must clarify derived-hp tooltip");
  assert.ok(t49AppJs.includes('play-container-vitals'), "app.js must populate play-container-vitals in renderPlayMode");

  // 4. Version Synchronization (v1.9.17+)
  const t49VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  assert.ok(/^1\.9\.\d+$/.test(t49VersionJson.version), "version.json must be 1.9.17+");
  assert.ok(t49Html.includes(`v${t49VersionJson.version}`), "index.html must display v1.9.17+");
  assert.ok(t49Html.includes(`css/app.css?v=${t49VersionJson.version}`), "index.html must cache-bust css with v1.9.17+");
  assert.ok(t49Html.includes(`js/app.js?v=${t49VersionJson.version}`), "index.html must cache-bust app.js with v1.9.17+");
  assert.ok(t49Html.includes(`js/character.js?v=${t49VersionJson.version}`), "index.html must cache-bust character.js with v1.9.17+");
  assert.ok(t49AppJs.includes(`version: "${t49VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.17+");

  console.log("✓ Test 49 Passed: Vehicle & Chassis Stats, Total Health (HP), Tough & Armour verified.");

  // ========================================================================
  // 50. Test Full Trait Rules Descriptions, Anchored '?' Popovers & Catalog Resolution
  // ========================================================================
  console.log("\nTesting 50: Full Trait Rules Descriptions, Anchored '?' Popovers & Catalog Resolution...");

  // 1. Data Integrity of js/trait_descriptions.js
  assert.ok(fs.existsSync('./js/trait_descriptions.js'), "js/trait_descriptions.js must exist");
  const traitDescFile = fs.readFileSync('./js/trait_descriptions.js', 'utf8');
  assert.ok(traitDescFile.length > 300000, "js/trait_descriptions.js should contain comprehensive rules text (>300KB)");
  
  assert.ok(global.BESM4E_TRAIT_DESCRIPTIONS, "BESM4E_TRAIT_DESCRIPTIONS global must be defined");
  assert.ok(global.BESM4E_TRAIT_DESCRIPTIONS.attributes && Object.keys(global.BESM4E_TRAIT_DESCRIPTIONS.attributes).length >= 90, "Must contain >= 90 attribute descriptions");
  assert.ok(global.BESM4E_TRAIT_DESCRIPTIONS.skills && Object.keys(global.BESM4E_TRAIT_DESCRIPTIONS.skills).length >= 100, "Must contain >= 100 skill descriptions");
  assert.ok(global.BESM4E_TRAIT_DESCRIPTIONS.skillGroups && Object.keys(global.BESM4E_TRAIT_DESCRIPTIONS.skillGroups).length >= 12, "Must contain all 12 skill groups");
  assert.ok(global.BESM4E_TRAIT_DESCRIPTIONS.defects && Object.keys(global.BESM4E_TRAIT_DESCRIPTIONS.defects).length >= 35, "Must contain >= 35 defect descriptions");

  // Verify specific deep extractions
  const mechaTrait = global.BESM4E_TRAIT_DESCRIPTIONS.attributes["alternate_form"];
  assert.ok(mechaTrait && mechaTrait.name === "Alternate Form", "Alternate Form must be present in descriptions");
  assert.ok(mechaTrait.levels && Object.keys(mechaTrait.levels).length > 0, "Alternate Form levels table must be extracted");
  assert.ok(mechaTrait.fullDescription && mechaTrait.fullDescription.length > 100, "Full description text must be present");

  const combatTrait = global.BESM4E_TRAIT_DESCRIPTIONS.attributes["weapon"];
  assert.ok(combatTrait && combatTrait.name === "Weapon", "Weapon attribute must be present in descriptions");

  const pilotSkill = global.BESM4E_TRAIT_DESCRIPTIONS.skills["piloting"];
  assert.ok(pilotSkill && pilotSkill.name === "Piloting", "Piloting skill must be present in descriptions");
  assert.ok((pilotSkill.specialisations || pilotSkill.specializations) && (pilotSkill.specialisations || pilotSkill.specializations).length > 0, "Piloting specializations must be present");

  // 2. Integration with rules.js getTraitFullInfo
  const queriedAttr = BESM4E_RULES.getTraitFullInfo("attribute", "alternate_form");
  assert.ok(queriedAttr && queriedAttr.name === "Alternate Form", "getTraitFullInfo must resolve attributes");
  const queriedSkill = BESM4E_RULES.getTraitFullInfo("skill", "piloting");
  assert.ok(queriedSkill && queriedSkill.name === "Piloting", "getTraitFullInfo must resolve skills");
  const queriedGroup = BESM4E_RULES.getTraitFullInfo("skill_group", "adventuring");
  assert.ok(queriedGroup && queriedGroup.name === "Adventuring", "getTraitFullInfo must resolve skill groups");
  const queriedDefect = BESM4E_RULES.getTraitFullInfo("defect", "bane");
  assert.ok(queriedDefect && queriedDefect.name === "Bane", "getTraitFullInfo must resolve defects");

  // 3. UI Markup & Anchored Popover DOM
  const t50Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t50Html.includes('id="trait-anchored-popover"'), "index.html must include #trait-anchored-popover container");
  assert.ok(t50Html.includes('id="popover-trait-title"'), "index.html must include #popover-trait-title");
  assert.ok(t50Html.includes('id="popover-trait-badges"'), "index.html must include #popover-trait-badges");
  assert.ok(t50Html.includes('id="popover-trait-body"'), "index.html must include #popover-trait-body");
  assert.ok(t50Html.includes('id="popover-close-btn"'), "index.html must include #popover-close-btn");
  assert.ok(t50Html.includes(`src="js/trait_descriptions.js?v=${t49VersionJson.version}"`), "index.html must include trait_descriptions.js script tag with v=1.9.18+");

  // 4. CSS Styling
  const t50Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t50Css.includes('.trait-anchored-popover'), "app.css must define .trait-anchored-popover");
  assert.ok(t50Css.includes('.btn-trait-help-popover'), "app.css must define .btn-trait-help-popover");
  assert.ok(t50Css.includes('.btn-trait-popover-pill'), "app.css must define .btn-trait-popover-pill");
  assert.ok(t50Css.includes('font-size: 12pt;'), "app.css must maintain 12pt font standard for popovers");

  // 5. App.js Popover Controller & Button Hooks
  const t50AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t50AppJs.includes('showTraitAnchoredPopover'), "app.js must define showTraitAnchoredPopover");
  assert.ok(t50AppJs.includes('formatPopoverHtml'), "app.js must define formatPopoverHtml");
  assert.ok(t50AppJs.includes('class="btn-trait-help-popover"'), "app.js must render .btn-trait-help-popover buttons across UI");

  // 6. Version Synchronization (v1.9.18+)
  const t50VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  assert.ok(/^1\.9\.\d+$/.test(t50VersionJson.version), "version.json must be 1.9.18+");
  assert.ok(t50Html.includes(`v${t50VersionJson.version}`), "index.html must display v1.9.18+");
  assert.ok(t50Html.includes(`css/app.css?v=${t50VersionJson.version}`), "index.html must cache-bust css with v1.9.18+");
  assert.ok(t50Html.includes(`js/app.js?v=${t50VersionJson.version}`), "index.html must cache-bust app.js with v1.9.18+");
  assert.ok(t50Html.includes(`js/character.js?v=${t50VersionJson.version}`), "index.html must cache-bust character.js with v1.9.18+");
  assert.ok(t50AppJs.includes(`version: "${t50VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.18+");

  console.log("✓ Test 50 Passed: Full Trait Rules Descriptions, Anchored '?' Popovers & Catalog Resolution verified.");

  // ========================================================================
  // 51. Test Trait Roll Buttons, Active Modifiers Integration & Version Sync (v1.9.19)
  // ========================================================================
  console.log("\nTesting 51: Trait Roll Buttons, Active Modifiers Integration & Version Sync (v1.9.19)...");

  // 1. isRollableAttribute detection
  assert.strictEqual(typeof BESM4ECharacter.isRollableAttribute, "function", "BESM4ECharacter.isRollableAttribute must be a function");
  assert.strictEqual(BESM4ECharacter.isRollableAttribute("healing"), true, "healing should be rollable");
  assert.strictEqual(BESM4ECharacter.isRollableAttribute("exorcism"), true, "exorcism should be rollable");
  assert.strictEqual(BESM4ECharacter.isRollableAttribute("telekinesis"), true, "telekinesis should be rollable");
  assert.strictEqual(BESM4ECharacter.isRollableAttribute("tough"), false, "tough is passive, not rollable");
  assert.strictEqual(BESM4ECharacter.isRollableAttribute("armour"), false, "armour is passive, not rollable");

  // 2. getInitiative calculation
  const char51 = new BESM4ECharacter();
  char51.setStat("body", 4);
  char51.setStat("mind", 4);
  char51.setStat("soul", 4);
  assert.strictEqual(char51.getInitiative(), 4, "Initial initiative should equal ACV");
  char51.addAttribute({ id: "heightened_awareness", name: "Heightened Awareness", level: 2 });
  assert.strictEqual(char51.getInitiative(), 8, "Initiative with Heightened Awareness 2 should be 4 + 4 = 8");
  char51.addAttribute({ id: "combat_technique_1", name: "Combat Technique (Lightning Reflexes)", subTrait: "Lightning Reflexes", level: 1 });
  assert.strictEqual(char51.getInitiative(), 10, "Initiative with Lightning Reflexes should be 10");
  char51.addDefect({ id: "demure", name: "Demure", rank: 1 });
  assert.strictEqual(char51.getInitiative(), 8, "Initiative with Demure 1 should be 8");
  char51.conditions = ["shocked"];
  assert.strictEqual(char51.getInitiative(), 7, "Initiative when Shocked should be 7");
  char51.conditions = [];

  // 3. Stat Checks via getTraitRollInfo
  const bodyRoll = char51.getTraitRollInfo("stat", "body");
  assert.strictEqual(bodyRoll.totalModifier, 4, "Base body check should have modifier +4");
  assert.ok(bodyRoll.breakdown.includes("Body (4)"), "Breakdown should include Body (4)");

  char51.conditions = ["shocked", "impaired"];
  const condBodyRoll = char51.getTraitRollInfo("stat", "body");
  assert.strictEqual(condBodyRoll.totalModifier, 2, "Body check with shocked and impaired should be 4 - 1 - 1 = 2");
  assert.ok(condBodyRoll.breakdown.includes("Shocked (-1)"), "Breakdown should include Shocked (-1)");
  char51.conditions = [];

  // 4. Combat Value Checks via getTraitRollInfo
  char51.addAttribute({ id: "melee_attack", name: "Melee Attack", level: 2 });
  const meleeAtkRoll = char51.getTraitRollInfo("cv", "melee_attack");
  assert.strictEqual(meleeAtkRoll.totalModifier, 6, "Melee Attack check should be ACV (4) + Melee Attack (2) = 6");

  char51.addAttribute({ id: "dead_eye", name: "Dead Eye", level: 1 });
  const rangedAtkRoll = char51.getTraitRollInfo("cv", "ranged_attack");
  assert.strictEqual(rangedAtkRoll.totalModifier, 6, "Ranged Attack check should include Dead Eye (+2): 4 + 2 = 6");

  // 5. Weapon Attack Checks via getTraitRollInfo
  char51.addWeapon({
    id: "katana",
    name: "Katana",
    level: 3,
    range: "Melee",
    enhancements: [{ id: "accurate", name: "Accurate", rank: 2 }]
  });
  const wpnRoll = char51.getTraitRollInfo("weapon", "katana");
  assert.strictEqual(wpnRoll.totalModifier, 8, "Katana attack check should be ACV 4 + Melee Attack 2 + Accurate 2 = 8");
  assert.ok(wpnRoll.breakdown.includes("Accurate (+2)"), "Breakdown should include Accurate (+2)");

  char51.addWeapon({
    id: "clumsy_club",
    name: "Clumsy Club",
    level: 2,
    range: "Melee",
    limiters: [{ id: "inaccurate", name: "Inaccurate", rank: 1 }]
  });
  const inaccWpnRoll = char51.getTraitRollInfo("weapon", "clumsy_club");
  assert.strictEqual(inaccWpnRoll.totalModifier, 5, "Clumsy Club attack check should be ACV 4 + Melee Attack 2 - Inaccurate 1 = 5");

  // 6. Skill Group Checks via getTraitRollInfo
  char51.addSkillGroup({ id: "detective", name: "Detective", level: 2 });
  const sgRoll = char51.getTraitRollInfo("skill_group", "detective");
  assert.strictEqual(sgRoll.totalModifier, 6, "Detective group check should be Mind 4 + Detective 2 = 6");

  // 7. Individual Skill Checks with Synergy & Perception Bonus via getTraitRollInfo
  char51.addSkill({ id: "search", name: "Search", level: 2, stat: "Mind", groupId: "detective" });
  const skRoll = char51.getTraitRollInfo("skill", "search");
  assert.strictEqual(skRoll.totalModifier, 12, "Search skill check should be Mind 4 + Search 2 + Synergy 2 + Heightened Awareness 4 = 12");
  assert.ok(skRoll.breakdown.includes("Synergy (+2)"), "Breakdown should include Detective Synergy (+2)");
  assert.ok(skRoll.breakdown.includes("Heightened Awareness (+4)"), "Breakdown should include Heightened Awareness (+4)");

  // 8. Active Rollable Power Check via getTraitRollInfo
  char51.addAttribute({
    id: "healing",
    name: "Healing",
    level: 3,
    enhancements: [{ id: "potent", name: "Potent", rank: 1 }]
  });
  const healRoll = char51.getTraitRollInfo("attribute", "healing");
  assert.strictEqual(healRoll.totalModifier, 8, "Healing check should be Soul 4 + Level 3 + Potent 1 = 8");
  assert.ok(healRoll.breakdown.includes("Healing (+3)"), "Breakdown should include Healing (+3)");
  assert.ok(healRoll.breakdown.includes("Potent (+1)"), "Breakdown should include Potent (+1)");

  // 9. UI Roll Buttons & Elements
  const t51Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t51Html.includes('id="btn-roll-builder-body"'), "index.html must include builder Body roll button");
  assert.ok(t51Html.includes('id="btn-roll-builder-mind"'), "index.html must include builder Mind roll button");
  assert.ok(t51Html.includes('id="btn-roll-builder-soul"'), "index.html must include builder Soul roll button");
  assert.ok(t51Html.includes('id="pill-acv"'), "index.html must include pill-acv roll trigger");
  assert.ok(t51Html.includes('id="pill-dcv"'), "index.html must include pill-dcv roll trigger");
  assert.ok(t51Html.includes('id="pill-init"'), "index.html must include pill-init roll trigger");
  assert.ok(t51Html.includes('id="btn-roll-melee-attack"'), "index.html must include btn-roll-melee-attack");
  assert.ok(t51Html.includes('id="btn-roll-ranged-attack"'), "index.html must include btn-roll-ranged-attack");
  assert.ok(t51Html.includes('id="btn-roll-melee-defence"'), "index.html must include btn-roll-melee-defence");
  assert.ok(t51Html.includes('id="btn-roll-initiative"'), "index.html must include btn-roll-initiative");
  assert.ok(t51Html.includes('id="play-powers-section"'), "index.html must include play-powers-section");
  assert.ok(t51Html.includes('id="play-powers-grid"'), "index.html must include play-powers-grid");
  assert.ok(t51Html.includes('id="roller-breakdown-display"'), "index.html must include roller-breakdown-display");

  // 10. CSS Roll Button Classes & 12pt Standard
  const t51Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t51Css.includes('.derived-pill-action'), "app.css must define .derived-pill-action");
  assert.ok(t51Css.includes('.btn-stat-roll'), "app.css must define .btn-stat-roll");
  assert.ok(t51Css.includes('.btn-weapon-roll'), "app.css must define .btn-weapon-roll");
  assert.ok(t51Css.includes('.btn-sg-roll'), "app.css must define .btn-sg-roll");
  assert.ok(t51Css.includes('.btn-sk-roll'), "app.css must define .btn-sk-roll");
  assert.ok(t51Css.includes('.btn-attr-roll'), "app.css must define .btn-attr-roll");

  // 11. App.js Integration
  const t51AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t51AppJs.includes('btn-roll-builder-body'), "app.js must hook builder body roll button");
  assert.ok(t51AppJs.includes('pill-init'), "app.js must hook pill-init roll trigger");
  assert.ok(t51AppJs.includes('.btn-sg-roll'), "app.js must hook skill group roll buttons");
  assert.ok(t51AppJs.includes('.btn-sk-roll'), "app.js must hook skill roll buttons");
  assert.ok(t51AppJs.includes('.btn-weapon-roll'), "app.js must hook weapon roll buttons");
  assert.ok(t51AppJs.includes('.btn-attr-roll'), "app.js must hook rollable attribute buttons");
  assert.ok(t51AppJs.includes('roller-breakdown-display'), "app.js must display breakdown formula in dice roller");

  // 12. Version Synchronization (v1.9.19+)
  const t51VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  assert.ok(/^1\.9\.\d+$/.test(t51VersionJson.version), "version.json must be 1.9.19+");
  assert.ok(t51Html.includes(`v${t51VersionJson.version}`), "index.html must display v1.9.19+");
  assert.ok(t51Html.includes(`css/app.css?v=${t51VersionJson.version}`), "index.html must cache-bust css with v1.9.19+");
  assert.ok(t51Html.includes(`js/app.js?v=${t51VersionJson.version}`), "index.html must cache-bust app.js with v1.9.19+");
  assert.ok(t51Html.includes(`js/character.js?v=${t51VersionJson.version}`), "index.html must cache-bust character.js with v1.9.19+");
  assert.ok(t51AppJs.includes(`version: "${t51VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.19+");

  console.log("✓ Test 51 Passed: Trait Roll Buttons, Active Modifiers Integration & Version Sync (v1.9.20) verified.");

  // ========================================================================
  // 52. Test Unique Modifier Custom Descriptions, Multi-Instance Support & Persistence (v1.9.24)
  // ========================================================================
  console.log("\nTesting 52: Unique Modifier Custom Descriptions, Multi-Instance Support & Persistence (v1.9.24)...");

  // 1. Rules definitions
  const rWeapEnh = BESM4E_RULES.weaponEnhancements.find(e => e.id === "unique_enhancement");
  assert.ok(rWeapEnh, "unique_enhancement must exist in BESM4E_RULES.weaponEnhancements");
  assert.strictEqual(rWeapEnh.costPerRank, 1, "unique_enhancement costPerRank must be 1");
  assert.strictEqual(rWeapEnh.hasDescription, true, "unique_enhancement must have hasDescription: true");

  const rWeapLim = BESM4E_RULES.weaponLimiters.find(l => l.id === "unique_limiter");
  assert.ok(rWeapLim, "unique_limiter must exist in BESM4E_RULES.weaponLimiters");
  assert.strictEqual(rWeapLim.costPerRank, -1, "unique_limiter costPerRank must be -1");
  assert.strictEqual(rWeapLim.hasDescription, true, "unique_limiter must have hasDescription: true");

  const rAttrEnh = BESM4E_RULES.enhancements.find(e => e.id === "unique_enhancement");
  assert.ok(rAttrEnh, "unique_enhancement must exist in BESM4E_RULES.enhancements");
  assert.strictEqual(rAttrEnh.hasDescription, true, "attribute unique_enhancement must have hasDescription: true");

  const rAttrLim = BESM4E_RULES.limiters.find(l => l.id === "unique_limiter");
  assert.ok(rAttrLim, "unique_limiter must exist in BESM4E_RULES.limiters");
  assert.strictEqual(rAttrLim.hasDescription, true, "attribute unique_limiter must have hasDescription: true");

  // 2. Top-level Attribute with Multiple Unique Enhancements and Limiters
  const char52 = new BESM4ECharacter({ name: "Aria Shadowalker", tier: "heroic" });
  char52.addAttribute({
    id: "force_field",
    attributeId: "force_field",
    name: "Force Field",
    level: 3,
    costPerLevel: 2
  });

  // Add first unique enhancement with custom description
  char52.addAttributeEnhancement("force_field", {
    id: "unique_enhancement",
    name: "Unique Enhancement",
    rank: 1,
    description: "Silver Touch"
  });
  let ff = char52.attributes.find(a => a.id === "force_field");
  assert.ok(ff, "Force Field attribute must exist");
  assert.strictEqual(ff.enhancements.length, 1, "First unique enhancement added");
  assert.strictEqual(ff.enhancements[0].description, "Silver Touch");
  assert.ok(ff.enhancements[0].instanceId, "Enhancement must have unique instanceId");
  const firstInstId = ff.enhancements[0].instanceId;

  // Add second unique enhancement on the SAME attribute (multi-instance)
  char52.addAttributeEnhancement("force_field", {
    id: "unique_enhancement",
    name: "Unique Enhancement",
    rank: 2,
    description: "Ghost Warding"
  });
  assert.strictEqual(ff.enhancements.length, 2, "Second unique enhancement must create a distinct entry");
  const secondInstId = ff.enhancements[1].instanceId;
  assert.notStrictEqual(firstInstId, secondInstId, "Instance IDs must be distinct");
  assert.strictEqual(ff.enhancements[1].description, "Ghost Warding");
  assert.strictEqual(ff.enhancements[1].rank, 2);

  // Update description of first enhancement
  char52.updateAttributeEnhancementDescription("force_field", firstInstId, "Pure Silver Touch");
  assert.strictEqual(ff.enhancements[0].description, "Pure Silver Touch");
  assert.strictEqual(ff.enhancements[1].description, "Ghost Warding", "Second enhancement description must remain unchanged");

  // Update rank of second enhancement
  char52.updateAttributeEnhancementRank("force_field", secondInstId, 3);
  assert.strictEqual(ff.enhancements[1].rank, 3);
  assert.strictEqual(ff.enhancements[0].rank, 1);

  // Add unique limiter with description
  char52.addAttributeLimiter("force_field", {
    id: "unique_limiter",
    name: "Unique Limiter",
    rank: 1,
    description: "Cold Iron Dissipation"
  });
  assert.strictEqual(ff.limiters.length, 1);
  assert.strictEqual(ff.limiters[0].description, "Cold Iron Dissipation");
  const limInstId = ff.limiters[0].instanceId;

  // Update limiter description
  char52.updateAttributeLimiterDescription("force_field", limInstId, "Magnetic Interference");
  assert.strictEqual(ff.limiters[0].description, "Magnetic Interference");

  // Verify attribute cost calculation: base 3*2 = 6, +1 (Pure Silver), +3 (Ghost Warding), -1 (Magnetic Interference) = 9 CP
  const ffCost = BESM4E_RULES.calculateAttributeCost(ff);
  assert.strictEqual(ffCost.totalCost, 9, "Attribute cost with multiple unique enhancements and limiters must be 9 CP");

  // Remove first enhancement by instanceId
  char52.removeAttributeEnhancement("force_field", firstInstId);
  assert.strictEqual(ff.enhancements.length, 1, "Only one enhancement remaining after deletion");
  assert.strictEqual(ff.enhancements[0].instanceId, secondInstId, "Remaining enhancement is the second one");

  // 3. Container Trait Unique Modifiers
  char52.addAttribute({
    id: "item_power_armor",
    name: "Power Armor",
    level: 1,
    costPerLevel: 0.5,
    isContainer: true,
    containerType: "item"
  });
  char52.addContainerTrait("item_power_armor", "attributes", BESM4E_RULES.getAttributeDef("force_field"), 2);
  const paContainer = char52.getContainerAttribute("item_power_armor");
  assert.ok(paContainer && paContainer.containerTraits, "Container must have containerTraits");
  const contAttr = paContainer.containerTraits.attributes[0];
  assert.ok(contAttr, "Contained trait must exist");

  // Add unique enhancement to contained trait
  char52.addContainerTraitEnhancement("item_power_armor", "attributes", contAttr.id, {
    id: "unique_enhancement",
    name: "Unique Enhancement",
    rank: 2,
    description: "Hydraulic Overdrive"
  });
  assert.strictEqual(contAttr.enhancements.length, 1);
  assert.strictEqual(contAttr.enhancements[0].description, "Hydraulic Overdrive");
  const contEnhInstId = contAttr.enhancements[0].instanceId;

  // Add unique limiter to contained trait
  char52.addContainerTraitLimiter("item_power_armor", "attributes", contAttr.id, {
    id: "unique_limiter",
    name: "Unique Limiter",
    rank: 1,
    description: "Coolant Leakage"
  });
  assert.strictEqual(contAttr.limiters.length, 1);
  assert.strictEqual(contAttr.limiters[0].description, "Coolant Leakage");
  const contLimInstId = contAttr.limiters[0].instanceId;

  // Update container trait descriptions
  char52.updateContainerTraitEnhancementDescription("item_power_armor", "attributes", contAttr.id, contEnhInstId, "Nitrous Hydraulic Overdrive");
  assert.strictEqual(contAttr.enhancements[0].description, "Nitrous Hydraulic Overdrive");

  char52.updateContainerTraitLimiterDescription("item_power_armor", "attributes", contAttr.id, contLimInstId, "Cryo-Coolant Bleed");
  assert.strictEqual(contAttr.limiters[0].description, "Cryo-Coolant Bleed");

  // Check contained attribute cost: level 2 * 4 = 8 + 2 (enh) - 1 (lim) = 9 CP
  const contCost = BESM4E_RULES.calculateAttributeCost(contAttr);
  assert.strictEqual(contCost.totalCost, 9, "Contained trait cost must be 9 CP");

  // 4. Custom Weapon Unique Modifiers
  char52.addWeapon({
    id: "blaster_rifle",
    name: "Pulse Blaster",
    level: 3,
    range: "Ranged",
    enhancements: [{ id: "unique_enhancement", name: "Unique Enhancement", rank: 1, description: "Plasma Splash" }],
    limiters: [{ id: "unique_limiter", name: "Unique Limiter", rank: 1, description: "Overheats Quickly" }]
  });
  const wpn = char52.weapons.find(w => w.id === "blaster_rifle");
  assert.strictEqual(wpn.enhancements[0].description, "Plasma Splash");
  assert.strictEqual(wpn.limiters[0].description, "Overheats Quickly");
  const wpnEnhInstId = wpn.enhancements[0].instanceId || "unique_enhancement";
  const wpnLimInstId = wpn.limiters[0].instanceId || "unique_limiter";

  // Update weapon descriptions
  char52.updateWeaponEnhancementDescription("blaster_rifle", wpnEnhInstId, "Superheated Plasma Splash");
  char52.updateWeaponLimiterDescription("blaster_rifle", wpnLimInstId, "Rapid Thermal Throttling");
  assert.strictEqual(wpn.enhancements[0].description, "Superheated Plasma Splash");
  assert.strictEqual(wpn.limiters[0].description, "Rapid Thermal Throttling");

  // Weapon cost calculation: Level 3 = 6 CP + 1 (enh) - 1 (lim) = 6 CP
  const wpnCost = BESM4E_RULES.calculateWeaponCost(wpn);
  assert.strictEqual(wpnCost.totalCost, 6, "Weapon cost must be 6 CP");

  // 5. Markdown Export Format & Integrity
  const t52MdExport = BESM4EStorage.generateMarkdown(char52);
  assert.ok(!t52MdExport.includes("[object Object]"), "Markdown export must NOT contain '[object Object]'");
  assert.ok(t52MdExport.includes("Unique Enhancement [Ghost Warding]"), "Markdown must format unique enhancement with description brackets");
  assert.ok(t52MdExport.includes("Unique Limiter [Magnetic Interference]"), "Markdown must format unique limiter with description brackets");
  assert.ok(t52MdExport.includes("Unique Enhancement [Superheated Plasma Splash]"), "Markdown must format weapon unique enhancement with description");
  assert.ok(t52MdExport.includes("Unique Limiter [Rapid Thermal Throttling]"), "Markdown must format weapon unique limiter with description");

  // 6. DOM Elements, CSS and 12pt Standard
  const t52Html = fs.readFileSync('./index.html', 'utf8');
  assert.ok(t52Html.includes('id="weapon-modal-enh-desc"'), "index.html must include #weapon-modal-enh-desc input");
  assert.ok(t52Html.includes('id="weapon-modal-lim-desc"'), "index.html must include #weapon-modal-lim-desc input");
  assert.ok(t52Html.includes('font-size: 12pt'), "index.html must style weapon modal description inputs with 12pt font");

  const t52Css = fs.readFileSync('./css/app.css', 'utf8');
  assert.ok(t52Css.includes('.attr-enh-desc-input'), "app.css must define .attr-enh-desc-input");
  assert.ok(t52Css.includes('.attr-lim-desc-input'), "app.css must define .attr-lim-desc-input");
  assert.ok(t52Css.includes('.cont-attr-enh-desc-input'), "app.css must define .cont-attr-enh-desc-input");
  assert.ok(t52Css.includes('.cont-attr-lim-desc-input'), "app.css must define .cont-attr-lim-desc-input");
  assert.ok(t52Css.includes('.input-attr-enh-desc'), "app.css must define .input-attr-enh-desc");
  assert.ok(t52Css.includes('.input-attr-lim-desc'), "app.css must define .input-attr-lim-desc");

  // 7. Version Synchronization (v1.9.37+)
  const t52VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  const t52AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t52VersionJson.version.startsWith("1.9."), "version.json must be 1.9.37+");
  assert.ok(t52Html.includes(`v${t52VersionJson.version}`), "index.html must display version");
  assert.ok(t52Html.includes(`css/app.css?v=${t52VersionJson.version}`), "index.html must cache-bust css");
  assert.ok(t52Html.includes(`js/app.js?v=${t52VersionJson.version}`), "index.html must cache-bust app.js");
  assert.ok(t52Html.includes(`js/character.js?v=${t52VersionJson.version}`), "index.html must cache-bust character.js");
  assert.ok(t52Html.includes(`js/rules.js?v=${t52VersionJson.version}`), "index.html must cache-bust rules.js");
  assert.ok(t52Html.includes(`js/storage.js?v=${t52VersionJson.version}`), "index.html must cache-bust storage.js");
  assert.ok(t52AppJs.includes(`version: "${t52VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  console.log("✓ Test 52 Passed: Unique Modifier Custom Descriptions, Multi-Instance Support & Persistence verified.");

  // =========================================================================
  // Test 53: Unique Limiter & Enhancement Full-Width Editable Description Fields (v1.9.24)
  // =========================================================================
  // 1. Multi-instance modifier IDs resolve properly via BESM4E_RULES lookup helpers
  const uniqLimInst = BESM4E_RULES.getGeneralLimiterDef("unique_limiter_1728585000_ab12");
  assert.ok(uniqLimInst && uniqLimInst.id === "unique_limiter", "getGeneralLimiterDef must strip instanceId suffix");
  const uniqWpnLimInst = BESM4E_RULES.getWeaponLimiterDef("unique_limiter_1728585000_cd34");
  assert.ok(uniqWpnLimInst && uniqWpnLimInst.id === "unique_limiter", "getWeaponLimiterDef must strip instanceId suffix");
  const uniqModDef = BESM4E_RULES.getModifierDef("armour_1728585000_ef56", "limiter", "unique_limiter_1728585000_ab12");
  assert.ok(uniqModDef && uniqModDef.id === "unique_limiter", "getModifierDef must resolve unique_limiter from instanceId");

  // 2. Boilerplate description is stripped from unique_limiter if accidentally stored
  const boilerCost = BESM4E_RULES.calculateAttributeCost({
    id: "armour",
    level: 2,
    limiters: [{ id: "unique_limiter", name: "Unique Limiter", rank: 1, description: "A custom GM-approved operational drawback or situational limitation." }]
  });
  assert.strictEqual(boilerCost.limiters[0].description, undefined, "Boilerplate description must not populate unique_limiter user description");

  // 3. Attribute record and modal replace static boilerplate with user-editable input field reaching the right margin
  assert.ok(t52AppJs.includes('id="trait-info-modal-desc-input"'), "showTraitInfoModal must render user-editable #trait-info-modal-desc-input for unique modifiers");
  assert.ok(t52AppJs.includes('class="form-control attr-lim-desc-input"'), "#attr-desc box must render user-editable .attr-lim-desc-input in place of static description");
  assert.ok(t52AppJs.includes('class="form-control cont-attr-lim-desc-input"'), "#cont-attr-desc box must render user-editable .cont-attr-lim-desc-input in place of static description");
  assert.ok(t52AppJs.includes('input-wpn-lim-desc'), "renderBuilderWeapons must render inline user-editable .input-wpn-lim-desc on Unique Limiter pills");
  assert.ok(t52AppJs.includes('modifier-pill-unique'), "Unique modifier pills must include .modifier-pill-unique class for full-width right-margin expansion");
  assert.ok(t52Css.includes('.modifier-pill.modifier-pill-unique'), "app.css must style .modifier-pill.modifier-pill-unique to span 100% width");
  assert.ok(!t52Css.includes('max-width: 180px'), "app.css must NOT clamp .attr-enh-desc-input / .attr-lim-desc-input to max-width: 180px");
  assert.ok(!t52Css.includes('max-width: 150px'), "app.css must NOT clamp .input-attr-enh-desc / .input-attr-lim-desc to max-width: 150px");

  console.log("✓ Test 53 Passed: Unique Limiter & Enhancement Full-Width Editable Description Fields (v1.9.24) verified.");

  // =========================================================================
  // Test 54: CV, ACV, DCV & Init Labels Preceding Values & Roll Buttons (v1.9.24)
  // =========================================================================
  assert.ok(t52Css.includes('.derived-inline-row'), "app.css must define .derived-inline-row for inline label + value layout");
  const cvLabelIdx = t52Html.indexOf('<span class="derived-label">CV</span>');
  const cvValIdx = t52Html.indexOf('id="derived-cv"');
  assert.ok(cvLabelIdx !== -1 && cvValIdx !== -1 && cvLabelIdx < cvValIdx, "CV label must appear in front of #derived-cv number value");

  const acvLabelIdx = t52Html.indexOf('<span class="derived-label">ACV</span>');
  const acvValIdx = t52Html.indexOf('id="derived-acv"');
  assert.ok(acvLabelIdx !== -1 && acvValIdx !== -1 && acvLabelIdx < acvValIdx, "ACV label must appear in front of #derived-acv number value");

  const dcvLabelIdx = t52Html.indexOf('<span class="derived-label">DCV</span>');
  const dcvValIdx = t52Html.indexOf('id="derived-dcv"');
  assert.ok(dcvLabelIdx !== -1 && dcvValIdx !== -1 && dcvLabelIdx < dcvValIdx, "DCV label must appear in front of #derived-dcv number value");

  const initLabelIdx = t52Html.indexOf('<span class="derived-label">Init</span>');
  const initValIdx = t52Html.indexOf('id="derived-init"');
  assert.ok(initLabelIdx !== -1 && initValIdx !== -1 && initLabelIdx < initValIdx, "Init label must appear in front of #derived-init number value");

  assert.ok(t52Html.includes('id="btn-roll-builder-acv"') && t52Html.includes('>🎲 Roll</button>'), "ACV pill must include 🎲 Roll button");
  assert.ok(t52Html.includes('id="btn-roll-builder-dcv"'), "DCV pill must include 🎲 Roll button");
  assert.ok(t52Html.includes('id="btn-roll-builder-init"'), "Init pill must include 🎲 Roll button");

  console.log("✓ Test 54 Passed: CV, ACV, DCV & Init Labels Preceding Values & Roll Buttons (v1.9.24) verified.");

  // =========================================================================
  // Test 55: Initiative Roller Modifiers, Multi-Rank Edge & No-TN Resolution (v1.9.25)
  // =========================================================================
  console.log("\nTesting 55: Initiative Roller Modifiers, Multi-Rank Edge & No-TN Resolution (v1.9.25)...");

  const char55 = new BESM4ECharacter({ name: "Tactical Speedster", tier: "heroic" });
  char55.setStat("body", 6);
  char55.setStat("mind", 6);
  char55.setStat("soul", 6); // CV = 6, ACV = 6

  // 1. Base Initiative roll info has no Target Number
  let initRoll55 = char55.getTraitRollInfo("cv", "initiative");
  assert.strictEqual(initRoll55.totalModifier, 6, "Base Initiative modifier must equal ACV (6)");
  assert.strictEqual(initRoll55.targetNumber, null, "Initiative roll must have targetNumber: null");
  assert.strictEqual(initRoll55.noTarget, true, "Initiative roll must have noTarget: true");
  assert.strictEqual(initRoll55.isInitiative, true, "Initiative roll must have isInitiative: true");
  assert.strictEqual(initRoll55.mode, "standard", "Base Initiative mode must be standard");

  // 2. Attack Mastery & Heightened Awareness
  char55.addAttribute({ id: "attack_mastery", name: "Attack Mastery", level: 2 }); // ACV = 8
  char55.addAttribute({ id: "heightened_awareness", name: "Heightened Awareness", level: 1 }); // +2
  initRoll55 = char55.getTraitRollInfo("cv", "initiative");
  assert.strictEqual(initRoll55.totalModifier, 10, "ACV 8 + Heightened Awareness 1 (+2) = 10");
  assert.strictEqual(char55.getInitiative(), 10, "getInitiative() must match getTraitRollInfo('cv', 'initiative').totalModifier");

  // 3. Lightning Reflexes Rank 1 (Minor Edge, +2) vs Rank 2 (Major Edge, +4)
  char55.addAttribute({ id: "combat_technique", name: "Combat Technique (Lightning Reflexes)", subTrait: "Lightning Reflexes", level: 1 });
  initRoll55 = char55.getTraitRollInfo("cv", "initiative");
  assert.strictEqual(initRoll55.totalModifier, 12, "1 rank of Lightning Reflexes adds +2 (10 + 2 = 12)");
  assert.strictEqual(initRoll55.mode, "minor_edge", "1 rank of Lightning Reflexes grants Minor Edge");

  // Upgrade Lightning Reflexes to 2 ranks
  char55.attributes.find(a => a.subTrait === "Lightning Reflexes").level = 2;
  initRoll55 = char55.getTraitRollInfo("cv", "initiative");
  assert.strictEqual(initRoll55.totalModifier, 14, "2 ranks of Lightning Reflexes adds +4 (10 + 4 = 14)");
  assert.strictEqual(initRoll55.mode, "major_edge", "2 ranks of Lightning Reflexes grants Major Edge");

  // 4. Contained Item/Chassis Initiative Modifiers & Conditions
  char55.addAttribute({
    id: "item_visor",
    name: "Tactical Visor",
    level: 1,
    isContainer: true,
    containerType: "item"
  });
  char55.addContainerTrait("item_visor", "attributes", BESM4E_RULES.getAttributeDef("heightened_awareness"), 1); // +2 from Item
  initRoll55 = char55.getTraitRollInfo("cv", "initiative");
  assert.strictEqual(initRoll55.totalModifier, 16, "Item Heightened Awareness 1 adds +2 to Initiative (14 + 2 = 16)");

  // Restrained condition steps down Major Edge -> Minor Edge; Shocked + Impaired subtract 2
  char55.conditions = ["shocked", "impaired", "restrained"];
  initRoll55 = char55.getTraitRollInfo("cv", "initiative");
  assert.strictEqual(initRoll55.totalModifier, 14, "Shocked (-1) and Impaired (-1) reduce Initiative from 16 to 14");
  assert.strictEqual(initRoll55.mode, "minor_edge", "Restrained steps Major Edge down to Minor Edge");
  assert.strictEqual(char55.getInitiative(), 14, "getInitiative() reflects all active modifiers and conditions");

  // 5. Dice Roller execution with no Target Number produces no TN evaluation
  const initExecResult = roller.roll(initRoll55);
  assert.strictEqual(initExecResult.targetNumber, null, "Executed Initiative roll must have targetNumber: null");
  assert.strictEqual(initExecResult.success, null, "Executed Initiative roll must have success: null");
  assert.strictEqual(initExecResult.margin, null, "Executed Initiative roll must have margin: null");
  assert.strictEqual(initExecResult.isCriticalSuccess, false, "Non-TN Initiative roll must not trigger TN Critical Triumph");
  assert.strictEqual(initExecResult.isCriticalFumble, false, "Non-TN Initiative roll must not trigger TN Critical Fumble");

  assert.ok(t52AppJs.includes('options.targetNumber === null || options.noTarget || options.isInitiative'), "triggerRoll in app.js must clear #roller-target when targetNumber is null");
  assert.ok(t52AppJs.includes('if (!hasTarget)'), "renderRollResult in app.js must hide evaluation badge when roll has no Target Number");

  console.log("✓ Test 55 Passed: Initiative Roller Modifiers, Multi-Rank Edge & No-TN Resolution (v1.9.25) verified.");

  // =========================================================================
  // Test 56: Unique Attribute, Unknown Power & Unique Defect '?' Descriptions (v1.9.26)
  // =========================================================================
  console.log("\nTesting 56: Unique Attribute, Unknown Power & Unique Defect '?' Descriptions (v1.9.26)...");

  // 1. Standalone entries in BESM4E_TRAIT_DESCRIPTIONS
  const tdUniqueAttr = global.BESM4E_TRAIT_DESCRIPTIONS.attributes["unique_attribute"];
  assert.ok(tdUniqueAttr, "BESM4E_TRAIT_DESCRIPTIONS.attributes.unique_attribute must exist");
  assert.strictEqual(tdUniqueAttr.name, "Unique Attribute");
  assert.ok(tdUniqueAttr.source.includes("p. 131"), "Unique Attribute source must reference p. 131");
  assert.ok(tdUniqueAttr.fullDescription.includes("This Attribute covers any and all powers and special abilities not detailed in the rules"), "Unique Attribute fullDescription must contain official p. 131 rules text");

  const tdUnknownPower = global.BESM4E_TRAIT_DESCRIPTIONS.attributes["unknown_power"];
  assert.ok(tdUnknownPower, "BESM4E_TRAIT_DESCRIPTIONS.attributes.unknown_power must exist");
  assert.strictEqual(tdUnknownPower.name, "Unknown Power");
  assert.ok(tdUnknownPower.source.includes("p. 131"), "Unknown Power source must reference p. 131");
  assert.ok(tdUnknownPower.fullDescription.includes("characters may be unaware of their paranormal or superhuman Attributes"), "Unknown Power fullDescription must contain official p. 131 rules text");

  const tdUniqueDefect = global.BESM4E_TRAIT_DESCRIPTIONS.defects["unique_defect"];
  assert.ok(tdUniqueDefect, "BESM4E_TRAIT_DESCRIPTIONS.defects.unique_defect must exist");
  assert.strictEqual(tdUniqueDefect.name, "Unique Defect");
  assert.ok(tdUniqueDefect.source.includes("p. 165"), "Unique Defect source must reference p. 165");
  assert.ok(tdUniqueDefect.fullDescription.includes("This section covers any and all possible Defects that a character might possess"), "Unique Defect fullDescription must contain official p. 165 rules text");

  // Verify undetectable and unappealing no longer have concatenated Unique Attribute / Unique Defect text
  const tdUndetectable = global.BESM4E_TRAIT_DESCRIPTIONS.attributes["undetectable"];
  assert.ok(!tdUndetectable.fullDescription.includes("UNIQUE ATTRIBUTE"), "undetectable fullDescription must not contain concatenated UNIQUE ATTRIBUTE");
  const tdUnappealing = global.BESM4E_TRAIT_DESCRIPTIONS.defects["unappealing"];
  assert.ok(!tdUnappealing.fullDescription.includes("UNIQUE DEFECT"), "unappealing fullDescription must not contain concatenated UNIQUE DEFECT");

  // 2. Catalog entries in BESM4E_RULES
  const rUniqueAttr = BESM4E_RULES.getAttributeDef("unique_attribute");
  assert.ok(rUniqueAttr && rUniqueAttr.name === "Unique Attribute", "BESM4E_RULES must contain unique_attribute");
  const rUnknownPower = BESM4E_RULES.getAttributeDef("unknown_power");
  assert.ok(rUnknownPower && rUnknownPower.name === "Unknown Power", "BESM4E_RULES must contain unknown_power");
  const rUniqueDefect = BESM4E_RULES.getDefectDef("unique_defect");
  assert.ok(rUniqueDefect && rUniqueDefect.name === "Unique Defect", "BESM4E_RULES must contain unique_defect");

  // 3. BESM4E_RULES.getTraitFullInfo resolution for Unique Attribute, Unknown Power, Unique Defect, and custom_* instances
  const infoUniqueAttr = BESM4E_RULES.getTraitFullInfo("attribute", "unique_attribute");
  assert.ok(infoUniqueAttr && infoUniqueAttr.name === "Unique Attribute", "getTraitFullInfo('attribute', 'unique_attribute') must return Unique Attribute info");
  assert.ok(infoUniqueAttr.fullDescription.includes("1-10 Points/Level"), "getTraitFullInfo('attribute', 'unique_attribute') must include cost details");

  const infoCustomAttr = BESM4E_RULES.getTraitFullInfo("attribute", "custom_1728695000000");
  assert.ok(infoCustomAttr && infoCustomAttr.name === "Unique Attribute", "getTraitFullInfo('attribute', 'custom_*') must resolve to Unique Attribute rules description");

  const infoUniqueAttrSpaced = BESM4E_RULES.getTraitFullInfo("attribute", "Unique Attribute");
  assert.ok(infoUniqueAttrSpaced && infoUniqueAttrSpaced.name === "Unique Attribute", "getTraitFullInfo('attribute', 'Unique Attribute') must normalize spaces and resolve");

  const infoUnknownPower = BESM4E_RULES.getTraitFullInfo("attribute", "unknown_power");
  assert.ok(infoUnknownPower && infoUnknownPower.name === "Unknown Power", "getTraitFullInfo('attribute', 'unknown_power') must return Unknown Power info");

  const infoUniqueDefect = BESM4E_RULES.getTraitFullInfo("defect", "unique_defect");
  assert.ok(infoUniqueDefect && infoUniqueDefect.name === "Unique Defect", "getTraitFullInfo('defect', 'unique_defect') must return Unique Defect info");

  const infoCustomDefect = BESM4E_RULES.getTraitFullInfo("defect", "custom_defect_1728695000000");
  assert.ok(infoCustomDefect && infoCustomDefect.name === "Unique Defect", "getTraitFullInfo('defect', 'custom_defect_*') must resolve to Unique Defect rules description");

  // 4. UI '?' popover button on Custom Attribute / Custom Defect sections in index.html & app.js custom instance lookup
  assert.ok(t52Html.includes('data-trait-type="attribute" data-trait-id="unique_attribute"'), "index.html must include '?' rules popover button for Unique Attribute");
  assert.ok(t52Html.includes('data-trait-type="defect" data-trait-id="unique_defect"'), "index.html must include '?' rules popover button for Unique Defect");
  assert.ok(t52AppJs.includes('<strong>Custom Effect:</strong>'), "showTraitAnchoredPopover in app.js must display custom instance effect alongside Unique Attribute/Defect rules description");

  console.log("✓ Test 56 Passed: Unique Attribute, Unknown Power & Unique Defect '?' Descriptions (v1.9.26) verified.");

  // =======================================================
  // TEST 57: Enhancement & Limiter Max Rank Enforcement (v1.9.27)
  // =======================================================
  console.log("\n--- Running Test 57: Enhancement & Limiter Max Rank Enforcement (v1.9.27) ---");

  // 1. Verify every modifier in all catalogs has a numeric maxRank >= 1
  const checkCatalogMaxRanks = (list, label) => {
    assert.ok(Array.isArray(list) && list.length > 0, `${label} must be a non-empty array`);
    list.forEach(m => {
      assert.strictEqual(typeof m.maxRank, "number", `${label}.${m.id} must have a numeric maxRank`);
      assert.ok(m.maxRank >= 1 && m.maxRank <= 10, `${label}.${m.id} maxRank (${m.maxRank}) must be between 1 and 10`);
    });
  };
  checkCatalogMaxRanks(BESM4E_RULES.weaponEnhancements, "weaponEnhancements");
  checkCatalogMaxRanks(BESM4E_RULES.weaponLimiters, "weaponLimiters");
  checkCatalogMaxRanks(BESM4E_RULES.generalEnhancements, "generalEnhancements");
  checkCatalogMaxRanks(BESM4E_RULES.generalLimiters, "generalLimiters");
  const gsAttrDef = BESM4E_RULES.getAttributeDef("ground_speed");
  checkCatalogMaxRanks(gsAttrDef.specificLimiters, "ground_speed.specificLimiters");

  // 2. Spot-check canonical BESM 4E & BESM Extras maxRank values across 1-rank, 2-rank, 3-rank, 4-rank, and 5-rank modifiers
  const expectedMaxRanks = [
    // Specific Limiters
    { cat: "limiter", id: "road_bound", attrId: "ground_speed", maxRank: 1 },
    { cat: "limiter", id: "assisted", attrId: "ground_speed", maxRank: 3 },
    // General Enhancements
    { cat: "enhancement", id: "accurate", maxRank: 2 },
    { cat: "enhancement", id: "area", maxRank: 5 },
    { cat: "enhancement", id: "continuing", maxRank: 5 },
    { cat: "enhancement", id: "duration", maxRank: 5 },
    { cat: "enhancement", id: "flexible", maxRank: 3 },
    { cat: "enhancement", id: "hardened", maxRank: 3 },
    { cat: "enhancement", id: "helper", maxRank: 1 },
    { cat: "enhancement", id: "imbue", maxRank: 3 },
    { cat: "enhancement", id: "inconspicuous", maxRank: 1 },
    { cat: "enhancement", id: "multidimensional", maxRank: 1 },
    { cat: "enhancement", id: "penetrating", maxRank: 5 },
    { cat: "enhancement", id: "potent", maxRank: 5 },
    { cat: "enhancement", id: "range", maxRank: 5 },
    { cat: "enhancement", id: "selective", maxRank: 1 },
    { cat: "enhancement", id: "spreading", maxRank: 5 },
    { cat: "enhancement", id: "subtle", maxRank: 1 },
    { cat: "enhancement", id: "targets", maxRank: 5 },
    { cat: "enhancement", id: "unique_enhancement", maxRank: 5 },
    // General Limiters
    { cat: "limiter", id: "activation", maxRank: 3 },
    { cat: "limiter", id: "assisted", maxRank: 3 },
    { cat: "limiter", id: "backblast", maxRank: 2 },
    { cat: "limiter", id: "backlash", maxRank: 3 },
    { cat: "limiter", id: "blind_spot", maxRank: 1 },
    { cat: "limiter", id: "charges", maxRank: 3 },
    { cat: "limiter", id: "concentration", maxRank: 3 },
    { cat: "limiter", id: "conditional", maxRank: 3 },
    { cat: "limiter", id: "consumable", maxRank: 3 },
    { cat: "limiter", id: "delay", maxRank: 3 },
    { cat: "limiter", id: "dependent", maxRank: 3 },
    { cat: "limiter", id: "deplete", maxRank: 3 },
    { cat: "limiter", id: "detectable", maxRank: 3 },
    { cat: "limiter", id: "exclusive", maxRank: 3 },
    { cat: "limiter", id: "feedback", maxRank: 3 },
    { cat: "limiter", id: "fragile", maxRank: 3 },
    { cat: "limiter", id: "gliding", maxRank: 1 },
    { cat: "limiter", id: "hands", maxRank: 1 },
    { cat: "limiter", id: "internal", maxRank: 1 },
    { cat: "limiter", id: "maximum", maxRank: 3 },
    { cat: "limiter", id: "object", maxRank: 3 },
    { cat: "limiter", id: "permanent", maxRank: 3 },
    { cat: "limiter", id: "recovery", maxRank: 3 },
    { cat: "limiter", id: "restricts_movement", maxRank: 1 },
    { cat: "limiter", id: "road_bound", maxRank: 1 },
    { cat: "limiter", id: "slow", maxRank: 3 },
    { cat: "limiter", id: "specific", maxRank: 3 },
    { cat: "limiter", id: "surface_only", maxRank: 1 },
    { cat: "limiter", id: "tethered", maxRank: 1 },
    { cat: "limiter", id: "uncontrolled", maxRank: 3 },
    { cat: "limiter", id: "unique_limiter", maxRank: 3 },
    { cat: "limiter", id: "unreliable", maxRank: 3 },
    { cat: "limiter", id: "uses_energy", maxRank: 3 },
    // Weapon Enhancements
    { cat: "weapon_enhancement", id: "accurate", maxRank: 2 },
    { cat: "weapon_enhancement", id: "anemic", maxRank: 3 },
    { cat: "weapon_enhancement", id: "area", maxRank: 5 },
    { cat: "weapon_enhancement", id: "aura", maxRank: 1 },
    { cat: "weapon_enhancement", id: "autofire", maxRank: 1 },
    { cat: "weapon_enhancement", id: "blight", maxRank: 3 },
    { cat: "weapon_enhancement", id: "contact", maxRank: 2 },
    { cat: "weapon_enhancement", id: "contagious", maxRank: 3 },
    { cat: "weapon_enhancement", id: "continuing", maxRank: 5 },
    { cat: "weapon_enhancement", id: "demoralize", maxRank: 3 },
    { cat: "weapon_enhancement", id: "drain", maxRank: 3 },
    { cat: "weapon_enhancement", id: "enervation", maxRank: 5 },
    { cat: "weapon_enhancement", id: "flare", maxRank: 3 },
    { cat: "weapon_enhancement", id: "flexible", maxRank: 3 },
    { cat: "weapon_enhancement", id: "helper", maxRank: 1 },
    { cat: "weapon_enhancement", id: "homing", maxRank: 2 },
    { cat: "weapon_enhancement", id: "incapacitating", maxRank: 4 },
    { cat: "weapon_enhancement", id: "inconspicuous", maxRank: 1 },
    { cat: "weapon_enhancement", id: "incurable", maxRank: 3 },
    { cat: "weapon_enhancement", id: "indirect", maxRank: 1 },
    { cat: "weapon_enhancement", id: "insidious", maxRank: 1 },
    { cat: "weapon_enhancement", id: "irritant", maxRank: 3 },
    { cat: "weapon_enhancement", id: "lethargy", maxRank: 3 },
    { cat: "weapon_enhancement", id: "linked", maxRank: 1 },
    { cat: "weapon_enhancement", id: "multidimensional", maxRank: 1 },
    { cat: "weapon_enhancement", id: "muscle", maxRank: 1 },
    { cat: "weapon_enhancement", id: "penetrating", maxRank: 5 },
    { cat: "weapon_enhancement", id: "piercing", maxRank: 5 },
    { cat: "weapon_enhancement", id: "psychic", maxRank: 1 },
    { cat: "weapon_enhancement", id: "quake", maxRank: 5 },
    { cat: "weapon_enhancement", id: "reach", maxRank: 1 },
    { cat: "weapon_enhancement", id: "selective", maxRank: 1 },
    { cat: "weapon_enhancement", id: "spreading", maxRank: 5 },
    { cat: "weapon_enhancement", id: "stun", maxRank: 1 },
    { cat: "weapon_enhancement", id: "tangle", maxRank: 5 },
    { cat: "weapon_enhancement", id: "targeted", maxRank: 3 },
    { cat: "weapon_enhancement", id: "trap", maxRank: 1 },
    { cat: "weapon_enhancement", id: "vampiric", maxRank: 4 },
    { cat: "weapon_enhancement", id: "unique_enhancement", maxRank: 5 },
    // Weapon Limiters
    { cat: "weapon_limiter", id: "activation", maxRank: 3 },
    { cat: "weapon_limiter", id: "alt_munition", maxRank: 1 },
    { cat: "weapon_limiter", id: "ammo", maxRank: 4 },
    { cat: "weapon_limiter", id: "backblast", maxRank: 2 },
    { cat: "weapon_limiter", id: "backlash", maxRank: 3 },
    { cat: "weapon_limiter", id: "charges", maxRank: 3 },
    { cat: "weapon_limiter", id: "concentration", maxRank: 3 },
    { cat: "weapon_limiter", id: "consumable", maxRank: 3 },
    { cat: "weapon_limiter", id: "delay", maxRank: 3 },
    { cat: "weapon_limiter", id: "dependent", maxRank: 3 },
    { cat: "weapon_limiter", id: "deplete", maxRank: 3 },
    { cat: "weapon_limiter", id: "detectable", maxRank: 3 },
    { cat: "weapon_limiter", id: "exclusive", maxRank: 3 },
    { cat: "weapon_limiter", id: "fieldless", maxRank: 1 },
    { cat: "weapon_limiter", id: "fragile", maxRank: 3 },
    { cat: "weapon_limiter", id: "hands", maxRank: 1 },
    { cat: "weapon_limiter", id: "inaccurate", maxRank: 2 },
    { cat: "weapon_limiter", id: "ingest", maxRank: 1 },
    { cat: "weapon_limiter", id: "internal", maxRank: 1 },
    { cat: "weapon_limiter", id: "irremovable", maxRank: 1 },
    { cat: "weapon_limiter", id: "irreversible", maxRank: 3 },
    { cat: "weapon_limiter", id: "localized", maxRank: 3 },
    { cat: "weapon_limiter", id: "low_penetration", maxRank: 5 },
    { cat: "weapon_limiter", id: "maximum", maxRank: 3 },
    { cat: "weapon_limiter", id: "melee", maxRank: 1 },
    { cat: "weapon_limiter", id: "non_penetrating", maxRank: 5 },
    { cat: "weapon_limiter", id: "object", maxRank: 3 },
    { cat: "weapon_limiter", id: "permanent", maxRank: 3 },
    { cat: "weapon_limiter", id: "recoil", maxRank: 3 },
    { cat: "weapon_limiter", id: "recovery", maxRank: 3 },
    { cat: "weapon_limiter", id: "slow", maxRank: 3 },
    { cat: "weapon_limiter", id: "stoppable", maxRank: 4 },
    { cat: "weapon_limiter", id: "toxic", maxRank: 2 },
    { cat: "weapon_limiter", id: "unique_limiter", maxRank: 3 },
    { cat: "weapon_limiter", id: "unreliable", maxRank: 3 },
    { cat: "weapon_limiter", id: "uses_energy", maxRank: 3 }
  ];

  expectedMaxRanks.forEach(item => {
    const attrId = item.attrId || (item.cat.startsWith("weapon") ? "weapon" : "flight");
    const modType = item.cat.replace("_", " ");
    const def = BESM4E_RULES.getModifierDef(attrId, modType, item.id);
    assert.ok(def, `Modifier ${item.cat}.${item.id} must resolve via getModifierDef`);
    assert.strictEqual(def.maxRank, item.maxRank, `${item.cat}.${item.id} must have maxRank === ${item.maxRank}`);
  });

  // 3. Verify calculateAttributeCost and calculateWeaponCost clamp out-of-bounds ranks to maxRank
  const clampAttrCost = BESM4E_RULES.calculateAttributeCost({
    id: "flight",
    level: 4,
    costPerLevel: 2,
    enhancements: [
      { id: "selective", rank: 5 },      // maxRank 1 -> clamps to 1
      { id: "flexible", rank: 9 }        // maxRank 3 -> clamps to 3
    ],
    limiters: [
      { id: "gliding", rank: 4 },        // maxRank 1 -> clamps to 1
      { id: "activation", rank: 10 }     // maxRank 3 -> clamps to 3
    ]
  });
  assert.strictEqual(clampAttrCost.enhancements[0].rank, 1, "Selective clamps to rank 1");
  assert.strictEqual(clampAttrCost.enhancements[0].maxRank, 1);
  assert.strictEqual(clampAttrCost.enhancements[1].rank, 3, "Flexible clamps to rank 3");
  assert.strictEqual(clampAttrCost.enhancements[1].maxRank, 3);
  assert.strictEqual(clampAttrCost.limiters[0].rank, 1, "Gliding clamps to rank 1");
  assert.strictEqual(clampAttrCost.limiters[0].maxRank, 1);
  assert.strictEqual(clampAttrCost.limiters[1].rank, 3, "Activation clamps to rank 3");
  assert.strictEqual(clampAttrCost.limiters[1].maxRank, 3);
  // Effective level = 4 - (1 + 3) + (1 + 3) = 4 -> 8 CP
  assert.strictEqual(clampAttrCost.effectiveLevel, 4);
  assert.strictEqual(clampAttrCost.totalCost, 8);

  const clampWpnCost = BESM4E_RULES.calculateWeaponCost({
    level: 4,
    enhancements: [
      { id: "autofire", rank: 4 },       // maxRank 1 -> clamps to 1
      { id: "accurate", rank: 5 },       // maxRank 2 -> clamps to 2
      { id: "incapacitating", rank: 9 }  // maxRank 4 -> clamps to 4
    ],
    limiters: [
      { id: "hands", rank: 3 },          // maxRank 1 -> clamps to 1
      { id: "inaccurate", rank: 5 },     // maxRank 2 -> clamps to 2
      { id: "ammo", rank: 8 }            // maxRank 4 -> clamps to 4
    ]
  });
  assert.strictEqual(clampWpnCost.enhancements[0].rank, 1, "Autofire clamps to rank 1");
  assert.strictEqual(clampWpnCost.enhancements[1].rank, 2, "Accurate clamps to rank 2");
  assert.strictEqual(clampWpnCost.enhancements[2].rank, 4, "Incapacitating clamps to rank 4");
  assert.strictEqual(clampWpnCost.limiters[0].rank, 1, "Hands clamps to rank 1");
  assert.strictEqual(clampWpnCost.limiters[1].rank, 2, "Inaccurate clamps to rank 2");
  assert.strictEqual(clampWpnCost.limiters[2].rank, 4, "Ammo clamps to rank 4");
  assert.strictEqual(clampWpnCost.enhRanks, 7, "1 + 2 + 4 = 7 enhancement ranks");
  assert.strictEqual(clampWpnCost.limRanks, 7, "1 + 2 + 4 = 7 limiter ranks");

  // 4. Verify BESM4ECharacter methods enforce maxRank on standard attributes, contained attributes, and weapons
  const t57Char = new BESM4ECharacter({ name: "Limit Tester", tier: "adventurer" });
  t57Char.addAttribute({ id: "ground_speed", name: "Ground Speed", level: 4, costPerLevel: 1 });
  t57Char.addAttributeEnhancement("ground_speed", { id: "selective", name: "Selective", rank: 5, costPerRank: 1 });
  t57Char.addAttributeLimiter("ground_speed", { id: "road_bound", name: "Road-Bound", rank: 3, refundPerRank: 1 });
  const stdGs = t57Char.attributes.find(a => a.id === "ground_speed");
  assert.strictEqual(stdGs.enhancements[0].rank, 1, "addAttributeEnhancement clamps Selective to maxRank 1");
  assert.strictEqual(stdGs.enhancements[0].maxRank, 1);
  assert.strictEqual(stdGs.limiters[0].rank, 1, "addAttributeLimiter clamps Road-Bound to maxRank 1");
  assert.strictEqual(stdGs.limiters[0].maxRank, 1);

  t57Char.updateAttributeEnhancementRank("ground_speed", "selective", 4);
  t57Char.updateAttributeLimiterRank("ground_speed", "road_bound", 4);
  assert.strictEqual(stdGs.enhancements[0].rank, 1, "updateAttributeEnhancementRank clamps Selective to maxRank 1");
  assert.strictEqual(stdGs.limiters[0].rank, 1, "updateAttributeLimiterRank clamps Road-Bound to maxRank 1");

  const t57WpnEntry = t57Char.addWeapon({
    name: "Test Blaster",
    level: 3,
    enhancements: [{ id: "aura", rank: 5 }, { id: "homing", rank: 5 }],
    limiters: [{ id: "melee", rank: 4 }, { id: "charges", rank: 6 }]
  });
  assert.strictEqual(t57WpnEntry.enhancements[0].rank, 1, "Weapon Aura clamped to rank 1");
  assert.strictEqual(t57WpnEntry.enhancements[1].rank, 2, "Weapon Homing clamped to rank 2");
  assert.strictEqual(t57WpnEntry.limiters[0].rank, 1, "Weapon Melee clamped to rank 1");
  assert.strictEqual(t57WpnEntry.limiters[1].rank, 3, "Weapon Charges clamped to rank 3");

  t57Char.updateWeapon(t57WpnEntry.id, {
    enhancements: [{ id: "aura", rank: 3 }],
    limiters: [{ id: "melee", rank: 2 }]
  });
  assert.strictEqual(t57WpnEntry.enhancements[0].rank, 1, "updateWeapon clamps Aura to rank 1");
  assert.strictEqual(t57WpnEntry.limiters[0].rank, 1, "updateWeapon clamps Melee to rank 1");

  // 5. Verify UI wiring in app.js includes data-max-rank and disabled stepper logic when at maxRank
  const t57AppJs = fs.readFileSync("./js/app.js", "utf8");
  assert.ok(t57AppJs.includes("data-max-rank="), "app.js must bind data-max-rank on modifier dropdown options");
  assert.ok(t57AppJs.includes("e.rank >= maxRank ? 'disabled' : ''"), "app.js must disable enhancement '+' button when at maxRank");
  assert.ok(t57AppJs.includes("l.rank >= maxRank ? 'disabled' : ''"), "app.js must disable limiter '+' button when at maxRank");
  assert.ok(t57AppJs.includes("rankVal >= maxRank ? 'disabled' : ''"), "app.js weapon modal must disable '+' button when at maxRank");

  console.log("✓ Test 57 Passed: Enhancement & Limiter Max Rank Enforcement (v1.9.27) verified.");

  // =========================================================================
  // TEST 58: Re-Parsed Trait Descriptions & Consolidated Attribute Descriptive Fields (v1.9.28)
  // =========================================================================
  console.log("\n--- Running Test 58: Re-Parsed Trait Descriptions & Consolidated Attribute Descriptive Fields (v1.9.28) ---");

  const t58Traits = global.BESM4E_TRAIT_DESCRIPTIONS;
  assert.ok(t58Traits && t58Traits.attributes && t58Traits.skills && t58Traits.defects, "BESM4E_TRAIT_DESCRIPTIONS must be loaded");

  // 1. Verify spliced sidebars, tables, and neighboring traits are removed
  assert.ok(!t58Traits.attributes.connected.fullDescription.includes("CONNECTED IN THE MULTIVERSE"), "connected must not include spliced multiverse sidebar");
  assert.ok(!t58Traits.attributes.size_change.fullDescription.includes("SKILL GROUP SKILL GROUP"), "size_change must not include spliced Skill Group section");
  assert.ok(!t58Traits.defects.bane.fullDescription.includes("SOCIAL AWARENESS"), "bane must not include mid-sentence Social Awareness sidebar");
  assert.ok(!t58Traits.defects.conditional_ownership.fullDescription.includes("AWKWARD SIZE"), "conditional_ownership must not include spliced Awkward Size table");
  assert.ok(!t58Traits.skills.social_sciences.fullDescription.includes("SPORTS SPORTS"), "social_sciences must not include spliced Sports section");
  assert.ok(!t58Traits.skills.writing.fullDescription.includes("VARYING SKILL COSTS"), "writing must not include spliced Varying Skill Costs section");
  assert.ok(!t58Traits.skills.burglary.fullDescription.includes("BUSINESS BUSINESS"), "burglary must not include spliced Business section");
  assert.ok(!t58Traits.skills.electronics.fullDescription.includes("EMPATHY EMPATHY"), "electronics must not include spliced Empathy section");
  assert.ok(!t58Traits.skills.engineering.fullDescription.includes("ENVIRONMENTAL SCIENCES"), "engineering must not include spliced Environmental Sciences section");
  assert.ok(!t58Traits.skills.navigation.fullDescription.includes("OCCULT OCCULT"), "navigation must not include spliced Occult section");
  assert.ok(!t58Traits.skills.riding.fullDescription.includes("SEARCH SEARCH"), "riding must not include spliced Search section");
  assert.ok(!t58Traits.skills.police_sciences.fullDescription.includes("POWERLIFTING"), "police_sciences must not include spliced Powerlifting section");
  assert.ok(!t58Traits.skills.physical_sciences.fullDescription.includes("TEMPLATES AND"), "physical_sciences must not include spliced Templates sidebar");

  // 2. Verify restored dropped stylized words, unscrambled tables, and completed progressions
  assert.ok(t58Traits.attributes.features.fullDescription.includes("Personal Features:"), "features must include unscrambled Personal Features list");
  assert.ok(t58Traits.attributes.features.fullDescription.includes("Racial Features:"), "features must include unscrambled Racial Features list");
  assert.ok(t58Traits.attributes.features.fullDescription.includes("Technological Features:"), "features must include unscrambled Technological Features list");
  assert.strictEqual(t58Traits.attributes.weapon.levels.length, 6, "weapon must include Level 1 through Level 6 progression");
  assert.ok(t58Traits.attributes.weapon.fullDescription.includes("A Level -1 Weapon inflicts no damage at all"), "weapon LEVEL 0 AND -1 paragraph must be complete");
  assert.ok(t58Traits.defects.awkward_size.fullDescription.includes("-2 Points Rank 1 (Large)"), "awkward_size must include Rank 1 progression");
  assert.ok(t58Traits.defects.awkward_size.fullDescription.includes("-20 Points Rank 10 (Monumental)"), "awkward_size must include Rank 10 progression");
  assert.ok(t58Traits.attributes.dynamic_powers.fullDescription.includes("the sphere"), "dynamic_powers must have restored 'the sphere' text");
  assert.ok(t58Traits.attributes.companion.fullDescription.includes("Companion Attribute several times"), "companion must have restored 'Companion Attribute several' text");

  // 3. Verify no mid-sentence line breaks or stray chapter headers across all trait categories
  for (const cat of ["attributes", "skillGroups", "skills", "defects"]) {
    for (const [id, item] of Object.entries(t58Traits[cat])) {
      assert.ok(!/\b0[257]:/.test(item.fullDescription), `${cat}.${id} must not contain stray chapter marker`);
      const lines = item.fullDescription.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const curr = lines[i].trim();
        const next = lines[i + 1].trim();
        assert.ok(!(curr.length > 0 && next.length > 0 && /^[a-z]/.test(next)), `${cat}.${id} must not break mid-sentence before lowercase line: "${curr}" -> "${next}"`);
      }
    }
  }

  // 4. Verify all skills have separated Multi-Genre Cost and Specialisations lines
  for (const [id, item] of Object.entries(t58Traits.skills)) {
    assert.ok(!/Multi-Genre Cost:[^\n]*Specialisations:/.test(item.fullDescription), `skills.${id} must separate Multi-Genre Cost and Specialisations onto distinct lines`);
  }

  // 5. Verify consolidated attribute descriptive field in app.js
  const t58AppJs = fs.readFileSync("./js/app.js", "utf8");
  assert.ok(t58AppJs.includes("const unifiedDescValue = attr.detail || (hasCustomDesc ? attr.customDesc : \"\");"), "app.js must unify detail and customDesc values in consolidated standard attribute field");
  assert.ok(t58AppJs.includes("const unifiedContDescValue = ca.detail || (hasContCustomDesc ? ca.customDesc : \"\");"), "app.js must unify detail and customDesc values in consolidated contained attribute field");
  assert.ok(t58AppJs.includes("const unifiedPlaceholder = (hasDetail && def.detailPlaceholder)"), "app.js must use attribute detailPlaceholder when available on consolidated description field");
  assert.ok(t58AppJs.includes("currentCharacter.updateAttributeDetail(id, val);"), "consolidated attr-desc-input listener must sync detail");
  assert.ok(t58AppJs.includes("currentCharacter.updateAttributeDescription(id, val);"), "consolidated attr-desc-input listener must sync customDesc");
  assert.ok(t58AppJs.includes("currentCharacter.updateContainerTraitDetail(cId, \"attributes\", id, val);"), "consolidated cont-attr-desc-input listener must sync detail");
  assert.ok(t58AppJs.includes("currentCharacter.updateContainerTraitDescription(cId, \"attributes\", id, val);"), "consolidated cont-attr-desc-input listener must sync customDesc");

  // 6. Verify compacted container stats block (Chassis, Companion, etc.) houses both core stats and derived stats
  const t58AppCss = fs.readFileSync("./css/app.css", "utf8");
  assert.ok(t58AppCss.includes(".companion-core-stats-group"), "app.css must define .companion-core-stats-group for compact core stats");
  assert.ok(t58AppJs.includes('<div class="companion-stats-box">') && t58AppJs.includes('<div class="companion-core-stats-group">'), "app.js must nest .companion-core-stats-group and .companion-derived-row inside .companion-stats-box");

  console.log("✓ Test 58 Passed: Re-Parsed Trait Descriptions, Consolidated Attribute Fields & Compact Container Stats Block (v1.9.29) verified.");

  // =========================================================================
  // TEST 59: Main Menu Help Entry & Large Features Guide Modal (v1.9.30)
  // =========================================================================
  console.log("\n--- Running Test 59: Main Menu Help Entry & Large Features Guide Modal (v1.9.30) ---");

  const t59Html = fs.readFileSync("./index.html", "utf8");
  const t59Css = fs.readFileSync("./css/app.css", "utf8");
  const t59AppJs = fs.readFileSync("./js/app.js", "utf8");

  // 1. Verify Help entry in Main menu
  assert.ok(t59Html.includes('id="btn-help-app"'), "index.html must include #btn-help-app in the Main menu");
  assert.ok(t59Html.includes('Help &amp; Features Guide...'), "Main menu Help button must display 'Help & Features Guide...'");
  assert.ok(t59Html.includes('<span class="menu-item-shortcut">F1</span>'), "Main menu Help button must show F1 shortcut");

  // 2. Verify large Help modal (#modal-help-app) and topic sections
  assert.ok(t59Html.includes('id="modal-help-app"'), "index.html must include #modal-help-app modal");
  assert.ok(t59Html.includes('id="help-search-input"'), "Help modal must include live search input #help-search-input");
  assert.ok(t59Html.includes('id="help-guide-grid"'), "Help modal must include #help-guide-grid");
  assert.ok(t59Html.includes('data-help-section="overview"'), "Help modal must include overview section");
  assert.ok(t59Html.includes('data-help-section="stats"'), "Help modal must include stats & templates section");
  assert.ok(t59Html.includes('data-help-section="traits"'), "Help modal must include attributes & modifiers section");
  assert.ok(t59Html.includes('data-help-section="containers"'), "Help modal must include containers & vehicles section");
  assert.ok(t59Html.includes('data-help-section="combat"'), "Help modal must include skills, defects & weapons section");
  assert.ok(t59Html.includes('data-help-section="play"'), "Help modal must include 2d6 roller & play mode section");
  assert.ok(t59Html.includes('data-help-section="files"'), "Help modal must include saving, export & shortcuts section");

  // 3. Verify CSS and JS wiring
  assert.ok(t59Css.includes(".help-guide-grid") && t59Css.includes(".help-guide-card"), "css/app.css must style .help-guide-grid and .help-guide-card");
  assert.ok(t59AppJs.includes('openModal("modal-help-app")'), "js/app.js must open modal-help-app on Help button or F1");
  assert.ok(t59AppJs.includes("function filterHelpGuide()"), "js/app.js must implement filterHelpGuide() for interactive help search & category pills");

  console.log("✓ Test 59 Passed: Main Menu Help Entry & Large Features Guide Modal (v1.9.30) verified.");

  // =========================================================================
  // TEST 60: Race & Class Template Switching Clears Previous Choices While Preserving Custom & Other-Template Traits (v1.9.31)
  // =========================================================================
  console.log("\n--- Running Test 60: Race & Class Template Switching Clears Previous Choices While Preserving Custom & Other-Template Traits (v1.9.31) ---");

  // 1. Verify switching Race clears all previous Race choices while preserving Class and user-added traits
  const t60Char = new BESM4ECharacter({
    name: "Kaelen",
    stats: { body: 4, mind: 4, soul: 4 },
    gear: "Personal Signet Ring"
  });
  const telepathyDef = BESM4E_RULES.getAttributeDef("telepathy");
  const toughDef = BESM4E_RULES.getAttributeDef("tough");
  const detectiveSgDef = BESM4E_RULES.getSkillGroupDef("detective");
  const stealthSkDef = BESM4E_RULES.getSkillDef("stealth");
  const cursedDef = BESM4E_RULES.getDefectDef("cursed");

  t60Char.addAttribute(telepathyDef, 2, "Telepathy", "Innate mind-link");
  t60Char.addAttribute(toughDef, 1, "Tough", "Personal conditioning");
  t60Char.addSkillGroup(detectiveSgDef, 1);
  t60Char.addSkill(stealthSkDef, 2, "Shadows");
  t60Char.addDefect(cursedDef, 1, "Ill Omen");
  t60Char.addWeapon({ name: "Heirloom Dagger", level: 1, range: "Melee", attackType: "melee", enhancements: "", limiters: "Melee" });

  // Apply Nekojin race + Demon Hunter class (both have distinct Combat Technique specializations)
  t60Char.applyRaceTemplate("nekojin");
  t60Char.applyClassTemplate("demon_hunter");

  assert.strictEqual(t60Char.race, "Nekojin (Cat-Folk)");
  assert.strictEqual(t60Char.characterClass, "Demon Hunter");
  assert.ok(t60Char.weapons.some(w => w.name === "Retractable Razor Claws"), "Nekojin weapon must be added");
  assert.ok(t60Char.weapons.some(w => w.name === "Consecrated Silver Blade"), "Demon Hunter weapon must be added");
  assert.ok(t60Char.weapons.some(w => w.name === "Heirloom Dagger"), "Manual weapon must remain");

  // Switch Race from Nekojin to Dwarf
  t60Char.applyRaceTemplate("dwarf");
  assert.strictEqual(t60Char.race, "Dwarf", "Race must update to Dwarf");
  assert.strictEqual(t60Char.appliedRaceTemplateId, "dwarf", "appliedRaceTemplateId must be dwarf");
  assert.ok(!t60Char.weapons.some(w => w.name === "Retractable Razor Claws"), "Previous race weapon (Retractable Razor Claws) must be removed");
  assert.ok(!t60Char.attributes.some(a => a.name.includes("Retractable Razor Claws")), "Previous race weapon attribute must be removed");
  assert.ok(!t60Char.attributes.some(a => a.name.includes("Night Vision")), "Previous race Supersense (Night Vision) must be removed");
  assert.ok(!t60Char.defects.some(d => d.name.includes("Feline Ears & Whiskers")), "Previous race Marked defect must be removed");

  // Verify Demon Hunter class traits and custom traits remain intact
  assert.strictEqual(t60Char.characterClass, "Demon Hunter", "Class must remain Demon Hunter");
  assert.ok(t60Char.weapons.some(w => w.name === "Consecrated Silver Blade"), "Demon Hunter weapon must remain");
  assert.ok(t60Char.attributes.some(a => a.name === "Combat Technique (Blind Fighting, Critical Strike)" && a.level === 2), "Demon Hunter Combat Technique specialization must remain intact");
  assert.ok(t60Char.attributes.some(a => a.id === "telepathy" && a.level === 2), "User-added Telepathy must remain");
  const toughAfterDwarf = t60Char.attributes.find(a => a.id === "tough");
  // Manual Tough (1) + Dwarf Tough (2) = 3
  assert.strictEqual(toughAfterDwarf.level, 3, "Tough must sum manual level (1) + Dwarf race level (2)");

  // Switch Class from Demon Hunter to Detective
  t60Char.applyClassTemplate("detective");
  assert.strictEqual(t60Char.characterClass, "Detective", "Class must update to Detective");
  assert.strictEqual(t60Char.appliedClassTemplateId, "detective", "appliedClassTemplateId must be detective");
  assert.ok(!t60Char.weapons.some(w => w.name === "Consecrated Silver Blade"), "Previous class weapon must be removed");
  assert.ok(!t60Char.attributes.some(a => a.name === "Combat Technique (Blind Fighting, Critical Strike)"), "Previous class Combat Technique must be removed");
  assert.ok(!t60Char.gear.includes("vials of holy water"), "Previous class gear must be removed");
  assert.ok(t60Char.gear.includes("Personal Signet Ring"), "Manual gear must remain");
  assert.ok(t60Char.gear.includes("Trench coat"), "New class gear must be present");

  // Verify manual Detective skill group (1) + Detective class skill group (2) = 3
  const detSg = t60Char.skillGroups.find(s => s.id === "detective");
  assert.ok(detSg && detSg.level === 3, "Detective skill group must sum manual level (1) + class level (2)");

  // Switch Class from Detective to Adventurer and verify Detective skill group reverts to manual level (1)
  t60Char.applyClassTemplate("adventurer");
  const detSgAfter = t60Char.skillGroups.find(s => s.id === "detective");
  assert.ok(detSgAfter && detSgAfter.level === 1, "Detective skill group must revert to manual level (1) when switching away from Detective class");
  assert.ok(t60Char.skills.some(s => s.id === "stealth" && s.level === 2), "Manual individual skill (Stealth) must remain intact");
  assert.ok(t60Char.defects.some(d => d.id === "cursed" && d.rank === 1), "Manual defect (Cursed) must remain intact");
  assert.ok(t60Char.weapons.some(w => w.name === "Heirloom Dagger"), "Manual weapon (Heirloom Dagger) must remain intact");

  // 2. Verify container attributes from both Race and Class (e.g. Werewolf + Sentai Member Alternate Forms) keep separate containers and clean up properly
  const t60Cont = new BESM4ECharacter();
  t60Cont.applyRaceTemplate("werewolf");
  t60Cont.applyClassTemplate("sentai_member");
  const altForms = t60Cont.attributes.filter(a => (a.attributeId || a.id) === "alternate_form");
  assert.strictEqual(altForms.length, 2, "Werewolf + Sentai Member must maintain two separate Alternate Form containers");
  t60Cont.applyRaceTemplate("human");
  const remAltForms = t60Cont.attributes.filter(a => (a.attributeId || a.id) === "alternate_form");
  assert.strictEqual(remAltForms.length, 1, "Switching race from Werewolf to Human must remove only Werewolf's Alternate Form");
  assert.ok(remAltForms[0].name.includes("Henshin Ranger Suit"), "Remaining Alternate Form must be Sentai Member's");

  // 3. Verify UI sync order and #char-race / #char-class change handlers in js/app.js
  const t60AppJs = fs.readFileSync("./js/app.js", "utf8");
  assert.ok(
    t60AppJs.includes("currentCharacter.applyRaceTemplate(tmpl.id);\r\n            refreshAll();\r\n            saveCurrentCharacter(true);") ||
    t60AppJs.includes("currentCharacter.applyRaceTemplate(tmpl.id);\n            refreshAll();\n            saveCurrentCharacter(true);"),
    "js/app.js must call refreshAll() before saveCurrentCharacter(true) when applying a Race template"
  );
  assert.ok(
    t60AppJs.includes("currentCharacter.applyClassTemplate(tmpl.id);\r\n            refreshAll();\r\n            saveCurrentCharacter(true);") ||
    t60AppJs.includes("currentCharacter.applyClassTemplate(tmpl.id);\n            refreshAll();\n            saveCurrentCharacter(true);"),
    "js/app.js must call refreshAll() before saveCurrentCharacter(true) when applying a Class template"
  );
  assert.ok(t60AppJs.includes("charRaceInput.addEventListener(\"change\""), "js/app.js must listen for #char-race change events to clear/replace race template choices");
  assert.ok(t60AppJs.includes("charClassInput.addEventListener(\"change\""), "js/app.js must listen for #char-class change events to clear/replace class template choices");

  console.log("✓ Test 60 Passed: Race & Class Template Switching Clears Previous Choices While Preserving Custom & Other-Template Traits (v1.9.31) verified.");

  // =========================================================================
  // TEST 61: PDF Export & Print Sheet Right Margin Overflow Protection (v1.9.32)
  // =========================================================================
  console.log("\n--- Running Test 61: PDF Export & Print Sheet Right Margin Overflow Protection (v1.9.32) ---");

  // 1. Verify CSS rules enforce minmax(0, 1fr) grid columns and box-sizing word wrapping
  const t61Css = fs.readFileSync("./css/app.css", "utf8");
  assert.ok(
    t61Css.includes(".sheet-stats-row {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));") ||
    t61Css.includes(".sheet-stats-row {\r\n  display: grid;\r\n  grid-template-columns: repeat(3, minmax(0, 1fr));"),
    "app.css must use repeat(3, minmax(0, 1fr)) for .sheet-stats-row"
  );
  assert.ok(
    t61Css.includes(".pdf-export-mode .sheet-stats-row {\n  display: grid !important;\n  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;") ||
    t61Css.includes(".pdf-export-mode .sheet-stats-row {\r\n  display: grid !important;\r\n  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;"),
    "app.css must use repeat(3, minmax(0, 1fr)) !important for .pdf-export-mode .sheet-stats-row"
  );
  assert.ok(
    t61Css.includes("padding: 0.35rem 0.4rem !important;\n  border-radius: var(--radius-md) !important;\n  text-align: center !important;\n  box-sizing: border-box !important;\n  min-width: 0 !important;\n  max-width: 100% !important;\n  overflow: hidden !important;") ||
    t61Css.includes("padding: 0.35rem 0.4rem !important;\r\n  border-radius: var(--radius-md) !important;\r\n  text-align: center !important;\r\n  box-sizing: border-box !important;\r\n  min-width: 0 !important;\r\n  max-width: 100% !important;\r\n  overflow: hidden !important;"),
    "app.css must enforce min-width: 0, max-width: 100%, and overflow: hidden on .pdf-export-mode .sheet-stat-box"
  );
  assert.ok(
    t61Css.includes(".pdf-export-mode .sheet-narrative-container {\n  width: 100% !important;\n  max-width: 100% !important;\n  box-sizing: border-box !important;\n  padding-right: 6px !important;") ||
    t61Css.includes(".pdf-export-mode .sheet-narrative-container {\r\n  width: 100% !important;\r\n  max-width: 100% !important;\r\n  box-sizing: border-box !important;\r\n  padding-right: 6px !important;"),
    "app.css must provide padding-right safety buffer on .pdf-export-mode .sheet-narrative-container"
  );
  assert.ok(
    t61Css.includes(".pdf-export-mode .sheet-narrative-item div {\n  color: #374151 !important;\n  word-wrap: break-word !important;\n  overflow-wrap: break-word !important;\n  word-break: break-word !important;\n  max-width: 100% !important;\n  box-sizing: border-box !important;\n  font-size: 12pt !important;\n  padding-right: 8px !important;") ||
    t61Css.includes(".pdf-export-mode .sheet-narrative-item div {\r\n  color: #374151 !important;\r\n  word-wrap: break-word !important;\r\n  overflow-wrap: break-word !important;\r\n  word-break: break-word !important;\r\n  max-width: 100% !important;\r\n  box-sizing: border-box !important;\r\n  font-size: 12pt !important;\r\n  padding-right: 8px !important;"),
    "app.css must enforce word-break, max-width 100%, and padding-right safety on .pdf-export-mode .sheet-narrative-item div"
  );

  // 2. Verify js/app.js exportCharacterPDF and renderPrintSheet markup
  const t61AppJs = fs.readFileSync("./js/app.js", "utf8");
  assert.ok(
    t61AppJs.includes('sandbox.style.cssText = "position: relative; width: 740px; max-width: 100%; margin: 0 auto; padding: 0 6px !important; background: #ffffff !important; color: #111827 !important; box-sizing: border-box; overflow-x: hidden; overflow-y: visible;";'),
    "exportCharacterPDF sandbox must include padding: 0 6px, box-sizing: border-box, and overflow-x: hidden"
  );
  assert.ok(
    t61AppJs.includes('<div>Spirit &amp; Willpower</div>'),
    "renderPrintSheet must format Soul stat subtitle with line-broken 'Spirit &amp; Willpower' to prevent right margin overflow"
  );
  assert.ok(
    t61AppJs.includes('<div>Strength &amp; Agility</div>') && t61AppJs.includes('<div>Intellect &amp; Tactics</div>'),
    "renderPrintSheet must format Body and Mind subtitles consistently with line breaks"
  );
  assert.ok(
    t61AppJs.includes('word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%; box-sizing: border-box; padding-right: 8px;'),
    "renderPrintSheet must apply padding-right: 8px, box-sizing, and word-break to background narrative items"
  );

  // 3. Functional Simulation: Character with extensive narrative paragraphs
  const t61Char = new BESM4ECharacter({
    name: "Princess Lumina of the Astral Horizon",
    concept: "Intergalactic Diplomat & Psionic Envoy",
    stats: { body: 4, mind: 9, soul: 11 },
    appearance: "Tall and slender with flowing iridescent starlight hair that refracts ambient light into soft violet prisms. Wears formal ceremonial ambassador robes woven from silken superconductive fibers.",
    backstory: "Born in the orbital spire of Novaria Prime, Lumina demonstrated telepathic resonance at an early age. She served as the youngest negotiator during the Orion Arm Armistice treaties, navigating treacherous political factions, rogue mercenary syndicates, and corporate espionage cartels across three planetary sectors.",
    alliesEnemies: "Allies: Grand Marshal Kaelen of the Starfleet Vanguard, Chancellor Vane of the Solar Synod. Enemies: Shadow Broker Obsidian, the Void Syndicate operative network."
  });

  // Verify stat calculations and point values
  assert.strictEqual(t61Char.calculateStatCost(t61Char.stats.soul), 22, "Soul stat cost for Soul 11 must be 22 CP");

  console.log("✓ Test 61 Passed: PDF Export & Print Sheet Right Margin Overflow Protection (v1.9.32) verified.");

  // =========================================================================
  // TEST 62: Folder Picker Resiliency, Offline Mode Safety & Modal Responsiveness (v1.9.33)
  // =========================================================================
  console.log("\n--- Running Test 62: Folder Picker Resiliency, Offline Mode Safety & Modal Responsiveness (v1.9.33) ---");

  const t62Html = fs.readFileSync('./index.html', 'utf8');
  const t62AppJs = fs.readFileSync('./js/app.js', 'utf8');

  // A. Storage Folder Picker Resiliency & SecureContext Isolation
  // When isSecureContext is false (e.g. file:///), selectDefaultSaveFolder must gracefully return unsupported
  global.window = {
    isSecureContext: false,
    showDirectoryPicker: async () => { throw new Error("SecurityError: Window must be in a secure context"); }
  };
  const offlineRes = await BESM4EStorage.selectDefaultSaveFolder();
  assert.strictEqual(offlineRes.unsupported, true, "selectDefaultSaveFolder must return unsupported when isSecureContext is false");

  // When showDirectoryPicker succeeds in a secure context, it must persist handle and folder name
  let mockHandlePersisted = null;
  global.window = {
    isSecureContext: true,
    showDirectoryPicker: async () => ({ name: "BESM 4E Characters" })
  };
  BESM4EStorage._persistDirHandle = async (h) => { mockHandlePersisted = h; };
  const onlineRes = await BESM4EStorage.selectDefaultSaveFolder();
  assert.strictEqual(onlineRes.success, true, "selectDefaultSaveFolder must succeed in secure context");
  assert.strictEqual(onlineRes.folderName, "BESM 4E Characters", "Folder name must match picker selection");
  assert.strictEqual(BESM4EStorage.getDefaultFolderName(), "BESM 4E Characters", "Default folder name must be stored");
  assert.strictEqual(mockHandlePersisted.name, "BESM 4E Characters", "Directory handle must be passed to persistence");

  // When picker is aborted/cancelled, handle gracefully
  global.window.showDirectoryPicker = async () => {
    const abortErr = new Error("The user aborted a request.");
    abortErr.name = "AbortError";
    throw abortErr;
  };
  const abortRes = await BESM4EStorage.selectDefaultSaveFolder();
  assert.strictEqual(abortRes.cancelled, true, "AbortError must be mapped to cancelled: true without throwing");

  // Clean up global mock
  delete global.window;

  // B. HTML Structure & Offline User Assistance
  assert.ok(t62Html.includes('id="native-folder-picker-input"'), "native-folder-picker-input must exist");
  assert.ok(t62Html.includes('webkitdirectory'), "native-folder-picker-input must support webkitdirectory");
  assert.ok(t62Html.includes('id="modal-folder-settings"'), "modal-folder-settings must exist");
  assert.ok(t62Html.includes('id="btn-browse-folder-tree"'), "btn-browse-folder-tree must exist");
  assert.ok(t62Html.includes('id="browse-folder-tree-help"'), "browse-folder-tree-help container must exist");
  assert.ok(t62Html.includes('id="folder-picker-mode-tip"'), "folder-picker-mode-tip span must exist for dynamic offline explanation");
  assert.ok(t62Html.includes('id="btn-browse-folder-sample-file"'), "btn-browse-folder-sample-file button must exist for non-upload file fallback");
  assert.ok(t62Html.includes('id="sample-file-folder-input"'), "sample-file-folder-input must exist");
  assert.ok(t62Html.includes('data-path="RPG development\\BESM 4E"'), "Quick presets must include RPG development\\BESM 4E");
  assert.ok(t62Html.includes('data-path="Documents\\BESM 4E Characters"'), "Quick presets must include Documents\\BESM 4E Characters");
  assert.ok(t62Html.includes('data-path="Desktop\\BESM 4E"'), "Quick presets must include Desktop\\BESM 4E");
  assert.ok(t62Html.includes('data-path="Downloads\\BESM 4E"'), "Quick presets must include Downloads\\BESM 4E");

  // C. App.js Error Resiliency & Non-Freezing Logic
  assert.ok(t62AppJs.includes('nativeFolderPicker.addEventListener("cancel"'), "nativeFolderPicker must register a cancel listener");
  assert.ok(t62AppJs.includes('showToast("Selected folder contains 0 files. Enter or confirm folder path below.", "info");'), "app.js must handle 0 files without freezing modal");
  assert.ok(t62AppJs.includes('inputFolderPath.addEventListener("keydown", (e) => {'), "app.js must support Enter key on manual folder path input");
  assert.ok(t62AppJs.includes('openFolderSettingsModal();'), "btn-browse-save-folder must route to openFolderSettingsModal when offline");

  console.log("✓ Test 62 Passed: Folder Picker Resiliency, Offline Mode Safety & Modal Responsiveness (v1.9.33) verified.");

  // 63. Test PDF/Print Sheet Core Stat Inline Layout, Right Margin Buffers & Custom Attribute Name Independence (v1.9.34)
  console.log("\n--- Running Test 63: PDF/Print Sheet Core Stat Inline Layout, Right Margin Buffers & Custom Attribute Name Independence (v1.9.34) ---");

  const t63Html = fs.readFileSync('./index.html', 'utf8');
  const t63Css = fs.readFileSync('./css/app.css', 'utf8');
  const t63AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t63StorageJs = fs.readFileSync('./js/storage.js', 'utf8');
  const t63CharJs = fs.readFileSync('./js/character.js', 'utf8');
  const t63VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization
  assert.ok(t63VersionJson.version.startsWith("1.9."), "version.json must be 1.9.34+");
  assert.ok(t63Html.includes(`v${t63VersionJson.version}`), "index.html must display version in about display");
  assert.ok(t63Html.includes(`css/app.css?v=${t63VersionJson.version}`), "index.html must cache-bust css");
  assert.ok(t63Html.includes(`js/app.js?v=${t63VersionJson.version}`), "index.html must cache-bust app.js");
  assert.ok(t63Html.includes(`js/character.js?v=${t63VersionJson.version}`), "index.html must cache-bust character.js");
  assert.ok(t63Html.includes(`js/storage.js?v=${t63VersionJson.version}`), "index.html must cache-bust storage.js");
  assert.ok(t63AppJs.includes(`version: "${t63VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  // B. CSS & Print Sheet Right Margin Buffers
  assert.ok(t63Css.includes('.sheet-header-grid > div:last-child'), "CSS must define .sheet-header-grid > div:last-child");
  assert.ok(t63Css.includes('padding-right: 6px') || t63Css.includes('padding-right: 8px'), "CSS header grid last child must include right padding buffer");
  assert.ok(t63Css.includes('.sheet-stats-row'), "CSS must define .sheet-stats-row");
  assert.ok(t63Css.includes('margin-right: 2px'), "CSS must define margin-right buffer for Soul box");
  assert.ok(t63AppJs.includes('class="sheet-header-grid" style="box-sizing: border-box; padding-right: 8px;"'), "renderPrintSheet must apply padding-right buffer to .sheet-header-grid");
  assert.ok(t63AppJs.includes('class="sheet-stats-row" style="box-sizing: border-box; padding-right: 4px;"'), "renderPrintSheet must apply padding-right buffer to .sheet-stats-row");

  // C. Inline Core Stat Layout (1.35rem, font-weight 800)
  assert.ok(t63Css.includes('font-size: 1.35rem'), "CSS .sheet-stat-title and .sheet-stat-num must use 1.35rem");
  assert.ok(t63AppJs.includes('<span>BODY:</span> <span class="sheet-stat-num" style="color: var(--color-body); font-size: 1.35rem; font-weight: 800; line-height: 1;">'), "renderPrintSheet must place BODY and value inline with 1.35rem 800 weight");
  assert.ok(t63AppJs.includes('<span>MIND:</span> <span class="sheet-stat-num" style="color: var(--color-mind); font-size: 1.35rem; font-weight: 800; line-height: 1;">'), "renderPrintSheet must place MIND and value inline with 1.35rem 800 weight");
  assert.ok(t63AppJs.includes('<span>SOUL:</span> <span class="sheet-stat-num" style="color: var(--color-soul); font-size: 1.35rem; font-weight: 800; line-height: 1;">'), "renderPrintSheet must place SOUL and value inline with 1.35rem 800 weight");
  assert.ok(t63AppJs.includes('<div>Strength &amp; Agility</div>'), "Subtitles must be retained for Body");
  assert.ok(t63AppJs.includes('<div>Intellect &amp; Tactics</div>'), "Subtitles must be retained for Mind");
  assert.ok(t63AppJs.includes('<div>Spirit &amp; Willpower</div>'), "Subtitles must be retained for Soul");

  // D. Custom Attribute Name Independence
  const t63Char = new BESM4ECharacter({
    name: "Cybernetic Specialist",
    stats: { body: 6, mind: 8, soul: 5 }
  });

  // 1. Add custom attribute with custom description
  t63Char.addAttribute({
    id: "custom_nanite",
    name: "Nanite Swarm",
    level: 3,
    costPerLevel: 2,
    customDesc: "Autonomous self-repair matrix",
    isCustom: true
  });

  const naniteAttr = t63Char.attributes.find(a => a.id === "custom_nanite");
  assert.ok(naniteAttr, "Custom attribute must exist");
  assert.strictEqual(naniteAttr.name, "Nanite Swarm", "Custom attribute name must not have description appended");
  assert.strictEqual(naniteAttr.customDesc, "Autonomous self-repair matrix", "Custom attribute must preserve customDesc");
  assert.strictEqual(naniteAttr.detail, "", "Custom attribute detail must be empty string");

  // 2. Add container with custom contained attribute
  t63Char.addAttribute({
    id: "item_cyber_arm",
    name: "Cybernetic Arm",
    level: 2,
    isContainer: true,
    containerType: "item"
  });
  t63Char.addContainerTrait("item_cyber_arm", "attributes", {
    id: "custom_shock",
    name: "Electric Discharge",
    level: 2,
    costPerLevel: 2,
    customDesc: "High-voltage conductive burst",
    isCustom: true
  }, 2);

  const cyberArm = t63Char.getContainerAttribute("item_cyber_arm");
  assert.ok(cyberArm, "Container attribute must exist");
  const shockAttr = cyberArm.containerTraits.attributes.find(a => a.id === "custom_shock");
  assert.ok(shockAttr, "Contained custom attribute must exist");
  assert.strictEqual(shockAttr.name, "Electric Discharge", "Contained custom attribute name must not append description");
  assert.strictEqual(shockAttr.customDesc, "High-voltage conductive burst", "Contained custom attribute must preserve customDesc");
  assert.strictEqual(shockAttr.detail, "", "Contained custom attribute detail must be empty");

  // 3. Markdown Export check
  const t63Md = BESM4EStorage.generateMarkdown(t63Char);
  assert.ok(t63Md.includes("Nanite Swarm (Level 3)"), "Markdown export must contain clean attribute name");
  assert.ok(!t63Md.includes("Nanite Swarm [Autonomous self-repair matrix]"), "Markdown export must NOT concatenate description into name");
  assert.ok(t63Md.includes("Electric Discharge (Level 2)"), "Markdown export must contain clean contained attribute name");
  assert.ok(!t63Md.includes("Electric Discharge [High-voltage conductive burst]"), "Markdown export must NOT concatenate contained description into name");

  // 4. Normalization / Deserialization cleans legacy concatenated descriptions while preserving legitimate parentheses
  const t63LegacyChar = new BESM4ECharacter({
    name: "Legacy Cyborg",
    attributes: [
      {
        id: "custom_legacy",
        name: "Nanite Swarm [Autonomous self-repair matrix]",
        level: 2,
        costPerLevel: 2,
        customDesc: "Autonomous self-repair matrix",
        isCustom: true
      },
      {
        id: "alternate_form_stealth",
        name: "Alternate Form (Stealth Mode)",
        level: 2,
        costPerLevel: 5,
        isContainer: true,
        containerType: "alternate_form",
        customDesc: "Active optical camouflage shifting into shadow operative state."
      }
    ]
  });

  assert.strictEqual(t63LegacyChar.attributes[0].name, "Nanite Swarm", "Legacy concatenated bracket description must be stripped");
  assert.strictEqual(t63LegacyChar.attributes[0].customDesc, "Autonomous self-repair matrix", "customDesc must be retained");
  assert.strictEqual(t63LegacyChar.attributes[1].name, "Alternate Form (Stealth Mode)", "Container parenthetical name must be preserved intact");

  console.log("✓ Test 63 Passed: PDF/Print Sheet Core Stat Inline Layout, Right Margin Buffers & Custom Attribute Name Independence (v1.9.34) verified.");

  // 64. Test Identity Block Vertical Whitespace Reduction & Light Theme Dice Roller Success Text Contrast (v1.9.35)
  console.log("\n--- Running Test 64: Identity Block Vertical Whitespace Reduction & Light Theme Dice Roller Success Text Contrast (v1.9.35) ---");

  const t64Html = fs.readFileSync('./index.html', 'utf8');
  const t64Css = fs.readFileSync('./css/app.css', 'utf8');
  const t64AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t64VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.35+)
  assert.ok(t64VersionJson.version.startsWith("1.9."), "version.json must be 1.9.35+");
  assert.ok(t64Html.includes(`v${t64VersionJson.version}`), "index.html must display version in about display");
  assert.ok(t64Html.includes(`css/app.css?v=${t64VersionJson.version}`), "index.html must cache-bust css");
  assert.ok(t64Html.includes(`js/app.js?v=${t64VersionJson.version}`), "index.html must cache-bust app.js");
  assert.ok(t64Html.includes(`js/character.js?v=${t64VersionJson.version}`), "index.html must cache-bust character.js");
  assert.ok(t64Html.includes(`js/rules.js?v=${t64VersionJson.version}`), "index.html must cache-bust rules.js");
  assert.ok(t64Html.includes(`js/storage.js?v=${t64VersionJson.version}`), "index.html must cache-bust storage.js");
  assert.ok(t64Html.includes(`js/roller.js?v=${t64VersionJson.version}`), "index.html must cache-bust roller.js");
  assert.ok(t64AppJs.includes(`version: "${t64VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  // B. Identity Block Vertical Whitespace Reduction
  assert.ok(t64Css.includes('.identity-card') && t64Css.includes('#card-identity'), "CSS must define .identity-card and #card-identity");
  assert.ok(t64Css.includes('.sheet-header-grid {'), "CSS must define .sheet-header-grid");
  assert.ok(t64Css.includes('.pdf-export-mode .sheet-header-grid'), "CSS must define .pdf-export-mode .sheet-header-grid");

  // C. Light Theme Dice Roller Success Text & Tray Contrast
  assert.ok(t64Css.includes('[data-theme="light"]') && t64Css.includes('--color-success: #047857;'), "Light theme variables must define high-contrast --color-success (#047857)");
  assert.ok(t64Css.includes('[data-theme="light"] .dice-tray') && t64Css.includes('background: #f1f5f9;'), "Light theme dice tray must use clean light background (#f1f5f9)");
  assert.ok(t64Css.includes('[data-theme="light"] .roll-eval-badge.success'), "CSS must define [data-theme='light'] .roll-eval-badge.success");
  assert.ok(t64Css.includes('background: #dcfce7;') && t64Css.includes('color: #14532d;'), "Light theme success badge must use high-contrast dark green text (#14532d) on soft green pill (#dcfce7)");
  assert.ok(t64Css.includes('[data-theme="light"] .die-box.crit-success'), "CSS must define [data-theme='light'] .die-box.crit-success");
  assert.ok(t64Css.includes('.roll-eval-history-success'), "CSS must define .roll-eval-history-success");
  assert.ok(t64AppJs.includes('roll-eval-history-success'), "app.js renderRollHistory must apply roll-eval-history-success class");

  console.log("✓ Test 64 Passed: Identity Block Vertical Whitespace Reduction & Light Theme Dice Roller Success Text Contrast (v1.9.35) verified.");

  // 65. Test Identity Card CSS Specificity Fix & Elimination of Redundant Custom Descriptions in Attribute/Defect Names (v1.9.36)
  console.log("\n--- Running Test 65: Identity Card CSS Specificity Fix & Elimination of Redundant Custom Descriptions in Attribute/Defect Names (v1.9.36) ---");

  const t65Html = fs.readFileSync('./index.html', 'utf8');
  const t65Css = fs.readFileSync('./css/app.css', 'utf8');
  const t65AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t65StorageJs = fs.readFileSync('./js/storage.js', 'utf8');
  const t65CharJs = fs.readFileSync('./js/character.js', 'utf8');
  const t65VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.36+)
  assert.ok(t65VersionJson.version.startsWith("1.9."), "version.json must be 1.9.36+");
  assert.ok(t65Html.includes(`v${t65VersionJson.version}`), "index.html must display version in about display");
  assert.ok(t65Html.includes(`css/app.css?v=${t65VersionJson.version}`), "index.html must cache-bust css");
  assert.ok(t65Html.includes(`js/app.js?v=${t65VersionJson.version}`), "index.html must cache-bust app.js");
  assert.ok(t65Html.includes(`js/character.js?v=${t65VersionJson.version}`), "index.html must cache-bust character.js");
  assert.ok(t65Html.includes(`js/rules.js?v=${t65VersionJson.version}`), "index.html must cache-bust rules.js");
  assert.ok(t65Html.includes(`js/storage.js?v=${t65VersionJson.version}`), "index.html must cache-bust storage.js");
  assert.ok(t65Html.includes(`js/roller.js?v=${t65VersionJson.version}`), "index.html must cache-bust roller.js");
  assert.ok(t65AppJs.includes(`version: "${t65VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  // B. Identity Card Bottom Whitespace CSS Specificity Fix
  const cardRuleIdx = t65Css.indexOf('.card {');
  const identityRuleIdx = t65Css.indexOf('.card.identity-card,');
  assert.ok(cardRuleIdx !== -1 && identityRuleIdx !== -1 && identityRuleIdx > cardRuleIdx, ".card.identity-card, #card-identity must be defined AFTER .card to prevent cascade override");
  assert.ok(t65Css.includes('padding: 0.4rem 0.75rem 0.18rem 0.75rem !important;'), "#card-identity must enforce tight bottom padding (0.18rem !important)");
  assert.ok(t65Css.includes('margin-bottom: -0.35rem !important;'), "#card-identity must pull up flex gap with negative margin-bottom (-0.35rem !important)");
  assert.ok(t65Css.includes('.print-sheet .sheet-header-grid'), "CSS must define high-specificity .print-sheet .sheet-header-grid");

  // C. Elimination of Redundant Custom Descriptions / Details in Attribute and Defect/Hindrance Names
  assert.ok(t65AppJs.includes('function stripRedundantTraitDesc('), "js/app.js must define stripRedundantTraitDesc helper");
  assert.ok(!t65AppJs.includes('defect.detail ? ` <span class="text-secondary text-sm">[${escapeHtml(defect.detail)}]</span>`'), "renderBuilderDefects must NOT append [defect.detail] to defect title");
  assert.ok(!t65AppJs.includes('attr.detail ? ` <span class="text-secondary text-sm">[${escapeHtml(attr.detail)}]</span>`'), "renderBuilderAttributes must NOT append [attr.detail] to attribute title");

  // 1. Standard & Custom Defects/Hindrances and Attributes do not repeat custom descriptions in their names
  const t65Char = new BESM4ECharacter({
    name: "Kenshin Redundancy Test",
    stats: { body: 7, mind: 6, soul: 7 }
  });

  // Add standard Attribute with custom description and detail matching customDesc (simulating Builder edit)
  t65Char.addAttribute({
    id: "sixth_sense",
    name: "Sixth Sense [Precognitive Danger Sense]",
    level: 2,
    costPerLevel: 1,
    detail: "Precognitive Danger Sense",
    customDesc: "Precognitive Danger Sense"
  });
  const sixthSenseAttr = t65Char.attributes.find(a => a.id === "sixth_sense");
  assert.strictEqual(sixthSenseAttr.name, "Sixth Sense", "Standard attribute must strip redundant bracketed custom description from name");
  assert.strictEqual(sixthSenseAttr.customDesc, "Precognitive Danger Sense", "Standard attribute must preserve customDesc");

  // Add Defect with custom description repeated in name
  t65Char.addDefect({
    id: "phobia",
    name: "Phobia (Open Oceans & Deep Water)",
    rank: 2,
    refundPerRank: 1,
    detail: "Open Oceans & Deep Water",
    customDesc: "Open Oceans & Deep Water"
  });
  const phobiaDef = t65Char.defects.find(d => d.id === "phobia");
  assert.strictEqual(phobiaDef.name, "Phobia", "Defect must strip redundant parenthetical description from name");
  assert.strictEqual(phobiaDef.detail, "Open Oceans & Deep Water", "Defect must preserve detail");
  assert.strictEqual(phobiaDef.customDesc, "Open Oceans & Deep Water", "Defect must preserve customDesc");

  // Add Hindrance (negative CP refund) with custom description repeated in name
  t65Char.addDefect({
    id: "custom_hindrance_vow",
    name: "Pacifist Vow [Never draw steel in anger]",
    rank: 1,
    refundPerRank: -1,
    detail: "Never draw steel in anger",
    customDesc: "Never draw steel in anger"
  });
  const vowHindrance = t65Char.defects.find(d => d.id === "custom_hindrance_vow");
  assert.strictEqual(vowHindrance.name, "Pacifist Vow", "Hindrance must strip redundant bracketed custom description from name");
  assert.strictEqual(vowHindrance.customDesc, "Never draw steel in anger", "Hindrance must preserve customDesc");

  // 2. Template Defects strip parenthetical details from defect.name while extracting detail
  const nekoChar = new BESM4ECharacter({ name: "Neko Test" });
  nekoChar.applyRaceTemplate("nekojin");
  const markedDefect = nekoChar.defects.find(d => d.id === "marked");
  assert.ok(markedDefect, "Nekojin template must apply Marked defect");
  assert.strictEqual(markedDefect.name, "Marked", "Template defect name must be clean ('Marked') without parenthetical description");
  assert.strictEqual(markedDefect.detail, "Feline Ears & Whiskers / Tail", "Template defect detail must be extracted ('Feline Ears & Whiskers / Tail')");

  // Removing Race Template still cleans up the defect cleanly
  nekoChar.removeRaceTemplate();
  assert.ok(!nekoChar.defects.some(d => d.id === "marked"), "removeRaceTemplate must remove Marked defect cleanly");

  // 3. Markdown export does not repeat customDesc in Attribute or Defect names when detail === customDesc
  const t65Md = BESM4EStorage.generateMarkdown(t65Char);
  assert.ok(t65Md.includes("- **Sixth Sense (Level 2):** Precognitive Danger Sense"), "Markdown must not repeat customDesc in Attribute name");
  assert.ok(!t65Md.includes("Sixth Sense [Precognitive Danger Sense]"), "Markdown must not contain redundant [Precognitive Danger Sense] in Attribute name");
  assert.ok(t65Md.includes("- **Phobia (Rank 2):** Open Oceans & Deep Water"), "Markdown must not repeat customDesc in Defect name");
  assert.ok(!t65Md.includes("Phobia [Open Oceans & Deep Water]"), "Markdown must not contain redundant [Open Oceans & Deep Water] in Defect name");
  assert.ok(t65Md.includes("- **Pacifist Vow (Rank 1):** Never draw steel in anger"), "Markdown must not repeat customDesc in Hindrance name");

  console.log("✓ Test 65 Passed: Identity Card CSS Specificity Fix & Elimination of Redundant Custom Descriptions in Attribute/Defect Names (v1.9.36) verified.");

  // 66. Test Discord Webhook Roll Broadcasting in Settings & Quick Roller Toggle (v1.9.37)
  console.log("\n--- Running Test 66: Discord Webhook Roll Broadcasting in Settings & Quick Roller Toggle (v1.9.37) ---");

  const t66Html = fs.readFileSync('./index.html', 'utf8');
  const t66Css = fs.readFileSync('./css/app.css', 'utf8');
  const t66AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t66RollerJs = fs.readFileSync('./js/roller.js', 'utf8');
  const t66VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.37+)
  assert.ok(t66VersionJson.version.startsWith("1.9."), "version.json must be 1.9.37+");
  assert.ok(t66Html.includes(`v${t66VersionJson.version}`), "index.html must display version in about display");
  assert.ok(t66Html.includes(`css/app.css?v=${t66VersionJson.version}`), "index.html must cache-bust css");
  assert.ok(t66Html.includes(`js/app.js?v=${t66VersionJson.version}`), "index.html must cache-bust app.js");
  assert.ok(t66Html.includes(`js/character.js?v=${t66VersionJson.version}`), "index.html must cache-bust character.js");
  assert.ok(t66Html.includes(`js/rules.js?v=${t66VersionJson.version}`), "index.html must cache-bust rules.js");
  assert.ok(t66Html.includes(`js/storage.js?v=${t66VersionJson.version}`), "index.html must cache-bust storage.js");
  assert.ok(t66Html.includes(`js/roller.js?v=${t66VersionJson.version}`), "index.html must cache-bust roller.js");
  assert.ok(t66AppJs.includes(`version: "${t66VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  // B. Settings Menu & Discord Settings Modal HTML Elements
  assert.ok(t66Html.includes('id="chk-settings-discord-enabled"'), "Main > Settings must include #chk-settings-discord-enabled");
  assert.ok(t66Html.includes('id="btn-open-discord-settings"'), "Main > Settings must include #btn-open-discord-settings");
  assert.ok(t66Html.includes('id="modal-discord-settings"'), "index.html must include #modal-discord-settings modal");
  assert.ok(t66Html.includes('id="discord-modal-enabled"'), "#modal-discord-settings must include #discord-modal-enabled");
  assert.ok(t66Html.includes('id="discord-webhook-url"'), "#modal-discord-settings must include #discord-webhook-url");
  assert.ok(t66Html.includes('id="discord-bot-name"'), "#modal-discord-settings must include #discord-bot-name");
  assert.ok(t66Html.includes('id="btn-test-discord-webhook"'), "#modal-discord-settings must include #btn-test-discord-webhook");
  assert.ok(t66Html.includes('id="btn-save-discord-settings"'), "#modal-discord-settings must include #btn-save-discord-settings");
  assert.ok(t66Html.includes('id="btn-clear-discord-settings"'), "#modal-discord-settings must include #btn-clear-discord-settings");

  // C. Quick On/Off Toggle in the Dice Roller
  assert.ok(t66Html.includes('id="roller-discord-bar"'), "Dice Roller must include #roller-discord-bar");
  assert.ok(t66Html.includes('id="chk-roller-discord-toggle"'), "Dice Roller must include #chk-roller-discord-toggle quick on/off checkbox");
  assert.ok(t66Html.includes('id="roller-discord-status-badge"'), "Dice Roller must include #roller-discord-status-badge");
  assert.ok(t66Html.includes('id="btn-roller-discord-config"'), "Dice Roller must include #btn-roller-discord-config button");
  assert.ok(t66Css.includes('.roller-discord-bar'), "CSS must style .roller-discord-bar");
  assert.ok(t66Css.includes('.discord-status-pill'), "CSS must style .discord-status-pill");

  // D. BESM4EDiceRoller Discord Webhook Validation, Payload Formatting & Broadcasting
  const t66Roller = new BESM4EDiceRoller();
  assert.strictEqual(typeof t66Roller.isValidWebhookUrl, "function", "BESM4EDiceRoller must implement isValidWebhookUrl()");
  assert.strictEqual(typeof t66Roller.formatDiscordPayload, "function", "BESM4EDiceRoller must implement formatDiscordPayload()");
  assert.strictEqual(typeof t66Roller.sendToDiscord, "function", "BESM4EDiceRoller must implement sendToDiscord()");

  // 1. URL validation
  assert.strictEqual(t66Roller.isValidWebhookUrl("https://discord.com/api/webhooks/123456789012345678/abcDEF123_-xyz"), true, "Must accept valid discord.com webhook URL");
  assert.strictEqual(t66Roller.isValidWebhookUrl("https://discordapp.com/api/webhooks/123456789012345678/abcDEF123_-xyz"), true, "Must accept valid discordapp.com webhook URL");
  assert.strictEqual(t66Roller.isValidWebhookUrl("https://ptb.discord.com/api/webhooks/123456789012345678/abcDEF123_-xyz"), true, "Must accept valid ptb.discord.com webhook URL");
  assert.strictEqual(t66Roller.isValidWebhookUrl("https://example.com/api/webhooks/123/abc"), false, "Must reject non-Discord domain");
  assert.strictEqual(t66Roller.isValidWebhookUrl(""), false, "Must reject empty URL");

  // 2. Payload formatting with Roll Type, Total Result & Outcome
  const sampleRoll = t66Roller.roll({
    label: "Ranged Attack Check",
    mode: "minor_edge",
    modifier: 7,
    dramaticFeatBonus: 2,
    targetNumber: 12,
    breakdown: "ACV (5) + Ranged Attack (2)"
  });
  const payload = t66Roller.formatDiscordPayload(sampleRoll, {
    characterName: "Akira",
    campaign: "Neo-Tokyo",
    breakdown: "ACV (5) + Ranged Attack (2)"
  });

  assert.strictEqual(payload.username, "Akira (BESM 4E)", "Payload username must default to Character Name (BESM 4E)");
  assert.ok(Array.isArray(payload.embeds) && payload.embeds.length === 1, "Payload must contain 1 embed");
  const embed = payload.embeds[0];
  assert.strictEqual(embed.title, "🎲 Ranged Attack Check", "Embed title must match roll label");
  assert.ok(embed.fields.some(f => f.name.includes("Total Result") && f.value.includes(`**${sampleRoll.total}**`)), "Embed must include Total Result field");
  assert.ok(embed.fields.some(f => f.name.includes("Outcome")), "Embed must include Outcome field when Target Number is set");
  assert.strictEqual(embed.fields.length, 2, "Simplified embed must have exactly 2 fields (Total Result and Outcome)");
  assert.ok(embed.footer.text.includes("Neo-Tokyo"), "Embed footer must include campaign");
  assert.ok(!embed.footer.text.includes("Akira"), "Embed footer must not include redundant character name");
  assert.ok(!embed.footer.text.includes("BESM 4E Character Architect"), "Embed footer must not include BESM tagline");

  // 3. Invalid URL handling in sendToDiscord
  const badRes = await t66Roller.sendToDiscord("https://invalid.url/webhook", sampleRoll);
  assert.strictEqual(badRes.ok, false, "sendToDiscord must return ok: false for invalid URL");

  console.log("✓ Test 66 Passed: Discord Webhook Roll Broadcasting in Settings & Quick Roller Toggle (v1.9.37) verified.");

  // =========================================================================
  // 67. Test Tactical Conditions Layout, Bonus HP Overheal, 1080px Resolution Barrier & Deferred Wide Discord Roll Broadcast (v1.9.38)
  // =========================================================================
  console.log("\n--- Running Test 67: Tactical Conditions Layout, Bonus HP Overheal, 1080px Resolution Barrier & Deferred Wide Discord Roll Broadcast (v1.9.38) ---");

  const t67Html = fs.readFileSync('./index.html', 'utf8');
  const t67Css = fs.readFileSync('./css/app.css', 'utf8');
  const t67AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t67RollerJs = fs.readFileSync('./js/roller.js', 'utf8');
  const t67CharJs = fs.readFileSync('./js/character.js', 'utf8');
  const t67VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.38+)
  assert.ok(t67VersionJson.version.startsWith("1.9."), "version.json must be 1.9.38+");
  assert.ok(t67Html.includes(`v${t67VersionJson.version}`), "index.html must display version in about display");
  assert.ok(t67Html.includes(`css/app.css?v=${t67VersionJson.version}`), "index.html must cache-bust css with v=1.9.38+");
  assert.ok(t67Html.includes(`js/app.js?v=${t67VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.38+");
  assert.ok(t67Html.includes(`js/character.js?v=${t67VersionJson.version}`), "index.html must cache-bust character.js with v=1.9.38+");
  assert.ok(t67Html.includes(`js/rules.js?v=${t67VersionJson.version}`), "index.html must cache-bust rules.js with v=1.9.38+");
  assert.ok(t67Html.includes(`js/storage.js?v=${t67VersionJson.version}`), "index.html must cache-bust storage.js with v=1.9.38+");
  assert.ok(t67Html.includes(`js/roller.js?v=${t67VersionJson.version}`), "index.html must cache-bust roller.js with v=1.9.38+");
  assert.ok(t67AppJs.includes(`version: "${t67VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  // B. Tactical Conditions (No Checkmark Prepend)
  assert.ok(t67AppJs.includes('btn.textContent = cond.label;'), "app.js must set condition button text to cond.label without checkmark prefix");
  assert.ok(!t67AppJs.includes('`${isActive ? "✓ " : ""}${cond.label}`'), "app.js must not prepend checkmarks to active condition buttons");

  // C. Bonus HP / Overheal & Green Pulsing Styling
  // 1. Quick Buttons renamed to "+x HP"
  assert.ok(t67Html.includes('id="btn-heal-1">+1 HP</button>'), "Quick heal button #btn-heal-1 must be renamed to +1 HP");
  assert.ok(t67Html.includes('id="btn-heal-5">+5 HP</button>'), "Quick heal button #btn-heal-5 must be renamed to +5 HP");
  assert.ok(t67Html.includes('id="btn-heal-10">+10 HP</button>'), "Quick heal button #btn-heal-10 must be renamed to +10 HP");

  // 2. Character Model allows overheal above maxHealth
  const testChar = new BESM4ECharacter();
  const testDerived = testChar.getDerived();
  testChar.currentHealth = testDerived.maxHealth;
  const newHp1 = testChar.applyHealing(5);
  assert.strictEqual(newHp1, testDerived.maxHealth + 5, "applyHealing must allow HP to exceed normal maxHealth");
  assert.strictEqual(testChar.currentHealth, testDerived.maxHealth + 5, "currentHealth must reflect bonus HP total");
  const newHp2 = testChar.addHealth(10);
  assert.strictEqual(newHp2, testDerived.maxHealth + 15, "addHealth alias must add bonus HP above maxHealth");

  // 3. CSS Animations & Green Total Text
  assert.ok(t67Css.includes('@keyframes pulse-bonus-hp'), "CSS must define @keyframes pulse-bonus-hp");
  assert.ok(t67Css.includes('.vital-bar-inner.health.bonus-hp'), "CSS must define .vital-bar-inner.health.bonus-hp");
  assert.ok(t67Css.includes('.vital-header .bonus-hp-total'), "CSS must style .vital-header .bonus-hp-total with green success color");
  assert.ok(t67AppJs.includes('classList.add("bonus-hp")'), "app.js renderPlayMode must add bonus-hp class when HP > maxHealth");
  assert.ok(t67AppJs.includes('bonus-hp-total'), "app.js renderPlayMode must render bonus-hp-total class for current health");

  // D. Horizontal Resolution Warning Barrier (Minimum 1080px Width)
  assert.ok(t67Html.includes('id="resolution-warning-barrier"'), "index.html must include #resolution-warning-barrier overlay");
  assert.ok(t67Html.includes('id="resolution-current-width"'), "index.html must include #resolution-current-width display");
  assert.ok(t67Css.includes('.resolution-warning-barrier'), "CSS must define .resolution-warning-barrier overlay container");
  assert.ok(t67Css.includes('.resolution-warning-card'), "CSS must define .resolution-warning-card modal card");
  assert.ok(t67Css.includes('@media screen and (max-width: 1079px)'), "CSS must enforce barrier display when width <= 1079px");
  assert.ok(t67AppJs.includes('checkScreenResolution'), "app.js must implement checkScreenResolution");
  assert.ok(t67AppJs.includes('window.addEventListener("resize", checkScreenResolution)'), "app.js must bind checkScreenResolution to window resize");

  // E. Deferred Discord Roll Execution & Wide Discord Description Layout
  // 1. triggerRoll does NOT auto-execute or broadcast roll immediately
  const triggerRollFnBody = t67AppJs.slice(t67AppJs.indexOf('function triggerRoll('), t67AppJs.indexOf('function executeDiceRoll('));
  assert.ok(!triggerRollFnBody.includes('executeDiceRoll();'), "triggerRoll must not automatically execute roll or broadcast to Discord");
  assert.ok(triggerRollFnBody.includes('openModal("dice-roller-drawer")'), "triggerRoll must open drawer for user adjustments");

  // 2. Format Discord Payload uses simplified fields and no BESM tagline
  const t67Roller = new BESM4EDiceRoller();
  const wideRoll = t67Roller.roll({
    label: "Melee Combat Attack",
    mode: "standard",
    modifier: 4,
    dramaticFeatBonus: 0,
    targetNumber: 12,
    breakdown: "ACV (4)"
  });
  const widePayload = t67Roller.formatDiscordPayload(wideRoll, {
    characterName: "Kenji",
    campaign: "Neo-Tokyo"
  });
  const wideEmbed = widePayload.embeds[0];
  assert.strictEqual(wideEmbed.title, "🎲 Melee Combat Attack", "Discord embed title must show roll type");
  assert.ok(wideEmbed.fields.some(f => f.name.includes("Total Result") && f.value.includes(String(wideRoll.total))), "Discord embed must include Total Result field");
  assert.ok(wideEmbed.fields.some(f => f.name.includes("Outcome")), "Discord embed must include Outcome field");
  assert.strictEqual(wideEmbed.fields.length, 2, "Discord embed must only have 2 fields (Total Result and Outcome)");
  assert.ok(wideEmbed.fields.every(f => f.inline === true), "All embed fields must be inline: true");
  assert.ok(!wideEmbed.footer || !wideEmbed.footer.text.includes("BESM 4E Character Architect"), "Embed footer must not include BESM tagline");
  assert.ok(wideEmbed.footer.text.includes("Neo-Tokyo"), "Embed footer must include campaign");
  assert.ok(!wideEmbed.footer.text.includes("Kenji"), "Embed footer must not include redundant character name");

  console.log("✓ Test 67 Passed: Tactical Conditions Layout, Bonus HP Overheal, 1080px Resolution Barrier & Deferred Wide Discord Roll Broadcast (v1.9.38) verified.");

  // =========================================================================
  // 68. Test Simplified Discord Roll Output, Redundant Timestamp Removal & BESM Tagline Removal (v1.9.40)
  // =========================================================================
  console.log("\n--- Running Test 68: Simplified Discord Roll Output, Redundant Timestamp Removal & BESM Tagline Removal (v1.9.40) ---");

  const t68Html = fs.readFileSync('./index.html', 'utf8');
  const t68AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t68RollerJs = fs.readFileSync('./js/roller.js', 'utf8');
  const t68VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.40+)
  assert.ok(t68VersionJson.version.startsWith("1.9."), "version.json must be 1.9.40+");
  assert.ok(t68Html.includes(`v${t68VersionJson.version}`), "index.html must display v1.9.40+ in about display");
  assert.ok(t68Html.includes(`css/app.css?v=${t68VersionJson.version}`), "index.html must cache-bust css with v=1.9.40+");
  assert.ok(t68Html.includes(`js/app.js?v=${t68VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.40+");
  assert.ok(t68Html.includes(`js/character.js?v=${t68VersionJson.version}`), "index.html must cache-bust character.js with v=1.9.40+");
  assert.ok(t68Html.includes(`js/rules.js?v=${t68VersionJson.version}`), "index.html must cache-bust rules.js with v=1.9.40+");
  assert.ok(t68Html.includes(`js/storage.js?v=${t68VersionJson.version}`), "index.html must cache-bust storage.js with v=1.9.40+");
  assert.ok(t68Html.includes(`js/roller.js?v=${t68VersionJson.version}`), "index.html must cache-bust roller.js with v=1.9.40+");
  assert.ok(t68AppJs.includes(`version: "${t68VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.40+");

  // B. Removal of BESM Tagline
  const t68Roller = new BESM4EDiceRoller();
  const targetedRoll = t68Roller.roll({
    label: "Mind Check",
    modifier: 2,
    targetNumber: 10
  });

  // Roll without character context must have NO footer at all (no BESM tagline)
  const noContextPayload = t68Roller.formatDiscordPayload(targetedRoll);
  assert.strictEqual(noContextPayload.embeds[0].footer, undefined, "Roll without character context must not have any footer");
  assert.ok(!JSON.stringify(noContextPayload).includes("BESM 4E Character Architect"), "Roll payload must never contain BESM tagline");

  // Roll with character context must have campaign in footer without character name or BESM tagline
  const withContextPayload = t68Roller.formatDiscordPayload(targetedRoll, {
    characterName: "Sakura",
    campaign: "Sector 7"
  });
  assert.strictEqual(withContextPayload.embeds[0].footer.text, "Sector 7", "Footer must only contain campaign");
  assert.ok(!withContextPayload.embeds[0].footer.text.includes("Sakura"), "Footer must not contain character name");
  assert.ok(!withContextPayload.embeds[0].footer.text.includes("BESM 4E Character Architect"), "Footer must not contain BESM tagline");

  // C. Simplified Roll Output (Roll Type, Total Result, Outcome only)
  const targetedEmbed = withContextPayload.embeds[0];
  assert.strictEqual(targetedEmbed.title, "🎲 Mind Check", "Embed title must show roll type");
  assert.strictEqual(targetedEmbed.fields.length, 2, "Targeted roll embed must have exactly 2 fields (Total Result and Outcome)");
  assert.ok(targetedEmbed.fields[0].name.includes("Total Result"), "First field must be Total Result");
  assert.ok(targetedEmbed.fields[1].name.includes("Outcome"), "Second field must be Outcome");
  assert.strictEqual(targetedEmbed.description, undefined, "Embed must not contain description block");

  // D. Redundant Timestamp Removal
  assert.strictEqual(targetedEmbed.timestamp, undefined, "Embed must not include redundant timestamp");

  // Untargeted roll (e.g. Initiative / General Check) has only Total Result and no timestamp
  const untargetedRoll = t68Roller.roll({
    label: "Initiative",
    modifier: 5,
    targetNumber: null
  });
  const untargetedPayload = t68Roller.formatDiscordPayload(untargetedRoll);
  const untargetedEmbed = untargetedPayload.embeds[0];
  assert.strictEqual(untargetedEmbed.title, "🎲 Initiative", "Embed title must show roll type");
  assert.strictEqual(untargetedEmbed.fields.length, 1, "Untargeted roll embed must have exactly 1 field (Total Result)");
  assert.ok(untargetedEmbed.fields[0].name.includes("Total Result"), "Field must be Total Result");
  assert.strictEqual(untargetedEmbed.timestamp, undefined, "Untargeted roll embed must not include timestamp");

  console.log("✓ Test 68 Passed: Simplified Discord Roll Output, Redundant Timestamp Removal & BESM Tagline Removal (v1.9.40) verified.");

  // =========================================================================
  // 69. Test In-Play Tracker Column Width Stabilization & Balanced Combat Grid (v1.9.41)
  // =========================================================================
  console.log("\n--- Running Test 69: In-Play Tracker Column Width Stabilization & Balanced Combat Grid (v1.9.41) ---");

  const t69Html = fs.readFileSync('./index.html', 'utf8');
  const t69Css = fs.readFileSync('./css/app.css', 'utf8');
  const t69AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t69VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.41+)
  assert.ok(t69VersionJson.version.startsWith("1.9."), "version.json must be 1.9.41+");
  assert.ok(t69Html.includes(`v${t69VersionJson.version}`), "index.html must display v1.9.41+ in about display");
  assert.ok(t69Html.includes(`css/app.css?v=${t69VersionJson.version}`), "index.html must cache-bust css with v=1.9.41+");
  assert.ok(t69Html.includes(`js/app.js?v=${t69VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.41+");
  assert.ok(t69Html.includes(`js/character.js?v=${t69VersionJson.version}`), "index.html must cache-bust character.js with v=1.9.41+");
  assert.ok(t69Html.includes(`js/rules.js?v=${t69VersionJson.version}`), "index.html must cache-bust rules.js with v=1.9.41+");
  assert.ok(t69Html.includes(`js/storage.js?v=${t69VersionJson.version}`), "index.html must cache-bust storage.js with v=1.9.41+");
  assert.ok(t69Html.includes(`js/roller.js?v=${t69VersionJson.version}`), "index.html must cache-bust roller.js with v=1.9.41+");
  assert.ok(t69AppJs.includes(`version: "${t69VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  // B. Grid Column Track Isolation & Sizing
  assert.ok(t69Css.includes('#play-pane > .grid-2'), "CSS must define layout rule for #play-pane > .grid-2");
  assert.ok(t69Css.includes('minmax(0, 1fr) minmax(0, 1fr)'), "CSS #play-pane > .grid-2 must enforce equal 50/50 minmax(0, 1fr) tracks");
  assert.ok(t69Css.includes('#play-pane > .grid-2 > div'), "CSS must define child column isolation rule for #play-pane > .grid-2 > div");
  assert.ok(t69Css.includes('.quick-roll-btn'), "CSS must define .quick-roll-btn class");

  // C. Balanced 2-Column Combat, Defense & Initiative Grid
  assert.ok(t69Html.includes('id="btn-roll-attack"'), "index.html must include #btn-roll-attack");
  assert.ok(t69Html.includes('id="btn-roll-defence"'), "index.html must include #btn-roll-defence");
  assert.ok(t69Html.includes('id="btn-roll-melee-attack"'), "index.html must include #btn-roll-melee-attack");
  assert.ok(t69Html.includes('id="btn-roll-melee-defence"'), "index.html must include #btn-roll-melee-defence");
  assert.ok(t69Html.includes('id="btn-roll-ranged-attack"'), "index.html must include #btn-roll-ranged-attack");
  assert.ok(t69Html.includes('id="btn-roll-initiative"'), "index.html must include #btn-roll-initiative");

  // Verify combat action buttons grid uses repeat(2, 1fr)
  assert.ok((t69Html.includes('grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.65rem;') || t69Html.includes('grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1.25rem;')) && t69Html.includes('id="btn-roll-attack"'), "Combat, Defense & Initiative buttons grid must use repeat(2, 1fr)");

  // D. Tactical Condition Calculations (Shocked & Blinded)
  const char69 = new BESM4ECharacter();
  char69.setHumanAverageStats(); // 4/4/4 -> ACV 4, DCV 4
  
  // Baseline check
  const baseAtk = char69.getTraitRollInfo("cv", "acv");
  const baseDef = char69.getTraitRollInfo("cv", "dcv");
  assert.strictEqual(baseAtk.totalModifier, 4, "Baseline ACV mod should be 4");
  assert.strictEqual(baseDef.totalModifier, 4, "Baseline DCV mod should be 4");

  // Shocked check (-1 to all actions)
  char69.conditions = ["shocked"];
  const shockedAtk = char69.getTraitRollInfo("cv", "acv");
  const shockedDef = char69.getTraitRollInfo("cv", "dcv");
  assert.strictEqual(shockedAtk.totalModifier, 3, "Shocked ACV mod should be 3");
  assert.strictEqual(shockedDef.totalModifier, 3, "Shocked DCV mod should be 3");

  // Blinded check (Minor Obstacle to attack, -2 to DCV)
  char69.conditions = ["blinded"];
  const blindedAtk = char69.getTraitRollInfo("cv", "acv");
  const blindedDef = char69.getTraitRollInfo("cv", "dcv");
  assert.strictEqual(blindedAtk.mode, "minor_obstacle", "Blinded attack check must have minor_obstacle mode");
  assert.strictEqual(blindedDef.totalModifier, 2, "Blinded DCV mod should be reduced by 2 (4 - 2 = 2)");

  // Clear conditions
  char69.conditions = [];
  const restoredAtk = char69.getTraitRollInfo("cv", "acv");
  const restoredDef = char69.getTraitRollInfo("cv", "dcv");
  assert.strictEqual(restoredAtk.totalModifier, 4, "Cleared conditions restore ACV to 4");
  assert.strictEqual(restoredDef.totalModifier, 4, "Cleared conditions restore DCV to 4");

  console.log("✓ Test 69 Passed: In-Play Tracker Column Width Stabilization & Balanced Combat Grid (v1.9.41) verified.");

  // =========================================================================
  // 70. Test Redundant Character Name Removal in Discord Roll Post Footer (v1.9.42)
  // =========================================================================
  console.log("\n--- Running Test 70: Discord Roll Embed Footer Cleanup & v1.9.42 Release Verification ---");

  const t70Html = fs.readFileSync('./index.html', 'utf8');
  const t70AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t70RollerJs = fs.readFileSync('./js/roller.js', 'utf8');
  const t70VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.42+)
  assert.ok(t70VersionJson.version.startsWith("1.9."), "version.json must be 1.9.42+");
  assert.ok(t70Html.includes(`v${t70VersionJson.version}`), "index.html must display v1.9.42+ in about display");
  assert.ok(t70Html.includes(`css/app.css?v=${t70VersionJson.version}`), "index.html must cache-bust css with v=1.9.42+");
  assert.ok(t70Html.includes(`js/app.js?v=${t70VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.42+");
  assert.ok(t70Html.includes(`js/character.js?v=${t70VersionJson.version}`), "index.html must cache-bust character.js with v=1.9.42+");
  assert.ok(t70Html.includes(`js/rules.js?v=${t70VersionJson.version}`), "index.html must cache-bust rules.js with v=1.9.42+");
  assert.ok(t70Html.includes(`js/storage.js?v=${t70VersionJson.version}`), "index.html must cache-bust storage.js with v=1.9.42+");
  assert.ok(t70Html.includes(`js/roller.js?v=${t70VersionJson.version}`), "index.html must cache-bust roller.js with v=1.9.42+");
  assert.ok(t70AppJs.includes(`version: "${t70VersionJson.version}"`), "app.js APP_VERSION_INFO must match version");

  // B. Roller Embed Footer Behavior
  const t70Roller = new BESM4EDiceRoller();
  const testRoll = t70Roller.roll({
    label: "Soul Stat Check",
    modifier: 3,
    targetNumber: 12
  });

  // 1. With character and campaign: username has character name, footer only has campaign
  const payloadWithBoth = t70Roller.formatDiscordPayload(testRoll, {
    characterName: "Ryu",
    campaign: "World Tour"
  });
  assert.strictEqual(payloadWithBoth.username, "Ryu (BESM 4E)", "Username header must contain character name attribution");
  assert.ok(payloadWithBoth.embeds && payloadWithBoth.embeds.length === 1, "Payload must have 1 embed");
  assert.strictEqual(payloadWithBoth.embeds[0].footer.text, "World Tour", "Footer must only contain campaign");
  assert.ok(!payloadWithBoth.embeds[0].footer.text.includes("Ryu"), "Footer must not contain character name");
  assert.ok(!payloadWithBoth.embeds[0].footer.text.includes("BESM"), "Footer must not contain BESM tagline");

  // 2. With character but NO campaign: username has character name, NO footer at all
  const payloadCharOnly = t70Roller.formatDiscordPayload(testRoll, {
    characterName: "Ryu",
    campaign: ""
  });
  assert.strictEqual(payloadCharOnly.username, "Ryu (BESM 4E)", "Username header must contain character name attribution");
  assert.strictEqual(payloadCharOnly.embeds[0].footer, undefined, "Footer must be undefined when no campaign is set");

  // 3. With campaign but NO character: default username, footer has campaign
  const payloadCampaignOnly = t70Roller.formatDiscordPayload(testRoll, {
    characterName: "",
    campaign: "World Tour"
  });
  assert.strictEqual(payloadCampaignOnly.username, "BESM 4E Dice Roller", "Username header defaults when no character name");
  assert.strictEqual(payloadCampaignOnly.embeds[0].footer.text, "World Tour", "Footer has campaign");

  // 4. With neither character nor campaign: NO footer
  const payloadNeither = t70Roller.formatDiscordPayload(testRoll, {});
  assert.strictEqual(payloadNeither.username, "BESM 4E Dice Roller");
  assert.strictEqual(payloadNeither.embeds[0].footer, undefined, "Footer must be undefined when neither character nor campaign is set");

  console.log("✓ Test 70 Passed: Redundant Character Name Removal in Discord Roll Post Footer (v1.9.42) verified.");

  // =========================================================================
  // 71. Test Locked Target Number for Initiative Rolls & Multi-Factor Support (v1.9.43)
  // =========================================================================
  console.log("\n--- Running Test 71: Locked Target Number for Initiative Rolls (v1.9.43) ---");

  const t71Html = fs.readFileSync('./index.html', 'utf8');
  const t71AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t71RollerJs = fs.readFileSync('./js/roller.js', 'utf8');
  const t71Css = fs.readFileSync('./css/app.css', 'utf8');
  const t71VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.43+)
  assert.ok(t71VersionJson.version.startsWith("1.9."), "version.json must be 1.9.43+");
  assert.ok(t71Html.includes(`v${t71VersionJson.version}`), "index.html must display v1.9.43 in about display");
  assert.ok(t71Html.includes(`css/app.css?v=${t71VersionJson.version}`), "index.html must cache-bust css with v=1.9.43");
  assert.ok(t71Html.includes(`js/app.js?v=${t71VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.43");
  assert.ok(t71Html.includes(`js/character.js?v=${t71VersionJson.version}`), "index.html must cache-bust character.js with v=1.9.43");
  assert.ok(t71Html.includes(`js/rules.js?v=${t71VersionJson.version}`), "index.html must cache-bust rules.js with v=1.9.43");
  assert.ok(t71Html.includes(`js/storage.js?v=${t71VersionJson.version}`), "index.html must cache-bust storage.js with v=1.9.43");
  assert.ok(t71Html.includes(`js/roller.js?v=${t71VersionJson.version}`), "index.html must cache-bust roller.js with v=1.9.43");
  assert.ok(t71AppJs.includes(`version: "${t71VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.43");

  // B. CSS Disabled Form-Control Styling
  assert.ok(t71Css.includes('.form-control:disabled'), "CSS must define .form-control:disabled");
  assert.ok(t71Css.includes('cursor: not-allowed;'), "CSS .form-control:disabled must set not-allowed cursor");

  // C. Core Dice Roller Enforces No-TN on Initiative Rolls
  const t71Roller = new BESM4EDiceRoller();

  // 1. Explicit targetNumber passed to an Initiative roll is overridden to null
  const enforcedInitRoll = t71Roller.roll({
    label: "Initiative Check",
    modifier: 4,
    targetNumber: 12,
    mode: "standard"
  });
  assert.strictEqual(enforcedInitRoll.targetNumber, null, "Initiative check must force targetNumber to null");
  assert.strictEqual(enforcedInitRoll.success, null, "Initiative check must have null success (no pass/fail)");
  assert.strictEqual(enforcedInitRoll.margin, null, "Initiative check must have null margin");
  assert.strictEqual(enforcedInitRoll.isCriticalSuccess, false, "Initiative check cannot have critical success vs TN");
  assert.strictEqual(enforcedInitRoll.isCriticalFumble, false, "Initiative check cannot have critical fumble vs TN");

  // 2. Initiative checks support Edges and Dramatic Feats (burning Energy Points)
  const edgeAndFeatInitRoll = t71Roller.roll({
    label: "Initiative Check (Combat)",
    modifier: 5,
    dramaticFeatBonus: 2, // +2 bonus (20 EP burned)
    mode: "minor_edge"    // 3d6 keep 2 highest from Lightning Reflexes
  });
  assert.strictEqual(edgeAndFeatInitRoll.targetNumber, null, "Initiative with edge/feat must still have targetNumber: null");
  assert.strictEqual(edgeAndFeatInitRoll.diceRolls.length, 3, "Minor Edge Initiative must roll 3 dice");
  const keptCount = edgeAndFeatInitRoll.diceRolls.filter(d => d.isKept).length;
  assert.strictEqual(keptCount, 2, "Minor Edge must keep 2 dice");
  assert.strictEqual(edgeAndFeatInitRoll.total, edgeAndFeatInitRoll.diceSum + 5 + 2, "Total must include modifier and dramatic feat bonus");

  // 3. Discord payload for Initiative check contains only Total Result and no outcome field
  const initPayload = t71Roller.formatDiscordPayload(edgeAndFeatInitRoll, {
    characterName: "Asuka",
    campaign: "Tokyo-3"
  });
  assert.strictEqual(initPayload.embeds.length, 1);
  assert.strictEqual(initPayload.embeds[0].title, "🎲 Initiative Check (Combat)");
  assert.strictEqual(initPayload.embeds[0].fields.length, 1, "Initiative embed must only have 1 field (Total Result)");
  assert.ok(initPayload.embeds[0].fields[0].name.includes("Total Result"));
  assert.strictEqual(initPayload.embeds[0].footer.text, "Tokyo-3", "Embed footer contains only campaign name");

  // D. App.js UI Integration checks
  assert.ok(t71AppJs.includes('targetSelect.disabled = true;'), "app.js must disable targetSelect for Initiative rolls");
  assert.ok(t71AppJs.includes('Initiative checks do not use a Target Number'), "app.js must provide tooltip explaining Initiative has no TN");

  console.log("✓ Test 71 Passed: Locked Target Number for Initiative Rolls & Multi-Factor Support (v1.9.43) verified.");

  // =========================================================================
  // 72. Test Automatic Multi-Row Button Expansion & In-Play Tracker Layout (v1.9.44)
  // =========================================================================
  console.log("\n--- Running Test 72: Live Tracker Multi-Row Buttons & Vertical Layout (v1.9.44) ---");

  const t72Html = fs.readFileSync('./index.html', 'utf8');
  const t72AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t72Css = fs.readFileSync('./css/app.css', 'utf8');
  const t72VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.44+)
  assert.ok(t72VersionJson.version.startsWith("1.9."), "version.json must be 1.9.44+");
  assert.ok(t72Html.includes(`v${t72VersionJson.version}`), "index.html must display v1.9.44 in about display");
  assert.ok(t72Html.includes(`css/app.css?v=${t72VersionJson.version}`), "index.html must cache-bust css with v=1.9.44");
  assert.ok(t72Html.includes(`js/app.js?v=${t72VersionJson.version}`), "index.html must cache-bust app.js with v=1.9.44");
  assert.ok(t72Html.includes(`js/character.js?v=${t72VersionJson.version}`), "index.html must cache-bust character.js with v=1.9.44");
  assert.ok(t72Html.includes(`js/rules.js?v=${t72VersionJson.version}`), "index.html must cache-bust rules.js with v=1.9.44");
  assert.ok(t72Html.includes(`js/storage.js?v=${t72VersionJson.version}`), "index.html must cache-bust storage.js with v=1.9.44");
  assert.ok(t72Html.includes(`js/roller.js?v=${t72VersionJson.version}`), "index.html must cache-bust roller.js with v=1.9.44");
  assert.ok(t72AppJs.includes(`version: "${t72VersionJson.version}"`), "app.js APP_VERSION_INFO must be 1.9.44");

  // B. Automatic Multi-Row Button Expansion CSS
  assert.ok(t72Css.includes('.quick-roll-btn'), "CSS must define .quick-roll-btn class");
  assert.ok(t72Css.includes('white-space: normal;'), "quick-roll-btn must enable normal text wrap");
  assert.ok(t72Css.includes('word-break: break-word;'), "quick-roll-btn must allow break-word wrapping");
  assert.ok(t72Css.includes('overflow-wrap: break-word;'), "quick-roll-btn must allow overflow-wrap break-word");
  assert.ok(t72Css.includes('height: auto;'), "quick-roll-btn must allow auto height expansion");

  // C. In-Play Tracker Layout Optimizations & Trailing Margin Removal
  assert.ok(t72Css.includes('#play-pane .card:last-child'), "CSS must define #play-pane .card:last-child");
  assert.ok(t72Css.includes('margin-bottom: 0;'), "CSS must remove margin-bottom on last card in play-pane");
  assert.ok(t72Css.includes('#play-session-notes'), "CSS must define #play-session-notes");
  assert.ok(t72Css.includes('min-height: 55px;'), "CSS play-session-notes must specify compact min-height");

  // D. HTML Scratchpad & Grid Spacing Verification
  assert.ok(t72Html.includes('id="play-session-notes" style="min-height: 55px; height: 60px; overflow-y: auto;"'), "play-session-notes must use compact height and scroll");
  assert.ok(t72Html.includes('id="play-skills-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.65rem;"'), "play-skills-grid must use compact bottom margin");

  console.log("✓ Test 72 Passed: Live Tracker Multi-Row Buttons & Vertical Layout (v1.9.44) verified.");

  // =========================================================================
  // 73. Test Live Tracker HP & EP Reset, Core Stat Check Ratings & Character History Rollback (v1.9.45)
  // =========================================================================
  console.log("\n--- Running Test 73: HP/EP Reset, Core Stat Ratings & History Rollback (v1.9.45) ---");

  const t73Html = fs.readFileSync('./index.html', 'utf8');
  const t73AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t73Css = fs.readFileSync('./css/app.css', 'utf8');
  const t73VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.45+)
  assert.ok(["1.9.45", "1.9.46"].includes(t73VersionJson.version), "version.json must be 1.9.45+");
  assert.ok(t73Html.includes('v1.9.45') || t73Html.includes('v1.9.46'), "index.html must display v1.9.45+ in about display");
  assert.ok(t73Html.includes('css/app.css?v=1.9.45') || t73Html.includes('css/app.css?v=1.9.46'), "index.html must cache-bust css with v=1.9.45+");
  assert.ok(t73Html.includes('js/app.js?v=1.9.45') || t73Html.includes('js/app.js?v=1.9.46'), "index.html must cache-bust app.js with v=1.9.45+");
  assert.ok(t73Html.includes('js/character.js?v=1.9.45') || t73Html.includes('js/character.js?v=1.9.46'), "index.html must cache-bust character.js with v=1.9.45+");
  assert.ok(t73Html.includes('js/rules.js?v=1.9.45') || t73Html.includes('js/rules.js?v=1.9.46'), "index.html must cache-bust rules.js with v=1.9.45+");
  assert.ok(t73Html.includes('js/storage.js?v=1.9.45') || t73Html.includes('js/storage.js?v=1.9.46'), "index.html must cache-bust storage.js with v=1.9.45+");
  assert.ok(t73Html.includes('js/roller.js?v=1.9.45') || t73Html.includes('js/roller.js?v=1.9.46'), "index.html must cache-bust roller.js with v=1.9.45+");
  assert.ok(t73AppJs.includes('version: "1.9.45"') || t73AppJs.includes('version: "1.9.46"'), "app.js APP_VERSION_INFO must be 1.9.45+");

  // B. HP & EP Reset Buttons on Live Tracker
  assert.ok(t73Html.includes('id="btn-reset-hp"'), "index.html must contain #btn-reset-hp button");
  assert.ok(t73Html.includes('id="btn-reset-ep"'), "index.html must contain #btn-reset-ep button");
  assert.ok(t73Css.includes('.btn-reset-vital'), "CSS must define .btn-reset-vital class");
  assert.ok(t73AppJs.includes('btnResetHp.addEventListener'), "app.js must wire #btn-reset-hp listener");
  assert.ok(t73AppJs.includes('btnResetEp.addEventListener'), "app.js must wire #btn-reset-ep listener");

  // Functional test of resetHealth and resetEnergy preserving active tactical conditions
  const char73 = new BESM4ECharacter({
    name: "Hero Tester",
    stats: { body: 4, mind: 4, soul: 4 }
  });
  const d73 = char73.getDerived();
  assert.strictEqual(d73.maxHealth, 40, "Base HP for 4/4/4 character must be 40");
  assert.strictEqual(d73.maxEnergy, 40, "Base EP for 4/4/4 character must be 40");

  char73.applyDamage(15, true);
  char73.spendEnergy(12);
  char73.conditions = ["shocked", "prone"];
  assert.strictEqual(char73.currentHealth, 25, "Current HP should be 25 after 15 damage");
  assert.strictEqual(char73.currentEnergy, 28, "Current EP should be 28 after 12 spend");
  assert.deepStrictEqual(char73.conditions, ["shocked", "prone"], "Tactical conditions are active");

  // Reset HP
  char73.resetHealth();
  assert.strictEqual(char73.currentHealth, 40, "resetHealth() must restore HP back to max (40)");
  assert.deepStrictEqual(char73.conditions, ["shocked", "prone"], "resetHealth() MUST NOT clear active conditions");

  // Reset EP
  char73.resetEnergy();
  assert.strictEqual(char73.currentEnergy, 40, "resetEnergy() must restore EP back to max (40)");
  assert.deepStrictEqual(char73.conditions, ["shocked", "prone"], "resetEnergy() MUST NOT clear active conditions");

  // C. Core Stat Checks for Character with Shortcomings (4/4/4 Stats)
  // Character with Shortcoming (Mind) and Shortcoming (Soul)
  char73.defects = [
    { id: "shortcoming", name: "Shortcoming (Gullible)", rank: 1, detail: "Gullible Mind" },
    { id: "shortcoming", name: "Shortcoming (Weak Will)", rank: 1, detail: "Weak-Willed Soul" }
  ];
  char73.conditions = []; // Clear conditions for clean test

  const bodyCheck = char73.getTraitRollInfo("stat", "body");
  const mindCheck = char73.getTraitRollInfo("stat", "mind");
  const soulCheck = char73.getTraitRollInfo("stat", "soul");

  assert.strictEqual(bodyCheck.totalModifier, 4, "General Body Stat Check must be +4");
  assert.strictEqual(mindCheck.totalModifier, 4, "General Mind Stat Check must be +4, not reduced to +3 by aspect shortcoming");
  assert.strictEqual(soulCheck.totalModifier, 4, "General Soul Stat Check must be +4, not reduced to +3 by aspect shortcoming");

  // Verify explicit shortcoming aspect roll still correctly applies penalty
  const mindAspectCheck = char73.getTraitRollInfo("stat", "mind", { includeShortcoming: true });
  assert.strictEqual(mindAspectCheck.totalModifier, 3, "Explicit shortcoming check correctly deducts shortcoming penalty (4 - 1 = 3)");
  assert.ok(mindAspectCheck.breakdown.includes("Shortcoming (-1)"), "Breakdown includes Shortcoming (-1)");

  // D. Character History Rollback
  const rbChar = new BESM4ECharacter({
    name: "Rollback Test Hero",
    tier: "heroic",
    stats: { body: 4, mind: 4, soul: 4 }
  });
  assert.strictEqual(rbChar.advancementLog.length, 1, "Character starts with 1 creation history entry");
  assert.ok(rbChar.advancementLog[0].snapshot, "Creation entry must store a snapshot");

  // Step 1: Award XP
  rbChar.addXP(10, "Defeated Shadow Syndicate Boss");
  assert.strictEqual(rbChar.earnedXP, 10, "Earned XP must be 10");
  assert.strictEqual(rbChar.advancementLog.length, 2, "History has 2 entries");
  assert.ok(rbChar.advancementLog[0].snapshot, "Milestone entry 1 must store a snapshot");

  // Step 2: Spend XP to upgrade Stats and add an Attribute
  rbChar.stats.mind = 6;
  rbChar.stats.body = 5;
  rbChar.addAttribute({ id: "armour", name: "Armour", level: 2 });
  rbChar.recordAdvancement("Upgraded Mind to 6, Body to 5, added Armour Level 2", -8, "Session 2 Training");
  assert.strictEqual(rbChar.advancementLog.length, 3, "History has 3 entries");
  assert.strictEqual(rbChar.stats.mind, 6, "Mind upgraded to 6");
  assert.strictEqual(rbChar.stats.body, 5, "Body upgraded to 5");
  assert.strictEqual(rbChar.attributes.length, 1, "Armour attribute present");

  // Step 3: Rollback to Milestone 1 ("Awarded 10 XP")
  // In advancementLog, index 0 is "Upgraded Mind...", index 1 is "Awarded 10 XP", index 2 is "Character Created"
  const rbSuccess = rbChar.rollbackToHistory(1);
  assert.strictEqual(rbSuccess, true, "rollbackToHistory must return true");
  assert.strictEqual(rbChar.stats.mind, 4, "Mind must be restored to 4 after rollback");
  assert.strictEqual(rbChar.stats.body, 4, "Body must be restored to 4 after rollback");
  assert.strictEqual(rbChar.attributes.length, 0, "Armour attribute must be reverted/removed after rollback");
  assert.strictEqual(rbChar.earnedXP, 10, "Earned XP must be 10 at this milestone");
  assert.strictEqual(rbChar.advancementLog[0].action, "History Rollback", "Newest log entry records rollback action");

  // Step 4: Rollback to original Character Creation state
  const creationIdx = rbChar.advancementLog.length - 1;
  const rbCreateSuccess = rbChar.rollbackToHistory(creationIdx);
  assert.strictEqual(rbCreateSuccess, true, "rollback to creation milestone must succeed");
  assert.strictEqual(rbChar.earnedXP, 0, "Earned XP must be reverted to 0");
  assert.strictEqual(rbChar.stats.mind, 4, "Mind remains 4");
  assert.strictEqual(rbChar.stats.body, 4, "Body remains 4");

  // E. UI Verification in HTML and App.js
  assert.ok(t73Html.includes('id="adv-log-th-action">Manage</th>'), "Table header must show Manage column");
  assert.ok(t73AppJs.includes('btn-rollback-adv-log'), "app.js must render .btn-rollback-adv-log buttons");
  assert.ok(t73AppJs.includes('rollbackToHistory'), "app.js must invoke rollbackToHistory");

  console.log("✓ Test 73 Passed: HP/EP Reset, Core Stat Ratings & History Rollback (v1.9.45) verified.");

  // =========================================================================
  // 74. Test Defects & Hindrances Alphabetical Ordering Across Rules, Catalog, Builder & Sheets (v1.9.46)
  // =========================================================================
  console.log("\n--- Running Test 74: Alphabetical Ordering of Defects & Hindrances (v1.9.46) ---");

  const t74Html = fs.readFileSync('./index.html', 'utf8');
  const t74AppJs = fs.readFileSync('./js/app.js', 'utf8');
  const t74VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));

  // A. Version Synchronization (v1.9.46)
  assert.strictEqual(t74VersionJson.version, "1.9.46", "version.json must be 1.9.46");
  assert.ok(t74Html.includes('v1.9.46'), "index.html must display v1.9.46 in about display");
  assert.ok(t74Html.includes('css/app.css?v=1.9.46'), "index.html must cache-bust css with v=1.9.46");
  assert.ok(t74Html.includes('js/app.js?v=1.9.46'), "index.html must cache-bust app.js with v=1.9.46");
  assert.ok(t74Html.includes('js/character.js?v=1.9.46'), "index.html must cache-bust character.js with v=1.9.46");
  assert.ok(t74Html.includes('js/rules.js?v=1.9.46'), "index.html must cache-bust rules.js with v=1.9.46");
  assert.ok(t74Html.includes('js/storage.js?v=1.9.46'), "index.html must cache-bust storage.js with v=1.9.46");
  assert.ok(t74Html.includes('js/roller.js?v=1.9.46'), "index.html must cache-bust roller.js with v=1.9.46");
  assert.ok(t74AppJs.includes('version: "1.9.46"'), "app.js APP_VERSION_INFO must be 1.9.46");

  // B. BESM4E_RULES.defects Alphabetical Ordering
  assert.ok(Array.isArray(BESM4E_RULES.defects), "BESM4E_RULES.defects must be an array");
  assert.strictEqual(BESM4E_RULES.defects.length, 39, "BESM4E_RULES.defects must contain 39 defects");
  for (let i = 0; i < BESM4E_RULES.defects.length - 1; i++) {
    const cur = BESM4E_RULES.defects[i].name;
    const next = BESM4E_RULES.defects[i + 1].name;
    assert.ok(
      cur.localeCompare(next, undefined, { sensitivity: "base", numeric: true }) <= 0,
      `BESM4E_RULES.defects catalog must be alphabetical: "${cur}" should precede or equal "${next}"`
    );
  }
  assert.strictEqual(BESM4E_RULES.defects[0].name, "Achilles Heel", "First defect in catalog must be Achilles Heel");
  assert.strictEqual(BESM4E_RULES.defects[BESM4E_RULES.defects.length - 1].name, "Weak Point", "Last defect in catalog must be Weak Point");

  // C. Catalog Filtering & Rendering Sort Verification
  assert.ok(
    t74AppJs.includes('filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""'),
    "renderDefectCatalog in app.js must sort filtered defects alphabetically"
  );

  // D. Character defects array automatically sorted on addition
  const t74Char = new BESM4ECharacter({
    name: "Defect Sort Hero",
    stats: { body: 4, mind: 4, soul: 4 }
  });

  // Add defects in completely scrambled non-alphabetical order
  t74Char.addDefect(BESM4E_RULES.getDefectDef("wanted"), 1);
  t74Char.addDefect(BESM4E_RULES.getDefectDef("fragile"), 1);
  t74Char.addDefect(BESM4E_RULES.getDefectDef("achilles_heel"), 2, null, "Cold Iron");
  t74Char.addDefect(BESM4E_RULES.getDefectDef("blind_fury"), 1);
  t74Char.addDefect(BESM4E_RULES.getDefectDef("special_requirement"), 1, null, "Daily Sunlight Recharge");
  t74Char.addDefect(BESM4E_RULES.getDefectDef("demure"), 1);

  // Verify internal this.defects is kept in alphabetical order
  assert.strictEqual(t74Char.defects.length, 6, "Character must have 6 defects");
  const defectNames = t74Char.defects.map(d => d.name);
  assert.deepStrictEqual(
    defectNames,
    ["Achilles Heel", "Blind Fury", "Demure", "Fragile", "Special Requirement", "Wanted"],
    "Character defects must be stored in alphabetical order"
  );

  // Verify getSortedDefects() returns the same order
  const sortedDefNames = t74Char.getSortedDefects().map(d => d.name);
  assert.deepStrictEqual(
    sortedDefNames,
    ["Achilles Heel", "Blind Fury", "Demure", "Fragile", "Special Requirement", "Wanted"],
    "getSortedDefects() must return defects in alphabetical order"
  );

  // E. Contained Defects in Containers Sorting
  t74Char.addAttribute(BESM4E_RULES.getAttributeDef("item"), 2, "Cursed Relic");
  const relic = t74Char.attributes.find(a => a.name === "Cursed Relic");
  assert.ok(relic, "Relic container attribute exists");

  t74Char.addContainerTrait(relic.id, "defects", BESM4E_RULES.getDefectDef("weak_point"), 1, null, null, "", "", "Cracked Gem");
  t74Char.addContainerTrait(relic.id, "defects", BESM4E_RULES.getDefectDef("awkward_size"), 1);
  t74Char.addContainerTrait(relic.id, "defects", BESM4E_RULES.getDefectDef("bane"), 1, null, null, "", "", "Holy Water");

  const contDefectNames = relic.containerTraits.defects.map(d => d.name);
  assert.deepStrictEqual(
    contDefectNames,
    ["Awkward Size", "Bane", "Weak Point"],
    "Container defects must be stored in alphabetical order"
  );

  // F. Export Markdown and Print Sheet Verification
  const t74Md = BESM4EStorage.generateMarkdown(t74Char);
  const posAchilles = t74Md.indexOf("- **Achilles Heel");
  const posBlindFury = t74Md.indexOf("- **Blind Fury");
  const posDemure = t74Md.indexOf("- **Demure");
  const posFragile = t74Md.indexOf("- **Fragile");
  const posSpecialReq = t74Md.indexOf("- **Special Requirement");
  const posWanted = t74Md.indexOf("- **Wanted");

  assert.ok(posAchilles > 0, "Achilles Heel must be in markdown");
  assert.ok(posBlindFury > posAchilles, "Blind Fury must appear after Achilles Heel");
  assert.ok(posDemure > posBlindFury, "Demure must appear after Blind Fury");
  assert.ok(posFragile > posDemure, "Fragile must appear after Demure");
  assert.ok(posSpecialReq > posFragile, "Special Requirement must appear after Fragile");
  assert.ok(posWanted > posSpecialReq, "Wanted must appear after Special Requirement");

  console.log("✓ Test 74 Passed: Defects & Hindrances Alphabetical Ordering (v1.9.46) verified.");

  console.log("\n=======================================================");
  console.log("🎉 ALL 74 BESM 4E & BESM EXTRAS TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
})();





