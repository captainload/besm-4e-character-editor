/**
 * Big Eyes, Small Mouth (BESM) 4th Edition - Rules Engine & Data Catalog
 * Based on the official BESM Fourth Edition core rulebook and BESM Extras by Dyskami Publishing / White Wolf.
 */

const BESM4E_RULES = {
  systemName: "Big Eyes, Small Mouth 4th Edition (BESM 4E) & BESM Extras",
  version: "4.1",
  
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
    calculateCV: (body, mind, soul) => Math.floor(((body || 0) + (mind || 0) + (soul || 0)) / 3),
    calculateHP: (body, soul, toughLvl = 0) => ((body || 0) + (soul || 0)) * 5 + (toughLvl * 10),
    calculateEP: (mind, soul, energisedLvl = 0) => ((mind || 0) + (soul || 0)) * 5 + (energisedLvl * 10),
    calculateDM: (massiveDmgLvl = 0) => 5 + massiveDmgLvl,
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
    { id: "social", name: "Social, Wealth & Containers" }
  ],

  // Table 07: Character Attributes (BESM 4E Core, p. 77 & BESM Extras)
  attributes: [
    { id: "absorption", name: "Absorption", category: "supernatural", costPerLevel: 5, maxLevel: 6, isHuman: false, description: "Absorbs incoming energy or kinetic attacks and converts them into Health or Energy Points." },
    { id: "alternate_form", name: "Alternate Form", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, isContainer: true, containerType: "alternate_form", description: "Grants access to a completely different transformed state (magical girl, mecha, beast) built on 10 Character Points per Level with independent stats." },
    { id: "alternate_identity", name: "Alternate Identity", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Maintains distinct public, civilian, or secret personas that differ in appearance, status, and legal documentation." },
    { id: "armour", name: "Armour", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Provides an Armour Rating (AR) of 5 per Level, subtracting that damage from every incoming attack." },
    { id: "attack_mastery", name: "Attack Mastery", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Mastery of offensive combat arts. Increases Attack Combat Value (ACV) by +1 per Level for all attacks." },
    { id: "augmented", name: "Augmented", category: "physical", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Increases one chosen Stat (Body, Mind, or Soul) by +1 Stat Value per Level through external magic, cybernetics, or science." },
    { id: "capacity", name: "Capacity", category: "social", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Ability to carry extra passengers or cargo inside the character, vehicle, or robot." },
    { id: "change_state", name: "Change State", category: "supernatural", costPerLevel: 3, maxLevel: 4, isHuman: false, description: "Transforms into gaseous, liquid, incorporeal, or energy states to slip through barriers or become immune to normal physical strikes." },
    { id: "chassis", name: "Chassis (Mecha / Vehicle Frame)", category: "social", costPerLevel: 0.5, maxLevel: 20, isHuman: true, isContainer: true, containerType: "chassis", description: "A mechanical mecha frame, android body, cybernetic shell, vehicle hull, or starship structure. Point cost is one-half of all contained traits (BESM Extras)." },
    { id: "cognition", name: "Cognition", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Glimpses into the future (precognition) or past (retrocognition) to obtain crucial clues." },
    { id: "combat_technique", name: "Combat Technique", category: "combat", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Specific martial manoeuvres: Blind Fighting, Brutal, Critical Strike, Dead Eye, Deflection, Hardboiled, Judge Opponent, Lethal Strike, Lightning Reflexes, Multiple Targets, Portable Armoury, Steady Hand, Two Weapons, or Weapons Flurry." },
    { id: "companion", name: "Companion", category: "social", costPerLevel: 4, maxLevel: 6, isHuman: true, isContainer: true, containerType: "companion", description: "A loyal ally, magical mascot, combat familiar, pet monster, or robot partner built on 10 Character Points per Level with independent stats." },
    { id: "connected", name: "Connected", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Social networks, intelligence contacts, corporate standing, or underworld ties." },
    { id: "control_environment", name: "Control Environment", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Manipulates atmospheric temperature, weather, gravity, or ambient conditions in a zone." },
    { id: "conversion", name: "Conversion", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Converts Health Points directly into Energy Points, or vice versa, at a rapid rate." },
    { id: "data_access", name: "Data Access", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Direct neural or wireless uplink to computer networks, databases, satellite arrays, and artificial intelligences." },
    { id: "death_dodge", name: "Death Dodge", category: "combat", costPerLevel: 1, maxLevel: 3, isHuman: true, description: "Once per story arc per Level, narrowly avoid an otherwise fatal attack or lethal blow through heroic anime grit or sheer serendipity (BESM Extras)." },
    { id: "debilitate", name: "Debilitate", category: "combat", costPerLevel: 1, maxLevel: 5, isHuman: true, description: "Attacks target nerve clusters or mechanical joints, imposing condition penalties (Lethargic, Stunned, Tangled) on the target (BESM Extras)." },
    { id: "defence_mastery", name: "Defence Mastery", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Combat evasion, parrying, and deflection expertise. Increases Defence Combat Value (DCV) by +1 per Level." },
    { id: "dimension_walk", name: "Dimension Walk", category: "supernatural", costPerLevel: 5, maxLevel: 4, isHuman: false, description: "Opens pathways between different planes of existence, alternate timelines, or the multiverse." },
    { id: "dynamic_powers", name: "Dynamic Powers", category: "supernatural", costPerLevel: 10, maxLevel: 4, isHuman: false, description: "Broad mastery over a domain of magic or reality (e.g. Elemental Fire, Sorcery, Technology Manipulation) to produce spontaneous effects." },
    { id: "elasticity", name: "Elasticity", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Extends, stretches, and contorts limbs over significant distances." },
    { id: "enemy_attack", name: "Enemy Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialised attack training that grants +2 ACV when targeting a specific enemy species or faction." },
    { id: "enemy_defence", name: "Enemy Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialised evasive tactics that grant +2 DCV against attacks from a specific enemy species or faction." },
    { id: "energised", name: "Energised", category: "supernatural", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Deep reservoirs of stamina and spiritual essence. Adds +10 Energy Points (EP) per Level." },
    { id: "exorcism", name: "Exorcism", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Banishes, dispels, or repels supernatural entities, demons, spirits, and possessive entities." },
    { id: "expertise", name: "Expertise", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialisation mastery in specific tasks (+1 roll bonus per Level when performing actions within your chosen area of expertise) (BESM Extras)." },
    { id: "extra_actions", name: "Extra Actions", category: "combat", costPerLevel: 4, maxLevel: 4, isHuman: true, description: "Grants one additional Attack or Defence action per combat round per Level." },
    { id: "extra_arms", name: "Extra Arms", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Additional biological, mechanical, or psychic appendages capable of manipulating tools or weapons." },
    { id: "extra_defenses", name: "Extra Defenses", category: "defence", costPerLevel: 2, maxLevel: 4, isHuman: true, description: "Grants one additional Defence check per combat round per Level (BESM Extras)." },
    { id: "features", name: "Features", category: "social", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Distinct anime traits: Appearance (Strikingly Cute / Bishojo), Eidetic Memory, Mimic Voice, Scentless, Internal Compass, etc." },
    { id: "flank_defense", name: "Flank Defense", category: "defence", costPerLevel: 1, maxLevel: 3, isHuman: true, description: "Eliminates or reduces flanking and surprise attack penalties when fighting multiple surrounding opponents (BESM Extras)." },
    { id: "flight", name: "Flight", category: "physical", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Airborne locomotion via wings, anti-gravity, magical levitation, or rocket propulsion." },
    { id: "force_field", name: "Force Field", category: "defence", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Creates an energy barrier providing an Armour Rating of 10 per Level against all attacks." },
    { id: "gear", name: "Gear", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Access to uncommon equipment, specialty kits, surveillance drones, and vehicles." },
    { id: "ground_speed", name: "Ground Speed", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Rapid overland ground movement for vehicles, mecha, or sprint specialists." },
    { id: "healing", name: "Healing", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Restores Health Points to injured living subjects through first aid, medicine, or magical curative touch." },
    { id: "heightened_awareness", name: "Heightened Awareness", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Acute perception and sixth sense. Adds +2 per Level to all Mind and Soul checks to notice hidden threats or traps." },
    { id: "heightened_senses", name: "Heightened Senses", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Exceptional eyesight, hearing, smell, or taste operating well beyond human acuity." },
    { id: "illusion", name: "Illusion", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Creates realistic sensory mirages in the minds of targets or hologram projections." },
    { id: "immovable", name: "Immovable", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Immense physical mass, gyroscopic stabilisers, or anchoring magic that resists knockback, forced displacement, and trips (BESM Extras)." },
    { id: "immunity", name: "Immunity", category: "defence", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Complete invulnerability to a specific environmental hazard: electricity, fire, cold, radiation, toxins, or vacuum." },
    { id: "immutable", name: "Immutable", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Resists forced shapechanging, petrification, transmutation, and size alteration." },
    { id: "inspire", name: "Inspire", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Oratory leadership that grants allies temporary bonuses to Combat Values or dice rolls." },
    { id: "item", name: "Item", category: "social", costPerLevel: 0.5, maxLevel: 20, isHuman: true, isContainer: true, containerType: "item", description: "Purchases vehicles, weapons, magical gear, or tech gadgets. Point cost is one-half the total value of all Attributes, Defects, and traits built into the Item (minimum 0)." },
    { id: "jumping", name: "Jumping", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Superhuman vertical and horizontal leap distances." },
    { id: "massive_damage", name: "Massive Damage", category: "combat", costPerLevel: 3, maxLevel: 6, isHuman: true, description: "Devastating striking power. Increases Damage Multiplier (DM) by +1 per Level for all attacks." },
    { id: "melee_attack", name: "Melee Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialized training with a specific melee weapon or hand-to-hand style (+1 ACV per Level with that weapon)." },
    { id: "melee_defence", name: "Melee Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Specialized defense training against close-quarters attacks (+1 DCV vs melee per Level)." },
    { id: "merge", name: "Merge", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Ability to combine with other characters or mecha into a single powerful composite being (classic combiner mecha!)." },
    { id: "metamorphosis", name: "Metamorphosis", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Alters cosmetic appearance, gender, species, or apparent age at will." },
    { id: "mimic", name: "Mimic", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Temporarily copies the attributes, powers, or skills of an observed target." },
    { id: "mind_control", name: "Mind Control", category: "mental", costPerLevel: 5, maxLevel: 6, isHuman: false, description: "Enforces mental domination or hypnotic commands over sentient beings." },
    { id: "mind_shield", name: "Mind Shield", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Mental fortitude against psionic intrusion, mind reading, and illusion (+2 to Mind Stat defence per Level)." },
    { id: "minions", name: "Minions", category: "social", costPerLevel: 2, maxLevel: 6, isHuman: true, isContainer: true, containerType: "minions", description: "A squad or army of loyal subordinates, corporate guards, or summoned drones built with Character Points." },
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
    { id: "social_mastery", name: "Social Mastery", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Superior social poise, commanding presence, and psychological insight in negotiations (+1 to all social skill and influence rolls per Level) (BESM Extras)." },
    { id: "spaceflight", name: "Spaceflight", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Propulsion in deep vacuum and interplanetary transit." },
    { id: "special_movement", name: "Special Movement", category: "physical", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Balance, Cat-Like, Fast, Light-Footed, Slithering, Swinging, Untrackable, Wall-Bouncing, Wall-Crawling, Water-Walking, or Zen Direction." },
    { id: "speed_burst", name: "Speed Burst", category: "physical", costPerLevel: 1, maxLevel: 4, isHuman: true, description: "Temporarily doubles movement speeds for brief tactical sprints or evasive dashes in combat (BESM Extras)." },
    { id: "summon_creatures", name: "Summon Creatures", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Summons and commands swarms of animals or weak dimensional creatures." },
    { id: "supersense", name: "Supersense", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Echolocation, infrared vision, radar, magnetic field detection, or x-ray sight." },
    { id: "superspeed", name: "Superspeed", category: "physical", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Blistering velocities from 100 kph (Level 1) to 30,000 kph (Level 6)." },
    { id: "superstrength", name: "Superstrength", category: "physical", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Colossal physical power. Adds +1 Damage Multiplier per Level for muscle-powered attacks and immense lifting capacity." },
    { id: "swarm", name: "Swarm", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Body disperses into a cloud of insects, bats, nanites, or mist." },
    { id: "taunt", name: "Taunt", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Combat demoralisation. Provokes, distracts, or enrages opponents, imposing -1 penalty per Level to their checks or luring them out of position (BESM Extras)." },
    { id: "telekinesis", name: "Telekinesis", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, description: "Moves, lifts, and throws physical objects using purely psychic or magical will." },
    { id: "telepathy", name: "Telepathy", category: "mental", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Mind-to-mind communication, thought reading, and broadcasting." },
    { id: "teleport", name: "Teleport", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Instantaneous spatial transit from 10 meters to global range." },
    { id: "tough", name: "Tough", category: "physical", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Physical fortitude and constitution. Adds +10 Maximum Health Points (HP) per Level." },
    { id: "transfer", name: "Transfer", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Bestows temporary attribute levels or energy points to allies." },
    { id: "transmute", name: "Transmute", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Alchemically transforms one physical element or material into another." },
    { id: "tunnelling", name: "Tunnelling", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Burrows through dirt, solid stone, or reinforced concrete." },
    { id: "unaffected", name: "Unaffected", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Immunity to non-damaging magical or psionic conditions (e.g. sleep, paralysis, emotion control)." },
    { id: "unassailable", name: "Unassailable", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Unyielding mental and spiritual fortitude. Provides resistance and Armour Rating against sanity loss, terror, psychic trauma, and corruption (BESM Extras)." },
    { id: "undetectable", name: "Undetectable", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: false, description: "Imperceptible to specific sensory bands (invisible to sight, cameras, magic, or psychic senses)." },
    { id: "water_speed", name: "Water Speed", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "High-speed aquatic swimming or naval cruising." },
    { id: "wealth", name: "Wealth", category: "social", costPerLevel: 3, maxLevel: 5, isHuman: true, description: "Level 1: Well-off; Level 2: Rich; Level 3: Multi-millionaire; Level 4: Billionaire / Mega-corp owner." },
    { id: "weapon", name: "Weapon", category: "combat", costPerLevel: 2, maxLevel: 10, isHuman: true, description: "A damaging weapon, signature attack, or energy blast. Inflicts (Level × Damage Multiplier) base damage, plus chosen Enhancements (Armor-Piercing, Area, Stun, Range) and Limiters." }
  ],

  // Skill Groups with Complete Constituent Skills Lists (BESM 4E Core, p. 120-122 & BESM Extras)
  skillGroups: [
    // Background Skill Groups (1 CP / Level)
    {
      id: "academic",
      name: "Academic",
      tier: "background",
      costPerLevel: 1,
      maxLevel: 6,
      description: "Language, humanities, history, research, communications, and critical analysis.",
      skills: [
        { id: "area_knowledge", name: "Area Knowledge", stat: "Mind", description: "Familiarity with geography, landmarks, culture, and personalities of a designated city, province, or realm.", specializations: ["One specific locale"] },
        { id: "civilisation", name: "Civilisation", stat: "Mind", description: "Understanding history, traditions, laws, customs, and structure of a specific society or population.", specializations: ["One specific culture or population"] },
        { id: "cultural_arts", name: "Cultural Arts", stat: "Mind", description: "Scholarly appreciation and history of fine arts, gastronomy, literature, mythology, nobility, and philosophy.", specializations: ["Gastronomy", "History", "Literature", "Mythology", "Nobility", "Philosophy", "Rare Object Appraisal", "Urban Legends"] },
        { id: "history", name: "History", stat: "Mind", description: "In-depth knowledge of historical eras, conflicts, geopolitical treaties, and dynasties.", specializations: ["Ancient", "Medieval", "Modern", "Military", "Diplomatic", "Galactic"] },
        { id: "languages", name: "Languages", stat: "Mind", description: "Speaking, reading, writing, translation, and cryptography across spoken, written, or visual tongues.", specializations: ["Any single language", "Braille", "Code Language", "Lip-Reading", "Sign Language"] },
        { id: "law", name: "Law", stat: "Mind", description: "Statutes, legal precedents, courtroom advocacy, contracts, civil rights, and criminal codes.", specializations: ["Civil", "Criminal", "Customs", "Family", "International", "Political", "Real Estate"] },
        { id: "philosophy", name: "Philosophy", stat: "Mind", description: "Schools of logic, ethics, epistemology, metaphysics, and political theory.", specializations: ["Ethics", "Logic", "Metaphysics", "Political Philosophy", "Eastern", "Western"] },
        { id: "religion", name: "Religion", stat: "Soul", description: "Theological scriptures, religious dogma, holy rituals, sacred rites, and ecclesiastical hierarchy.", specializations: ["Academic", "Dogma", "Congregational", "Context", "Enlightenment", "Guidance", "Interpretation", "Scripture"] },
        { id: "social_sciences", name: "Social Sciences", stat: "Mind", description: "Systematic study of human societies, behavior, archaeology, and institutions.", specializations: ["Archaeology", "Anthropology", "Communication", "Education", "Politics", "Psychology", "Social Work", "Sociology"] },
        { id: "writing", name: "Writing", stat: "Mind", description: "Composition of prose, investigative journalism, technical documentation, poetry, or fiction.", specializations: ["Academic", "Fiction", "Journalistic", "Poetic", "Religious", "Technical"] }
      ]
    },
    {
      id: "artistic",
      name: "Artistic",
      tier: "background",
      costPerLevel: 1,
      maxLevel: 6,
      description: "Creative expression, visual arts, music, dance, writing, craft, and aesthetics.",
      skills: [
        { id: "artisan", name: "Artisan", stat: "Body", description: "Manual mastery of fine functional crafts, construction, and materials fabrication.", specializations: ["Blacksmith", "Bowyer-Fletcher", "Carpentry", "Enchanting Objects", "Leatherworking", "Metalworking", "Plumbing", "Pottery", "Tailoring", "Woodworking"] },
        { id: "performing_arts", name: "Performing Arts", stat: "Soul", description: "Live presentation, theatrical stage presence, dance, instrument mastery, and vocal performance.", specializations: ["Comedy", "Dance", "Drama", "Musical Instrument", "Public Speaking", "Singing"] },
        { id: "visual_arts", name: "Visual Arts", stat: "Mind", description: "Static visual media, fine arts creation, digital graphic design, and sculpting.", specializations: ["Animation", "Carving", "Drawing", "Flower Arranging", "Painting", "Photography", "Sculpting", "Video"] }
      ]
    },
    {
      id: "domestic",
      name: "Domestic",
      tier: "background",
      costPerLevel: 1,
      maxLevel: 6,
      description: "Daily life skills, culinary arts, home maintenance, sewing, animal care, and parenting.",
      skills: [
        { id: "animal_training", name: "Animal Training", stat: "Soul", description: "Conditioning, obedience training, commands, and compassionate care of animals.", specializations: ["Any single animal species (Canines, Felines, Equines, Birds, Beasts)"] },
        { id: "childrearing", name: "Childrearing", stat: "Soul", description: "Nurturing, discipline, education, pediatric health, and moral development of children.", specializations: ["Infants", "Toddlers", "Adolescents", "Special Needs"] },
        { id: "cleaning_maintenance", name: "Cleaning & Maintenance", stat: "Body", description: "Hygiene, deep domestic sanitation, laundry, stain removal, and organization.", specializations: ["Detailed Cleaning", "Deep Sanitation", "Hazard Cleanup", "Organizing"] },
        { id: "cooking", name: "Cooking (Gastronomy)", stat: "Mind", description: "Culinary preparation, recipe invention, baking, butchery, and gourmet banqueting.", specializations: ["Baking", "Brewing", "Comfort Food", "Exotic Cuisine", "Gourmet", "Traditional"] },
        { id: "decorating", name: "Decorating", stat: "Mind", description: "Interior aesthetics, lighting, furniture layout, color palettes, and living ambiance.", specializations: ["Feng Shui", "Minimalist", "Opulent", "Practical", "Thematic"] },
        { id: "domestic_arts", name: "Domestic Arts", stat: "Soul", description: "Holistic household management, home remedies, thrift, and hospitable living.", specializations: ["Childrearing", "Cleaning", "Cooking", "Decorating", "Gardening", "Home Budgeting"] },
        { id: "gardening", name: "Gardening", stat: "Mind", description: "Botany, horticulture, hydroponics, floral landscaping, and seasonal crop cultivation.", specializations: ["Bonsai", "Floral", "Greenhouse", "Hydroponics", "Vegetable Garden"] },
        { id: "home_budgeting", name: "Home Budgeting", stat: "Mind", description: "Household accounting, bill management, bulk provisioning, and fiscal thriftiness.", specializations: ["Frugality", "Investment", "Resource Allocation"] }
      ]
    },
    {
      id: "occupation",
      name: "Occupation (Career)",
      tier: "background",
      costPerLevel: 1,
      maxLevel: 6,
      description: "Specialized skills tied to a specific vocational trade or daily career job.",
      skills: [
        { id: "agriculture", name: "Agriculture", stat: "Body", description: "Farming, livestock rearing, commercial crop harvesting, orchard management, and aquaculture.", specializations: ["Crops", "Dairy", "Forestry", "Livestock", "Orchard", "Vineyard"] },
        { id: "construction", name: "Construction", stat: "Body", description: "Building framing, masonry, heavy industrial machinery, demolition, and structural assembly.", specializations: ["Commercial", "Demolition", "Heavy Machinery", "Residential"] },
        { id: "food_service", name: "Food Service & Hospitality", stat: "Mind", description: "Restaurant workflow, customer hospitality, bartending, hotel guest relations, and catering.", specializations: ["Bartending", "Concierge", "Event Hosting", "Kitchen Operations"] },
        { id: "office_administration", name: "Office Administration", stat: "Mind", description: "Executive support, document filing, schedule coordination, clerical workflow, and communications.", specializations: ["Data Entry", "Executive Assistant", "Records Management"] },
        { id: "retail_sales", name: "Retail & Merchandising", stat: "Soul", description: "Customer service, inventory reconciliation, floor display, cashier systems, and retail sales.", specializations: ["Luxury Goods", "Wholesale", "General Retail"] },
        { id: "security_guarding", name: "Security & Guarding", stat: "Body", description: "Physical access control, premise perimeter patrols, VIP escort, and watchkeeping.", specializations: ["VIP Protection", "Facility Security", "Night Patrol"] },
        { id: "trade_craft", name: "Trade & Blue-Collar Craft", stat: "Body", description: "Skilled vocational trade: electrician, plumber, machinist, welder, carpenter, or mechanic.", specializations: ["Electrician", "Machinist", "Mechanic", "Plumber", "Welder"] },
        { id: "specific_career", name: "Designated Career Vocation", stat: "Mind", description: "Professional mastery in an individualized vocation not covered by other groups.", specializations: ["One specific vocation"] }
      ]
    },

    // Field Skill Groups (2 CP / Level)
    {
      id: "business",
      name: "Business",
      tier: "field",
      costPerLevel: 2,
      maxLevel: 6,
      description: "Management, finance, corporate politics, marketing, sales, and administration.",
      skills: [
        { id: "accounting", name: "Accounting", stat: "Mind", description: "Financial ledgers, corporate audits, balance sheets, taxes, and fiscal compliance.", specializations: ["Corporate", "Forensic", "Personal", "Tax"] },
        { id: "administration", name: "Administration", stat: "Mind", description: "Corporate structural operations, executive workflow, organizational logistics, and personnel.", specializations: ["Corporate", "Healthcare", "Non-Profit", "Public Sector"] },
        { id: "economics", name: "Economics", stat: "Mind", description: "Market trends, macroeconomic forecasting, pricing theory, trade flows, and supply/demand dynamics.", specializations: ["Corporate Finance", "Macroeconomics", "Market Analysis", "Microeconomics"] },
        { id: "executive", name: "Executive Management", stat: "Mind", description: "Boardroom governance, high-stakes crisis response, merger acquisitions, and corporate strategy.", specializations: ["Crisis Management", "Strategic Planning", "Venture Capital"] },
        { id: "fraud_detection", name: "Fraud Detection", stat: "Mind", description: "Identifying corporate embezzlement, laundering operations, insider trading, and falsified ledgers.", specializations: ["Corporate", "Embezzlement", "Identity Fraud", "Money Laundering"] },
        { id: "government_liaison", name: "Government Liaison", stat: "Soul", description: "Regulatory filings, municipal zoning, political lobbying, and state contract bidding.", specializations: ["Defense Contracts", "Municipal", "National", "Regulatory Compliance"] },
        { id: "management", name: "Management", stat: "Soul", description: "Team supervision, project roadmaps, human resources, workflow optimization, and leadership.", specializations: ["Agile", "Human Resources", "Operations", "Project Management"] },
        { id: "marketing", name: "Marketing", stat: "Mind", description: "Consumer analytics, brand image, public advertising campaigns, viral outreach, and press releases.", specializations: ["Digital Campaigns", "Public Relations", "Research", "Social Media"] },
        { id: "negotiating", name: "Negotiating", stat: "Soul", description: "Contractual compromise, deal arbitration, leverage assessment, and high-stakes settlement.", specializations: ["Commercial", "Labor Union", "Mergers & Acquisitions", "Vendor Contracts"] },
        { id: "sales", name: "Sales", stat: "Soul", description: "Direct pitching, pipeline development, relationship cultivation, client acquisition, and closing accounts.", specializations: ["B2B", "Direct Sales", "High-Tech", "Luxury Retail"] }
      ]
    },
    {
      id: "social",
      name: "Social",
      tier: "field",
      costPerLevel: 2,
      maxLevel: 6,
      description: "Charm, diplomacy, etiquette, public relations, fast-talking, empathy, and negotiation.",
      skills: [
        { id: "bribery", name: "Bribery", stat: "Mind", description: "Assessing corruptibility, establishing deniability, and determining the appropriate payoff price.", specializations: ["Corporate", "Customs", "Judicial", "Police", "Political"] },
        { id: "deception", name: "Deception (Bluffing)", stat: "Soul", description: "Telling convincing falsehoods, maintaining cover stories under pressure, and poker face.", specializations: ["Impersonation", "Misdirection", "Poker Face", "White Lies"] },
        { id: "disguise", name: "Disguise", stat: "Mind", description: "Transforming physical appearance through make-up, prosthetics, body language, and voice modulation.", specializations: ["Costume", "Impersonation", "Make-Up", "Prosthetics"] },
        { id: "etiquette", name: "Etiquette", stat: "Mind", description: "Adhering to expected protocol, courtesies, customs, honorifics, and social ranks.", specializations: ["Alien", "Diplomatic", "High Society", "Lower-Class", "Middle-Class", "Military", "Underworld", "Upper-Class"] },
        { id: "interpersonal", name: "Interpersonal (Empathy)", stat: "Soul", description: "Reading emotional subtext, micro-expressions, body language, motivations, and hidden anxieties.", specializations: ["Body Language", "Calming", "Interpreting Words", "Intuition", "Lie Detection", "Listening"] },
        { id: "leadership", name: "Leadership", stat: "Soul", description: "Rallying followers, boosting morale under fire, inspiring unit loyalty, and decisive direction.", specializations: ["Business", "Co-Operative", "Military", "Political", "Spiritual", "Strategic", "Transformational"] },
        { id: "persuasion", name: "Persuasion", stat: "Soul", description: "Debate, logical rhetoric, charismatic advocacy, fast-talking, and converting viewpoints.", specializations: ["Bluffing", "Bribery", "Diplomacy", "Emotional", "Fast-Talking", "Hypnosis", "Logic", "Mediation", "Rhetoric", "Social-Networking", "Storytelling"] },
        { id: "seduction", name: "Seduction", stat: "Soul", description: "Romantic allure, flirting, provocative charm, magnetism, and captivating emotional appeal.", specializations: ["Emotional", "Mental", "Physical", "Political", "Social", "Spiritual", "Verbal"] }
      ]
    },
    {
      id: "street",
      name: "Street",
      tier: "field",
      costPerLevel: 2,
      maxLevel: 6,
      description: "Underworld etiquette, black markets, urban survival, gang signs, lock-picking, and streetwise.",
      skills: [
        { id: "burglary", name: "Burglary", stat: "Body", description: "Breaking and entering, picking locks, bypassing electronic alarms, and safe cracking.", specializations: ["Breaking and Entering", "Disarming Physical Traps", "Hot-Wiring", "Safe-Cracking"] },
        { id: "card_sharking", name: "Card-Sharking", stat: "Body", description: "Manipulating cards, stacking decks, cheating in games of chance, and palming game tokens.", specializations: ["Dice Manipulation", "Marked Decks", "Palming", "Second Dealing"] },
        { id: "forgery", name: "Forgery", stat: "Mind", description: "Falsifying official documents, signatures, passports, corporate badges, and paper currency.", specializations: ["Artwork", "Electronic Documents", "Financial Notes", "Handwriting", "Paper Documents", "Physical Objects"] },
        { id: "gaming", name: "Gaming (Gambling)", stat: "Mind", description: "Calculating statistical odds, betting strategies, card counting, and board game tactics.", specializations: ["Board Games", "Card Games", "Computer Games", "Gambling", "Military Simulations", "Role-Playing Games"] },
        { id: "intimidation", name: "Intimidation", stat: "Soul", description: "Coercion, menacing body language, psychological threats, extortion, and projecting physical danger.", specializations: ["Business", "Emotional", "Physical", "Political", "Spiritual", "Street"] },
        { id: "sleight_of_hand", name: "Sleight of Hand", stat: "Body", description: "Dexterous manual deception: pickpocketing, concealed palming, and distraction tricks.", specializations: ["Card-Sharking", "Lock-Picking", "Pick-Pocketing", "Stage Magic"] },
        { id: "stealth", name: "Stealth", stat: "Body", description: "Silent movement, sticking to shadows, vanishing around corners, and avoiding observation.", specializations: ["Camouflage", "Concealment", "Silent Movement", "Shadowing"] },
        { id: "street_sense", name: "Street Sense", stat: "Mind", description: "Knowing turf boundaries, underworld hierarchy, fences, illegal contraband, and street rumor mills.", specializations: ["Gang Activity", "Influential Individuals", "Contraband Fences", "Territorial Divisions"] },
        { id: "urban_tracking", name: "Urban Tracking", stat: "Mind", description: "Pursuing targets through alleys, crowded markets, metro subways, and tenement rooftops.", specializations: ["Academic", "Corporate", "Political", "Residential", "Underworld"] }
      ]
    },
    {
      id: "technical",
      name: "Technical",
      tier: "field",
      costPerLevel: 2,
      maxLevel: 6,
      description: "Mechanics, electronics, hardware repair, programming, robotics, and cyber warfare.",
      skills: [
        { id: "architecture", name: "Architecture", stat: "Mind", description: "Structural engineering blueprints, building security layouts, access vents, and load calculations.", specializations: ["Aquatic", "Bridges", "Fortifications", "Small Buildings", "Skyscrapers"] },
        { id: "communications", name: "Communications", stat: "Mind", description: "Radio transmitters, microwave antennas, encrypted frequencies, satellite uplinks, and optical lines.", specializations: ["Encryption", "Long-Range Radio", "Microwave", "Satellite", "Optical Relay"] },
        { id: "computers", name: "Computers", stat: "Mind", description: "Software coding, network intrusion, database querying, firewall penetration, and AI maintenance.", specializations: ["Artificial Intelligence", "Cryptography", "Databases", "Electronic Warfare", "Intrusion/Security", "Networks", "Programming"] },
        { id: "electronics", name: "Electronics", stat: "Mind", description: "Circuit board soldering, microchips, sensor systems, wiring harnesses, and power supplies.", specializations: ["Aerospace", "Audio/Visual", "Hardware Repair", "Micro-Circuitry", "Sensors"] },
        { id: "engineering", name: "Engineering", stat: "Mind", description: "Designing, building, and analyzing complex technological, civil, and mechanical systems.", specializations: ["Aerospace", "Agricultural", "Biomedical", "Chemical", "Civil", "Computer", "Electrical", "Environmental", "Mechanical", "Mining", "Robotics"] },
        { id: "mechanics", name: "Mechanics", stat: "Mind", description: "Disassembling, repairing, and fabricating engines, hydraulic linkages, gearboxes, and firearms.", specializations: ["Aeronautical", "Armorer", "Automotive", "Gunsmith", "Locksmith", "Nanotechnology", "Traps"] },
        { id: "robotics", name: "Robotics", stat: "Mind", description: "Design, servo kinematics, artificial intelligence cores, sensors, and actuator maintenance for robots/drones.", specializations: ["Androids", "Drones", "Industrial Automation", "Mecha Systems"] }
      ]
    },

    // Action Skill Groups (3 CP / Level)
    {
      id: "adventuring",
      name: "Adventuring",
      tier: "action",
      costPerLevel: 3,
      maxLevel: 6,
      description: "Wilderness exploration, climbing, swimming, acrobatics, piloting, driving, and survival.",
      skills: [
        { id: "acrobatics", name: "Acrobatics", stat: "Body", description: "Gymnastics, aerial flips, dodging falling hazards, balance beam walking, and parkour.", specializations: ["Balance", "Flexibility", "Jumps", "Tumbling", "Parkour"] },
        { id: "athletics", name: "Athletics (Sports)", stat: "Body", description: "Organized competitive sports, track and field, throwing accuracy, and physical contests.", specializations: ["Baseball", "Basketball", "Football", "Martial Competitions", "Soccer", "Track and Field"] },
        { id: "boating", name: "Boating", stat: "Body", description: "Piloting small watercraft, speedboats, sailboats, personal watercraft, and river navigating.", specializations: ["Hovercraft", "Hydrofoils", "Large Ships", "Small Boats", "Submarines"] },
        { id: "climbing", name: "Climbing", stat: "Body", description: "Ascending sheer cliffs, masonry walls, rigging ropes, and skyscraper faces.", specializations: ["Natural Surfaces", "Poles", "Ropes", "Vegetation", "Walls"] },
        { id: "controlled_breathing", name: "Controlled Breathing", stat: "Body", description: "Conserving lung capacity, heart-rate regulation under duress, and poison gas resistance.", specializations: ["Calm", "Cyclic Breathing", "Holding Breath", "Slow Heart Rate"] },
        { id: "deep_sea_diving", name: "Deep-Sea Diving", stat: "Body", description: "Scuba diving, pressurized deep ocean exploration, decompression safety, and underwater work.", specializations: ["Commercial", "Deep-Sea Diving", "Free-Diving", "Scuba", "Snorkeling"] },
        { id: "driving", name: "Driving", stat: "Body", description: "Operating ground motor vehicles, stunt driving, high-speed chases, and vehicular maneuvering.", specializations: ["Armored Fighting Vehicle", "Bicycle", "Big Rig", "Bus", "Car", "Giant Robot", "Motorcycle", "Small Truck", "Teamster", "Walker"] },
        { id: "navigation", name: "Navigation", stat: "Mind", description: "Plotting courses by landmarks, celestial stars, compass headings, topographical maps, and GPS.", specializations: ["Air", "Highway", "Sea", "Space", "Undersea", "Urban", "Wilderness"] },
        { id: "piloting", name: "Piloting", stat: "Body", description: "Flying helicopters, fixed-wing aircraft, supersonic fighters, spacecraft, and aerial mecha.", specializations: ["Giant Robot", "Heavy Airplane", "Helicopter", "Jet Fighter", "Light Airplane", "Lighter-Than-Air Craft", "Spacecraft"] },
        { id: "power_lifting", name: "Power Lifting", stat: "Body", description: "Leverage technique for hoisting, carrying, and benching massive physical loads without injury.", specializations: ["Bulky Objects", "Free Weights", "Humans", "Moving Objects", "Small Objects"] },
        { id: "riding", name: "Riding", stat: "Body", description: "Equestrian riding, controlling riding mounts, mounted combat, and alien beast handling.", specializations: ["Horses", "Camels", "Canines", "Winged Mounts", "Exotic Beasts"] },
        { id: "stealth", name: "Stealth", stat: "Body", description: "Silent stalking, natural camouflage, shadow blending, and evading alert sentries.", specializations: ["Camouflage", "Concealment", "Silent Movement"] },
        { id: "survival", name: "Survival", stat: "Mind", description: "Foraging for clean water and food, constructing emergency shelters, and surviving harsh biomes.", specializations: ["Aquatic", "Arctic", "Desert", "Dimensional", "Forest", "Jungle", "Mountain", "Plains"] },
        { id: "swimming", name: "Swimming", stat: "Body", description: "Treading rough waters, aquatic endurance sprints, lifesaving rescues, and rapid river navigation.", specializations: ["Aquabatics", "Competition", "Deep-Sea Diving", "Free-Diving", "Recreational", "Lifesaving"] },
        { id: "wilderness_tracking", name: "Wilderness Tracking", stat: "Mind", description: "Identifying animal and human tracks, bent twigs, bruised leaves, and spoor in nature.", specializations: ["Aquatic", "Arctic", "Desert", "Forest", "Jungle", "Mountain", "Plains"] }
      ]
    },
    {
      id: "detective",
      name: "Detective",
      tier: "action",
      costPerLevel: 3,
      maxLevel: 6,
      description: "Forensics, crime scene analysis, surveillance, shadowing, and interrogation.",
      skills: [
        { id: "criminology", name: "Criminology", stat: "Mind", description: "Criminal psychological profiling, motive deduction, signature behaviors, and syndicate structures.", specializations: ["Serial Offenders", "Organized Crime", "Psychopathy", "Modus Operandi"] },
        { id: "demolitions", name: "Demolitions", stat: "Mind", description: "Defusing explosive ordinances, bomb disposal protocols, blasting caps, and breaching charges.", specializations: ["Artificial Structures", "Bomb Disposal", "Natural Structures", "Safe-Cracking", "Underwater"] },
        { id: "forensics", name: "Forensics", stat: "Mind", description: "Processing crime scenes, blood spatter analysis, fingerprint lifting, and ballistic striations.", specializations: ["Ballistics", "Biological Evidence", "Chemical Analysis", "Digital Forensics", "Toxicology"] },
        { id: "interrogation", name: "Interrogation", stat: "Mind", description: "Eliciting confessions, detecting deception, psychological pressure, and good cop/bad cop routines.", specializations: ["Business", "Drugs/Chemicals", "Physical", "Psychological", "Spiritual"] },
        { id: "search", name: "Investigation (Search)", stat: "Mind", description: "Finding hidden compartments, secret safes, concealed doorways, and overlooked physical evidence.", specializations: ["Compartments", "Detail Work", "Electronics", "Irregularities", "Hidden Doors"] },
        { id: "listening", name: "Listening", stat: "Soul", description: "Acute audio perception, eavesdropping through walls, acoustic signatures, and discerning whispers.", specializations: ["Background Noise", "Discrimination", "Eavesdropping", "Spiritual"] },
        { id: "police_sciences", name: "Police Sciences", stat: "Mind", description: "Standard police procedural protocols, chain of custody, warrant laws, and dispatch operations.", specializations: ["Ballistics", "Community Policing", "Criminology", "Forensics", "International Law Enforcement"] },
        { id: "poisons", name: "Poisons", stat: "Mind", description: "Identifying toxins, venomous bites, synthesizing antidotes, and chemical delivery methods.", specializations: ["Alien", "Natural", "Synthetic", "Technological"] },
        { id: "shadowing", name: "Shadowing (Surveillance)", stat: "Mind", description: "Tailing suspects through foot and vehicle traffic without alerting them to surveillance.", specializations: ["Audio Surveillance", "Electronic Bugging", "Foot Tailing", "Vehicle Tailing"] },
        { id: "urban_tracking", name: "Urban Tracking", stat: "Mind", description: "Tracking fugitives through dense urban concrete, alleys, mass transit systems, and storm drains.", specializations: ["Academic", "Corporate", "Political", "Residential", "Underworld"] }
      ]
    },
    {
      id: "military",
      name: "Military",
      tier: "action",
      costPerLevel: 3,
      maxLevel: 6,
      description: "Troop tactics, chain of command, battlefield navigation, and combat logistics.",
      skills: [
        { id: "artillery", name: "Artillery", stat: "Mind", description: "Indirect fire trajectories, mortar calculations, ballistic aiming tables, and orbital barrage strikes.", specializations: ["Mortars", "Rocket Artillery", "Self-Propelled Howitzers", "Naval Guns", "Orbital Bombardment"] },
        { id: "demolitions", name: "Demolitions", stat: "Mind", description: "Tactical combat engineering, bridge demolition, minefield laying/clearing, and shaped charges.", specializations: ["Artificial Structures", "Bomb Disposal", "Bridge Demolition", "Minefields", "Underwater Breaching"] },
        { id: "heavy_weapons", name: "Heavy Weapons", stat: "Body", description: "Operating heavy machine guns, anti-tank missile systems, rocket launchers, and vehicle turrets.", specializations: ["Anti-Air", "Anti-Tank", "Heavy Machine Guns", "Rocket Launchers", "Railguns"] },
        { id: "military_sciences", name: "Military Sciences", stat: "Mind", description: "Military doctrine, weapon hardware identification, supply line logistics, and order of battle.", specializations: ["Hardware Recognition", "Intelligence Analysis", "Logistics", "Strategy", "Tactics", "Teamwork"] },
        { id: "navigation", name: "Navigation", stat: "Mind", description: "Grid coordinate navigation, tactical maps, night compass traverses, and military waypoint markers.", specializations: ["Air", "Desert", "Grid Systems", "Sea", "Terrain Association", "Undersea", "Wilderness"] },
        { id: "nbc_defence", name: "NBC Defence", stat: "Mind", description: "Protocols for nuclear radiation, biological pathogens, and chemical weapon decontamination.", specializations: ["Biological Hazards", "Chemical Agents", "Decontamination", "Radiation Shielding"] },
        { id: "strategy", name: "Strategy", stat: "Mind", description: "High-level campaign command, theater logistics, troop deployment, and geopolitical theater warfare.", specializations: ["Asymmetric Warfare", "Naval Fleet", "Planetary Defense", "Siege Warfare", "Theatre Command"] },
        { id: "tactics", name: "Tactics", stat: "Mind", description: "Small unit fire-and-maneuver, bounding overwatch, room clearing, flanking, and ambushes.", specializations: ["Air-to-Air", "Close-Quarters Battle (CQB)", "Guerrilla", "Mechanized Armor", "Urban Warfare"] }
      ]
    },
    {
      id: "scientific",
      name: "Scientific",
      tier: "action",
      costPerLevel: 3,
      maxLevel: 6,
      description: "Natural sciences, medicine, first aid, physics, biology, and chemistry.",
      skills: [
        { id: "archaeology", name: "Archaeology", stat: "Mind", description: "Excavating ancient ruins, dating artifacts, carbon analysis, and ancient script deciphering.", specializations: ["Ancient Civilizations", "Cuneiform", "Prehistoric", "Relic Authentication"] },
        { id: "astronomy", name: "Astronomy", stat: "Mind", description: "Stellar cartography, orbital mechanics, planetary atmospheres, astrophysics, and cosmic phenomena.", specializations: ["Astrophysics", "Cosmology", "Planetary Science", "Stellar Cartography"] },
        { id: "biological_sciences", name: "Biological Sciences", stat: "Mind", description: "Microbiology, cellular genetics, botany, zoology, alien ecosystem biology, and evolution.", specializations: ["Astrobiology", "Bacteria/Viruses", "Bioengineering", "Botany", "Genetics", "Physiology", "Zoology"] },
        { id: "chemistry", name: "Chemistry", stat: "Mind", description: "Organic synthesis, industrial reactions, chemical polymers, hazardous solvents, and pyrotechnics.", specializations: ["Biochemistry", "Inorganic", "Organic", "Polymers", "Thermochemistry"] },
        { id: "climatology", name: "Climatology & Earth Sciences", stat: "Mind", description: "Meteorological forecasts, storm path modeling, seismology, hydrology, and geology.", specializations: ["Climatology", "Ecology", "Geography", "Geology", "Geophysics", "Hydrology", "Meteorology", "Oceanography"] },
        { id: "mathematics", name: "Mathematics", stat: "Mind", description: "Higher calculus, abstract statistical models, quantum equations, and cryptography.", specializations: ["Cryptography", "Differential Equations", "Statistics", "Theoretical Math"] },
        { id: "medical", name: "Medical", stat: "Mind", description: "Clinical diagnosis, emergency paramedic triage, field trauma surgery, and pharmacology.", specializations: ["Chiropractic", "Dentistry", "Diagnosis", "Emergency Response", "Family Practice", "Nursing", "Obstetrics", "Pathology", "Pharmacy", "Surgery", "Veterinary"] },
        { id: "naturopathy", name: "Naturopathy", stat: "Soul", description: "Holistic herbal medicines, acupuncture, massage therapy, and natural botanical therapies.", specializations: ["Acupuncture", "Aromatherapy", "Herbalism", "Homoeopathy", "Massage Therapy", "Reflexology"] },
        { id: "physical_sciences", name: "Physical Sciences (Physics)", stat: "Mind", description: "Thermodynamics, optics, particle physics, quantum mechanics, and relativity.", specializations: ["Acoustics", "Electromagnetism", "Nuclear", "Optics", "Particle Physics", "Quantum Mechanics", "Thermodynamics"] },
        { id: "psychology", name: "Psychology", stat: "Mind", description: "Cognitive behavior analysis, therapy, mental health diagnosis, and counseling techniques.", specializations: ["Abnormal Psychology", "Behavioral Analysis", "Clinical Therapy", "Neuropsychology"] }
      ]
    }
  ],

  // Table 14: Defects (BESM 4E Core, p. 155 & BESM Extras)
  // Lesser: -1/-2/-3 CP (1 CP / Rank)
  // Greater: -2/-4/-6 CP (2 CP / Rank)
  // Serious: -3/-6/-9 CP (3 CP / Rank)
  defects: [
    // Lesser Defects (-1 / -2 / -3 CP)
    { id: "conditional_ownership", name: "Conditional Ownership", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Gear or vehicle is owned by a patron, bank, or agency and may be audited, revoked, or inspected." },
    { id: "demure", name: "Demure", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Extremely unassertive, painfully shy, or subservient. Suffers -2 penalty on Initiative rolls and social intimidation (BESM Extras)." },
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
    { id: "unsettled", name: "Unsettled", category: "lesser", refundPerRank: 1, maxRank: 3, description: "An eerie, ominous aura or unnatural presence that disturbs normal animals and sensitive individuals, alerting them to your approach (BESM Extras)." },

    // Greater Defects (-2 / -4 / -6 CP)
    { id: "achilles_heel", name: "Achilles Heel", category: "greater", refundPerRank: 2, maxRank: 3, description: "Takes double damage from a specific attack type (e.g. silver, wooden stakes, cold iron, electricity)." },
    { id: "awkward_size", name: "Awkward Size", category: "greater", refundPerRank: 2, maxRank: 3, description: "Unusually huge or miniature without commensurate combat scaling benefits, making navigating normal doorways, vehicles, and furniture difficult (BESM Extras)." },
    { id: "bane", name: "Bane", category: "greater", refundPerRank: 2, maxRank: 3, description: "A normally harmless substance (sunlight, running water, garlic, holy water) inflicts severe damage on contact." },
    { id: "blind_fury", name: "Blind Fury", category: "greater", refundPerRank: 2, maxRank: 3, description: "Enters an uncontrollable berserk frenzy in combat, unable to distinguish friend from foe." },
    { id: "cursed", name: "Cursed", category: "greater", refundPerRank: 2, maxRank: 3, description: "Afflicted with a supernatural or karmic misfortune that causes disastrous coincidences." },
    { id: "hounded", name: "Hounded", category: "greater", refundPerRank: 2, maxRank: 3, description: "Actively hunted by corporate mercenaries, cults, alien agents, or bounty syndicates." },
    { id: "ism", name: "Ism (Prejudice)", category: "greater", refundPerRank: 2, maxRank: 3, description: "Target of systemic discrimination, suspicion, or hostility in the local society." },
    { id: "no_healing", name: "No Healing", category: "greater", refundPerRank: 2, maxRank: 3, description: "Cannot naturally recover Health Points through rest; requires specialized engineering repairs, bio-transfusions, or rare magical rituals (BESM Extras)." },
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

  // Official BESM 4E & BESM Extras Weapon Enhancements
  weaponEnhancements: [
    { id: "accurate", name: "Accurate", costPerRank: 1, source: "core", description: "Adds +1 to Attack Combat Value when using this weapon." },
    { id: "anemic", name: "Anemic", costPerRank: 1, source: "extras", description: "Attack causes severe exhaustion and fatigue conditions on hit." },
    { id: "area", name: "Area Effect", costPerRank: 1, source: "core", description: "Attacks affect all targets within an area radius (10m, 30m, 100m, etc.)." },
    { id: "aura", name: "Aura", costPerRank: 1, source: "core", description: "Surrounds the character in damaging energy; strikes anyone who touches them in melee." },
    { id: "autofire", name: "Autofire", costPerRank: 3, source: "core", description: "Fires a rapid burst of rounds, allowing multiple attack rolls or area suppression." },
    { id: "blight", name: "Blight", costPerRank: 1, source: "core", description: "Withering necrotic or corrosive damage that prevents natural healing." },
    { id: "contact", name: "Contact", costPerRank: 1, source: "core", description: "Activates upon skin touch or graze, ignoring physical parry attempts." },
    { id: "contagious", name: "Contagious", costPerRank: 1, source: "core", description: "Condition or affliction spreads to nearby targets who touch the victim." },
    { id: "continuing", name: "Continuing", costPerRank: 1, source: "core", description: "Target suffers ongoing damage in subsequent combat rounds (burning, poison, acid)." },
    { id: "demoralize", name: "Demoralize", costPerRank: 1, source: "extras", description: "Strikes shatter target's morale, confidence, and resolve in combat." },
    { id: "drain", name: "Drain", costPerRank: 1, source: "core", description: "Saps target's Energy Points or specific Stat value upon hitting." },
    { id: "enervation", name: "Enervation", costPerRank: 1, source: "core", description: "Drains the target's physical strength and stamina, inducing weakness." },
    { id: "flare", name: "Flare", costPerRank: 1, source: "core", description: "Emits a blinding flash of light, causing temporary blindness condition." },
    { id: "flexible", name: "Flexible", costPerRank: 1, source: "core", description: "Whip-like or curving attack that wraps around shields and cover." },
    { id: "helper", name: "Helper", costPerRank: 1, source: "core", description: "Coordinated tracer fire that helps allies land subsequent attacks with bonus ACV." },
    { id: "homing", name: "Homing", costPerRank: 1, source: "core", description: "Seeker missiles or guided beams track moving targets, reducing target evasion by 2." },
    { id: "incapacitating", name: "Incapacitating", costPerRank: 1, source: "core", description: "Renders the target unconscious or physically unable to take actions." },
    { id: "inconspicuous", name: "Inconspicuous", costPerRank: 3, source: "core", description: "Attack is invisible or noiseless, leaving no visual or acoustic signature." },
    { id: "incurable", name: "Incurable", costPerRank: 1, source: "core", description: "Wounds inflicted cannot be healed by normal medical treatment without high magic." },
    { id: "indirect", name: "Indirect", costPerRank: 1, source: "core", description: "High-arcing or portal trajectory bypasses intervening walls and cover." },
    { id: "insidious", name: "Insidious", costPerRank: 3, source: "core", description: "Damage bypasses conventional Armour Rating and Force Fields entirely." },
    { id: "irritant", name: "Irritant", costPerRank: 1, source: "core", description: "Causes itching, stinging, or tear-gas irritation imposing -2 dice penalties." },
    { id: "lethargy", name: "Lethargy", costPerRank: 1, source: "extras", description: "Attack induces sluggishness and heavy torpor, halving speed." },
    { id: "linked", name: "Linked", costPerRank: 1, source: "core", description: "Attack fires in tandem with another primary weapon simultaneously." },
    { id: "multidimensional", name: "Multidimensional", costPerRank: 1, source: "core", description: "Strikes through phase shifts, ethereal planes, and dimensional barriers." },
    { id: "muscle", name: "Muscle-Powered", costPerRank: 1, source: "core", description: "Adds character's Superstrength Level to Damage Multiplier." },
    { id: "penetrating", name: "Penetrating", costPerRank: 1, source: "core", description: "Ignores 5 points of target's Armour Rating per rank." },
    { id: "piercing", name: "Piercing", costPerRank: 1, source: "core", description: "Completely ignores 10 points of target's Armour Rating per rank." },
    { id: "psychic", name: "Psychic", costPerRank: 4, source: "core", description: "Direct mental damage targeted against Mind/Soul instead of Body." },
    { id: "quake", name: "Quake", costPerRank: 1, source: "core", description: "Ground-shattering shockwave knocks targets within blast radius prone." },
    { id: "reach", name: "Reach", costPerRank: 1, source: "core", description: "Melee strike extends several meters beyond normal close-quarters combat." },
    { id: "selective", name: "Selective", costPerRank: 1, source: "core", description: "Area effect can selectively spare designated allies within the blast zone." },
    { id: "spreading", name: "Spreading", costPerRank: 1, source: "core", description: "Wide scatter or cone pattern hits closely grouped targets with one roll." },
    { id: "stun", name: "Stun", costPerRank: 1, source: "core", description: "Non-lethal damage. Target is knocked unconscious rather than killed at 0 HP." },
    { id: "tangle", name: "Tangle", costPerRank: 1, source: "core", description: "Ensnaring nets, web, or sticky foam immobilises target (Tangled condition)." },
    { id: "targeted", name: "Targeted", costPerRank: 1, source: "core", description: "Precision targeting against specific vulnerable components or joints." },
    { id: "trap", name: "Trap", costPerRank: 1, source: "core", description: "Deployed mine, rune, or tripwire triggers when enemies enter the blast perimeter." },
    { id: "vampiric", name: "Vampiric", costPerRank: 1, source: "core", description: "Heals attacker's Health Points for half of the damage inflicted." }
  ],

  // Official BESM 4E & BESM Extras Weapon Limiters
  weaponLimiters: [
    { id: "activation", name: "Activation", refundPerRank: 1, source: "core", description: "Requires full combat turn or ritual preparation before firing." },
    { id: "alt_munition", name: "Alt-Munition", refundPerRank: 1, source: "extras", description: "Requires rare, exotic, or expensive specialty ammunition to fire." },
    { id: "ammo", name: "Ammo", refundPerRank: 1, source: "core", description: "Limited ammunition supply; must reload after a set number of shots." },
    { id: "backblast", name: "Backblast", refundPerRank: 1, source: "core", description: "Danger zone behind the weapon inflicts damage to adjacent allies." },
    { id: "backlash", name: "Backlash", refundPerRank: 1, source: "core", description: "Attacker suffers feedback damage or drain when weapon is fired." },
    { id: "charges", name: "Charges", refundPerRank: 1, source: "core", description: "Strictly limited number of uses per encounter or day (e.g. 3 charges)." },
    { id: "concentration", name: "Concentration", refundPerRank: 1, source: "core", description: "Attacker cannot take other actions or defend while aiming/firing." },
    { id: "consumable", name: "Consumable", refundPerRank: 1, source: "core", description: "Weapon or ammunition is permanently consumed upon use." },
    { id: "delay", name: "Delay", refundPerRank: 1, source: "core", description: "Blast or damage detonates several seconds or rounds after launch." },
    { id: "dependent", name: "Dependent", refundPerRank: 1, source: "core", description: "Requires another power or environmental condition to be active." },
    { id: "deplete", name: "Deplete", refundPerRank: 1, source: "core", description: "Significantly drains character's Energy Point pool with each attack." },
    { id: "detectable", name: "Detectable", refundPerRank: 1, source: "core", description: "Blatant sensory signature (loud roar, glowing beacon) gives away position." },
    { id: "exclusive", name: "Exclusive", refundPerRank: 1, source: "core", description: "Cannot use other powers or attributes in the same round as this weapon." },
    { id: "fieldless", name: "Fieldless", refundPerRank: 1, source: "extras", description: "Ineffective against energy fields or force shields." },
    { id: "fragile", name: "Fragile", refundPerRank: 1, source: "core", description: "Weapon is easily damaged or broken if struck by enemy attacks." },
    { id: "hands", name: "Hands", refundPerRank: 1, source: "core", description: "Requires two hands to wield and operate effectively." },
    { id: "inaccurate", name: "Inaccurate", refundPerRank: 1, source: "core", description: "Imposes -1 penalty to Attack Combat Value." },
    { id: "ingest", name: "Ingest", refundPerRank: 1, source: "extras", description: "Attack must be consumed or swallowed by the target to take effect." },
    { id: "internal", name: "Internal", refundPerRank: 1, source: "core", description: "Weapon is fixed internally inside a mecha chassis and cannot pivot." },
    { id: "irremovable", name: "Irremovable", refundPerRank: 1, source: "core", description: "Integrated into cybernetics or mecha; cannot be dropped or passed to allies." },
    { id: "irreversible", name: "Irreversible", refundPerRank: 1, source: "core", description: "Damage or conditions caused cannot be undone quickly." },
    { id: "localized", name: "Localized", refundPerRank: 1, source: "core", description: "Only targets one specific physical limb or system." },
    { id: "low_penetration", name: "Low Penetration", refundPerRank: 1, source: "core", description: "Target's Armour Rating counts double against this attack." },
    { id: "maximum", name: "Maximum Range", refundPerRank: 1, source: "core", description: "Strict upper limit on engagement distance with no extreme range arc." },
    { id: "melee", name: "Melee", refundPerRank: 1, source: "core", description: "Close-quarters combat range only (hand-to-hand / blade)." },
    { id: "non_penetrating", name: "Non-Penetrating", refundPerRank: 1, source: "core", description: "Completely stopped by any amount of armor or force field." },
    { id: "object", name: "Object", refundPerRank: 1, source: "core", description: "Relies on external physical weapon or focus that can be disarmed or stolen." },
    { id: "permanent", name: "Permanent", refundPerRank: 1, source: "core", description: "Effect is permanent and cannot be turned off at will." },
    { id: "recoil", name: "Recoil", refundPerRank: 1, source: "core", description: "Heavy physical kick knocks shooter off balance or imposes DCV penalty." },
    { id: "recovery", name: "Recovery", refundPerRank: 1, source: "core", description: "Requires cooldown period between shots before firing again." },
    { id: "slow", name: "Slow", refundPerRank: 1, source: "core", description: "Projectile takes time to travel; opponents receive +2 to Defence rolls." },
    { id: "stoppable", name: "Stoppable", refundPerRank: 1, source: "core", description: "Attack projectile can be intercepted or shot down in flight." },
    { id: "toxic", name: "Toxic", refundPerRank: 1, source: "core", description: "Ineffective against non-living targets, constructs, or airtight armour." },
    { id: "unreliable", name: "Unreliable", refundPerRank: 1, source: "core", description: "Weapon jams, misfires, or fails on an unmodified roll of 2 or 3." },
    { id: "uses_energy", name: "Uses Energy", refundPerRank: 1, source: "core", description: "Costs Energy Points to activate or fire." }
  ],

  // Helper Lookup Methods
  getAttributeDef: function(id) {
    if (!id) return null;
    return this.attributes.find(a => a.id === id || a.name.toLowerCase() === id.toLowerCase()) || null;
  },
  getDefectDef: function(id) {
    if (!id) return null;
    return this.defects.find(d => d.id === id || d.name.toLowerCase() === id.toLowerCase()) || null;
  },
  getSkillGroupDef: function(id) {
    if (!id) return null;
    return this.skillGroups.find(s => s.id === id || s.name.toLowerCase() === id.toLowerCase()) || null;
  },
  getConstituentSkills: function(groupId) {
    const grp = this.getSkillGroupDef(groupId);
    return grp ? (grp.skills || []) : [];
  },
  getSkillDef: function(skillId) {
    if (!skillId) return null;
    const lower = skillId.toLowerCase();
    for (const group of this.skillGroups) {
      if (group.skills) {
        const found = group.skills.find(s => s.id === skillId || s.id.toLowerCase() === lower || s.name.toLowerCase() === lower);
        if (found) {
          return {
            ...found,
            groupId: group.id,
            groupName: group.name,
            groupTier: group.tier,
            costPerLevel: 1 // BESM 4E p. 120: Individual constituent skills cost 1 CP / Level
          };
        }
      }
    }
    return null;
  },
  getAllConstituentSkills: function() {
    const list = [];
    for (const group of this.skillGroups) {
      if (group.skills) {
        group.skills.forEach(s => {
          list.push({
            ...s,
            groupId: group.id,
            groupName: group.name,
            groupTier: group.tier,
            costPerLevel: 1
          });
        });
      }
    }
    return list;
  },

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
        { id: "chassis", name: "Chassis (Combat Exo-Frame)", level: 10, costPerLevel: 0.5, customDesc: "Custom high-mobility humanoid combat mecha chassis unit" },
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
