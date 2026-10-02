/**
 * Big Eyes, Small Mouth (BESM) 4th Edition - Rules Engine & Data Catalog
 * Based on the official BESM Fourth Edition core rulebook by Dyskami Publishing / White Wolf.
 */

const BESM4E_RULES = {
  systemName: "Big Eyes, Small Mouth 4th Edition (BESM 4E)",
  version: "4.0",
  
  // Stat Cost Rules:
  // Values 1 to 12 cost 2 Character Points per Stat point.
  // Values 13+ cost 4 Character Points per Stat point.
  statCostRegular: 2,
  statCostSuperhuman: 4,
  statThreshold: 12,
  humanAverageStat: 4,

  // Table 01: Character Power Levels (BESM 4E Core, p. 22)
  tiers: [
    { id: "sub_human", name: "Sub-Human", minPoints: 0, maxPoints: 24, defaultPoints: 20, description: "Young teens, children, small animals, wee creatures (pixies, sprites)." },
    { id: "human", name: "Human", minPoints: 25, maxPoints: 49, defaultPoints: 35, description: "Brave but low-powered roles: detectives, high school students, soldiers." },
    { id: "adventurer", name: "Adventurer", minPoints: 50, maxPoints: 74, defaultPoints: 60, description: "Valiant action heroes, martial artists, students with pet monsters/magic." },
    { id: "heroic", name: "Heroic (Sweet Spot)", minPoints: 75, maxPoints: 99, defaultPoints: 75, description: "Peak humans, magical girls, mecha pilots, moderate superhumans." },
    { id: "mythical", name: "Mythical", minPoints: 100, maxPoints: 149, defaultPoints: 125, description: "Vampires, ghosts, cyborgs, demons, starship captains, elite sorcerers." },
    { id: "superhuman", name: "Superhuman", minPoints: 150, maxPoints: 199, defaultPoints: 175, description: "Arch-mages, elder vampires, dragons, awakened magical guardians." },
    { id: "superpowered", name: "Superpowered", minPoints: 200, maxPoints: 249, defaultPoints: 200, description: "Demigods, towering mecha masters, world-shaking meta-beings." },
    { id: "godlike", name: "Godlike", minPoints: 250, maxPoints: 500, defaultPoints: 250, description: "Forces of nature with power to change entire worlds or dimensions." },
    { id: "custom", name: "Custom", minPoints: 1, maxPoints: 1000, defaultPoints: 75, description: "Custom Game Master point allowance." }
  ],

  // Core Stats (BESM 4E Core, Chapter 4, p. 70-74)
  stats: [
    {
      id: "body",
      name: "Body",
      short: "BOD",
      color: "#ef4444",
      description: "Physical strength, health, stamina, quickness, manual dexterity, endurance, and rate of healing. Average adult human = 4."
    },
    {
      id: "mind",
      name: "Mind",
      short: "MND",
      color: "#06b6d4",
      description: "Intellectual capability, critical thinking, wit, perception, memory, deduction, and tactical acumen. Average adult human = 4."
    },
    {
      id: "soul",
      name: "Soul",
      short: "SOL",
      color: "#a855f7",
      description: "Luck, willpower, spirit, presence, empathy, life force, determination, and psychic/supernatural resonance. Average adult human = 4."
    }
  ],

  // Derived Values Formulas (BESM 4E Core, Chapter 8, p. 168-171)
  derivedFormulas: {
    // Combat Value = (Body + Mind + Soul) / 3 (rounded down)
    calculateCV: (body, mind, soul) => Math.floor(((body || 0) + (mind || 0) + (soul || 0)) / 3),
    // Health Points = (Body + Soul) * 5 + (Tough Level * 10)
    calculateHP: (body, soul, toughLvl = 0) => ((body || 0) + (soul || 0)) * 5 + (toughLvl * 10),
    // Energy Points = (Mind + Soul) * 5 + (Energised Level * 10)
    calculateEP: (mind, soul, energisedLvl = 0) => ((mind || 0) + (soul || 0)) * 5 + (energisedLvl * 10),
    // Base Damage Multiplier = 5 + Massive Damage Level (+ Superstrength Level for muscle weapons)
    calculateDM: (massiveDmgLvl = 0) => 5 + massiveDmgLvl,
    // Armour Rating = (Armour Level * 5) + (Force Field Level * 10)
    calculateAR: (armourLvl = 0, forceFieldLvl = 0) => (armourLvl * 5) + (forceFieldLvl * 10)
  },

  // Attribute Categories
  attributeCategories: [
    { id: "all", name: "All Attributes" },
    { id: "combat", name: "Combat & Offense" },
    { id: "defence", name: "Defense & Armor" },
    { id: "physical", name: "Physical & Movement" },
    { id: "mental", name: "Mental & Sensory" },
    { id: "supernatural", name: "Powers & Magic" },
    { id: "social", name: "Social, Wealth & Items" }
  ],

  // Table 07: Character Attributes (BESM 4E Core, p. 77)
  attributes: [
    { id: "absorption", name: "Absorption", category: "supernatural", costPerLevel: 5, maxLevel: 6, isHuman: false, description: "Absorbs incoming energy or kinetic attacks and converts them into Health or Energy Points." },
    { id: "alternate_form", name: "Alternate Form", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Grants access to a completely different transformed state (magical girl, mecha, beast) with separate attribute point allocations." },
    { id: "alternate_identity", name: "Alternate Identity", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Maintains distinct public, civilian, or secret personas that differ in appearance, status, and legal documentation." },
    { id: "armour", name: "Armour", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Provides an Armour Rating (AR) of 5 per Level, subtracting that damage from every incoming attack." },
    { id: "attack_mastery", name: "Attack Mastery", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Mastery of offensive combat arts. Increases Attack Combat Value (ACV) by +1 per Level for all attacks." },
    { id: "augmented", name: "Augmented", category: "physical", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Increases one chosen Stat (Body, Mind, or Soul) by +1 Stat Value per Level through external magic, cybernetics, or science." },
    { id: "capacity", name: "Capacity", category: "social", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Ability to carry extra passengers or cargo inside the character, vehicle, or robot." },
    { id: "change_state", name: "Change State", category: "supernatural", costPerLevel: 3, maxLevel: 4, isHuman: false, description: "Transforms into gaseous, liquid, incorporeal, or energy states to slip through barriers or become immune to normal physical strikes." },
    { id: "cognition", name: "Cognition", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Glimpses into the future (precognition) or past (retrocognition) to obtain crucial clues." },
    { id: "combat_technique", name: "Combat Technique", category: "combat", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Specific martial manoeuvres: Blind Fighting, Brutal, Critical Strike, Dead Eye, Deflection, Hardboiled, Judge Opponent, Lethal Strike, Lightning Reflexes, Multiple Targets, Portable Armoury, Steady Hand, Two Weapons, or Weapons Flurry." },
    { id: "companion", name: "Companion", category: "social", costPerLevel: 4, maxLevel: 6, isHuman: true, description: "A loyal ally, magical mascot, combat familiar, pet monster, or robot partner built with Character Points." },
    { id: "connected", name: "Connected", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Social networks, intelligence contacts, corporate standing, or underworld ties." },
    { id: "control_environment", name: "Control Environment", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Manipulates atmospheric temperature, weather, gravity, or ambient conditions in a zone." },
    { id: "conversion", name: "Conversion", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Converts Health Points directly into Energy Points, or vice versa, at a rapid rate." },
    { id: "data_access", name: "Data Access", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Direct neural or wireless uplink to computer networks, databases, satellite arrays, and artificial intelligences." },
    { id: "defence_mastery", name: "Defence Mastery", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Combat evasion, parrying, and deflection expertise. Increases Defence Combat Value (DCV) by +1 per Level." },
    { id: "dimension_walk", name: "Dimension Walk", category: "supernatural", costPerLevel: 5, maxLevel: 4, isHuman: false, description: "Opens pathways between different planes of existence, alternate timelines, or the multiverse." },
    { id: "dynamic_powers", name: "Dynamic Powers", category: "supernatural", costPerLevel: 10, maxLevel: 4, isHuman: false, description: "Broad mastery over a domain of magic or reality (e.g. Elemental Fire, Sorcery, Technology Manipulation) to produce spontaneous effects." },
    { id: "elasticity", name: "Elasticity", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Extends, stretches, and contorts limbs over significant distances." },
    { id: "enemy_attack", name: "Enemy Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialised attack training that grants +2 ACV when targeting a specific enemy species or faction." },
    { id: "enemy_defence", name: "Enemy Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialised evasive tactics that grant +2 DCV against attacks from a specific enemy species or faction." },
    { id: "energised", name: "Energised", category: "supernatural", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Deep reservoirs of stamina and spiritual essence. Adds +10 Energy Points (EP) per Level." },
    { id: "exorcism", name: "Exorcism", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Banishes, dispels, or repels supernatural entities, demons, spirits, and possessive entities." },
    { id: "extra_actions", name: "Extra Actions", category: "combat", costPerLevel: 4, maxLevel: 4, isHuman: true, description: "Grants one additional Attack or Defence action per combat round per Level." },
    { id: "extra_arms", name: "Extra Arms", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Additional biological, mechanical, or psychic appendages capable of manipulating tools or weapons." },
    { id: "features", name: "Features", category: "social", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Distinct anime traits: Appearance (Strikingly Cute / Bishojo), Eidetic Memory, Mimic Voice, Scentless, Internal Compass, etc." },
    { id: "flight", name: "Flight", category: "physical", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Airborne locomotion via wings, anti-gravity, magical levitation, or rocket propulsion." },
    { id: "force_field", name: "Force Field", category: "defence", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Creates an energy barrier providing an Armour Rating of 10 per Level against all attacks." },
    { id: "gear", name: "Gear", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Access to uncommon equipment, specialty kits, surveillance drones, and vehicles." },
    { id: "ground_speed", name: "Ground Speed", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Rapid overland ground movement for vehicles, mecha, or sprint specialists." },
    { id: "healing", name: "Healing", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Restores Health Points to injured living subjects through first aid, medicine, or magical curative touch." },
    { id: "heightened_awareness", name: "Heightened Awareness", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Acute perception and sixth sense. Adds +2 per Level to all Mind and Soul checks to notice hidden threats or traps." },
    { id: "heightened_senses", name: "Heightened Senses", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Exceptional eyesight, hearing, smell, or taste operating well beyond human acuity." },
    { id: "illusion", name: "Illusion", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Creates realistic sensory mirages in the minds of targets or hologram projections." },
    { id: "immunity", name: "Immunity", category: "defence", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Complete invulnerability to a specific environmental hazard: electricity, fire, cold, radiation, toxins, or vacuum." },
    { id: "immutable", name: "Immutable", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Resists forced shapechanging, petrification, transmutation, and size alteration." },
    { id: "inspire", name: "Inspire", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Oratory leadership that grants allies temporary bonuses to Combat Values or dice rolls." },
    { id: "item", name: "Item", category: "social", costPerLevel: 0.5, maxLevel: 20, isHuman: true, description: "Purchases mecha, vehicles, weapons, or magical artifacts at half the normal Character Point cost." },
    { id: "jumping", name: "Jumping", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Superhuman vertical and horizontal leap distances." },
    { id: "massive_damage", name: "Massive Damage", category: "combat", costPerLevel: 3, maxLevel: 6, isHuman: true, description: "Devastating striking power. Increases Damage Multiplier (DM) by +1 per Level for all attacks." },
    { id: "melee_attack", name: "Melee Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialized training with a specific melee weapon or hand-to-hand style (+1 ACV per Level with that weapon)." },
    { id: "melee_defence", name: "Melee Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialized defense training against close-quarters attacks (+1 DCV vs melee per Level)." },
    { id: "merge", name: "Merge", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Ability to combine with other characters or mecha into a single powerful composite being (classic combiner mecha!)." },
    { id: "metamorphosis", name: "Metamorphosis", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Alters cosmetic appearance, gender, species, or apparent age at will." },
    { id: "mimic", name: "Mimic", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Temporarily copies the attributes, powers, or skills of an observed target." },
    { id: "mind_control", name: "Mind Control", category: "mental", costPerLevel: 5, maxLevel: 6, isHuman: false, description: "Enforces mental domination or hypnotic commands over sentient beings." },
    { id: "mind_shield", name: "Mind Shield", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Mental fortitude against psionic intrusion, mind reading, and illusion (+2 to Mind Stat defence per Level)." },
    { id: "minions", name: "Minions", category: "social", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "A squad or army of loyal subordinates, corporate guards, or summoned drones." },
    { id: "mulligan", name: "Mulligan", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Fabulous luck. Reroll any failed dice roll once per session per Level." },
    { id: "nullify", name: "Nullify", category: "supernatural", costPerLevel: 5, maxLevel: 6, isHuman: false, description: "Suppresses, neutralises, or dispels the supernatural powers, magic, or tech of targets." },
    { id: "plant_control", name: "Plant Control", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Commands vegetation, vines, trees, and botanical growth." },
    { id: "pocket_dimension", name: "Pocket Dimension", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Access to an extradimensional space for storage (hammerspace, magic pouch, personal realm)." },
    { id: "portal", name: "Portal", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Creates stationary gateways that connect distant spatial locations." },
    { id: "power_flux", name: "Power Flux", category: "supernatural", costPerLevel: 10, maxLevel: 6, isHuman: false, description: "Dynamic ability pool that can be reallocated on the fly to simulate versatile magical or superpower suites." },
    { id: "power_variation", name: "Power Variation", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Creates alternate modes or utility variations for existing primary powers." },
    { id: "projection", name: "Projection", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Astral projection or hard-light sensory avatars." },
    { id: "ranged_attack", name: "Ranged Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialized marksmanship with a specific firearm or ranged weapon (+1 ACV per Level with that weapon)." },
    { id: "ranged_defence", name: "Ranged Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Dodging and evasive positioning against ranged attacks (+1 DCV vs ranged per Level)." },
    { id: "regeneration", name: "Regeneration", category: "supernatural", costPerLevel: 5, maxLevel: 6, isHuman: false, description: "Rapid cell recovery. Regains Health Points automatically each combat round or minute." },
    { id: "reincarnation", name: "Reincarnation", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "When killed, the soul returns in a new body or reconstructs itself after a period of time." },
    { id: "resilient", name: "Resilient", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Immunity or extreme resilience to non-combat physical trauma, poisons, and diseases." },
    { id: "sensory_block", name: "Sensory Block", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Shields against electronic surveillance, psychic eavesdropping, or thermal detection." },
    { id: "sixth_sense", name: "Sixth Sense", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Intuitive detection of invisible presences, magic, danger, spirits, or dimensional rifts." },
    { id: "size_change", name: "Size Change", category: "supernatural", costPerLevel: 10, maxLevel: 6, isHuman: false, description: "Grows to gigantic proportions or shrinks to insect scale on demand." },
    { id: "spaceflight", name: "Spaceflight", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Propulsion in deep vacuum and interplanetary transit." },
    { id: "special_movement", name: "Special Movement", category: "physical", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Balance, Cat-Like, Fast, Light-Footed, Slithering, Swinging, Untrackable, Wall-Bouncing, Wall-Crawling, Water-Walking, or Zen Direction." },
    { id: "summon_creatures", name: "Summon Creatures", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Summons and commands swarms of animals or weak dimensional creatures." },
    { id: "supersense", name: "Supersense", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Echolocation, infrared vision, radar, magnetic field detection, or x-ray sight." },
    { id: "superspeed", name: "Superspeed", category: "physical", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Blistering velocities from 100 kph (Level 1) to 30,000 kph (Level 6)." },
    { id: "superstrength", name: "Superstrength", category: "physical", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Colossal physical power. Adds +1 Damage Multiplier per Level for muscle-powered attacks and immense lifting capacity." },
    { id: "swarm", name: "Swarm", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Body disperses into a cloud of insects, bats, nanites, or mist." },
    { id: "telekinesis", name: "Telekinesis", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Moves, lifts, and throws physical objects using purely psychic or magical will." },
    { id: "telepathy", name: "Telepathy", category: "mental", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Mind-to-mind communication, thought reading, and broadcasting." },
    { id: "teleport", name: "Teleport", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Instantaneous spatial transit from 10 meters to global range." },
    { id: "tough", name: "Tough", category: "physical", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Physical fortitude and constitution. Adds +10 Maximum Health Points (HP) per Level." },
    { id: "transfer", name: "Transfer", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Bestows temporary attribute levels or energy points to allies." },
    { id: "transmute", name: "Transmute", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Alchemically transforms one physical element or material into another." },
    { id: "tunnelling", name: "Tunnelling", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Burrows through dirt, solid stone, or reinforced concrete." },
    { id: "unaffected", name: "Unaffected", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Immunity to non-damaging magical or psionic conditions (e.g. sleep, paralysis, emotion control)." },
    { id: "undetectable", name: "Undetectable", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Imperceptible to specific sensory bands (invisible to sight, cameras, magic, or psychic senses)." },
    { id: "water_speed", name: "Water Speed", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "High-speed aquatic swimming or naval cruising." },
    { id: "wealth", name: "Wealth", category: "social", costPerLevel: 3, maxLevel: 5, isHuman: true, description: "Level 1: Well-off; Level 2: Rich; Level 3: Multi-millionaire; Level 4: Billionaire / Mega-corp owner." },
    { id: "weapon", name: "Weapon", category: "combat", costPerLevel: 2, maxLevel: 10, isHuman: true, description: "A damaging weapon, signature attack, or energy blast. Inflicts (Level × Damage Multiplier) base damage, plus chosen Enhancements (Armor-Piercing, Area, Stun, Range) and Limiters." }
  ],

  // Skill Groups (BESM 4E Core, p. 120-122)
  skillGroups: [
    // Background Skill Groups (1 CP / Level)
    { id: "academic", name: "Academic", tier: "background", costPerLevel: 1, maxLevel: 6, description: "Language, humanities, history, research, communications, and critical analysis." },
    { id: "artistic", name: "Artistic", tier: "background", costPerLevel: 1, maxLevel: 6, description: "Creative expression, visual arts, music, dance, writing, and aesthetics." },
    { id: "domestic", name: "Domestic", tier: "background", costPerLevel: 1, maxLevel: 6, description: "Daily life skills, culinary arts, home maintenance, sewing, and parenting." },
    { id: "occupation", name: "Occupation (Career)", tier: "background", costPerLevel: 1, maxLevel: 6, description: "Specialized skills tied to a specific vocational trade or daily job." },

    // Field Skill Groups (2 CP / Level)
    { id: "business", name: "Business", tier: "field", costPerLevel: 2, maxLevel: 6, description: "Management, finance, corporate politics, marketing, sales, and administration." },
    { id: "social", name: "Social", tier: "field", costPerLevel: 2, maxLevel: 6, description: "Charm, diplomacy, etiquette, public relations, fast-talking, and negotiation." },
    { id: "street", name: "Street", tier: "field", costPerLevel: 2, maxLevel: 6, description: "Underworld etiquette, black markets, urban survival, gang signs, and streetwise." },
    { id: "technical", name: "Technical", tier: "field", costPerLevel: 2, maxLevel: 6, description: "Mechanics, electronics, hardware repair, programming, and hacking." },

    // Action Skill Groups (3 CP / Level)
    { id: "adventuring", name: "Adventuring", tier: "action", costPerLevel: 3, maxLevel: 6, description: "Wilderness exploration, climbing, swimming, acrobatics, and survival." },
    { id: "detective", name: "Detective", tier: "action", costPerLevel: 3, maxLevel: 6, description: "Forensics, crime scene analysis, surveillance, shadowing, and interrogation." },
    { id: "military", name: "Military", tier: "action", costPerLevel: 3, maxLevel: 6, description: "Troop tactics, chain of command, battlefield navigation, and combat logistics." },
    { id: "scientific", name: "Scientific", tier: "action", costPerLevel: 3, maxLevel: 6, description: "Natural sciences, medicine, first aid, physics, biology, and chemistry." }
  ],

  // Table 14: Defects (BESM 4E Core, p. 155)
  // Lesser: -1/-2/-3 CP (1 CP / Rank)
  // Greater: -2/-4/-6 CP (2 CP / Rank)
  // Serious: -3/-6/-9 CP (3 CP / Rank)
  defects: [
    // Lesser Defects (-1 / -2 / -3 CP)
    { id: "conditional_ownership", name: "Conditional Ownership", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Gear or vehicle is owned by a patron, bank, or agency and may be audited, revoked, or inspected." },
    { id: "easily_distracted", name: "Easily Distracted", category: "lesser", refundPerRank: 1, maxRank: 3, description: "A particular obsession (shiny gadgets, cute animals, attractive people) draws attention away from danger." },
    { id: "fragile", name: "Fragile", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Low physical resilience. Subtracts 5 Maximum Health Points per Rank." },
    { id: "inept_attack", name: "Inept Attack", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Clumsiness or hesitation in battle. Reduces Attack Combat Value (ACV) by -1 per Rank." },
    { id: "inept_defence", name: "Inept Defence", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Slow evasive instincts. Reduces Defence Combat Value (DCV) by -1 per Rank." },
    { id: "involuntary_change", name: "Involuntary Change", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Changes form unexpectedly when exposed to a trigger (cold water, full moon, stress)." },
    { id: "magnet", name: "Magnet", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Attracts trouble, comedic mishaps, or an endless swarm of eccentric admirers." },
    { id: "marked", name: "Marked", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Distinctive physical feature (heterochromia, strange hair, horns, cyberware) making you memorable." },
    { id: "nemesis", name: "Nemesis", category: "lesser", refundPerRank: 1, maxRank: 3, description: "A dedicated rival, school competitor, or personal antagonist who frequently interferes." },
    { id: "nightmares", name: "Nightmares", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Haunted sleep patterns that periodically interfere with natural Energy Point recovery." },
    { id: "phobia", name: "Phobia", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Intense, irrational dread. Suffer Obstacle on actions when confronting the phobic trigger." },
    { id: "red_tape", name: "Red Tape", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Bureaucratic clearance, paperwork, or military oversight delays your missions." },
    { id: "shortcoming", name: "Shortcoming", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Deficiency in one specific aspect of a Stat (e.g. Clumsy Body, Gullible Mind, Weak-Willed Soul)." },
    { id: "significant_other", name: "Significant Other", category: "lesser", refundPerRank: 1, maxRank: 3, description: "A loved one, family member, or friend whom villains target and who requires regular protection." },
    { id: "social_fault", name: "Social Fault", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Rude, arrogant, painfully shy, boastful, or blunt personality flaw." },
    { id: "unappealing", name: "Unappealing", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Unpleasant aesthetic appearance, grotesque traits, or severe social unfriendliness." },

    // Greater Defects (-2 / -4 / -6 CP)
    { id: "achilles_heel", name: "Achilles Heel", category: "greater", refundPerRank: 2, maxRank: 3, description: "Takes double damage from a specific attack type (e.g. silver, wooden stakes, cold iron, electricity)." },
    { id: "bane", name: "Bane", category: "greater", refundPerRank: 2, maxRank: 3, description: "A normally harmless substance (sunlight, running water, garlic, holy water) inflicts severe damage on contact." },
    { id: "blind_fury", name: "Blind Fury", category: "greater", refundPerRank: 2, maxRank: 3, description: "Enters an uncontrollable berserk frenzy in combat, unable to distinguish friend from foe." },
    { id: "cursed", name: "Cursed", category: "greater", refundPerRank: 2, maxRank: 3, description: "Afflicted with a supernatural or karmic misfortune that causes disastrous coincidences." },
    { id: "hounded", name: "Hounded", category: "greater", refundPerRank: 2, maxRank: 3, description: "Actively hunted by corporate mercenaries, cults, alien agents, or bounty syndicates." },
    { id: "ism", name: "Ism (Prejudice)", category: "greater", refundPerRank: 2, maxRank: 3, description: "Target of systemic discrimination, suspicion, or hostility in the local society." },
    { id: "obligated", name: "Obligated", category: "greater", refundPerRank: 2, maxRank: 3, description: "Bound by a strict code of honour, clan oath, or legal duty that cannot be broken." },
    { id: "skeleton_in_the_closet", name: "Skeleton in the Closet", category: "greater", refundPerRank: 2, maxRank: 3, description: "A dark secret that would result in arrest, social ruin, or death if revealed." },
    { id: "vulnerability", name: "Vulnerability", category: "greater", refundPerRank: 2, maxRank: 3, description: "A specific attack form bypasses your Armour, Force Field, or magical resistances entirely." },
    { id: "wanted", name: "Wanted", category: "greater", refundPerRank: 2, maxRank: 3, description: "An active warrant or bounty is out for your arrest or termination by law enforcement." },
    { id: "weak_point", name: "Weak Point", category: "greater", refundPerRank: 2, maxRank: 3, description: "A specific physical weak spot (exhaust port, unarmoured gem, core) that allows critical damage." },

    // Serious Defects (-3 / -6 / -9 CP)
    { id: "confined", name: "Confined", category: "serious", refundPerRank: 3, maxRank: 3, description: "Bound to a specific location, shrine, lamp, or container and cannot leave without permission." },
    { id: "impaired_manipulation", name: "Impaired Manipulation", category: "serious", refundPerRank: 3, maxRank: 3, description: "Lacks hands, fingers, or prehensile limbs to manipulate fine tools or weapons." },
    { id: "impaired_speech", name: "Impaired Speech", category: "serious", refundPerRank: 3, maxRank: 3, description: "Mute, speaks only in clicks/roars, or cannot communicate verbally." },
    { id: "physical_impairment", name: "Physical Impairment", category: "serious", refundPerRank: 3, maxRank: 3, description: "Severe permanent disability: missing limb, paralysis, chronic illness." },
    { id: "reduced_damage", name: "Reduced Damage", category: "serious", refundPerRank: 3, maxRank: 3, description: "Innate weakness or peaceful aura reduces your base Damage Multiplier by -1 per Rank." },
    { id: "sensory_impairment", name: "Sensory Impairment", category: "serious", refundPerRank: 3, maxRank: 3, description: "Complete loss of sight (Blind) or hearing (Deaf)." },
    { id: "special_requirement", name: "Special Requirement", category: "serious", refundPerRank: 3, maxRank: 3, description: "Must consume blood, absorb rare crystals, or perform daily complex rituals to survive." }
  ],

  // Table 16: Target Numbers (BESM 4E Core, p. 177)
  targetNumbers: [
    { target: 6, label: "Routine", example: "Simple lock, clear driving, basic first aid" },
    { target: 8, label: "Easy", example: "Bypassing basic security, minor vehicle stunts" },
    { target: 10, label: "Moderate", example: "Standard task under pressure, decoding encrypted comms" },
    { target: 12, label: "Challenging", example: "Cracking a corporate mainframe, surgery in the field" },
    { target: 14, label: "Difficult", example: "Disarming high-yield explosive, hitting target in dense fog" },
    { target: 16, label: "Extreme", example: "Dodging point-blank blast, deciphering dead alien language" },
    { target: 18, label: "Heroic", example: "Near-miraculous feats bordering on legendary anime glory" },
    { target: 20, label: "Mythical", example: "Feats thought impossible for mortals" }
  ],

  // Archetype Presets (BESM 4E Heroic Sweet Spot - 75 CP)
  templates: [
    {
      id: "magical_girl",
      name: "Magical Girl (Champion of Light)",
      concept: "High school student blessed with sparkling supernatural guardian powers and pure determination",
      tier: "heroic",
      points: 75,
      stats: { body: 4, mind: 5, soul: 8 },
      attributes: [
        { id: "alternate_form", name: "Alternate Form (Transformation)", level: 2, costPerLevel: 4, customDesc: "Instant magical costume change with mystical fanfare and floating ribbons" },
        { id: "dynamic_powers", name: "Dynamic Powers (Starlight & Healing)", level: 1, costPerLevel: 10, customDesc: "Spontaneous manipulation of pure luminous radiant energy" },
        { id: "flight", name: "Flight", level: 1, costPerLevel: 3, customDesc: "Graceful levitation and gliding on glowing starlight trails" },
        { id: "force_field", name: "Force Field", level: 2, costPerLevel: 4, customDesc: "Radiant barrier providing +20 Armour Rating" },
        { id: "energised", name: "Energised", level: 2, costPerLevel: 1, customDesc: "Abundant spiritual essence adding +20 Energy Points" },
        { id: "mulligan", name: "Mulligan (Anime Luck)", level: 1, costPerLevel: 1, customDesc: "Once per session reroll on critical rolls" },
        { id: "weapon", name: "Weapon (Starlight Prism Beam)", level: 3, costPerLevel: 2, customDesc: "Damage 15, Range 25m, Piercing Light Beam" }
      ],
      skillGroups: [
        { id: "artistic", name: "Artistic", tier: "background", level: 2, costPerLevel: 1 },
        { id: "social", name: "Social", tier: "field", level: 2, costPerLevel: 2 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 1, costPerLevel: 3 }
      ],
      defects: [
        { id: "involuntary_change", name: "Involuntary Change", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Reverts to ordinary schoolgirl form when Energy Points hit 0" },
        { id: "significant_other", name: "Significant Other", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "High school best friend who constantly wanders into supernatural peril" },
        { id: "obligated", name: "Obligated (Code of Honour)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Vow to protect the innocent and never use powers for selfish gain" }
      ],
      weapons: [
        { name: "Starlight Prism Beam", level: 3, range: "25m", enhancements: "Armour-Piercing, Accurate", limiters: "Concentration", notes: "Fired from magical wand or compact" }
      ],
      gear: "Mystical Transformation Brooch, school uniform, enchanted fairy companion familiar, smartphone"
    },
    {
      id: "mecha_ace",
      name: "Mecha Pilot (Armored Ace)",
      concept: "Skilled tactical pilot operating a high-performance humanoid combat frame",
      tier: "heroic",
      points: 75,
      stats: { body: 5, mind: 6, soul: 4 },
      attributes: [
        { id: "item", name: "Item (Combat Exo-Frame)", level: 10, costPerLevel: 0.5, customDesc: "Custom high-mobility humanoid combat mecha unit" },
        { id: "armour", name: "Armour (Reinforced Chobham Alloy)", level: 3, costPerLevel: 2, customDesc: "Hardened physical plates providing 15 Armour Rating" },
        { id: "attack_mastery", name: "Attack Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Attack Combat Value with gunnery and mecha weaponry" },
        { id: "defence_mastery", name: "Defence Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Defence Combat Value through evasive thruster maneuvering" },
        { id: "data_access", name: "Data Access (Neural Uplink)", level: 2, costPerLevel: 2, customDesc: "Direct neural link to tactical mainframe and radar arrays" },
        { id: "tough", name: "Tough", level: 2, costPerLevel: 1, customDesc: "High G-force physical endurance adding +20 Health Points" },
        { id: "weapon", name: "Weapon (Twin Rotary Cannons)", level: 4, costPerLevel: 2, customDesc: "Damage 20, Range 100m, Rapid Fire" },
        { id: "weapon", name: "Weapon (High-Frequency Vibro-Blade)", level: 3, costPerLevel: 2, customDesc: "Damage 15, Melee, Armour-Piercing" }
      ],
      skillGroups: [
        { id: "technical", name: "Technical", tier: "field", level: 3, costPerLevel: 2 },
        { id: "military", name: "Military", tier: "action", level: 2, costPerLevel: 3 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 1, costPerLevel: 3 }
      ],
      defects: [
        { id: "conditional_ownership", name: "Conditional Ownership", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Mecha unit is property of Earth Defence Taskforce; subject to military audit" },
        { id: "nemesis", name: "Nemesis", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Rival enemy ace pilot in crimson custom prototype unit" },
        { id: "red_tape", name: "Red Tape", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Mission deployment requires command staff clearance" }
      ],
      weapons: [
        { name: "Twin Rotary Cannons", level: 4, range: "100m", enhancements: "Rapid Fire, Accurate", limiters: "Charges", notes: "Mounted on shoulder pylons" },
        { name: "Vibro-Blade", level: 3, range: "Melee", enhancements: "Armour-Piercing", limiters: "Melee", notes: "High frequency edge cuts through hull plate" }
      ],
      gear: "Flight flightsuit, tactical neural helmet, sidearm pistol, military ID dog tags"
    },
    {
      id: "cyber_ninja",
      name: "Cyber-Ninja (Urban Shinobi)",
      concept: "Augmented martial operative specializing in rooftop surveillance, silent takedowns, and corporate infiltration",
      tier: "heroic",
      points: 75,
      stats: { body: 6, mind: 5, soul: 4 },
      attributes: [
        { id: "superspeed", name: "Superspeed", level: 1, costPerLevel: 3, customDesc: "Short burst sprint speeds up to 100 kph" },
        { id: "special_movement", name: "Special Movement (Wall-Crawling, Light-Footed, Fast)", level: 3, costPerLevel: 1, customDesc: "Scaling vertical glass facades and landing soundlessly" },
        { id: "combat_technique", name: "Combat Technique (Lightning Reflexes, Blind-Fighting, Deflection)", level: 3, costPerLevel: 1, customDesc: "Parries incoming bullets and reacts instantly to ambushes" },
        { id: "attack_mastery", name: "Attack Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Attack Combat Value" },
        { id: "defence_mastery", name: "Defence Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Defence Combat Value" },
        { id: "heightened_senses", name: "Heightened Senses (Thermal & Cyber-Optics)", level: 2, costPerLevel: 1, customDesc: "Sees through walls and darkness in thermal spectrum" },
        { id: "undetectable", name: "Undetectable (Optical & Radar Camouflage)", level: 2, costPerLevel: 2, customDesc: "Active thermo-optic cloaking renders invisible to cameras and eyes" },
        { id: "weapon", name: "Weapon (Mono-Molecular Katana)", level: 3, costPerLevel: 2, customDesc: "Damage 15, Melee, Armour-Piercing" },
        { id: "weapon", name: "Weapon (Shock Kunai & Shuriken)", level: 2, costPerLevel: 2, customDesc: "Damage 10, Range 25m, Stun" }
      ],
      skillGroups: [
        { id: "detective", name: "Detective", tier: "action", level: 3, costPerLevel: 3 },
        { id: "street", name: "Street", tier: "field", level: 3, costPerLevel: 2 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "wanted", name: "Wanted (Zaibatsu Syndicate)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Bounty on your head from former corporate employers" },
        { id: "skeleton_in_the_closet", name: "Skeleton in the Closet", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Involved in secret black-ops project that must never be revealed" },
        { id: "phobia", name: "Phobia (Electromagnetic Pulses)", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Dread of cybernetic system blackout" }
      ],
      weapons: [
        { name: "Mono-Molecular Katana", level: 3, range: "Melee", enhancements: "Armour-Piercing, Accurate", limiters: "Melee", notes: "Nanotech honed edge" },
        { name: "Shock Kunai", level: 2, range: "25m", enhancements: "Stun, Concealable", limiters: "Charges", notes: "High voltage capacitor discharge" }
      ],
      gear: "Thermo-optic shinobi suit, grappling line launcher, encrypted memory chips, smoke pellets"
    }
  ]
};

// Backwards compatibility alias
const TRI_STAT_RULES = BESM4E_RULES;

// Freeze rules to prevent accidental mutation
if (typeof Object.freeze === "function") {
  Object.freeze(BESM4E_RULES);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = BESM4E_RULES;
  global.BESM4E_RULES = BESM4E_RULES;
  global.TRI_STAT_RULES = BESM4E_RULES;
}
