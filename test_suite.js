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
assert.ok(t31VersionJson.version === "1.9.8" || t31VersionJson.version === "1.9.9" || t31VersionJson.version === "1.9.10" || t31VersionJson.version === "1.9.11" || t31VersionJson.version === "1.9.12" || t31VersionJson.version === "1.9.13" || t31VersionJson.version === "1.9.14" || t31VersionJson.version === "1.9.15" || t31VersionJson.version === "1.9.16" || t31VersionJson.version === "1.9.17" || t31VersionJson.version === "1.9.18" || t31VersionJson.version === "1.9.19", "version.json version must be valid");
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
  assert.ok(t39Html.includes('v1.9.4') || t39Html.includes('v1.9.5') || t39Html.includes('v1.9.6') || t39Html.includes('v1.9.7') || t39Html.includes('v1.9.8') || t39Html.includes('v1.9.9') || t39Html.includes('v1.9.10') || t39Html.includes('v1.9.11') || t39Html.includes('v1.9.12') || t39Html.includes('v1.9.13') || t39Html.includes('v1.9.14') || t39Html.includes('v1.9.15') || t39Html.includes('v1.9.16') || t39Html.includes('v1.9.17') || t39Html.includes('v1.9.18') || t39Html.includes('v1.9.19'), "index.html updated to v1.9.4+");

  const t39AppJs = fs.readFileSync('./js/app.js', 'utf8');
  assert.ok(t39AppJs.includes('isAdvancementEditMode'), "app.js tracks isAdvancementEditMode");
  assert.ok(t39AppJs.includes('toggleAdvancementEditMode'), "app.js implements toggleAdvancementEditMode");
  assert.ok(t39AppJs.includes('btn-delete-adv-log'), "app.js renders btn-delete-adv-log buttons");
  assert.ok(t39AppJs.includes('1.9.4') || t39AppJs.includes('1.9.5') || t39AppJs.includes('1.9.6') || t39AppJs.includes('1.9.7') || t39AppJs.includes('1.9.8') || t39AppJs.includes('1.9.9') || t39AppJs.includes('1.9.10') || t39AppJs.includes('1.9.11') || t39AppJs.includes('1.9.12') || t39AppJs.includes('1.9.13') || t39AppJs.includes('1.9.14') || t39AppJs.includes('1.9.15') || t39AppJs.includes('1.9.16') || t39AppJs.includes('1.9.17') || t39AppJs.includes('1.9.18') || t39AppJs.includes('1.9.19'), "app.js updated to 1.9.4+");

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
  assert.ok(t40VersionJson.version === "1.9.8" || t40VersionJson.version === "1.9.9" || t40VersionJson.version === "1.9.10" || t40VersionJson.version === "1.9.11" || t40VersionJson.version === "1.9.12" || t40VersionJson.version === "1.9.13" || t40VersionJson.version === "1.9.14" || t40VersionJson.version === "1.9.15" || t40VersionJson.version === "1.9.16" || t40VersionJson.version === "1.9.17" || t40VersionJson.version === "1.9.18" || t40VersionJson.version === "1.9.19", "version.json version must be valid");
  assert.ok(t40Html.includes('v1.9.8') || t40Html.includes('v1.9.9') || t40Html.includes('v1.9.10') || t40Html.includes('v1.9.11') || t40Html.includes('v1.9.12') || t40Html.includes('v1.9.13') || t40Html.includes('v1.9.14') || t40Html.includes('v1.9.15') || t40Html.includes('v1.9.16') || t40Html.includes('v1.9.17') || t40Html.includes('v1.9.18') || t40Html.includes('v1.9.19'), "index.html must display version");
  assert.ok(t40AppJs.includes('version: "1.9.8"') || t40AppJs.includes('version: "1.9.9"') || t40AppJs.includes('version: "1.9.10"') || t40AppJs.includes('version: "1.9.11"') || t40AppJs.includes('version: "1.9.12"') || t40AppJs.includes('version: "1.9.13"') || t40AppJs.includes('version: "1.9.14"') || t40AppJs.includes('version: "1.9.15"') || t40AppJs.includes('version: "1.9.16"') || t40AppJs.includes('version: "1.9.17"') || t40AppJs.includes('version: "1.9.18"') || t40AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must match version.json");

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
  assert.ok(t43VersionJson.version === "1.9.9" || t43VersionJson.version === "1.9.10" || t43VersionJson.version === "1.9.11" || t43VersionJson.version === "1.9.12" || t43VersionJson.version === "1.9.13" || t43VersionJson.version === "1.9.14" || t43VersionJson.version === "1.9.15" || t43VersionJson.version === "1.9.16" || t43VersionJson.version === "1.9.17" || t43VersionJson.version === "1.9.18" || t43VersionJson.version === "1.9.19", "version.json version must be 1.9.9+");
  assert.ok(t43Html.includes('v1.9.9') || t43Html.includes('v1.9.10') || t43Html.includes('v1.9.11') || t43Html.includes('v1.9.12') || t43Html.includes('v1.9.13') || t43Html.includes('v1.9.14') || t43Html.includes('v1.9.15') || t43Html.includes('v1.9.16') || t43Html.includes('v1.9.17') || t43Html.includes('v1.9.18') || t43Html.includes('v1.9.19'), "index.html must display version");
  assert.ok(t43AppJs.includes('version: "1.9.9"') || t43AppJs.includes('version: "1.9.10"') || t43AppJs.includes('version: "1.9.11"') || t43AppJs.includes('version: "1.9.12"') || t43AppJs.includes('version: "1.9.13"') || t43AppJs.includes('version: "1.9.14"') || t43AppJs.includes('version: "1.9.15"') || t43AppJs.includes('version: "1.9.16"') || t43AppJs.includes('version: "1.9.17"') || t43AppJs.includes('version: "1.9.18"') || t43AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be valid");

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
  assert.ok(t44VersionJson.version === "1.9.10" || t44VersionJson.version === "1.9.11" || t44VersionJson.version === "1.9.12" || t44VersionJson.version === "1.9.13" || t44VersionJson.version === "1.9.14" || t44VersionJson.version === "1.9.15" || t44VersionJson.version === "1.9.16" || t44VersionJson.version === "1.9.17" || t44VersionJson.version === "1.9.18" || t44VersionJson.version === "1.9.19", "version.json version must be 1.9.10+");
  assert.ok(t44Html.includes('v1.9.10') || t44Html.includes('v1.9.11') || t44Html.includes('v1.9.12') || t44Html.includes('v1.9.13') || t44Html.includes('v1.9.14') || t44Html.includes('v1.9.15') || t44Html.includes('v1.9.16') || t44Html.includes('v1.9.17') || t44Html.includes('v1.9.18') || t44Html.includes('v1.9.19'), "index.html must display version");
  assert.ok(t44Html.includes('css/app.css?v=1.9.10') || t44Html.includes('css/app.css?v=1.9.11') || t44Html.includes('css/app.css?v=1.9.12') || t44Html.includes('css/app.css?v=1.9.13') || t44Html.includes('css/app.css?v=1.9.14') || t44Html.includes('css/app.css?v=1.9.15') || t44Html.includes('css/app.css?v=1.9.16') || t44Html.includes('css/app.css?v=1.9.17') || t44Html.includes('css/app.css?v=1.9.18') || t44Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css");
  assert.ok(t44Html.includes('js/app.js?v=1.9.10') || t44Html.includes('js/app.js?v=1.9.11') || t44Html.includes('js/app.js?v=1.9.12') || t44Html.includes('js/app.js?v=1.9.13') || t44Html.includes('js/app.js?v=1.9.14') || t44Html.includes('js/app.js?v=1.9.15') || t44Html.includes('js/app.js?v=1.9.16') || t44Html.includes('js/app.js?v=1.9.17') || t44Html.includes('js/app.js?v=1.9.18') || t44Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js");
  assert.ok(t44AppJs.includes('version: "1.9.10"') || t44AppJs.includes('version: "1.9.11"') || t44AppJs.includes('version: "1.9.12"') || t44AppJs.includes('version: "1.9.13"') || t44AppJs.includes('version: "1.9.14"') || t44AppJs.includes('version: "1.9.15"') || t44AppJs.includes('version: "1.9.16"') || t44AppJs.includes('version: "1.9.17"') || t44AppJs.includes('version: "1.9.18"') || t44AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be valid");

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
  assert.ok(t45VersionJson.version === "1.9.11" || t45VersionJson.version === "1.9.12" || t45VersionJson.version === "1.9.13" || t45VersionJson.version === "1.9.14" || t45VersionJson.version === "1.9.15" || t45VersionJson.version === "1.9.16" || t45VersionJson.version === "1.9.17" || t45VersionJson.version === "1.9.18" || t45VersionJson.version === "1.9.19", "version.json version must be 1.9.11+");
  assert.ok(t45Html.includes('v1.9.11') || t45Html.includes('v1.9.12') || t45Html.includes('v1.9.13') || t45Html.includes('v1.9.14') || t45Html.includes('v1.9.15') || t45Html.includes('v1.9.16') || t45Html.includes('v1.9.17') || t45Html.includes('v1.9.18') || t45Html.includes('v1.9.19'), "index.html must display version");
  assert.ok(t45Html.includes('css/app.css?v=1.9.11') || t45Html.includes('css/app.css?v=1.9.12') || t45Html.includes('css/app.css?v=1.9.13') || t45Html.includes('css/app.css?v=1.9.14') || t45Html.includes('css/app.css?v=1.9.15') || t45Html.includes('css/app.css?v=1.9.16') || t45Html.includes('css/app.css?v=1.9.17') || t45Html.includes('css/app.css?v=1.9.18') || t45Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css");
  assert.ok(t45Html.includes('js/app.js?v=1.9.11') || t45Html.includes('js/app.js?v=1.9.12') || t45Html.includes('js/app.js?v=1.9.13') || t45Html.includes('js/app.js?v=1.9.14') || t45Html.includes('js/app.js?v=1.9.15') || t45Html.includes('js/app.js?v=1.9.16') || t45Html.includes('js/app.js?v=1.9.17') || t45Html.includes('js/app.js?v=1.9.18') || t45Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js");
  assert.ok(t45AppJs.includes('version: "1.9.11"') || t45AppJs.includes('version: "1.9.12"') || t45AppJs.includes('version: "1.9.13"') || t45AppJs.includes('version: "1.9.14"') || t45AppJs.includes('version: "1.9.15"') || t45AppJs.includes('version: "1.9.16"') || t45AppJs.includes('version: "1.9.17"') || t45AppJs.includes('version: "1.9.18"') || t45AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be valid");

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
  assert.ok(t46VersionJson.version === "1.9.12" || t46VersionJson.version === "1.9.13" || t46VersionJson.version === "1.9.14" || t46VersionJson.version === "1.9.15" || t46VersionJson.version === "1.9.16" || t46VersionJson.version === "1.9.17" || t46VersionJson.version === "1.9.18" || t46VersionJson.version === "1.9.19", "version.json version must be 1.9.12+");
  assert.ok(t46Html.includes('v1.9.12') || t46Html.includes('v1.9.13') || t46Html.includes('v1.9.14') || t46Html.includes('v1.9.15') || t46Html.includes('v1.9.16') || t46Html.includes('v1.9.17') || t46Html.includes('v1.9.18') || t46Html.includes('v1.9.19'), "index.html must display v1.9.12+");
  assert.ok(t46Html.includes('css/app.css?v=1.9.12') || t46Html.includes('css/app.css?v=1.9.13') || t46Html.includes('css/app.css?v=1.9.14') || t46Html.includes('css/app.css?v=1.9.15') || t46Html.includes('css/app.css?v=1.9.16') || t46Html.includes('css/app.css?v=1.9.17') || t46Html.includes('css/app.css?v=1.9.18') || t46Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css with v=1.9.12+");
  assert.ok(t46Html.includes('js/app.js?v=1.9.12') || t46Html.includes('js/app.js?v=1.9.13') || t46Html.includes('js/app.js?v=1.9.14') || t46Html.includes('js/app.js?v=1.9.15') || t46Html.includes('js/app.js?v=1.9.16') || t46Html.includes('js/app.js?v=1.9.17') || t46Html.includes('js/app.js?v=1.9.18') || t46Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js with v=1.9.12+");
  assert.ok(t46AppJs.includes('version: "1.9.12"') || t46AppJs.includes('version: "1.9.13"') || t46AppJs.includes('version: "1.9.14"') || t46AppJs.includes('version: "1.9.15"') || t46AppJs.includes('version: "1.9.16"') || t46AppJs.includes('version: "1.9.17"') || t46AppJs.includes('version: "1.9.18"') || t46AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be 1.9.12+");

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

  // Increase Road-Bound rank to 2
  testGsAttr.limiters[0].rank = 2;
  gsCost = BESM4E_RULES.calculateAttributeCost(testGsAttr);
  assert.strictEqual(gsCost.limRefund, 2, "Rank 2 Road-Bound refunds 2 CP");
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
  assert.strictEqual(contGs.limiters[0].refundPerRank, 1);

  // Contained Ground Speed cost is 6 - 1 = 5 CP. Mach 5 Item cost is floor(5 / 2) = 2 CP.
  mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 5, "Net contained points = 5 CP after Road-Bound rank 1");
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 2, "Mach 5 Item cost is floor(5/2) = 2 CP");
  assert.strictEqual(t47Char.getAttributeCost(mach5Item), 2, "Character pays 2 CP for Mach 5");

  // Step Road-Bound rank to 2 via updateContainerTraitLimiterRank
  const stepLimRes = t47Char.updateContainerTraitLimiterRank("item_mach5", "attributes", contGs.id, "road_bound", 2);
  assert.strictEqual(stepLimRes, true, "updateContainerTraitLimiterRank must return true");
  assert.strictEqual(contGs.limiters[0].rank, 2, "Road-Bound rank updated to 2");

  mach5Pts = t47Char.getContainerPoints("item_mach5");
  assert.strictEqual(mach5Pts.netContainedPoints, 4, "Net contained points = 4 CP after Road-Bound rank 2 (6 - 2 = 4)");
  assert.strictEqual(mach5Pts.effectiveCharacterCost, 2, "Mach 5 Item cost is floor(4/2) = 2 CP");

  // Add Enhancement to contained Ground Speed
  const addEnhRes = t47Char.addContainerTraitEnhancement("item_mach5", "attributes", contGs.id, "area", 1);
  assert.strictEqual(addEnhRes, true, "addContainerTraitEnhancement must return true");
  assert.ok(Array.isArray(contGs.enhancements), "Contained Ground Speed must have enhancements array");
  assert.strictEqual(contGs.enhancements.length, 1);
  assert.strictEqual(contGs.enhancements[0].name, "Area Effect");
  assert.strictEqual(contGs.enhancements[0].rank, 1);

  // Net contained points: 6 (base) + 1 (enhancement) - 2 (limiter) = 5 CP. floor(5/2) = 2 CP.
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

  // Remove enhancement
  t47Char.removeContainerTraitEnhancement("item_mach5", "attributes", contGs.id, "area");
  assert.strictEqual(contGs.enhancements.length, 0, "Area enhancement removed");

  // Step Road-Bound back to rank 1 with delta -1
  t47Char.updateContainerTraitLimiterRank("item_mach5", "attributes", contGs.id, "road_bound", -1, true);
  assert.strictEqual(contGs.limiters[0].rank, 1, "Road-Bound stepped down to rank 1");
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
  assert.ok(t47VersionJson.version === "1.9.13" || t47VersionJson.version === "1.9.14" || t47VersionJson.version === "1.9.15" || t47VersionJson.version === "1.9.16" || t47VersionJson.version === "1.9.17" || t47VersionJson.version === "1.9.18" || t47VersionJson.version === "1.9.19", "version.json version must be 1.9.13+");
  assert.ok(t47Html.includes('v1.9.13') || t47Html.includes('v1.9.14') || t47Html.includes('v1.9.15') || t47Html.includes('v1.9.16') || t47Html.includes('v1.9.17') || t47Html.includes('v1.9.18') || t47Html.includes('v1.9.19'), "index.html must display v1.9.13+");
  assert.ok(t47Html.includes('css/app.css?v=1.9.13') || t47Html.includes('css/app.css?v=1.9.14') || t47Html.includes('css/app.css?v=1.9.15') || t47Html.includes('css/app.css?v=1.9.16') || t47Html.includes('css/app.css?v=1.9.17') || t47Html.includes('css/app.css?v=1.9.18') || t47Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css with v=1.9.13+");
  assert.ok(t47Html.includes('js/app.js?v=1.9.13') || t47Html.includes('js/app.js?v=1.9.14') || t47Html.includes('js/app.js?v=1.9.15') || t47Html.includes('js/app.js?v=1.9.16') || t47Html.includes('js/app.js?v=1.9.17') || t47Html.includes('js/app.js?v=1.9.18') || t47Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js with v=1.9.13+");
  assert.ok(t47AppJs.includes('version: "1.9.13"') || t47AppJs.includes('version: "1.9.14"') || t47AppJs.includes('version: "1.9.15"') || t47AppJs.includes('version: "1.9.16"') || t47AppJs.includes('version: "1.9.17"') || t47AppJs.includes('version: "1.9.18"') || t47AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be 1.9.13+");

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
  assert.ok(t48VersionJson.version === "1.9.15" || t48VersionJson.version === "1.9.16" || t48VersionJson.version === "1.9.17" || t48VersionJson.version === "1.9.18" || t48VersionJson.version === "1.9.19", "version.json must be 1.9.16+");
  assert.ok(t48Html.includes('v1.9.15') || t48Html.includes('v1.9.16') || t48Html.includes('v1.9.17') || t48Html.includes('v1.9.18') || t48Html.includes('v1.9.19'), "index.html must display v1.9.16+");
  assert.ok(t48Html.includes('css/app.css?v=1.9.15') || t48Html.includes('css/app.css?v=1.9.16') || t48Html.includes('css/app.css?v=1.9.17') || t48Html.includes('css/app.css?v=1.9.18') || t48Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css with v=1.9.16+");
  assert.ok(t48Html.includes('js/app.js?v=1.9.15') || t48Html.includes('js/app.js?v=1.9.16') || t48Html.includes('js/app.js?v=1.9.17') || t48Html.includes('js/app.js?v=1.9.18') || t48Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js with v=1.9.16+");
  assert.ok(t48Html.includes('js/rules.js?v=1.9.15') || t48Html.includes('js/rules.js?v=1.9.16') || t48Html.includes('js/rules.js?v=1.9.17') || t48Html.includes('js/rules.js?v=1.9.18') || t48Html.includes('js/rules.js?v=1.9.19'), "index.html must cache-bust rules.js with v=1.9.16+");
  assert.ok(t48Html.includes('js/character.js?v=1.9.15') || t48Html.includes('js/character.js?v=1.9.16') || t48Html.includes('js/character.js?v=1.9.17') || t48Html.includes('js/character.js?v=1.9.18') || t48Html.includes('js/character.js?v=1.9.19'), "index.html must cache-bust character.js with v=1.9.16+");
  assert.ok(t48Html.includes('js/storage.js?v=1.9.15') || t48Html.includes('js/storage.js?v=1.9.16') || t48Html.includes('js/storage.js?v=1.9.17') || t48Html.includes('js/storage.js?v=1.9.18') || t48Html.includes('js/storage.js?v=1.9.19'), "index.html must cache-bust storage.js with v=1.9.16+");
  assert.ok(t48Html.includes('js/roller.js?v=1.9.15') || t48Html.includes('js/roller.js?v=1.9.16') || t48Html.includes('js/roller.js?v=1.9.17') || t48Html.includes('js/roller.js?v=1.9.18') || t48Html.includes('js/roller.js?v=1.9.19'), "index.html must cache-bust roller.js with v=1.9.16+");
  assert.ok(t48AppJs.includes('version: "1.9.15"') || t48AppJs.includes('version: "1.9.16"') || t48AppJs.includes('version: "1.9.17"') || t48AppJs.includes('version: "1.9.18"') || t48AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be 1.9.16+");

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
  assert.ok(t49VersionJson.version === "1.9.17" || t49VersionJson.version === "1.9.18" || t49VersionJson.version === "1.9.19", "version.json must be 1.9.17+");
  assert.ok(t49Html.includes('v1.9.17') || t49Html.includes('v1.9.18') || t49Html.includes('v1.9.19'), "index.html must display v1.9.17+");
  assert.ok(t49Html.includes('css/app.css?v=1.9.17') || t49Html.includes('css/app.css?v=1.9.18') || t49Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css with v=1.9.17+");
  assert.ok(t49Html.includes('js/app.js?v=1.9.17') || t49Html.includes('js/app.js?v=1.9.18') || t49Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js with v=1.9.17+");
  assert.ok(t49Html.includes('js/character.js?v=1.9.17') || t49Html.includes('js/character.js?v=1.9.18') || t49Html.includes('js/character.js?v=1.9.19'), "index.html must cache-bust character.js with v=1.9.17+");
  assert.ok(t49AppJs.includes('version: "1.9.17"') || t49AppJs.includes('version: "1.9.18"') || t49AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be 1.9.17+");

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
  assert.ok(t50Html.includes('src="js/trait_descriptions.js?v=1.9.18"') || t50Html.includes('src="js/trait_descriptions.js?v=1.9.19"'), "index.html must include trait_descriptions.js script tag with v=1.9.18+");

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
  assert.ok(t50VersionJson.version === "1.9.18" || t50VersionJson.version === "1.9.19", "version.json must be 1.9.18+");
  assert.ok(t50Html.includes('v1.9.18') || t50Html.includes('v1.9.19'), "index.html must display v1.9.18+");
  assert.ok(t50Html.includes('css/app.css?v=1.9.18') || t50Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css with v=1.9.18+");
  assert.ok(t50Html.includes('js/app.js?v=1.9.18') || t50Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js with v=1.9.18+");
  assert.ok(t50Html.includes('js/character.js?v=1.9.18') || t50Html.includes('js/character.js?v=1.9.19'), "index.html must cache-bust character.js with v=1.9.18+");
  assert.ok(t50AppJs.includes('version: "1.9.18"') || t50AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be 1.9.18+");

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

  // 12. Version Synchronization (v1.9.19)
  const t51VersionJson = JSON.parse(fs.readFileSync('./version.json', 'utf8'));
  assert.strictEqual(t51VersionJson.version, "1.9.19", "version.json must be 1.9.19");
  assert.ok(t51Html.includes('v1.9.19'), "index.html must display v1.9.19");
  assert.ok(t51Html.includes('css/app.css?v=1.9.19'), "index.html must cache-bust css with v=1.9.19");
  assert.ok(t51Html.includes('js/app.js?v=1.9.19'), "index.html must cache-bust app.js with v=1.9.19");
  assert.ok(t51Html.includes('js/character.js?v=1.9.19'), "index.html must cache-bust character.js with v=1.9.19");
  assert.ok(t51AppJs.includes('version: "1.9.19"'), "app.js APP_VERSION_INFO must be 1.9.19");

  console.log("✓ Test 51 Passed: Trait Roll Buttons, Active Modifiers Integration & Version Sync (v1.9.19) verified.");

  console.log("\n=======================================================");
  console.log("🎉 ALL 51 BESM 4E & BESM EXTRAS TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
})();



