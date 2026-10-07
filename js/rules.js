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
    { id: "absorption", name: "Absorption", category: "supernatural", costPerLevel: 5, maxLevel: 6, isHuman: false, detailLabel: "Absorption Medium / Energy", detailPlaceholder: "e.g. Kinetic Impacts, Electricity, Thermal Heat, Laser Light", description: "Absorbs incoming energy or kinetic attacks and converts them into Health or Energy Points." },
    { id: "alternate_form", name: "Alternate Form", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, isContainer: true, containerType: "alternate_form", description: "Grants access to a completely different transformed state (magical girl, mecha, beast) built on 10 Character Points per Level with independent stats." },
    { id: "alternate_identity", name: "Alternate Identity", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Persona / Secret Identity", detailPlaceholder: "e.g. Bruce Wayne, Masked Vigilante, High School Student", description: "Maintains distinct public, civilian, or secret personas that differ in appearance, status, and legal documentation." },
    { id: "armour", name: "Armour", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: true, detailLabel: "Armour Type / Material", detailPlaceholder: "e.g. Kevlar Vest, Titanium Plates, Dragon Scales, Power Suit", description: "Provides an Armour Rating (AR) of 5 per Level, subtracting that damage from every incoming attack." },
    { id: "attack_mastery", name: "Attack Mastery", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Mastery of offensive combat arts. Increases Attack Combat Value (ACV) by +1 per Level for all attacks." },
    { id: "augmented", name: "Augmented", category: "physical", costPerLevel: 2, maxLevel: 6, isHuman: true, subTraitLabel: "Augmented Stat", subTraits: ["Body", "Mind", "Soul"], subTraitDescriptions: {
      "Body": "Increases Body stat by +1 Stat Value per Level through external cybernetics, genetics, or alchemy.",
      "Mind": "Increases Mind stat by +1 Stat Value per Level through neural implants, AI assistant, or psionic augment.",
      "Soul": "Increases Soul stat by +1 Stat Value per Level through spiritual talisman, mystical pact, or focus."
    }, allowMultiple: true, description: "Increases one chosen Stat (Body, Mind, or Soul) by +1 Stat Value per Level through external magic, cybernetics, or science." },
    { id: "capacity", name: "Capacity", category: "social", costPerLevel: 1, maxLevel: 10, isHuman: true, detailLabel: "Cargo / Passengers", detailPlaceholder: "e.g. 4 Passengers, 500 kg Cargo, Internal Hangar Bay", description: "Ability to carry extra passengers or cargo inside the character, vehicle, or robot." },
    { id: "change_state", name: "Change State", category: "supernatural", costPerLevel: 3, maxLevel: 4, isHuman: false, subTraitLabel: "Transformed State", subTraits: ["Gaseous", "Incorporeal / Intangible", "Liquid", "Energy / Plasma"], subTraitDescriptions: {
      "Gaseous": "Transforms into mist, vapor, or gas; slips through tiny gaps and immune to normal physical strikes.",
      "Incorporeal / Intangible": "Phases out of physical matter; walks through solid walls and immune to physical damage.",
      "Liquid": "Melts into fluid form; slips under sealed doorways and resists blunt force impacts.",
      "Energy / Plasma": "Becomes pure electricity, laser light, or plasma; travels along power lines with extreme speed."
    }, description: "Transforms into gaseous, liquid, incorporeal, or energy states to slip through barriers or become immune to normal physical strikes." },
    { id: "chassis", name: "Chassis (Mecha / Vehicle Frame)", category: "social", costPerLevel: 0.5, maxLevel: 20, isHuman: true, isContainer: true, containerType: "chassis", description: "A mechanical mecha frame, android body, cybernetic shell, vehicle hull, or starship structure. Point cost is one-half of all contained traits (BESM Extras)." },
    { id: "cognition", name: "Cognition", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: true, detailLabel: "Vision Method / Medium", detailPlaceholder: "e.g. Tarot Cards, Dreams, Crystal Ball, Quantum Trance", description: "Glimpses into the future (precognition) or past (retrocognition) to obtain crucial clues." },
    { id: "combat_technique", name: "Combat Technique", category: "combat", costPerLevel: 1, maxLevel: 10, isHuman: true, subTraitLabel: "Martial Technique", subTraits: ["Blind Fighting", "Brutal", "Critical Strike", "Dead Eye", "Deflection", "Hardboiled", "Judge Opponent", "Lethal Strike", "Lightning Reflexes", "Multiple Targets", "Portable Armoury", "Steady Hand", "Two Weapons", "Weapons Flurry"], subTraitDescriptions: {
      "Blind Fighting": "Attack and defend in darkness, smoke, or blindness without penalty.",
      "Brutal": "Critical hits inflict additional trauma and maximum weapon damage multiplier.",
      "Critical Strike": "Achieve a critical hit on an attack roll of 11 or 12 instead of natural 12 only.",
      "Dead Eye": "Adds +2 to Attack Combat Value (ACV) when taking aim or making ranged attacks without moving.",
      "Deflection": "Can parry or deflect incoming ranged physical or energy attacks using a melee weapon or shield.",
      "Hardboiled": "Ignores wound and shock penalties until reduced to 0 Health Points.",
      "Judge Opponent": "Assess an opponent's Combat Values, Health Points, and skill level with a successful Mind check.",
      "Lethal Strike": "Unarmed strikes or martial arts blows inflict lethal damage instead of non-lethal damage.",
      "Lightning Reflexes": "Adds +2 to Initiative checks in combat rounds.",
      "Multiple Targets": "Suffers reduced combat penalties when dividing attacks among two or more adjacent targets.",
      "Portable Armoury": "Readily produces appropriate small weapons, ammunition, or gear suitable for tactical needs.",
      "Steady Hand": "No penalty when firing or attacking while moving, sprinting, or riding on a fast vehicle.",
      "Two Weapons": "Wield two melee or ranged weapons simultaneously with reduced off-hand penalties.",
      "Weapons Flurry": "Deliver a rapid flurry of melee strikes with cumulative bonus damage on consecutive hits."
    }, allowMultiple: true, description: "Specific martial manoeuvres: Blind Fighting, Brutal, Critical Strike, Dead Eye, Deflection, Hardboiled, Judge Opponent, Lethal Strike, Lightning Reflexes, Multiple Targets, Portable Armoury, Steady Hand, Two Weapons, or Weapons Flurry." },
    { id: "companion", name: "Companion", category: "social", costPerLevel: 4, maxLevel: 6, isHuman: true, isContainer: true, containerType: "companion", description: "A loyal ally, magical mascot, combat familiar, pet monster, or robot partner built on 10 Character Points per Level with independent stats." },
    { id: "connected", name: "Connected", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, subTraitLabel: "Connection Sphere", subTraits: ["Underworld / Criminal", "Police / Law Enforcement", "Military / Armed Forces", "Corporate / Business", "Political / Government", "High Society / Elite", "Occult / Supernatural", "Other / Custom"], subTraitDescriptions: {
      "Underworld / Criminal": "Connections with criminal cartels, black market fences, fixers, and street syndicates.",
      "Police / Law Enforcement": "Allies within municipal police departments, detective bureaus, and federal agencies.",
      "Military / Armed Forces": "Access to military officers, supply depots, specialized armouries, and base facilities.",
      "Corporate / Business": "Influence within multinational corporations, financial institutions, and boardroom executives.",
      "Political / Government": "Ties to civic legislators, municipal mayors, diplomatic embassies, and civil service.",
      "High Society / Elite": "Social standing among aristocratic dynasties, celebrities, and high-society galas.",
      "Occult / Supernatural": "Ties to hidden sorcerer circles, sacred shrines, esoteric orders, and arcane archives.",
      "Other / Custom": "A unique social or organizational network approved by the Game Master."
    }, allowMultiple: true, detailLabel: "Organization / Contact Details", detailPlaceholder: "e.g. Tokyo Police Dept, Black Market Syndicate, Clan Elders", description: "Social networks, intelligence contacts, corporate standing, or underworld ties." },
    { id: "control_environment", name: "Control Environment", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Environment / Weather Focus", detailPlaceholder: "e.g. Local Gravity, Fog & Rain, Arctic Chill, Thermal Heat", description: "Manipulates atmospheric temperature, weather, gravity, or ambient conditions in a zone." },
    { id: "conversion", name: "Conversion", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, description: "Converts Health Points directly into Energy Points, or vice versa, at a rapid rate." },
    { id: "data_access", name: "Data Access", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: true, detailLabel: "Uplink Type / Interface", detailPlaceholder: "e.g. Cyberbrain Jack, Neural Wi-Fi, Satellite Transceiver", description: "Direct neural or wireless uplink to computer networks, databases, satellite arrays, and artificial intelligences." },
    { id: "death_dodge", name: "Death Dodge", category: "combat", costPerLevel: 1, maxLevel: 3, isHuman: true, description: "Once per story arc per Level, narrowly avoid an otherwise fatal attack or lethal blow through heroic anime grit or sheer serendipity (BESM Extras)." },
    { id: "debilitate", name: "Debilitate", category: "combat", costPerLevel: 1, maxLevel: 5, isHuman: true, subTraitLabel: "Condition Penalty", subTraits: ["Lethargic", "Stunned", "Tangled"], subTraitDescriptions: {
      "Lethargic": "Target's nervous system or motor servos are drained, halving movement speeds.",
      "Stunned": "Attacks overload target's neural synapses or processors, rendering them unable to act for 1 round.",
      "Tangled": "Snaring strikes bind limbs or gears, imposing a -2 penalty on all attack and defense rolls."
    }, allowMultiple: true, description: "Attacks target nerve clusters or mechanical joints, imposing condition penalties (Lethargic, Stunned, Tangled) on the target (BESM Extras)." },
    { id: "defence_mastery", name: "Defence Mastery", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Combat evasion, parrying, and deflection expertise. Increases Defence Combat Value (DCV) by +1 per Level." },
    { id: "dimension_walk", name: "Dimension Walk", category: "supernatural", costPerLevel: 5, maxLevel: 4, isHuman: false, detailLabel: "Planes / Transit Method", detailPlaceholder: "e.g. Astral Plane, Mirror World, Shadow Realm, Portal Gun", description: "Opens pathways between different planes of existence, alternate timelines, or the multiverse." },
    { id: "dynamic_powers", name: "Dynamic Powers", category: "supernatural", costPerLevel: 10, maxLevel: 4, isHuman: false, detailLabel: "Magic / Reality Domain", detailPlaceholder: "e.g. Elemental Fire, Sorcery, Technopathy, Necromancy", description: "Broad mastery over a domain of magic or reality (e.g. Elemental Fire, Sorcery, Technology Manipulation) to produce spontaneous effects." },
    { id: "elasticity", name: "Elasticity", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Form / Mechanism", detailPlaceholder: "e.g. Rubber Limbs, Tentacles, Liquid Metal", description: "Extends, stretches, and contorts limbs over significant distances." },
    { id: "enemy_attack", name: "Enemy Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Enemy Species / Faction", detailPlaceholder: "e.g. Demons, Robots, Undead, Zaibatsu Syndicate", allowMultiple: true, description: "Specialised attack training that grants +2 ACV when targeting a specific enemy species or faction." },
    { id: "enemy_defence", name: "Enemy Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Enemy Species / Faction", detailPlaceholder: "e.g. Demons, Robots, Undead, Zaibatsu Syndicate", allowMultiple: true, description: "Specialised evasive tactics that grant +2 DCV against attacks from a specific enemy species or faction." },
    { id: "energised", name: "Energised", category: "supernatural", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Deep reservoirs of stamina and spiritual essence. Adds +10 Energy Points (EP) per Level." },
    { id: "exorcism", name: "Exorcism", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Tradition / Holy Rites", detailPlaceholder: "e.g. Shinto Ofuda, Holy Water & Prayers, Arcane Binding Seals", description: "Banishes, dispels, or repels supernatural entities, demons, spirits, and possessive entities." },
    { id: "expertise", name: "Expertise", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Area of Expertise", detailPlaceholder: "e.g. Computer Hacking, Forensic Analysis, Interrogation", allowMultiple: true, description: "Specialisation mastery in specific tasks (+1 roll bonus per Level when performing actions within your chosen area of expertise) (BESM Extras)." },
    { id: "extra_actions", name: "Extra Actions", category: "combat", costPerLevel: 4, maxLevel: 4, isHuman: true, description: "Grants one additional Attack or Defence action per combat round per Level." },
    { id: "extra_arms", name: "Extra Arms", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Appendage Type", detailPlaceholder: "e.g. Robotic Arms, Cybernetic Tentacles, Prehensile Tails, Spider Legs", description: "Additional biological, mechanical, or psychic appendages capable of manipulating tools or weapons." },
    { id: "extra_defenses", name: "Extra Defenses", category: "defence", costPerLevel: 2, maxLevel: 4, isHuman: true, description: "Grants one additional Defence check per combat round per Level (BESM Extras)." },
    { id: "features", name: "Features", category: "social", costPerLevel: 1, maxLevel: 10, isHuman: true, subTraitLabel: "Anime Feature", subTraits: ["Appearance (Strikingly Cute / Bishojo)", "Appearance (Handsome / Bishounen)", "Appearance (Intimidating / Fierce)", "Eidetic Memory", "Internal Compass", "Mimic Voice", "Scentless", "Other / Custom"], subTraitDescriptions: {
      "Appearance (Strikingly Cute / Bishojo)": "Adorable, charming appearance that triggers protective and friendly reactions.",
      "Appearance (Handsome / Bishounen)": "Breathtakingly handsome appearance that charms observers in social encounters.",
      "Appearance (Intimidating / Fierce)": "Imposing or menacing aura that adds substantial bonuses to intimidation checks.",
      "Eidetic Memory": "Photographic total recall of every image, document, conversation, and detail encountered.",
      "Internal Compass": "Flawless internal sense of magnetic north, elevation, and subterranean orientation.",
      "Mimic Voice": "Accurately replicates any voice, vocal cadence, accent, or animal call ever heard.",
      "Scentless": "Produces no body odor or scent; cannot be tracked by scent hounds or olfactory sensors.",
      "Other / Custom": "A distinct cosmetic anime quirk or practical physical perk approved by the GM."
    }, allowMultiple: true, detailLabel: "Feature Notes / Description", detailPlaceholder: "e.g. Glowing Eyes, Fox Ears & Tail, Mechanical Arm", description: "Distinct anime traits: Appearance (Strikingly Cute / Bishojo), Eidetic Memory, Mimic Voice, Scentless, Internal Compass, etc." },
    { id: "flank_defense", name: "Flank Defense", category: "defence", costPerLevel: 1, maxLevel: 3, isHuman: true, description: "Eliminates or reduces flanking and surprise attack penalties when fighting multiple surrounding opponents (BESM Extras)." },
    { id: "flight", name: "Flight", category: "physical", costPerLevel: 3, maxLevel: 6, isHuman: false, detailLabel: "Flight Form / Propulsion", detailPlaceholder: "e.g. Feathered Wings, Anti-Grav Belt, Rocket Thrusters, Mystic Levitation", allowMultiple: true, description: "Airborne locomotion via wings, anti-gravity, magical levitation, or rocket propulsion." },
    { id: "force_field", name: "Force Field", category: "defence", costPerLevel: 4, maxLevel: 6, isHuman: false, detailLabel: "Field Manifestation", detailPlaceholder: "e.g. Hexagonal Hard-Light, Ki Barrier, Biotic Shield, Magnetic Repulsor", description: "Creates an energy barrier providing an Armour Rating of 10 per Level against all attacks." },
    { id: "gear", name: "Gear", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Gear Item / Device", detailPlaceholder: "e.g. Spy Drone, Forensic Field Kit, Encrypted Radio, Lockpicks", allowMultiple: true, description: "Access to uncommon equipment, specialty kits, surveillance drones, and vehicles." },
    { id: "ground_speed", name: "Ground Speed", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Propulsion / Mode", detailPlaceholder: "e.g. Roller Skates, Wheels, Cybernetic Legs, Cheetah Dash", description: "Rapid overland ground movement for vehicles, mecha, or sprint specialists." },
    { id: "healing", name: "Healing", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Healing Medium / Method", detailPlaceholder: "e.g. Nanite Injections, Laying on Hands, Cellular Alchemy, Curative Rites", description: "Restores Health Points to injured living subjects through first aid, medicine, or magical curative touch." },
    { id: "heightened_awareness", name: "Heightened Awareness", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Acute perception and sixth sense. Adds +2 per Level to all Mind and Soul checks to notice hidden threats or traps." },
    { id: "heightened_senses", name: "Heightened Senses", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Enhanced Senses", detailPlaceholder: "e.g. Keen Eyesight, Canine Smell, Ultrasonic Hearing", allowMultiple: true, description: "Exceptional eyesight, hearing, smell, or taste operating well beyond human acuity." },
    { id: "illusion", name: "Illusion", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Illusion Type / Medium", detailPlaceholder: "e.g. Holograms, Sensory Phantasms, Dream Weaving", description: "Creates realistic sensory mirages in the minds of targets or hologram projections." },
    { id: "immovable", name: "Immovable", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Immense physical mass, gyroscopic stabilisers, or anchoring magic that resists knockback, forced displacement, and trips (BESM Extras)." },
    { id: "immunity", name: "Immunity", category: "defence", costPerLevel: 3, maxLevel: 6, isHuman: false, subTraitLabel: "Hazard Immune", subTraits: ["Electricity", "Fire / Heat", "Cold", "Radiation", "Toxins / Poison", "Vacuum / Suffocation", "Acid / Corrosion", "Disease", "Other / Custom"], subTraitDescriptions: {
      "Electricity": "Complete invulnerability to electric currents, lightning, and stun tasers.",
      "Fire / Heat": "Complete immunity to open flame, thermal radiation, magma, and extreme heat.",
      "Cold": "Complete immunity to sub-zero temperatures, frostbite, and cryogenic weapons.",
      "Radiation": "Complete immunity to nuclear radiation, gamma rays, and cosmic fallout.",
      "Toxins / Poison": "Immune to biological venoms, chemical nerve gases, toxic spores, and drugs.",
      "Vacuum / Suffocation": "Survives indefinitely in hard vacuum, toxic atmosphere, or underwater without breathing.",
      "Acid / Corrosion": "Immune to corrosive chemical compounds, digestive fluids, and industrial acid.",
      "Disease": "Completely immune to bacterial infections, viruses, and magical plagues.",
      "Other / Custom": "Immunity to a specific environmental hazard approved by the Game Master."
    }, allowMultiple: true, detailLabel: "Immunity Notes", detailPlaceholder: "e.g. Hellfire, Dragon Breath, Cybernetic EMP", description: "Complete invulnerability to a specific environmental hazard: electricity, fire, cold, radiation, toxins, or vacuum." },
    { id: "immutable", name: "Immutable", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: false, description: "Resists forced shapechanging, petrification, transmutation, and size alteration." },
    { id: "inspire", name: "Inspire", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Inspirational Style", detailPlaceholder: "e.g. Battle Cry, Tactical Commands, Inspiring Song, Chivalric Speech", description: "Oratory leadership that grants allies temporary bonuses to Combat Values or dice rolls." },
    { id: "item", name: "Item", category: "social", costPerLevel: 0.5, maxLevel: 20, isHuman: true, isContainer: true, containerType: "item", description: "Purchases vehicles, weapons, magical gear, or tech gadgets. Point cost is one-half the total value of all Attributes, Defects, and traits built into the Item (minimum 0)." },
    { id: "jumping", name: "Jumping", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Leap Mechanism", detailPlaceholder: "e.g. Hydraulic Leg Boosters, Kinetic Springs, Superhuman Leg Power", description: "Superhuman vertical and horizontal leap distances." },
    { id: "massive_damage", name: "Massive Damage", category: "combat", costPerLevel: 3, maxLevel: 6, isHuman: true, description: "Devastating striking power. Increases Damage Multiplier (DM) by +1 per Level for all attacks." },
    { id: "melee_attack", name: "Melee Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Weapon or Hand-to-Hand Style", detailPlaceholder: "e.g. Katana, Judo, Staff, Brawling, Dual Daggers", allowMultiple: true, description: "Specialized training with a specific melee weapon or hand-to-hand style (+1 ACV per Level with that weapon)." },
    { id: "melee_defence", name: "Melee Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Weapon or Melee Style", detailPlaceholder: "e.g. Blades, Unarmed, Polearms, Clubs", allowMultiple: true, description: "Specialized defense training against close-quarters attacks (+1 DCV vs melee per Level)." },
    { id: "merge", name: "Merge", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, detailLabel: "Merge Form / Partners", detailPlaceholder: "e.g. Super Mecha Gattai, Fusion Dance, Symbiote Bonding", description: "Ability to combine with other characters or mecha into a single powerful composite being (classic combiner mecha!)." },
    { id: "metamorphosis", name: "Metamorphosis", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Disguise Style / Range", detailPlaceholder: "e.g. Perfect Facial Mimicry, Age/Gender Shifting, Infiltration Forms", description: "Alters cosmetic appearance, gender, species, or apparent age at will." },
    { id: "mimic", name: "Mimic", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Mimicry Method", detailPlaceholder: "e.g. Power Absorption Touch, Adaptive Sensors, Visual Replication", description: "Temporarily copies the attributes, powers, or skills of an observed target." },
    { id: "mind_control", name: "Mind Control", category: "mental", costPerLevel: 5, maxLevel: 6, isHuman: false, detailLabel: "Control Medium", detailPlaceholder: "e.g. Hypnotic Gaze, Pheromone Domination, Neural Override, Puppet Strings", description: "Enforces mental domination or hypnotic commands over sentient beings." },
    { id: "mind_shield", name: "Mind Shield", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Mental fortitude against psionic intrusion, mind reading, and illusion (+2 to Mind Stat defence per Level)." },
    { id: "minions", name: "Minions", category: "social", costPerLevel: 2, maxLevel: 6, isHuman: true, isContainer: true, containerType: "minions", description: "A squad or army of loyal subordinates, corporate guards, or summoned drones built with Character Points." },
    { id: "mulligan", name: "Mulligan", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Fabulous luck. Reroll any failed dice roll once per session per Level." },
    { id: "nullify", name: "Nullify", category: "supernatural", costPerLevel: 5, maxLevel: 6, isHuman: false, detailLabel: "Power Domain Nullified", detailPlaceholder: "e.g. Magic, Psionics, Cybernetics, Mutations", description: "Suppresses, neutralises, or dispels the supernatural powers, magic, or tech of targets." },
    { id: "plant_control", name: "Plant Control", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Plant Specialty / Flora", detailPlaceholder: "e.g. Thorny Vines, Toxic Flowers, Living Roots, Carnivorous Flora", description: "Commands vegetation, vines, trees, and botanical growth." },
    { id: "pocket_dimension", name: "Pocket Dimension", category: "supernatural", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Dimension Form / Access", detailPlaceholder: "e.g. Hammerspace Pocket, Bag of Holding, Shadow Cloak, Mirror Vault", description: "Access to an extradimensional space for storage (hammerspace, magic pouch, personal realm)." },
    { id: "portal", name: "Portal", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Gateway Form / Style", detailPlaceholder: "e.g. Ring Gateways, Arcane Doorway, Quantum Rift, Magic Mirror", description: "Creates stationary gateways that connect distant spatial locations." },
    { id: "power_flux", name: "Power Flux", category: "supernatural", costPerLevel: 10, maxLevel: 6, isHuman: false, description: "Dynamic ability pool that can be reallocated on the fly to simulate versatile magical or superpower suites." },
    { id: "power_variation", name: "Power Variation", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, detailLabel: "Variation Mode / Effect", detailPlaceholder: "e.g. Stun Setting, Freezing Beam, Defensive Shield Mode", description: "Creates alternate modes or utility variations for existing primary powers." },
    { id: "projection", name: "Projection", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, detailLabel: "Projection Form", detailPlaceholder: "e.g. Astral Spirit, Hard-Light Hologram, Shadow Double", description: "Astral projection or hard-light sensory avatars." },
    { id: "ranged_attack", name: "Ranged Attack", category: "combat", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Weapon or Firearm", detailPlaceholder: "e.g. Sniper Rifle, Bow, Revolvers, Shuriken", allowMultiple: true, description: "Specialized marksmanship with a specific firearm or ranged weapon (+1 ACV per Level with that weapon)." },
    { id: "ranged_defence", name: "Ranged Defence", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Ranged Attack Type", detailPlaceholder: "e.g. Bullets, Arrows, Energy Blasts, Missiles", allowMultiple: true, description: "Dodging and evasive positioning against ranged attacks (+1 DCV vs ranged per Level)." },
    { id: "regeneration", name: "Regeneration", category: "supernatural", costPerLevel: 5, maxLevel: 6, isHuman: false, detailLabel: "Regeneration Source", detailPlaceholder: "e.g. Cellular Hyper-Regeneration, Nanite Repair Swarm, Vampiric Healing", description: "Rapid cell recovery. Regains Health Points automatically each combat round or minute." },
    { id: "reincarnation", name: "Reincarnation", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Rebirth Form / Vessel", detailPlaceholder: "e.g. Newborn Reincarnation, Phoenix Ashes, Cybernetic Clone Backup", description: "When killed, the soul returns in a new body or reconstructs itself after a period of time." },
    { id: "resilient", name: "Resilient", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: true, description: "Immunity or extreme resilience to non-combat physical trauma, poisons, and diseases." },
    { id: "sensory_block", name: "Sensory Block", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Surveillance Block Type", detailPlaceholder: "e.g. Electronic Surveillance, Psychic Eavesdropping", description: "Shields against electronic surveillance, psychic eavesdropping, or thermal detection." },
    { id: "sixth_sense", name: "Sixth Sense", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Presence Detected", detailPlaceholder: "e.g. Magic, Evil Intent, Supernatural Spirits, Danger", description: "Intuitive detection of invisible presences, magic, danger, spirits, or dimensional rifts." },
    { id: "size_change", name: "Size Change", category: "supernatural", costPerLevel: 10, maxLevel: 6, isHuman: false, detailLabel: "Size Modes", detailPlaceholder: "e.g. Giant Growth Only, Insect Shrinking, Both Giant & Insect Scale", description: "Grows to gigantic proportions or shrinks to insect scale on demand." },
    { id: "social_mastery", name: "Social Mastery", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, description: "Superior social poise, commanding presence, and psychological insight in negotiations (+1 to all social skill and influence rolls per Level) (BESM Extras)." },
    { id: "spaceflight", name: "Spaceflight", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Space Propulsion Method", detailPlaceholder: "e.g. Ion Thrusters, Warp Drive, Solar Sails, Cosmic Wings", allowMultiple: true, description: "Propulsion in deep vacuum and interplanetary transit." },
    { id: "special_movement", name: "Special Movement", category: "physical", costPerLevel: 1, maxLevel: 10, isHuman: true, subTraitLabel: "Movement Technique", subTraits: ["Balance", "Cat-Like", "Fast", "Light-Footed", "Slithering", "Swinging", "Untrackable", "Wall-Bouncing", "Wall-Crawling", "Water-Walking", "Zen Direction"], subTraitDescriptions: {
      "Balance": "Maintains perfect balance on narrow ledges, wires, or tightropes without risk of falling.",
      "Cat-Like": "Always lands upright when falling; reduces falling damage by 10 points.",
      "Fast": "Significantly multiplies overland running and sprint speed beyond normal limits.",
      "Light-Footed": "Moves across fragile surfaces like thin ice, snow, or pressure plates without triggering them.",
      "Slithering": "Crawls or moves while prone at full normal movement speed without penalties.",
      "Swinging": "Swings through urban or jungle terrain using cables, webs, vines, or grappling lines.",
      "Untrackable": "Leaves no footprints, scent, or physical traces behind while traveling.",
      "Wall-Bouncing": "Ricochets and leaps between opposing vertical surfaces to scale structures rapidly.",
      "Wall-Crawling": "Walks, runs, or adheres to vertical walls and ceilings without falling.",
      "Water-Walking": "Runs or walks across liquid surfaces including water, mud, or chemical pools.",
      "Zen Direction": "Possesses flawless orientation; always knows absolute compass heading and landmarks."
    }, allowMultiple: true, description: "Balance, Cat-Like, Fast, Light-Footed, Slithering, Swinging, Untrackable, Wall-Bouncing, Wall-Crawling, Water-Walking, or Zen Direction." },
    { id: "speed_burst", name: "Speed Burst", category: "physical", costPerLevel: 1, maxLevel: 4, isHuman: true, description: "Temporarily doubles movement speeds for brief tactical sprints or evasive dashes in combat (BESM Extras)." },
    { id: "summon_creatures", name: "Summon Creatures", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Creature Type / Swarm", detailPlaceholder: "e.g. Raven Swarm, Shadow Imps, Combat Drones, Fairy Sprites", description: "Summons and commands swarms of animals or weak dimensional creatures." },
    { id: "supersense", name: "Supersense", category: "mental", costPerLevel: 1, maxLevel: 6, isHuman: false, subTraitLabel: "Sensory Band", subTraits: ["Echolocation", "Infrared Vision", "Magnetic Field Detection", "Microscopic Vision", "Radar", "Radio Hearing", "Ultraviolet Vision", "X-Ray Sight", "Other / Custom"], subTraitDescriptions: {
      "Echolocation": "Emits acoustic pulses to navigate and detect targets in total darkness.",
      "Infrared Vision": "Sees thermal signatures and warm bodies in pitch black darkness.",
      "Magnetic Field Detection": "Senses electromagnetic currents, live wires, and planetary polarity.",
      "Microscopic Vision": "Examines microscopic details, DNA traces, and micro-structures with bare eyes.",
      "Radar": "Emits radio waves to track coordinates, range, and velocity of distant objects.",
      "Radio Hearing": "Intercepts and decodes wireless communications, WiFi packets, and radio frequencies.",
      "Ultraviolet Vision": "Perceives UV radiation, invisible security dyes, and fluorescent trails.",
      "X-Ray Sight": "Sees through walls, opaque containers, and armor plating (except dense lead).",
      "Other / Custom": "A unique exotic sensory spectrum or detection capability approved by the GM."
    }, allowMultiple: true, description: "Echolocation, infrared vision, radar, magnetic field detection, or x-ray sight." },
    { id: "superspeed", name: "Superspeed", category: "physical", costPerLevel: 3, maxLevel: 6, isHuman: false, detailLabel: "Speed Manifestation", detailPlaceholder: "e.g. Lightning Dash, After-Images, Mach Sprint, Speed Force", description: "Blistering velocities from 100 kph (Level 1) to 30,000 kph (Level 6)." },
    { id: "superstrength", name: "Superstrength", category: "physical", costPerLevel: 4, maxLevel: 6, isHuman: false, detailLabel: "Strength Source / Form", detailPlaceholder: "e.g. Hydraulic Muscles, Demonic Might, Kinetic Compression, Bionic Graft", description: "Colossal physical power. Adds +1 Damage Multiplier per Level for muscle-powered attacks and immense lifting capacity." },
    { id: "swarm", name: "Swarm", category: "supernatural", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Swarm Composition", detailPlaceholder: "e.g. Micro-Nanites, Vampire Bats, Glowing Butterflies, Smoke & Ash", description: "Body disperses into a cloud of insects, bats, nanites, or mist." },
    { id: "taunt", name: "Taunt", category: "social", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Demoralisation Style / Target", detailPlaceholder: "e.g. Cocky Mockery, Cold Logic, Intimidation", description: "Combat demoralisation. Provokes, distracts, or enrages opponents, imposing -1 penalty per Level to their checks or luring them out of position (BESM Extras)." },
    { id: "telekinesis", name: "Telekinesis", category: "supernatural", costPerLevel: 4, maxLevel: 6, isHuman: false, detailLabel: "TK Visual / Theme", detailPlaceholder: "e.g. Violet Psychic Aura, Invisible Graviton Force, Poltergeist Hand", description: "Moves, lifts, and throws physical objects using purely psychic or magical will." },
    { id: "telepathy", name: "Telepathy", category: "mental", costPerLevel: 3, maxLevel: 6, isHuman: false, detailLabel: "Telepathic Mode", detailPlaceholder: "e.g. Mind-Link Network, Silent Thought-Speech, Psychic Whispers", description: "Mind-to-mind communication, thought reading, and broadcasting." },
    { id: "teleport", name: "Teleport", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, detailLabel: "Teleport Effect / Style", detailPlaceholder: "e.g. Lightning Flash, Smoke Disappearance, Spatial Blink, Quantum Slip", description: "Instantaneous spatial transit from 10 meters to global range." },
    { id: "tough", name: "Tough", category: "physical", costPerLevel: 1, maxLevel: 10, isHuman: true, description: "Physical fortitude and constitution. Adds +10 Maximum Health Points (HP) per Level." },
    { id: "transfer", name: "Transfer", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, detailLabel: "Transfer Method", detailPlaceholder: "e.g. Arcane Blessing, Neural Uplink, Ki Bestowal, Blood Oath", description: "Bestows temporary attribute levels or energy points to allies." },
    { id: "transmute", name: "Transmute", category: "supernatural", costPerLevel: 3, maxLevel: 6, isHuman: false, detailLabel: "Transmutation Domain", detailPlaceholder: "e.g. Lead to Gold, Water to Ice, Earth Shaper, Metal Morphing", description: "Alchemically transforms one physical element or material into another." },
    { id: "tunnelling", name: "Tunnelling", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: false, detailLabel: "Burrowing Mechanism", detailPlaceholder: "e.g. Titanium Drill Head, Sonic Vibrations, Acid Melting, Mole Claws", description: "Burrows through dirt, solid stone, or reinforced concrete." },
    { id: "unaffected", name: "Unaffected", category: "defence", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Condition / Effect Immune", detailPlaceholder: "e.g. Sleep, Paralysis, Mind Control, Petrification", description: "Immunity to non-damaging magical or psionic conditions (e.g. sleep, paralysis, emotion control)." },
    { id: "unassailable", name: "Unassailable", category: "defence", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Trauma Type Resisted", detailPlaceholder: "e.g. Sanity Loss, Corruption, Psychic Trauma", description: "Unyielding mental and spiritual fortitude. Provides resistance and Armour Rating against sanity loss, terror, psychic trauma, and corruption (BESM Extras)." },
    { id: "undetectable", name: "Undetectable", category: "mental", costPerLevel: 2, maxLevel: 6, isHuman: false, detailLabel: "Undetectable Sensory Band", detailPlaceholder: "e.g. Normal Sight (Invisibility), Thermal, Radar, Psychic", description: "Imperceptible to specific sensory bands (invisible to sight, cameras, magic, or psychic senses)." },
    { id: "water_speed", name: "Water Speed", category: "physical", costPerLevel: 1, maxLevel: 6, isHuman: true, detailLabel: "Aquatic Propulsion / Form", detailPlaceholder: "e.g. Hydro-Jets, Mermaid Tail, Aqua-Turbines, Dolphin Kick", description: "High-speed aquatic swimming or naval cruising." },
    { id: "wealth", name: "Wealth", category: "social", costPerLevel: 3, maxLevel: 5, isHuman: true, detailLabel: "Source of Wealth", detailPlaceholder: "e.g. Zaibatsu Heir, Treasure Hunter, Venture Capitalist, Crime Boss", description: "Level 1: Well-off; Level 2: Rich; Level 3: Multi-millionaire; Level 4: Billionaire / Mega-corp owner." },
    { id: "weapon", name: "Weapon", category: "combat", costPerLevel: 2, maxLevel: 10, isHuman: true, allowMultiple: true, acceptsModifiers: true, modifierType: "weapon", detailLabel: "Weapon Name / Design", detailPlaceholder: "e.g. Plasma Cannon, Katana, Mystic Blast", description: "A damaging weapon, signature attack, or energy blast. Inflicts (Level × Damage Multiplier) base damage, plus chosen Enhancements (Armor-Piercing, Area, Stun, Range) and Limiters." }
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
        { id: "area_knowledge", name: "Area Knowledge", stat: "Mind", allowMultiple: true, description: "Familiarity with geography, landmarks, culture, and personalities of a designated city, province, or realm.", specializations: ["One specific locale"] },
        { id: "civilisation", name: "Civilisation", stat: "Mind", allowMultiple: true, description: "Understanding history, traditions, laws, customs, and structure of a specific society or population.", specializations: ["One specific culture or population"] },
        { id: "cultural_arts", name: "Cultural Arts", stat: "Mind", allowMultiple: true, description: "Scholarly appreciation and history of fine arts, gastronomy, literature, mythology, nobility, and philosophy.", specializations: ["Gastronomy", "History", "Literature", "Mythology", "Nobility", "Philosophy", "Rare Object Appraisal", "Urban Legends"] },
        { id: "history", name: "History", stat: "Mind", allowMultiple: true, description: "In-depth knowledge of historical eras, conflicts, geopolitical treaties, and dynasties.", specializations: ["Ancient", "Medieval", "Modern", "Military", "Diplomatic", "Galactic"] },
        { id: "languages", name: "Languages", stat: "Mind", allowMultiple: true, description: "Speaking, reading, writing, translation, and cryptography across spoken, written, or visual tongues.", specializations: ["Any single language", "Braille", "Code Language", "Lip-Reading", "Sign Language"] },
        { id: "law", name: "Law", stat: "Mind", allowMultiple: true, description: "Statutes, legal precedents, courtroom advocacy, contracts, civil rights, and criminal codes.", specializations: ["Civil", "Criminal", "Customs", "Family", "International", "Political", "Real Estate"] },
        { id: "philosophy", name: "Philosophy", stat: "Mind", allowMultiple: true, description: "Schools of logic, ethics, epistemology, metaphysics, and political theory.", specializations: ["Ethics", "Logic", "Metaphysics", "Political Philosophy", "Eastern", "Western"] },
        { id: "religion", name: "Religion", stat: "Soul", allowMultiple: true, description: "Theological scriptures, religious dogma, holy rituals, sacred rites, and ecclesiastical hierarchy.", specializations: ["Academic", "Dogma", "Congregational", "Context", "Enlightenment", "Guidance", "Interpretation", "Scripture"] },
        { id: "social_sciences", name: "Social Sciences", stat: "Mind", allowMultiple: true, description: "Systematic study of human societies, behavior, archaeology, and institutions.", specializations: ["Archaeology", "Anthropology", "Communication", "Education", "Politics", "Psychology", "Social Work", "Sociology"] },
        { id: "writing", name: "Writing", stat: "Mind", allowMultiple: true, description: "Composition of prose, investigative journalism, technical documentation, poetry, or fiction.", specializations: ["Academic", "Fiction", "Journalistic", "Poetic", "Religious", "Technical"] }
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
        { id: "artisan", name: "Artisan", stat: "Body", allowMultiple: true, description: "Manual mastery of fine functional crafts, construction, and materials fabrication.", specializations: ["Blacksmith", "Bowyer-Fletcher", "Carpentry", "Enchanting Objects", "Leatherworking", "Metalworking", "Plumbing", "Pottery", "Tailoring", "Woodworking"] },
        { id: "performing_arts", name: "Performing Arts", stat: "Soul", allowMultiple: true, description: "Live presentation, theatrical stage presence, dance, instrument mastery, and vocal performance.", specializations: ["Comedy", "Dance", "Drama", "Musical Instrument", "Public Speaking", "Singing"] },
        { id: "visual_arts", name: "Visual Arts", stat: "Mind", allowMultiple: true, description: "Static visual media, fine arts creation, digital graphic design, and sculpting.", specializations: ["Animation", "Carving", "Drawing", "Flower Arranging", "Painting", "Photography", "Sculpting", "Video"] }
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
        { id: "animal_training", name: "Animal Training", stat: "Soul", allowMultiple: true, description: "Conditioning, obedience training, commands, and compassionate care of animals.", specializations: ["Any single animal species (Canines, Felines, Equines, Birds, Beasts)"] },
        { id: "childrearing", name: "Childrearing", stat: "Soul", description: "Nurturing, discipline, education, pediatric health, and moral development of children.", specializations: ["Infants", "Toddlers", "Adolescents", "Special Needs"] },
        { id: "cleaning_maintenance", name: "Cleaning & Maintenance", stat: "Body", description: "Hygiene, deep domestic sanitation, laundry, stain removal, and organization.", specializations: ["Detailed Cleaning", "Deep Sanitation", "Hazard Cleanup", "Organizing"] },
        { id: "cooking", name: "Cooking (Gastronomy)", stat: "Mind", allowMultiple: true, description: "Culinary preparation, recipe invention, baking, butchery, and gourmet banqueting.", specializations: ["Baking", "Brewing", "Comfort Food", "Exotic Cuisine", "Gourmet", "Traditional"] },
        { id: "decorating", name: "Decorating", stat: "Mind", description: "Interior aesthetics, lighting, furniture layout, color palettes, and living ambiance.", specializations: ["Feng Shui", "Minimalist", "Opulent", "Practical", "Thematic"] },
        { id: "domestic_arts", name: "Domestic Arts", stat: "Soul", allowMultiple: true, description: "Holistic household management, home remedies, thrift, and hospitable living.", specializations: ["Childrearing", "Cleaning", "Cooking", "Decorating", "Gardening", "Home Budgeting"] },
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
        { id: "trade_craft", name: "Trade & Blue-Collar Craft", stat: "Body", allowMultiple: true, description: "Skilled vocational trade: electrician, plumber, machinist, welder, carpenter, or mechanic.", specializations: ["Electrician", "Machinist", "Mechanic", "Plumber", "Welder"] },
        { id: "specific_career", name: "Designated Career Vocation", stat: "Mind", allowMultiple: true, description: "Professional mastery in an individualized vocation not covered by other groups.", specializations: ["One specific vocation"] }
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
        { id: "athletics", name: "Athletics (Sports)", stat: "Body", allowMultiple: true, description: "Organized competitive sports, track and field, throwing accuracy, and physical contests.", specializations: ["Baseball", "Basketball", "Football", "Martial Competitions", "Soccer", "Track and Field"] },
        { id: "boating", name: "Boating", stat: "Body", description: "Piloting small watercraft, speedboats, sailboats, personal watercraft, and river navigating.", specializations: ["Hovercraft", "Hydrofoils", "Large Ships", "Small Boats", "Submarines"] },
        { id: "climbing", name: "Climbing", stat: "Body", description: "Ascending sheer cliffs, masonry walls, rigging ropes, and skyscraper faces.", specializations: ["Natural Surfaces", "Poles", "Ropes", "Vegetation", "Walls"] },
        { id: "controlled_breathing", name: "Controlled Breathing", stat: "Body", description: "Conserving lung capacity, heart-rate regulation under duress, and poison gas resistance.", specializations: ["Calm", "Cyclic Breathing", "Holding Breath", "Slow Heart Rate"] },
        { id: "deep_sea_diving", name: "Deep-Sea Diving", stat: "Body", description: "Scuba diving, pressurized deep ocean exploration, decompression safety, and underwater work.", specializations: ["Commercial", "Deep-Sea Diving", "Free-Diving", "Scuba", "Snorkeling"] },
        { id: "driving", name: "Driving", stat: "Body", allowMultiple: true, description: "Operating ground motor vehicles, stunt driving, high-speed chases, and vehicular maneuvering.", specializations: ["Armored Fighting Vehicle", "Bicycle", "Big Rig", "Bus", "Car", "Giant Robot", "Motorcycle", "Small Truck", "Teamster", "Walker"] },
        { id: "navigation", name: "Navigation", stat: "Mind", description: "Plotting courses by landmarks, celestial stars, compass headings, topographical maps, and GPS.", specializations: ["Air", "Highway", "Sea", "Space", "Undersea", "Urban", "Wilderness"] },
        { id: "piloting", name: "Piloting", stat: "Body", allowMultiple: true, description: "Flying helicopters, fixed-wing aircraft, supersonic fighters, spacecraft, and aerial mecha.", specializations: ["Giant Robot", "Heavy Airplane", "Helicopter", "Jet Fighter", "Light Airplane", "Lighter-Than-Air Craft", "Spacecraft"] },
        { id: "power_lifting", name: "Power Lifting", stat: "Body", description: "Leverage technique for hoisting, carrying, and benching massive physical loads without injury.", specializations: ["Bulky Objects", "Free Weights", "Humans", "Moving Objects", "Small Objects"] },
        { id: "riding", name: "Riding", stat: "Body", allowMultiple: true, description: "Equestrian riding, controlling riding mounts, mounted combat, and alien beast handling.", specializations: ["Horses", "Camels", "Canines", "Winged Mounts", "Exotic Beasts"] },
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
        { id: "archaeology", name: "Archaeology", stat: "Mind", allowMultiple: true, description: "Excavating ancient ruins, dating artifacts, carbon analysis, and ancient script deciphering.", specializations: ["Ancient Civilizations", "Cuneiform", "Prehistoric", "Relic Authentication"] },
        { id: "astronomy", name: "Astronomy", stat: "Mind", allowMultiple: true, description: "Stellar cartography, orbital mechanics, planetary atmospheres, astrophysics, and cosmic phenomena.", specializations: ["Astrophysics", "Cosmology", "Planetary Science", "Stellar Cartography"] },
        { id: "biological_sciences", name: "Biological Sciences", stat: "Mind", allowMultiple: true, description: "Microbiology, cellular genetics, botany, zoology, alien ecosystem biology, and evolution.", specializations: ["Astrobiology", "Bacteria/Viruses", "Bioengineering", "Botany", "Genetics", "Physiology", "Zoology"] },
        { id: "chemistry", name: "Chemistry", stat: "Mind", allowMultiple: true, description: "Organic synthesis, industrial reactions, chemical polymers, hazardous solvents, and pyrotechnics.", specializations: ["Biochemistry", "Inorganic", "Organic", "Polymers", "Thermochemistry"] },
        { id: "climatology", name: "Climatology & Earth Sciences", stat: "Mind", allowMultiple: true, description: "Meteorological forecasts, storm path modeling, seismology, hydrology, and geology.", specializations: ["Climatology", "Ecology", "Geography", "Geology", "Geophysics", "Hydrology", "Meteorology", "Oceanography"] },
        { id: "mathematics", name: "Mathematics", stat: "Mind", allowMultiple: true, description: "Higher calculus, abstract statistical models, quantum equations, and cryptography.", specializations: ["Cryptography", "Differential Equations", "Statistics", "Theoretical Math"] },
        { id: "medical", name: "Medical", stat: "Mind", allowMultiple: true, description: "Clinical diagnosis, emergency paramedic triage, field trauma surgery, and pharmacology.", specializations: ["Chiropractic", "Dentistry", "Diagnosis", "Emergency Response", "Family Practice", "Nursing", "Obstetrics", "Pathology", "Pharmacy", "Surgery", "Veterinary"] },
        { id: "naturopathy", name: "Naturopathy", stat: "Soul", allowMultiple: true, description: "Holistic herbal medicines, acupuncture, massage therapy, and natural botanical therapies.", specializations: ["Acupuncture", "Aromatherapy", "Herbalism", "Homoeopathy", "Massage Therapy", "Reflexology"] },
        { id: "physical_sciences", name: "Physical Sciences (Physics)", stat: "Mind", allowMultiple: true, description: "Thermodynamics, optics, particle physics, quantum mechanics, and relativity.", specializations: ["Acoustics", "Electromagnetism", "Nuclear", "Optics", "Particle Physics", "Quantum Mechanics", "Thermodynamics"] },
        { id: "psychology", name: "Psychology", stat: "Mind", allowMultiple: true, description: "Cognitive behavior analysis, therapy, mental health diagnosis, and counseling techniques.", specializations: ["Abnormal Psychology", "Behavioral Analysis", "Clinical Therapy", "Neuropsychology"] }
      ]
    }
  ],

  // Table 14: Defects (BESM 4E Core, p. 155 & BESM Extras)
  // Lesser: -1/-2/-3 CP (1 CP / Rank)
  // Greater: -2/-4/-6 CP (2 CP / Rank)
  // Serious: -3/-6/-9 CP (3 CP / Rank)
  defects: [
    // Lesser Defects (-1 / -2 / -3 CP)
    { id: "conditional_ownership", name: "Conditional Ownership", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Owner / Agency", detailPlaceholder: "e.g. Military, Megacorp, Patron, Bank", description: "Gear or vehicle is owned by a patron, bank, or agency and may be audited, revoked, or inspected." },
    { id: "demure", name: "Demure", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Extremely unassertive, painfully shy, or subservient. Suffers -2 penalty on Initiative rolls and social intimidation (BESM Extras)." },
    { id: "easily_distracted", name: "Easily Distracted", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Obsession / Distraction", detailPlaceholder: "e.g. Shiny Gadgets, Cute Animals, Food", allowMultiple: true, description: "A particular obsession (shiny gadgets, cute animals, attractive people) draws attention away from danger." },
    { id: "fragile", name: "Fragile", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Low physical resilience. Subtracts 5 Maximum Health Points per Rank." },
    { id: "inept_attack", name: "Inept Attack", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Clumsiness or hesitation in battle. Reduces Attack Combat Value (ACV) by -1 per Rank." },
    { id: "inept_defence", name: "Inept Defence", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Slow evasive instincts. Reduces Defence Combat Value (DCV) by -1 per Rank." },
    { id: "involuntary_change", name: "Involuntary Change", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Trigger / Form", detailPlaceholder: "e.g. Cold Water, Full Moon, High Stress", description: "Changes form unexpectedly when exposed to a trigger (cold water, full moon, stress)." },
    { id: "magnet", name: "Magnet", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Attracts trouble, comedic mishaps, or an endless swarm of eccentric admirers." },
    { id: "marked", name: "Marked", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Marking / Feature", detailPlaceholder: "e.g. Heterochromia, Glowing Horns, Cybernetic Eye", allowMultiple: true, description: "Distinctive physical feature (heterochromia, strange hair, horns, cyberware) making you memorable." },
    { id: "nemesis", name: "Nemesis", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Rival / Antagonist", detailPlaceholder: "e.g. High School Rival, Arch-Nemesis, Bounty Hunter", allowMultiple: true, description: "A dedicated rival, school competitor, or personal antagonist who frequently interferes." },
    { id: "nightmares", name: "Nightmares", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Haunted sleep patterns that periodically interfere with natural Energy Point recovery." },
    { id: "phobia", name: "Phobia", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Phobic Trigger", detailPlaceholder: "e.g. Heights, Spiders, Enclosed Spaces, Fire", allowMultiple: true, description: "Intense, irrational dread. Suffer Obstacle on actions when confronting the phobic trigger." },
    { id: "red_tape", name: "Red Tape", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Bureaucratic clearance, paperwork, or military oversight delays your missions." },
    { id: "shortcoming", name: "Shortcoming", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Stat Deficiency", detailPlaceholder: "e.g. Clumsy Body, Gullible Mind, Weak-Willed Soul", allowMultiple: true, description: "Deficiency in one specific aspect of a Stat (e.g. Clumsy Body, Gullible Mind, Weak-Willed Soul)." },
    { id: "significant_other", name: "Significant Other", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Person / Loved One", detailPlaceholder: "e.g. Younger Sister, Childhood Sweetheart, Mentor", allowMultiple: true, description: "A loved one, family member, or friend whom villains target and who requires regular protection." },
    { id: "social_fault", name: "Social Fault", category: "lesser", refundPerRank: 1, maxRank: 3, detailLabel: "Personality Flaw", detailPlaceholder: "e.g. Boastful, Blunt, Arrogant, Shy", allowMultiple: true, description: "Rude, arrogant, painfully shy, boastful, or blunt personality flaw." },
    { id: "unappealing", name: "Unappealing", category: "lesser", refundPerRank: 1, maxRank: 3, description: "Unpleasant aesthetic appearance, grotesque traits, or severe social unfriendliness." },
    { id: "unsettled", name: "Unsettled", category: "lesser", refundPerRank: 1, maxRank: 3, description: "An eerie, ominous aura or unnatural presence that disturbs normal animals and sensitive individuals, alerting them to your approach (BESM Extras)." },

    // Greater Defects (-2 / -4 / -6 CP)
    { id: "achilles_heel", name: "Achilles Heel", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Vulnerability Form", detailPlaceholder: "e.g. Silver, Cold Iron, Electricity, Fire", allowMultiple: true, description: "Takes double damage from a specific attack type (e.g. silver, wooden stakes, cold iron, electricity)." },
    { id: "awkward_size", name: "Awkward Size", category: "greater", refundPerRank: 2, maxRank: 3, description: "Unusually huge or miniature without commensurate combat scaling benefits, making navigating normal doorways, vehicles, and furniture difficult (BESM Extras)." },
    { id: "bane", name: "Bane", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Bane Substance", detailPlaceholder: "e.g. Sunlight, Running Water, Garlic, Holy Water", allowMultiple: true, description: "A normally harmless substance (sunlight, running water, garlic, holy water) inflicts severe damage on contact." },
    { id: "blind_fury", name: "Blind Fury", category: "greater", refundPerRank: 2, maxRank: 3, description: "Enters an uncontrollable berserk frenzy in combat, unable to distinguish friend from foe." },
    { id: "cursed", name: "Cursed", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Curse Effect", detailPlaceholder: "e.g. Technology Jinx, Ill Omen, Bad Luck", description: "Afflicted with a supernatural or karmic misfortune that causes disastrous coincidences." },
    { id: "hounded", name: "Hounded", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Pursuing Group", detailPlaceholder: "e.g. Syndicate Mercenaries, Alien Agents, Secret Police", allowMultiple: true, description: "Actively hunted by corporate mercenaries, cults, alien agents, or bounty syndicates." },
    { id: "ism", name: "Ism (Prejudice)", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Prejudice / Group", detailPlaceholder: "e.g. Anti-Cyborg, Outsider, Mutant", allowMultiple: true, description: "Target of systemic discrimination, suspicion, or hostility in the local society." },
    { id: "no_healing", name: "No Healing", category: "greater", refundPerRank: 2, maxRank: 3, description: "Cannot naturally recover Health Points through rest; requires specialized engineering repairs, bio-transfusions, or rare magical rituals (BESM Extras)." },
    { id: "obligated", name: "Obligated", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Code / Duty", detailPlaceholder: "e.g. Bushido Code, Clan Oath, Corporate Contract", allowMultiple: true, description: "Bound by a strict code of honour, clan oath, or legal duty that cannot be broken." },
    { id: "skeleton_in_the_closet", name: "Skeleton in the Closet", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Secret", detailPlaceholder: "e.g. Fugitive Prince, Artificial Clone, Ex-Villain", allowMultiple: true, description: "A dark secret that would result in arrest, social ruin, or death if revealed." },
    { id: "vulnerability", name: "Vulnerability", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Attack Form Bypassing Armor", detailPlaceholder: "e.g. Sonic Attacks, Magic, Holy Weapons", allowMultiple: true, description: "A specific attack form bypasses your Armour, Force Field, or magical resistances entirely." },
    { id: "wanted", name: "Wanted", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Pursuing Law Agency", detailPlaceholder: "e.g. Intergalactic Police, Local Authorities, FBI", allowMultiple: true, description: "An active warrant or bounty is out for your arrest or termination by law enforcement." },
    { id: "weak_point", name: "Weak Point", category: "greater", refundPerRank: 2, maxRank: 3, detailLabel: "Vulnerable Spot", detailPlaceholder: "e.g. Exhaust Port, Core Gem, Unarmoured Neck", allowMultiple: true, description: "A specific physical weak spot (exhaust port, unarmoured gem, core) that allows critical damage." },

    // Serious Defects (-3 / -6 / -9 CP)
    { id: "confined", name: "Confined", category: "serious", refundPerRank: 3, maxRank: 3, detailLabel: "Bound Location / Object", detailPlaceholder: "e.g. Sacred Shrine, Magic Lamp, Dimension Barrier", description: "Bound to a specific location, shrine, lamp, or container and cannot leave without permission." },
    { id: "impaired_manipulation", name: "Impaired Manipulation", category: "serious", refundPerRank: 3, maxRank: 3, description: "Lacks hands, fingers, or prehensile limbs to manipulate fine tools or weapons." },
    { id: "impaired_speech", name: "Impaired Speech", category: "serious", refundPerRank: 3, maxRank: 3, description: "Mute, speaks only in clicks/roars, or cannot communicate verbally." },
    { id: "physical_impairment", name: "Physical Impairment", category: "serious", refundPerRank: 3, maxRank: 3, description: "Severe permanent disability: missing limb, paralysis, chronic illness." },
    { id: "reduced_damage", name: "Reduced Damage", category: "serious", refundPerRank: 3, maxRank: 3, description: "Innate weakness or peaceful aura reduces your base Damage Multiplier by -1 per Rank." },
    { id: "sensory_impairment", name: "Sensory Impairment", category: "serious", refundPerRank: 3, maxRank: 3, detailLabel: "Lost Sense", detailPlaceholder: "e.g. Blindness, Deafness", description: "Complete loss of sight (Blind) or hearing (Deaf)." },
    { id: "special_requirement", name: "Special Requirement", category: "serious", refundPerRank: 3, maxRank: 3, detailLabel: "Requirement", detailPlaceholder: "e.g. Consuming Blood, Daily Battery Recharging, Rare Crystals", allowMultiple: true, description: "Must consume blood, absorb rare crystals, or perform daily complex rituals to survive." }
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

  // Official BESM 4E General Attribute Enhancements (Applicable to non-weapon powers and abilities)
  generalEnhancements: [
    { id: "area", name: "Area Effect", costPerRank: 1, source: "core", description: "Affects all targets or volume within a radius (10m, 30m, 100m, etc.)." },
    { id: "continuing", name: "Continuing / Ongoing", costPerRank: 1, source: "core", description: "Effect persists and continues acting over subsequent combat rounds." },
    { id: "duration", name: "Duration", costPerRank: 1, source: "core", description: "Extends active duration beyond standard instant or 1-round effect (minutes, hours, days)." },
    { id: "flexible", name: "Flexible", costPerRank: 1, source: "core", description: "Adaptable application, allowing broad creative utility within the attribute's theme." },
    { id: "inconspicuous", name: "Inconspicuous", costPerRank: 1, source: "core", description: "Imperceptible or silent; leaves no obvious visual, auditory, or magical signature." },
    { id: "multidimensional", name: "Multidimensional", costPerRank: 1, source: "core", description: "Operates seamlessly across astral, ethereal, spirit, or phase dimensions." },
    { id: "potent", name: "Potent", costPerRank: 1, source: "core", description: "Adds +1 bonus per rank to attribute checks or increases difficulty for opponents to resist." },
    { id: "range", name: "Range", costPerRank: 1, source: "core", description: "Extends engagement distance beyond Touch / Self to ranged distances (10m, 50m, 250m, 1km)." },
    { id: "selective", name: "Selective", costPerRank: 1, source: "core", description: "Allows user to selectively exclude designated allies or objects from the effect." },
    { id: "targets", name: "Targets", costPerRank: 1, source: "core", description: "Can target multiple independent individuals or objects simultaneously with one activation." }
  ],

  // Official BESM 4E General Attribute Limiters (Applicable to non-weapon powers and abilities)
  generalLimiters: [
    { id: "activation", name: "Activation", refundPerRank: 1, source: "core", description: "Requires preparation time, ritual focus, or a full round before taking effect." },
    { id: "charges", name: "Charges", refundPerRank: 1, source: "core", description: "Strictly limited number of uses per encounter or per day (e.g. 3 charges)." },
    { id: "concentration", name: "Concentration", refundPerRank: 1, source: "core", description: "Requires uninterrupted concentration; breaks immediately if user takes damage." },
    { id: "conditional", name: "Conditional / Environmental", refundPerRank: 1, source: "core", description: "Only functions under specific conditions or environments (e.g. night, moonlight, underwater)." },
    { id: "delay", name: "Delay", refundPerRank: 1, source: "core", description: "Effect does not trigger immediately; delayed by several rounds, minutes, or hours." },
    { id: "dependent", name: "Dependent", refundPerRank: 1, source: "core", description: "Requires another specific power, condition, or equipment to be active first." },
    { id: "deplete", name: "Deplete / Uses Energy", refundPerRank: 1, source: "core", description: "Saps Energy Points or causes fatigue reservation each time the attribute is used." },
    { id: "detectable", name: "Detectable", refundPerRank: 1, source: "core", description: "Blatant visual flare, loud roar, or beacon gives away character position and activity." },
    { id: "exclusive", name: "Exclusive", refundPerRank: 1, source: "core", description: "Cannot use other attributes, powers, or actions in the same round as this ability." },
    { id: "fragile", name: "Fragile", refundPerRank: 1, source: "core", description: "The manifestation or conduit is fragile and can be disabled or shattered by attacks." },
    { id: "hands", name: "Hands", refundPerRank: 1, source: "core", description: "Requires one or two free hands/gestures to activate and maintain." },
    { id: "internal", name: "Internal / Irremovable", refundPerRank: 1, source: "core", description: "Integrated internally into biology or chassis; cannot be shared, loaned, or uninstalled." },
    { id: "object", name: "Object / Focus", refundPerRank: 1, source: "core", description: "Requires an external talisman, device, or focus that can be disarmed, stolen, or lost." },
    { id: "permanent", name: "Permanent", refundPerRank: 1, source: "core", description: "Effect is constantly active and cannot be deactivated or turned off at will." },
    { id: "recovery", name: "Recovery", refundPerRank: 1, source: "core", description: "Requires a mandatory cooldown or recharge rest period between activations." },
    { id: "slow", name: "Slow", refundPerRank: 1, source: "core", description: "Manifests slowly; targets gain +2 bonus to avoid or resist the effect." },
    { id: "unreliable", name: "Unreliable", refundPerRank: 1, source: "core", description: "May jam, glitch, or fail to activate on an unmodified roll of 2 or 3." },
    { id: "uses_energy", name: "Uses Energy", refundPerRank: 1, source: "core", description: "Costs Energy Points to activate or maintain each round." }
  ],

  // Set of Attribute IDs that accept modifiers (Enhancements and Limiters)
  modifierAttributes: {
    weapon: "weapon",
    absorption: "general",
    armour: "general",
    change_state: "general",
    cognition: "general",
    control_environment: "general",
    conversion: "general",
    data_access: "general",
    debilitate: "general",
    dimension_walk: "general",
    dynamic_powers: "general",
    elasticity: "general",
    exorcism: "general",
    flight: "general",
    force_field: "general",
    ground_speed: "general",
    healing: "general",
    illusion: "general",
    immovable: "general",
    immunity: "general",
    jumping: "general",
    merge: "general",
    metamorphosis: "general",
    mimic: "general",
    mind_control: "general",
    mind_shield: "general",
    nullify: "general",
    plant_control: "general",
    pocket_dimension: "general",
    portal: "general",
    power_flux: "general",
    power_variation: "general",
    projection: "general",
    regeneration: "general",
    reincarnation: "general",
    resilient: "general",
    sensory_block: "general",
    sixth_sense: "general",
    size_change: "general",
    spaceflight: "general",
    special_movement: "general",
    speed_burst: "general",
    summon_creatures: "general",
    supersense: "general",
    superspeed: "general",
    superstrength: "general",
    swarm: "general",
    telekinesis: "general",
    telepathy: "general",
    teleport: "general",
    transfer: "general",
    transmute: "general",
    tunnelling: "general",
    unaffected: "general",
    unassailable: "general",
    undetectable: "general",
    water_speed: "general"
  },

  // Helper Lookup Methods
  getAttributeDef: function(id) {
    if (!id) return null;
    const direct = this.attributes.find(a => a.id === id || a.name.toLowerCase() === id.toLowerCase());
    if (direct) return direct;
    const baseId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '');
    return this.attributes.find(a => a.id === baseId || a.name.toLowerCase() === baseId.toLowerCase()) || null;
  },
  getSubTraitDesc: function(id, subTrait) {
    if (!id || !subTrait) return "";
    const def = this.getAttributeDef(id);
    if (def && def.subTraitDescriptions && def.subTraitDescriptions[subTrait]) {
      return def.subTraitDescriptions[subTrait];
    }
    return "";
  },
  getDefectDef: function(id) {
    if (!id) return null;
    const direct = this.defects.find(d => d.id === id || d.name.toLowerCase() === id.toLowerCase());
    if (direct) return direct;
    const baseId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '');
    return this.defects.find(d => d.id === baseId || d.name.toLowerCase() === baseId.toLowerCase()) || null;
  },
  getSkillGroupDef: function(id) {
    if (!id) return null;
    return this.skillGroups.find(s => s.id === id || s.name.toLowerCase() === id.toLowerCase()) || null;
  },
  getRaceTemplate: function(id) {
    if (!id || !this.raceTemplates) return null;
    const lower = String(id).toLowerCase().trim();
    return this.raceTemplates.find(r => r.id.toLowerCase() === lower || r.name.toLowerCase() === lower) || null;
  },
  getClassTemplate: function(id) {
    if (!id || !this.classTemplates) return null;
    const lower = String(id).toLowerCase().trim();
    return this.classTemplates.find(c => c.id.toLowerCase() === lower || c.name.toLowerCase() === lower) || null;
  },
  getTemplate: function(id) {
    return this.getRaceTemplate(id) || this.getClassTemplate(id) || (this.templates ? this.templates.find(t => t.id === id || t.name.toLowerCase() === String(id).toLowerCase().trim()) : null);
  },
  getConstituentSkills: function(groupId) {
    const grp = this.getSkillGroupDef(groupId);
    return grp ? (grp.skills || []) : [];
  },
  getSkillDef: function(skillId) {
    if (!skillId) return null;
    const baseId = String(skillId).replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '');
    const lower = baseId.toLowerCase();
    for (const group of this.skillGroups) {
      if (group.skills) {
        const found = group.skills.find(s => s.id === baseId || s.id.toLowerCase() === lower || s.name.toLowerCase() === lower);
        if (found) {
          return {
            ...found,
            groupId: group.id,
            groupName: group.name,
            groupTier: group.tier,
            allowMultiple: Boolean(found.allowMultiple),
            costPerLevel: 1 // BESM 4E p. 120: Individual constituent skills cost 1 CP / Level
          };
        }
      }
    }
    return null;
  },
  isSkillRepeatable: function(skillOrId) {
    if (!skillOrId) return false;
    let def = null;
    if (typeof skillOrId === "object") {
      def = skillOrId;
      if (def.allowMultiple !== undefined) return Boolean(def.allowMultiple);
      if (def.repeatable !== undefined) return Boolean(def.repeatable);
      if (def.id || def.skillId) {
        const lookup = this.getSkillDef(def.id || def.skillId);
        if (lookup && lookup.allowMultiple !== undefined) return Boolean(lookup.allowMultiple);
      }
    } else {
      def = this.getSkillDef(skillOrId);
      if (def && def.allowMultiple !== undefined) return Boolean(def.allowMultiple);
    }
    return Boolean(def && def.allowMultiple);
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
            allowMultiple: Boolean(s.allowMultiple),
            costPerLevel: 1
          });
        });
      }
    }
    return list;
  },

  getWeaponEnhancementDef: function(idOrName) {
    if (!idOrName) return null;
    const lower = idOrName.toLowerCase();
    if (lower === "armour-piercing" || lower === "armor-piercing" || lower === "armour_piercing" || lower === "armor_piercing") {
      return this.weaponEnhancements.find(e => e.id === "piercing") || null;
    }
    if (lower === "armour-penetrating" || lower === "armor-penetrating" || lower === "armour_penetrating" || lower === "armor_penetrating") {
      return this.weaponEnhancements.find(e => e.id === "penetrating") || null;
    }
    return this.weaponEnhancements.find(e => e.id.toLowerCase() === lower || e.name.toLowerCase() === lower) || null;
  },

  getWeaponLimiterDef: function(idOrName) {
    if (!idOrName) return null;
    const lower = idOrName.toLowerCase();
    return this.weaponLimiters.find(l => l.id.toLowerCase() === lower || l.name.toLowerCase() === lower) || null;
  },

  getGeneralEnhancementDef: function(idOrName) {
    if (!idOrName) return null;
    const lower = idOrName.toLowerCase();
    return this.generalEnhancements.find(e => e.id.toLowerCase() === lower || e.name.toLowerCase() === lower) || null;
  },

  getGeneralLimiterDef: function(idOrName) {
    if (!idOrName) return null;
    const lower = idOrName.toLowerCase();
    return this.generalLimiters.find(l => l.id.toLowerCase() === lower || l.name.toLowerCase() === lower) || null;
  },

  getModifierDef: function(attrId, type, idOrName) {
    if (!idOrName) return null;
    const lower = String(idOrName).toLowerCase();
    const modType = type ? type.toLowerCase() : (attrId ? this.getModifierTypeForAttribute(attrId) : null);
    if (modType === "weapon") {
      return this.getWeaponEnhancementDef(lower) || this.getWeaponLimiterDef(lower);
    } else if (modType === "general") {
      return this.getGeneralEnhancementDef(lower) || this.getGeneralLimiterDef(lower);
    } else if (modType === "enhancement" || modType === "weapon enhancement") {
      return this.getWeaponEnhancementDef(lower) || this.getGeneralEnhancementDef(lower);
    } else if (modType === "limiter" || modType === "weapon limiter") {
      return this.getWeaponLimiterDef(lower) || this.getGeneralLimiterDef(lower);
    }
    return this.getWeaponEnhancementDef(lower) ||
           this.getWeaponLimiterDef(lower) ||
           this.getGeneralEnhancementDef(lower) ||
           this.getGeneralLimiterDef(lower);
  },

  attributeAcceptsModifiers: function(id) {
    if (!id) return false;
    const baseId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
    const def = this.getAttributeDef(baseId);
    if (def && def.acceptsModifiers !== undefined) return def.acceptsModifiers;
    return !!this.modifierAttributes[baseId];
  },

  getModifierTypeForAttribute: function(id) {
    if (!id) return null;
    const baseId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
    if (baseId === "weapon") return "weapon";
    const def = this.getAttributeDef(baseId);
    if (def && def.modifierType) return def.modifierType;
    return this.modifierAttributes[baseId] || null;
  },

  getLegalEnhancementsForAttribute: function(id) {
    const type = this.getModifierTypeForAttribute(id);
    if (type === "weapon") return this.weaponEnhancements;
    if (type === "general") return this.generalEnhancements;
    return [];
  },

  getLegalLimitersForAttribute: function(id) {
    const type = this.getModifierTypeForAttribute(id);
    if (type === "weapon") return this.weaponLimiters;
    if (type === "general") return this.generalLimiters;
    return [];
  },

  calculateWeaponCost: function(weapon) {
    if (!weapon) return { level: 1, baseCost: 2, enhCost: 0, limRefund: 0, totalCost: 2, effectiveLevel: 1, enhRanks: 0, limRanks: 0, enhancements: [], limiters: [] };
    const level = Math.max(1, parseInt(weapon.level, 10) || 1);
    const baseCost = level * 2; // BESM 4E Table 07: Weapon costs 2 CP per Level
    let enhCost = 0;
    let enhRanks = 0;
    const normalizedEnh = [];

    if (Array.isArray(weapon.enhancements)) {
      weapon.enhancements.forEach(e => {
        if (!e) return;
        const id = typeof e === "string" ? e : (e.id || e.name);
        const def = this.getWeaponEnhancementDef(id) || this.getGeneralEnhancementDef(id);
        const rank = typeof e === "object" && e.rank ? Math.max(1, parseInt(e.rank, 10)) : 1;
        const costPerRank = (def && def.costPerRank) || (typeof e === "object" && e.costPerRank) || 1;
        const name = def ? def.name : (typeof e === "string" ? e : (e.name || id));
        enhCost += rank * costPerRank;
        enhRanks += rank;
        normalizedEnh.push({ id: def ? def.id : id.toLowerCase().replace(/\s+/g, '_'), name, rank, costPerRank });
      });
    } else if (typeof weapon.enhancements === "string" && weapon.enhancements !== "None") {
      weapon.enhancements.split(",").map(s => s.trim()).filter(Boolean).forEach(name => {
        const def = this.getWeaponEnhancementDef(name) || this.getGeneralEnhancementDef(name);
        const costPerRank = def ? def.costPerRank : 1;
        enhCost += costPerRank;
        enhRanks += 1;
        normalizedEnh.push({ id: def ? def.id : name.toLowerCase().replace(/\s+/g, '_'), name: def ? def.name : name, rank: 1, costPerRank });
      });
    }

    let limRefund = 0;
    let limRanks = 0;
    const normalizedLim = [];

    if (Array.isArray(weapon.limiters)) {
      weapon.limiters.forEach(l => {
        if (!l) return;
        const id = typeof l === "string" ? l : (l.id || l.name);
        const def = this.getWeaponLimiterDef(id) || this.getGeneralLimiterDef(id);
        const rank = typeof l === "object" && l.rank ? Math.max(1, parseInt(l.rank, 10)) : 1;
        const refundPerRank = (def && def.refundPerRank) || (typeof l === "object" && l.refundPerRank) || 1;
        const name = def ? def.name : (typeof l === "string" ? l : (l.name || id));
        limRefund += rank * refundPerRank;
        limRanks += rank;
        normalizedLim.push({ id: def ? def.id : id.toLowerCase().replace(/\s+/g, '_'), name, rank, refundPerRank });
      });
    } else if (typeof weapon.limiters === "string" && weapon.limiters !== "None") {
      weapon.limiters.split(",").map(s => s.trim()).filter(Boolean).forEach(name => {
        const def = this.getWeaponLimiterDef(name) || this.getGeneralLimiterDef(name);
        const refundPerRank = def ? def.refundPerRank : 1;
        limRefund += refundPerRank;
        limRanks += 1;
        normalizedLim.push({ id: def ? def.id : name.toLowerCase().replace(/\s+/g, '_'), name: def ? def.name : name, rank: 1, refundPerRank });
      });
    }

    const netCost = Math.max(1, baseCost + enhCost - limRefund);
    const effectiveLevel = Math.max(1, level - enhRanks + limRanks);

    return {
      level,
      baseCost,
      enhCost,
      limRefund,
      totalCost: netCost,
      effectiveLevel,
      enhRanks,
      limRanks,
      enhancements: normalizedEnh,
      limiters: normalizedLim
    };
  },

  calculateAttributeCost: function(attr) {
    if (!attr) return { level: 1, baseCost: 1, enhCost: 0, limRefund: 0, totalCost: 1, effectiveLevel: 1, enhRanks: 0, limRanks: 0, enhancements: [], limiters: [] };
    const baseId = (attr.attributeId || attr.id || "").replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
    if (baseId === "weapon") {
      return this.calculateWeaponCost(attr);
    }
    const level = Math.max(1, parseInt(attr.level, 10) || 1);
    const def = this.getAttributeDef(baseId);
    const costPerLevel = attr.costPerLevel !== undefined ? attr.costPerLevel : (def ? def.costPerLevel : 1);
    const baseCost = level * costPerLevel;

    let enhCost = 0;
    let enhRanks = 0;
    const normalizedEnh = [];

    if (Array.isArray(attr.enhancements)) {
      attr.enhancements.forEach(e => {
        if (!e) return;
        const id = typeof e === "string" ? e : (e.id || e.name);
        const enhDef = this.getGeneralEnhancementDef(id) || this.getWeaponEnhancementDef(id);
        const rank = typeof e === "object" && e.rank ? Math.max(1, parseInt(e.rank, 10)) : 1;
        const costPerRank = (enhDef && enhDef.costPerRank) || (typeof e === "object" && e.costPerRank) || 1;
        const name = enhDef ? enhDef.name : (typeof e === "string" ? e : (e.name || id));
        enhCost += rank * costPerRank;
        enhRanks += rank;
        normalizedEnh.push({ id: enhDef ? enhDef.id : id.toLowerCase().replace(/\s+/g, '_'), name, rank, costPerRank });
      });
    }

    let limRefund = 0;
    let limRanks = 0;
    const normalizedLim = [];

    if (Array.isArray(attr.limiters)) {
      attr.limiters.forEach(l => {
        if (!l) return;
        const id = typeof l === "string" ? l : (l.id || l.name);
        const limDef = this.getGeneralLimiterDef(id) || this.getWeaponLimiterDef(id);
        const rank = typeof l === "object" && l.rank ? Math.max(1, parseInt(l.rank, 10)) : 1;
        const refundPerRank = (limDef && limDef.refundPerRank) || (typeof l === "object" && l.refundPerRank) || 1;
        const name = limDef ? limDef.name : (typeof l === "string" ? l : (l.name || id));
        limRefund += rank * refundPerRank;
        limRanks += rank;
        normalizedLim.push({ id: limDef ? limDef.id : id.toLowerCase().replace(/\s+/g, '_'), name, rank, refundPerRank });
      });
    }

    const netCost = Math.max(1, baseCost + enhCost - limRefund);
    const effectiveLevel = Math.max(1, level - enhRanks + limRanks);

    return {
      level,
      baseCost,
      enhCost,
      limRefund,
      totalCost: netCost,
      effectiveLevel,
      enhRanks,
      limRanks,
      enhancements: normalizedEnh,
      limiters: normalizedLim
    };
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

  // Official BESM 4E Race Templates (25 official + Human)
  raceTemplates: [
    {
      "id": "human",
      "name": "Human",
      "category": "human",
      "concept": "Standard baseline mortal with unlimited adaptability, determination, and potential across any anime setting.",
      "points": 0,
      "stats": {},
      "attributes": [],
      "defects": [],
      "weapons": []
    },
    {
      "id": "android_battle_maid",
      "name": "Android Battle-Maid",
      "category": "scifi",
      "concept": "Combat automaton disguised as an elegant domestic attendant, with reinforced chassis, tactical sensors, and hidden weaponry.",
      "points": 18,
      "stats": {
        "body": 1,
        "mind": 1
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Reinforced Synthetic Chassis)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "+10 Armour Rating from armored plating"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Lightning Reflexes)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "High-speed reflex processors"
        },
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Sensory Sensors)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Tuned visual and acoustic pickups"
        },
        {
          "id": "supersense",
          "name": "Supersense (Infrared Thermal Sight)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Sees heat signatures through smoke"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Hydraulic Actuators)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Crushing mechanical grip"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from durable alloy body"
        },
        {
          "id": "weapon",
          "name": "Weapon (Concealed Arm Blade)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Retractable monomolecular edge concealed in wrist sleeve",
          "enhancements": "Concealable",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "achilles_heel",
          "name": "Achilles Heel (EMP & Electrical Shock)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Double damage from electromagnetic pulses"
        },
        {
          "id": "obligated",
          "name": "Obligated (Service Directives / Master)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Hardcoded obedience to employer or creator"
        },
        {
          "id": "special_requirement",
          "name": "Special Requirement (Power Recharge / Maintenance)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Requires specialized recharging cradle and lubricant flushes"
        }
      ],
      "weapons": [
        {
          "name": "Concealed Arm Blade",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Concealable",
          "limiters": "Melee",
          "notes": "Retractable monomolecular edge"
        }
      ]
    },
    {
      "id": "archfiend",
      "name": "Archfiend",
      "category": "supernatural",
      "concept": "Ancient noble demon lord wielding dark hellfire, great bat wings, impenetrable fiendish hide, and crushing physical might.",
      "points": 30,
      "stats": {
        "body": 2,
        "soul": 2
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Demonic Scales)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "+10 Armour Rating from infernal hide"
        },
        {
          "id": "flight",
          "name": "Flight (Leathery Fiend Wings)",
          "level": 2,
          "costPerLevel": 3,
          "customDesc": "Soars on obsidian bat wings"
        },
        {
          "id": "immunity",
          "name": "Immunity (Hellfire & Extreme Heat)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Immune to fire and magma damage"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Demonic Might)",
          "level": 2,
          "costPerLevel": 4,
          "customDesc": "Shatters stone gates barehanded"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from demonic endurance"
        },
        {
          "id": "weapon",
          "name": "Weapon (Hellfire Blast)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "Sphere of infernal flames",
          "enhancements": "Area Effect",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Holy Relics & Sacred Water)",
          "category": "greater",
          "rank": 2,
          "refundPerRank": 2,
          "customDesc": "Burns agonizingly upon touch of consecrated items"
        },
        {
          "id": "marked",
          "name": "Marked (Curved Horns, Obsidian Wings & Tail)",
          "category": "lesser",
          "rank": 2,
          "refundPerRank": 1,
          "customDesc": "Cannot disguise monstrous fiendish anatomy easily"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Demon Hunter Order)",
          "category": "lesser",
          "rank": 2,
          "refundPerRank": 1,
          "customDesc": "Relentless holy paladins hunting your lineage"
        }
      ],
      "weapons": [
        {
          "name": "Hellfire Blast",
          "level": 3,
          "range": "30m",
          "attackType": "ranged",
          "enhancements": "Area Effect",
          "limiters": "Charges",
          "notes": "Infernal black flame"
        }
      ]
    },
    {
      "id": "asrai",
      "name": "Asrai (Water Spirit)",
      "category": "supernatural",
      "concept": "Graceful aquatic nymph or river spirit composed of cold liquid essence, swimming effortlessly and dissolving into fresh water.",
      "points": 10,
      "stats": {
        "soul": 1
      },
      "attributes": [
        {
          "id": "change_state",
          "name": "Change State (Liquid Water)",
          "level": 2,
          "costPerLevel": 3,
          "customDesc": "Melts into clear water to slip under barriers"
        },
        {
          "id": "water_speed",
          "name": "Water Speed",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Glides with supernatural speed through aquatic environments"
        },
        {
          "id": "control_environment",
          "name": "Control Environment (Water & Currents)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Calms rapids or stirs whirlpools"
        },
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Underwater Echoes)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Senses vibrations in water"
        }
      ],
      "defects": [
        {
          "id": "vulnerability",
          "name": "Vulnerability (Heat & Desiccation)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Double damage from intense drying heat and fire"
        },
        {
          "id": "fragile",
          "name": "Fragile (Vaporous Fluid Form)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "-10 Health Points"
        }
      ],
      "weapons": []
    },
    {
      "id": "dark_elf",
      "name": "Dark Elf",
      "category": "fantasy",
      "concept": "Subterranean elf attuned to shadow sorcery and silent stealth, moving with uncanny grace through midnight caverns.",
      "points": 14,
      "stats": {
        "mind": 1,
        "soul": 1
      },
      "attributes": [
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Acute Hearing)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Pinpoints faint footsteps in cavern dark"
        },
        {
          "id": "supersense",
          "name": "Supersense (Darkvision)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Sees clearly in complete absence of light"
        },
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value"
        },
        {
          "id": "defence_mastery",
          "name": "Defence Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Defence Combat Value"
        },
        {
          "id": "special_movement",
          "name": "Special Movement (Light-Footed)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Moves without leaving footprints or sound"
        },
        {
          "id": "dynamic_powers",
          "name": "Dynamic Powers (Shadow Sorcery)",
          "level": 1,
          "costPerLevel": 10,
          "customDesc": "Weaves living shadows to obscure, blind, and chill"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Direct Sunlight)",
          "category": "greater",
          "rank": 2,
          "refundPerRank": 2,
          "customDesc": "Sunlight burns pale skin and imposes -2 to all actions"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (High Elf Inquisitors)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Hunted by surface sun-elf zealots"
        }
      ],
      "weapons": []
    },
    {
      "id": "dwarf",
      "name": "Dwarf",
      "category": "fantasy",
      "concept": "Stout and unyielding subterranean artisan-warrior with iron constitution, night sight, and immovable balance.",
      "points": 10,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Dense Muscle & Bone)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+5 Armour Rating from stocky resilience"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Dwarven Might)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Exceptional lifting and hefting power"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from legendary dwarven vigor"
        },
        {
          "id": "supersense",
          "name": "Supersense (Darkvision)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Sees perfectly in cavern gloom"
        },
        {
          "id": "immovable",
          "name": "Immovable",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Resists knockdowns and involuntary displacement"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Broad Stout Frame & Braided Beard)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Instantly recognizable dwarven physique"
        },
        {
          "id": "shortcoming",
          "name": "Shortcoming (Stubborn Pride / Gold Lust)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Reluctant to retreat or surrender treasure"
        }
      ],
      "weapons": []
    },
    {
      "id": "fairy",
      "name": "Fairy",
      "category": "fantasy",
      "concept": "Tiny winged sprite steeped in woodland glamour and mischievous fey trickery, fluttering between realms in shimmering light.",
      "points": 16,
      "stats": {
        "soul": 1
      },
      "attributes": [
        {
          "id": "flight",
          "name": "Flight (Gossamer Wings)",
          "level": 2,
          "costPerLevel": 3,
          "customDesc": "Hover and dart on shimmering insectoid wings"
        },
        {
          "id": "dimension_walk",
          "name": "Dimension Walk (Fey Crossing)",
          "level": 1,
          "costPerLevel": 3,
          "customDesc": "Steps between mortal realm and twilight Faerie"
        },
        {
          "id": "dynamic_powers",
          "name": "Dynamic Powers (Fey Glamour)",
          "level": 1,
          "costPerLevel": 10,
          "customDesc": "Manifests sparkling lights, harmless illusions, and whimsical magic"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Cold Iron)",
          "category": "greater",
          "rank": 2,
          "refundPerRank": 2,
          "customDesc": "Cold-forged iron burns fairy flesh and disrupts glamour"
        },
        {
          "id": "awkward_size",
          "name": "Awkward Size (Diminutive Pixie Stature)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Less than 30 cm tall; struggles with normal human tools"
        }
      ],
      "weapons": []
    },
    {
      "id": "giant_living_robot",
      "name": "Giant Living Robot",
      "category": "scifi",
      "concept": "Sentient colossal titan forged from ancient hyper-alloys or alien technology, packing tremendous physical force and sensor suites.",
      "points": 24,
      "stats": {
        "body": 3
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Heavy Composite Hull)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "+15 Armour Rating against kinetic and energy fire"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Colossal Actuators)",
          "level": 3,
          "costPerLevel": 4,
          "customDesc": "Lifts vehicles and crumbles masonry"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 3,
          "costPerLevel": 1,
          "customDesc": "+30 Health Points from titanic mass"
        },
        {
          "id": "supersense",
          "name": "Supersense (Radar & Sensor Array)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Surrounding spatial radar scanner"
        }
      ],
      "defects": [
        {
          "id": "achilles_heel",
          "name": "Achilles Heel (EMP / High-Voltage Lightning)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Vulnerable to massive electrical discharges"
        },
        {
          "id": "awkward_size",
          "name": "Awkward Size (Colossal Scale)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Cannot enter normal buildings or human vehicles"
        },
        {
          "id": "special_requirement",
          "name": "Special Requirement (Heavy Coolant & Maintenance Rig)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Requires specialized gantry and heavy hydraulic fluids"
        }
      ],
      "weapons": []
    },
    {
      "id": "grey",
      "name": "Grey (Alien)",
      "category": "alien",
      "concept": "Slender extraterrestrial visitor with oversized cranium and almond eyes, possessing formidable telepathic and telekinetic intellect.",
      "points": 12,
      "stats": {
        "mind": 2
      },
      "attributes": [
        {
          "id": "telepathy",
          "name": "Telepathy (Mind Speech)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Broadcasts thoughts and reads surface intent"
        },
        {
          "id": "telekinesis",
          "name": "Telekinesis (Kinetic Levitation)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Manipulates tools and lifts items mentally"
        },
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Auditory)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Hears ultrasonic vibrations"
        },
        {
          "id": "supersense",
          "name": "Supersense (Electromagnetic Vision)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Sees radio and energy spectrums"
        }
      ],
      "defects": [
        {
          "id": "physical_impairment",
          "name": "Physical Impairment (Frail & Brittle Frame)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Lightweight bones easily damaged by rough handling"
        },
        {
          "id": "marked",
          "name": "Marked (Almond Eyes & Pale Grey Skin)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Instantly recognizable alien morphology"
        }
      ],
      "weapons": []
    },
    {
      "id": "half_dragon",
      "name": "Half-Dragon",
      "category": "fantasy",
      "concept": "Mortal born with draconic royal blood, manifesting gleaming chromatic scales, vestigial wings, supreme vitality, and searing elemental breath.",
      "points": 20,
      "stats": {
        "body": 1,
        "soul": 1
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Chromatic Scales)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "+10 Armour Rating from hardened reptilian scales"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Draconic Power)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Immense physical sinew and grip"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from draconic blood"
        },
        {
          "id": "flight",
          "name": "Flight (Draconic Wings)",
          "level": 1,
          "costPerLevel": 3,
          "customDesc": "Glides and ascends on leathery wings"
        },
        {
          "id": "weapon",
          "name": "Weapon (Draconic Breath Blast)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "Cone of searing elemental fire or lightning",
          "enhancements": "Area Effect",
          "limiters": "Concentration"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Glacial Ice / Dragon-Slaying Steel)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Suffers double trauma from cold or dragonbane weapons"
        },
        {
          "id": "marked",
          "name": "Marked (Horns, Slitted Pupils & Scales)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Prominent crest of horns and shimmering scaly patches"
        }
      ],
      "weapons": [
        {
          "name": "Draconic Breath Blast",
          "level": 3,
          "range": "20m",
          "attackType": "ranged",
          "enhancements": "Area Effect",
          "limiters": "Concentration",
          "notes": "Searing elemental blast"
        }
      ]
    },
    {
      "id": "half_oni",
      "name": "Half-Oni",
      "category": "supernatural",
      "concept": "Fierce demon-ogre hybrid bearing horned brow and fiery temper, famous for devastating club strikes and supernatural resilience.",
      "points": 16,
      "stats": {
        "body": 2
      },
      "attributes": [
        {
          "id": "superstrength",
          "name": "Superstrength (Ogre Might)",
          "level": 2,
          "costPerLevel": 4,
          "customDesc": "Crushes timber and hurls boulder-sized obstacles"
        },
        {
          "id": "armour",
          "name": "Armour (Thick Oni Hide)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+5 Armour Rating from tough demonic skin"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from ogre stamina"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Brutal)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Devastating critical impact"
        },
        {
          "id": "weapon",
          "name": "Weapon (Kanabo Iron Club Smash)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Heavy studded iron club strike",
          "enhancements": "Piercing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Crimson Skin, Fangs & Horns)",
          "category": "lesser",
          "rank": 2,
          "refundPerRank": 1,
          "customDesc": "Blatantly demonic appearance"
        },
        {
          "id": "blind_fury",
          "name": "Blind Fury (Berserk Rage)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Flys into a rage when insulted or wounded"
        }
      ],
      "weapons": [
        {
          "name": "Kanabo Iron Club Smash",
          "level": 1,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Piercing",
          "limiters": "Melee",
          "notes": "Heavy iron club blow"
        }
      ]
    },
    {
      "id": "half_orc",
      "name": "Half-Orc",
      "category": "fantasy",
      "concept": "Rugged and durable survivor of frontier clans, endowed with keen low-light vision, thick musculature, and fierce tenacity.",
      "points": 8,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "superstrength",
          "name": "Superstrength (Orcish Sinew)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Powerful athletic physique"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from rough frontier conditioning"
        },
        {
          "id": "supersense",
          "name": "Supersense (Low-Light Night Sight)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Sees clearly in starlight and campfire shadow"
        },
        {
          "id": "resilient",
          "name": "Resilient",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 bonus to resist toxins and exhaustion"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Prominent Lower Tusks & Heavy Brow)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Clear orcish lineage"
        },
        {
          "id": "social_fault",
          "name": "Social Fault (Gruff Frontier Demeanor)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Unrefined manners causing social friction"
        }
      ],
      "weapons": []
    },
    {
      "id": "haud",
      "name": "Haud (Alien Warrior)",
      "category": "alien",
      "concept": "Ruthless warlike alien conqueror with quad-jointed limbs, chittering mandibles, internal plasma gland, and relentless martial instinct.",
      "points": 18,
      "stats": {
        "body": 1,
        "mind": 1
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Chitinous Exoskeleton)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "+10 Armour Rating from segmented alien carapace"
        },
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value"
        },
        {
          "id": "defence_mastery",
          "name": "Defence Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Defence Combat Value"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Alien Sinew)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "High torque alien limbs"
        },
        {
          "id": "supersense",
          "name": "Supersense (Thermal Vision)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Detects infrared body heat"
        },
        {
          "id": "weapon",
          "name": "Weapon (Bio-Plasma Spit)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "Volatile bio-plasma fired from thoracic gland",
          "enhancements": "Piercing",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Monstrous Alien Anatomy)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Terrifying extraterrestrial appearance"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Galactic Coalition Marshals)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Wanted across civilized star systems"
        },
        {
          "id": "shortcoming",
          "name": "Shortcoming (Arrogant Martial Pride)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Refuses to treat weaker species as equals"
        }
      ],
      "weapons": [
        {
          "name": "Bio-Plasma Spit",
          "level": 3,
          "range": "30m",
          "attackType": "ranged",
          "enhancements": "Piercing",
          "limiters": "Charges",
          "notes": "Corrosive bio-plasma glob"
        }
      ]
    },
    {
      "id": "homo_psyche",
      "name": "Homo Psyche (Psion)",
      "category": "scifi",
      "concept": "Next evolutionary leap in human consciousness, tapping deep cerebral reserves to read thoughts, move matter, and sense psychic resonance.",
      "points": 14,
      "stats": {
        "mind": 1,
        "soul": 1
      },
      "attributes": [
        {
          "id": "telepathy",
          "name": "Telepathy (Mind Speech & Reading)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Communicates telepathically and reads thoughts"
        },
        {
          "id": "telekinesis",
          "name": "Telekinesis (Kinetic Wave)",
          "level": 2,
          "costPerLevel": 4,
          "customDesc": "Hurls physical force and barriers with mind power"
        }
      ],
      "defects": [
        {
          "id": "achilles_heel",
          "name": "Achilles Heel (Psychic Backlash & Neural Strain)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Extreme mental strain or psionic feedback triggers severe disorientation"
        }
      ],
      "weapons": []
    },
    {
      "id": "kodama",
      "name": "Kodama (Tree Spirit)",
      "category": "spirit",
      "concept": "Gentle forest spirit inhabiting ancient sacred trees, camouflaging effortlessly into wooden bark and coaxing vines to protect travelers.",
      "points": 8,
      "stats": {
        "soul": 1
      },
      "attributes": [
        {
          "id": "change_state",
          "name": "Change State (Wood / Tree Form)",
          "level": 1,
          "costPerLevel": 3,
          "customDesc": "Merges into living trees and woody flora"
        },
        {
          "id": "plant_control",
          "name": "Plant Control (Flora Empathy)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Coaxes roots, branches, and flowers to blossom"
        },
        {
          "id": "control_environment",
          "name": "Control Environment (Sacred Grove Mists)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Summons tranquil protective forest mist"
        },
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Ecosystem Awareness)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Feels tremors in the roots of the forest"
        }
      ],
      "defects": [
        {
          "id": "vulnerability",
          "name": "Vulnerability (Open Fire & Chainsaws)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Double damage from fire and timber-clearing tools"
        }
      ],
      "weapons": []
    },
    {
      "id": "nekojin",
      "name": "Nekojin (Cat-Folk)",
      "category": "beast",
      "concept": "Agile feline humanoid with twitching cat ears and tail, legendary nine-lives luck, lightning acrobatics, and razor claw strikes.",
      "points": 10,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Feline Scent & Hearing)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Tracks prey by sound and faint scents"
        },
        {
          "id": "special_movement",
          "name": "Special Movement (Balance & Cat-Landing)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Always lands on feet; balances on thin wires"
        },
        {
          "id": "supersense",
          "name": "Supersense (Night Vision)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Sees clearly in near-total darkness"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Lightning Reflexes)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+2 initiative bonus"
        },
        {
          "id": "weapon",
          "name": "Weapon (Retractable Razor Claws)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Razor-sharp nails extending from finger pads",
          "enhancements": "Concealable",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Feline Ears & Whiskers / Tail)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Cat ears and twitching tail cannot be hidden"
        },
        {
          "id": "easily_distracted",
          "name": "Easily Distracted (Laser Dots, Fish & Catnip)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Struggles to ignore playful lures and cat delights"
        }
      ],
      "weapons": [
        {
          "name": "Retractable Razor Claws",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Concealable",
          "limiters": "Melee",
          "notes": "Retractable feline claws"
        }
      ]
    },
    {
      "id": "parasite",
      "name": "Parasite (Symbiote)",
      "category": "alien",
      "concept": "Amorphous sentient alien organism that bonds with a living host, granting enhanced physical power, rapid cellular mending, and bio-armor.",
      "points": 16,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "alternate_form",
          "name": "Alternate Form (Host Symbiosis)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Shifts host into ferocious bonded war state"
        },
        {
          "id": "healing",
          "name": "Healing (Cellular Mending)",
          "level": 2,
          "costPerLevel": 4,
          "customDesc": "Quickly knits host wounds and neutralizes toxins"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Symbiotic Muscle)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Envelops muscles in hyper-dense biomass"
        },
        {
          "id": "armour",
          "name": "Armour (Hardened Bio-Sheath)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+5 Armour Rating from organic chitin"
        }
      ],
      "defects": [
        {
          "id": "special_requirement",
          "name": "Special Requirement (Living Host Vessel & Bio-Nutrients)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Must inhabit a living compatible biological host"
        },
        {
          "id": "bane",
          "name": "Bane (High-Frequency Sonics & Concussive Fire)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Sonic pitch tears symbiote bonding away from host"
        }
      ],
      "weapons": []
    },
    {
      "id": "shapechanger",
      "name": "Shapechanger",
      "category": "beast",
      "concept": "Deceptive mimic capable of reshaping flesh, face, voice, and size at will, slipping undetected past any guard or checkpoint.",
      "points": 18,
      "stats": {
        "mind": 1
      },
      "attributes": [
        {
          "id": "alternate_form",
          "name": "Alternate Form (Metamorphosis)",
          "level": 2,
          "costPerLevel": 4,
          "customDesc": "Transforms into different personas, animals, and disguises"
        },
        {
          "id": "mimic",
          "name": "Mimic (Voice & Feature Copying)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Perfect mimicry of spoken pitch and mannerisms"
        },
        {
          "id": "social_mastery",
          "name": "Social Mastery (Impersonation)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+2 bonus to acting and disguise deception"
        },
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Scent)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Identifies people by subtle odor"
        },
        {
          "id": "special_movement",
          "name": "Special Movement (Contortionist)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Slips through iron bars and narrow ducts"
        },
        {
          "id": "size_change",
          "name": "Size Change",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Grows or shrinks by several orders of size"
        }
      ],
      "defects": [
        {
          "id": "skeleton_in_the_closet",
          "name": "Skeleton in the Closet (True Identity Concealed)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Constant risk of being unmasked as a shapeshifting imposter"
        },
        {
          "id": "unsettled",
          "name": "Unsettled (Fluctuating Anatomy)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Unconscious moments cause subtle features to shift unnervingly"
        }
      ],
      "weapons": []
    },
    {
      "id": "skeleton_key",
      "name": "Skeleton Key (Living Skeleton)",
      "category": "undead",
      "concept": "Animated skeletal warrior or rogue possessing hollow bones immune to mortal ailments, picking locks with finger digits.",
      "points": 12,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Bleached Bone Plating)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "+10 Armour Rating against edged weapons"
        },
        {
          "id": "immunity",
          "name": "Immunity (Poisons, Disease & Suffocation)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Undead lack of biological organs"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from enchanted bone matrix"
        },
        {
          "id": "regeneration",
          "name": "Regeneration (Bone Reassembly)",
          "level": 1,
          "costPerLevel": 5,
          "customDesc": "Snaps dislodged bones back into place"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Walking Animated Skeleton)",
          "category": "lesser",
          "rank": 2,
          "refundPerRank": 1,
          "customDesc": "Terrifies mundane mortals on sight"
        },
        {
          "id": "vulnerability",
          "name": "Vulnerability (Bludgeoning Crushing Trauma)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Double damage from heavy blunt maces and warhammers"
        },
        {
          "id": "social_fault",
          "name": "Social Fault (Bone Rattling & Grim Visage)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Lacks facial expressions, clatters when walking"
        }
      ],
      "weapons": []
    },
    {
      "id": "slime",
      "name": "Slime",
      "category": "fantasy",
      "concept": "Sentient translucent blob capable of squishing through door cracks, dissolving organic matter with acidic fluids, and absorbing blunt hits.",
      "points": 14,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "change_state",
          "name": "Change State (Gelatinous Viscous Fluid)",
          "level": 2,
          "costPerLevel": 3,
          "customDesc": "Oozes through keyholes, pipes, and grated drains"
        },
        {
          "id": "immunity",
          "name": "Immunity (Piercing & Bludgeoning Weaponry)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Non-solid body reforms seamlessly around physical impacts"
        },
        {
          "id": "elasticity",
          "name": "Elasticity (Stretching Pseudopods)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Extends sticky tendrils to grab objects"
        },
        {
          "id": "water_speed",
          "name": "Water Speed",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Swims effortlessly in liquid environments"
        },
        {
          "id": "weapon",
          "name": "Weapon (Acidic Dissolving Secretion)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Digestive juices that dissolve biological and organic matter",
          "enhancements": "Continuing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Translucent Gelatinous Mass)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Wobbly jelly body with visible internal core"
        },
        {
          "id": "vulnerability",
          "name": "Vulnerability (Freezing Cold & Salt)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Crystallizes or desiccates rapidly when salted or frozen"
        }
      ],
      "weapons": [
        {
          "name": "Acidic Dissolving Secretion",
          "level": 1,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Continuing",
          "limiters": "Melee",
          "notes": "Digestive enzymes"
        }
      ]
    },
    {
      "id": "snow_maiden",
      "name": "Snow Maiden (Yuki-Onna)",
      "category": "spirit",
      "concept": "Spectral winter maiden of Japanese folklore, surrounded by swirling snowstorms and freezing winds that turn men into ice statues.",
      "points": 18,
      "stats": {
        "soul": 1
      },
      "attributes": [
        {
          "id": "change_state",
          "name": "Change State (Freezing Mist & Blizzard)",
          "level": 2,
          "costPerLevel": 3,
          "customDesc": "Dissolves into white mist or whirling snow"
        },
        {
          "id": "dynamic_powers",
          "name": "Dynamic Powers (Ice & Blizzard Sorcery)",
          "level": 1,
          "costPerLevel": 10,
          "customDesc": "Freezes moisture, conjures icicle javelins, and drops room temperatures"
        },
        {
          "id": "immunity",
          "name": "Immunity (Subzero Cold & Hypothermia)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Completely immune to all freezing and frost effects"
        }
      ],
      "defects": [
        {
          "id": "vulnerability",
          "name": "Vulnerability (Fire & Torrid Heat)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Melts rapidly and suffers double damage from fire"
        },
        {
          "id": "bane",
          "name": "Bane (Boiling Water & Sacred Temple Hearthfire)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Direct contact with boiling water inflicts searing trauma"
        }
      ],
      "weapons": []
    },
    {
      "id": "spider_demon",
      "name": "Spider Demon (Jorōgumo)",
      "category": "supernatural",
      "concept": "Enchanting yet deadly arachnid demoness who sprouts eight spider appendages, spins binding webs, and paralyzes prey with venom.",
      "points": 18,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "extra_arms",
          "name": "Extra Arms (Arachnid Appendages)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Four scything spider legs extending from back"
        },
        {
          "id": "special_movement",
          "name": "Special Movement (Wall-Crawling)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Scales ceilings and sheer walls effortlessly"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Spider Grip)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Powerful arachnid muscle fibers"
        },
        {
          "id": "armour",
          "name": "Armour (Chitinous Plates)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+5 Armour Rating from hardened exoskeleton"
        },
        {
          "id": "weapon",
          "name": "Weapon (Paralytic Neurotoxin Fangs)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Venomous fangs inducing muscle paralysis",
          "enhancements": "Incapacitating",
          "limiters": "Melee"
        },
        {
          "id": "weapon",
          "name": "Weapon (Silk Tangle Snare)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "High-tensile web strand that traps targets",
          "enhancements": "Tangle",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Eight Ocelli Eyes & Spider Limbs)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Frightening arachnid visage when agitated"
        },
        {
          "id": "bane",
          "name": "Bane (Sanctified Incense & Cedar Smoke)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Sacred smoke suffocates lungs and paralyzes limbs"
        }
      ],
      "weapons": [
        {
          "name": "Paralytic Neurotoxin Fangs",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Incapacitating",
          "limiters": "Melee",
          "notes": "Neurotoxin injection"
        },
        {
          "name": "Silk Tangle Snare",
          "level": 3,
          "range": "20m",
          "attackType": "ranged",
          "enhancements": "Tangle",
          "limiters": "Charges",
          "notes": "Sticky spider silk"
        }
      ]
    },
    {
      "id": "vampire",
      "name": "Vampire",
      "category": "undead",
      "concept": "Aristocratic creature of the night blessed with immortal youth, hypnotic crimson eyes, rapid regeneration, and bloodthirst.",
      "points": 22,
      "stats": {
        "body": 1,
        "soul": 1
      },
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Undead Resilience)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "+10 Armour Rating from unnatural cold flesh"
        },
        {
          "id": "regeneration",
          "name": "Regeneration (Blood Reconstitution)",
          "level": 1,
          "costPerLevel": 5,
          "customDesc": "Rapidly recovers 5 HP per combat round"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Nocturnal Might)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Effortlessly overpowers mortal prey"
        },
        {
          "id": "supersense",
          "name": "Supersense (Darkvision)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Sees clearly in absolute midnight"
        },
        {
          "id": "mind_control",
          "name": "Mind Control (Hypnotic Gaze)",
          "level": 1,
          "costPerLevel": 3,
          "customDesc": "Enthralls mortals with locked crimson eyes"
        },
        {
          "id": "weapon",
          "name": "Weapon (Vampiric Fangs)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "Elongated canines that drain vitality",
          "enhancements": "Drain",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Direct Sunlight & Heart Stakes)",
          "category": "greater",
          "rank": 2,
          "refundPerRank": 2,
          "customDesc": "Sunlight incinerates flesh; wooden stake paralyzes"
        },
        {
          "id": "special_requirement",
          "name": "Special Requirement (Warm Living Blood)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Must feed on fresh blood regularly to avoid starvation"
        }
      ],
      "weapons": [
        {
          "name": "Vampiric Fangs",
          "level": 3,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Drain",
          "limiters": "Melee",
          "notes": "Vitality draining bite"
        }
      ]
    },
    {
      "id": "werewolf",
      "name": "Werewolf",
      "category": "beast",
      "concept": "Bestial lycanthrope gifted with razor jaws, scent tracking, swift wound recovery, and frenzy under the full moon.",
      "points": 18,
      "stats": {
        "body": 1
      },
      "attributes": [
        {
          "id": "alternate_form",
          "name": "Alternate Form (War Beast Wolf-Man)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Transforms into hulking predatory werewolf form"
        },
        {
          "id": "regeneration",
          "name": "Regeneration (Primal Recovery)",
          "level": 1,
          "costPerLevel": 5,
          "customDesc": "Closes flesh wounds rapidly unless burned by silver"
        },
        {
          "id": "superstrength",
          "name": "Superstrength (Lupine Muscle)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Enormous predatory jaw and arm torque"
        },
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Olfactory & Hearing)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Tracks quarry across kilometers by scent"
        },
        {
          "id": "weapon",
          "name": "Weapon (Predatory Claws & Fangs)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Ripping fangs and claws",
          "enhancements": "Piercing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Silver Weapons & Implements)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Silver wounds bypass regeneration and burn flesh"
        },
        {
          "id": "involuntary_change",
          "name": "Involuntary Change (Full Moon Night)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Forced into beast form when the full moon rises"
        }
      ],
      "weapons": [
        {
          "name": "Predatory Claws & Fangs",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Piercing",
          "limiters": "Melee",
          "notes": "Lethal rending claws"
        }
      ]
    },
    {
      "id": "woolie",
      "name": "Woolie (Alien Companion)",
      "category": "alien",
      "concept": "Fuzzy, spherical alien mascot with adorable big eyes, bouncy acrobatics, empathic chirps, and cheerful good luck.",
      "points": 6,
      "stats": {
        "soul": 1
      },
      "attributes": [
        {
          "id": "inspire",
          "name": "Inspire (Adorable Cheerful Antics)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Boosts party morale with cute squeaks"
        },
        {
          "id": "telepathy",
          "name": "Telepathy (Empathic Emotional Chirp)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Transmits moods and soothing emotions"
        },
        {
          "id": "mulligan",
          "name": "Mulligan (Mascot Luck)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Reroll one critical failed roll"
        },
        {
          "id": "special_movement",
          "name": "Special Movement (Bouncing Acrobatics)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Bounces over obstacles like a rubber ball"
        }
      ],
      "defects": [
        {
          "id": "awkward_size",
          "name": "Awkward Size (Tiny Fluffy Ball)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Small enough to fit in a backpack; cannot wield standard gear"
        },
        {
          "id": "impaired_speech",
          "name": "Impaired Speech (Chirps & Squeaks)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Can only say its own name or make cute sounds"
        }
      ],
      "weapons": []
    },
    {
      "id": "yurei",
      "name": "Yurei (Ghost / Spirit)",
      "category": "spirit",
      "concept": "Ethereal spirit unbound by gravity or physical walls, hovering in cold silence, drifting invisibly, and hurling poltergeist objects.",
      "points": 16,
      "stats": {
        "soul": 1
      },
      "attributes": [
        {
          "id": "change_state",
          "name": "Change State (Incorporeal Phantom)",
          "level": 2,
          "costPerLevel": 3,
          "customDesc": "Passes through solid stone and iron walls without resistance"
        },
        {
          "id": "flight",
          "name": "Flight (Ethereal Levitation)",
          "level": 1,
          "costPerLevel": 3,
          "customDesc": "Floats effortlessly above ground"
        },
        {
          "id": "undetectable",
          "name": "Undetectable (Phantom Invisibility)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Invisible to living mortal eyes and optical cameras"
        },
        {
          "id": "telekinesis",
          "name": "Telekinesis (Poltergeist Force)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Hurling furniture and slamming doors with phantom fury"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Exorcism Talismans & Shinto Salt)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Warded barriers block passage; salt repels"
        },
        {
          "id": "unsettled",
          "name": "Unsettled (Haunting Chill Aura)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Surrounding air drops 15 degrees, frosting windows"
        }
      ],
      "weapons": []
    }
  ],

  // Official BESM 4E Class Templates (25 official)
  classTemplates: [
    {
      "id": "adventurer",
      "name": "Adventurer",
      "category": "action",
      "concept": "Resourceful rover and explorer of dungeons, wilderness, and forgotten ruins.",
      "points": 15,
      "stats": {
        "body": 1
      },
      "skillGroups": [
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "domestic",
          "name": "Domestic",
          "tier": "background",
          "level": 2,
          "costPerLevel": 1
        }
      ],
      "attributes": [
        {
          "id": "combat_technique",
          "name": "Combat Technique (Lightning Reflexes)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+2 initiative bonus"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+10 Health Points from survival grit"
        },
        {
          "id": "item",
          "name": "Item (Exploration Gear & Climbing Rig)",
          "level": 2,
          "costPerLevel": 0.5,
          "customDesc": "Ropes, pitons, bedroll, and torches"
        },
        {
          "id": "weapon",
          "name": "Weapon (Survival Machete / Shortbow)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Dependable survival weapon",
          "enhancements": "Accurate",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "shortcoming",
          "name": "Shortcoming (Wanderlust / Restless)",
          "category": "lesser",
          "rank": 2,
          "refundPerRank": 1,
          "customDesc": "Cannot stay in one civilized town for long"
        }
      ],
      "weapons": [
        {
          "name": "Survival Machete / Shortbow",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Accurate",
          "limiters": "Melee",
          "notes": "Durable explorer blade"
        }
      ],
      "gear": "50ft silk rope, iron pitons, flint & tinder, oiled canvas bedroll, canteen, traveler rations"
    },
    {
      "id": "artificer",
      "name": "Artificer",
      "category": "tech",
      "concept": "Master of enchanted crafts, magical automata, and magitech gadgets who can infuse everyday tools with arcane power.",
      "points": 20,
      "stats": {
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "technical",
          "name": "Technical",
          "tier": "field",
          "level": 3,
          "costPerLevel": 2
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        },
        {
          "id": "academic",
          "name": "Academic",
          "tier": "background",
          "level": 1,
          "costPerLevel": 1
        }
      ],
      "attributes": [
        {
          "id": "item",
          "name": "Item (Magitech Arcane Rig & Relic Tools)",
          "level": 4,
          "costPerLevel": 0.5,
          "customDesc": "Portable alchemy laboratory and enchanting tools"
        },
        {
          "id": "power_variation",
          "name": "Power Variation (Arcane Infusions)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Imbues mundane objects with temporary magical properties"
        },
        {
          "id": "weapon",
          "name": "Weapon (Aetheric Wrench / Magitech Pistol)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "Overclocked energy projector",
          "enhancements": "Piercing",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "shortcoming",
          "name": "Shortcoming (Obsessive Crafting Perfectionism)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Spends hours tinkering instead of resting"
        },
        {
          "id": "easily_distracted",
          "name": "Easily Distracted (Novel Mechanisms & Blueprints)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Fascinated by complex technology"
        }
      ],
      "weapons": [
        {
          "name": "Aetheric Wrench / Magitech Pistol",
          "level": 3,
          "range": "25m",
          "attackType": "ranged",
          "enhancements": "Piercing",
          "limiters": "Charges",
          "notes": "Aetheric discharge blast"
        }
      ],
      "gear": "Leather tool belt with fine brass wrenches, etching stylus, vials of quicksilver, blueprint cylinder"
    },
    {
      "id": "broker",
      "name": "Broker",
      "category": "social",
      "concept": "Savvy information merchant, corporate negotiator, or fixer who controls deals, contracts, and black markets.",
      "points": 18,
      "stats": {
        "mind": 1,
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "social",
          "name": "Social",
          "tier": "field",
          "level": 3,
          "costPerLevel": 2
        },
        {
          "id": "business",
          "name": "Business",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "wealth",
          "name": "Wealth (Liquid Capital)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Substantial cash reserves and investment accounts"
        },
        {
          "id": "connected",
          "name": "Connected (Informant Syndicate)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Eyes and ears across municipal agencies and underworld"
        },
        {
          "id": "alternate_identity",
          "name": "Alternate Identity (Legitimate Business Executive)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Clean corporate persona with flawless legal standing"
        }
      ],
      "defects": [
        {
          "id": "nemesis",
          "name": "Nemesis (Corporate Rival Fixer)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Ruthless competitor targeting your clients"
        },
        {
          "id": "shortcoming",
          "name": "Shortcoming (Greedy / Transactional)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Measures all relationships by profit margin"
        }
      ],
      "weapons": [],
      "gear": "Encrypted satellite phone, tailored suit, luxury watch, gold-embossed business cards, briefcase"
    },
    {
      "id": "demon_hunter",
      "name": "Demon Hunter",
      "category": "action",
      "concept": "Sworn exterminator of supernatural horrors and fiends, wielding consecrated silver blades and relentless combat training.",
      "points": 22,
      "stats": {
        "body": 1,
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value"
        },
        {
          "id": "defence_mastery",
          "name": "Defence Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Defence Combat Value"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Blind Fighting, Critical Strike)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Strikes in darkness, lands deadly criticals"
        },
        {
          "id": "heightened_senses",
          "name": "Heightened Senses (Supernatural Scent)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Detects demonic sulfur and fiendish aura"
        },
        {
          "id": "weapon",
          "name": "Weapon (Consecrated Silver Blade)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "Blessed exorcism steel sword",
          "enhancements": "Piercing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "nemesis",
          "name": "Nemesis (Vengeful Fiend Bloodline)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Demon clan sworn to avenge their slain kin"
        },
        {
          "id": "marked",
          "name": "Marked (Demon Hunter Brand & Ritual Scars)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Glows faintly in presence of evil"
        }
      ],
      "weapons": [
        {
          "name": "Consecrated Silver Blade",
          "level": 3,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Piercing",
          "limiters": "Melee",
          "notes": "Silver exorcism edge"
        }
      ],
      "gear": "Long leather duster, silver whetstone, prayer beads, vials of holy water, bandolier"
    },
    {
      "id": "detective",
      "name": "Detective",
      "category": "street",
      "concept": "Hardboiled investigator unearthing urban secrets, interviewing witnesses, and drawing a rapid revolver under neon streetlights.",
      "points": 16,
      "stats": {
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "detective",
          "name": "Detective",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "street",
          "name": "Street",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "combat_technique",
          "name": "Combat Technique (Judge Opponent, Steady Hand)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Reads intent, eliminates aiming penalties"
        },
        {
          "id": "weapon",
          "name": "Weapon (Snub-Nose .38 Revolver)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Dependable concealed service firearm",
          "enhancements": "Concealable",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "shortcoming",
          "name": "Shortcoming (Cynical Disillusionment)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Distrustful of authority and happy endings"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Corrupt Syndicate Lieutenant)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Mob boss you put behind bars who just broke out"
        }
      ],
      "weapons": [
        {
          "name": "Snub-Nose .38 Revolver",
          "level": 2,
          "range": "20m",
          "attackType": "ranged",
          "enhancements": "Concealable",
          "limiters": "Charges",
          "notes": "Six-shot revolver"
        }
      ],
      "gear": "Trench coat, battered fedora, leather badge case, mini recorder, silver flask, pocket notebook"
    },
    {
      "id": "exorcist",
      "name": "Exorcist",
      "category": "magic",
      "concept": "Spiritual mystic who banishes restless phantoms, cleanses demonic corruption, and erects barrier wards.",
      "points": 20,
      "stats": {
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "academic",
          "name": "Academic",
          "tier": "background",
          "level": 2,
          "costPerLevel": 1
        },
        {
          "id": "social",
          "name": "Social",
          "tier": "field",
          "level": 1,
          "costPerLevel": 2
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "exorcism",
          "name": "Exorcism",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Banishes possessing spirits and cleanses cursed items"
        },
        {
          "id": "force_field",
          "name": "Force Field (Sanctified Purification Barrier)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "+10 Armour Rating against demonic/supernatural attacks"
        },
        {
          "id": "sixth_sense",
          "name": "Sixth Sense (Supernatural Presence)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Detects phantoms, spectres, and cursed auras"
        },
        {
          "id": "weapon",
          "name": "Weapon (Holy Sutras & Sacred Relic)",
          "level": 3,
          "costPerLevel": 2,
          "customDesc": "Consecrated paper talisman or bell blast",
          "enhancements": "Piercing",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Sacred Temple Vows & Rites)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Vow of spiritual purification and poverty"
        }
      ],
      "weapons": [
        {
          "name": "Holy Sutras & Sacred Relic",
          "level": 3,
          "range": "25m",
          "attackType": "ranged",
          "enhancements": "Piercing",
          "limiters": "Charges",
          "notes": "Purifying spiritual talismans"
        }
      ],
      "gear": "Shinto ofuda paper charms / Buddhist prayer beads, brass purifying bell, white vestments, incense kit"
    },
    {
      "id": "gate_guardian",
      "name": "Gate Guardian",
      "category": "action",
      "concept": "Ancient sentinel sworn to guard interdimensional rifts, planar thresholds, and forbidden sanctuary portals.",
      "points": 22,
      "stats": {
        "body": 1,
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Warder Plate)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+5 Armour Rating from consecrated armor"
        },
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value"
        },
        {
          "id": "force_field",
          "name": "Force Field (Dimensional Portal Ward)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "+10 Armour Rating barrier"
        },
        {
          "id": "weapon",
          "name": "Weapon (Dimensional Guardian Halberd)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Polearm that slices through planar tears",
          "enhancements": "Piercing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Eternal Gatekeeper Oath)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Must protect the gateway or planar seal with life"
        }
      ],
      "weapons": [
        {
          "name": "Dimensional Guardian Halberd",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Piercing",
          "limiters": "Melee",
          "notes": "Planar cutting halberd"
        }
      ],
      "gear": "Etched steel breastplate, guardian seal talisman, heavy hooded cloak, key of the gateway"
    },
    {
      "id": "general",
      "name": "General",
      "category": "action",
      "concept": "Supreme battlefield tactician, military commander, and charismatic strategist directing armed forces to victory.",
      "points": 20,
      "stats": {
        "mind": 1,
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 3,
          "costPerLevel": 3
        },
        {
          "id": "social",
          "name": "Social",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "inspire",
          "name": "Inspire (Tactical Leadership Aura)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+2 combat bonus to all allies who can hear commands"
        },
        {
          "id": "minions",
          "name": "Minions (Staff Aides & Honor Guard)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Squad of dedicated military aides"
        },
        {
          "id": "connected",
          "name": "Connected (High Command Logistics)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Requisitions ordnance, supplies, and transports"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Supreme High Command Directives)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Bound by official military orders and government protocol"
        }
      ],
      "weapons": [],
      "gear": "Ceremonial dress officer uniform, medals of valor, tactical holomap projector, officer pistol"
    },
    {
      "id": "hacktivist",
      "name": "Hacktivist",
      "category": "tech",
      "concept": "Cyber-insurgent infiltrating classified mainframes, bypassing digital ICE, and exposing corporate corruption.",
      "points": 16,
      "stats": {
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "technical",
          "name": "Technical",
          "tier": "field",
          "level": 3,
          "costPerLevel": 2
        },
        {
          "id": "street",
          "name": "Street",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "data_access",
          "name": "Data Access (Global Neural Net Deck)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Direct wireless access to worldwide networks"
        },
        {
          "id": "alternate_identity",
          "name": "Alternate Identity (Anonymous Handle)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Ghostly pseudonym scrubbing all digital traces"
        },
        {
          "id": "item",
          "name": "Item (Encrypted Cyberdeck)",
          "level": 2,
          "costPerLevel": 0.5,
          "customDesc": "Custom overclocked hacking terminal"
        }
      ],
      "defects": [
        {
          "id": "wanted",
          "name": "Wanted (Megacorps & Cyber Interpol)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Active warrant with heavy bounties for arrest"
        }
      ],
      "weapons": [],
      "gear": "Custom cyberdeck with fiber optic cables, wireless neural tap, holographic projector visor, black hoodie"
    },
    {
      "id": "hot_rod",
      "name": "Hot Rod",
      "category": "tech",
      "concept": "Speed demon mechanic and wheelman who lives behind the wheel of a nitrous-injected, custom-tuned supercar.",
      "points": 16,
      "stats": {
        "body": 1
      },
      "skillGroups": [
        {
          "id": "technical",
          "name": "Technical",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "item",
          "name": "Item (Supercharged Tuner Vehicle)",
          "level": 8,
          "costPerLevel": 0.5,
          "customDesc": "Twin-turbo muscle car or tuned sports coupe"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Lightning Reflexes)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Split-second steering reaction time"
        },
        {
          "id": "special_movement",
          "name": "Special Movement (High-Speed Agility)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Powersliding and drift precision"
        }
      ],
      "defects": [
        {
          "id": "shortcoming",
          "name": "Shortcoming (Adrenaline Junkie / Speed Demanded)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Cannot resist high-speed challenges or illegal races"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Highway Patrol Officer)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Traffic captain determined to impound your ride"
        }
      ],
      "weapons": [],
      "gear": "Racing leather jacket, leather driving gloves, socket wrench set, tire pressure gauge, sunglasses"
    },
    {
      "id": "idol",
      "name": "Idol",
      "category": "social",
      "concept": "Pop icon and beloved superstar whose sparkling charisma, radiant voice, and media presence inspire millions.",
      "points": 18,
      "stats": {
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "social",
          "name": "Social",
          "tier": "field",
          "level": 3,
          "costPerLevel": 2
        },
        {
          "id": "artistic",
          "name": "Artistic",
          "tier": "background",
          "level": 3,
          "costPerLevel": 1
        }
      ],
      "attributes": [
        {
          "id": "inspire",
          "name": "Inspire (Starlight Stage Aura)",
          "level": 3,
          "costPerLevel": 1,
          "customDesc": "+3 bonus to friends listening to performance"
        },
        {
          "id": "mulligan",
          "name": "Mulligan (Fan Cheering & Adoration)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Twice per session reroll fueled by fans"
        },
        {
          "id": "features",
          "name": "Features (Irresistible Idol Charisma)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Instantly likable, perfect media smile"
        },
        {
          "id": "social_mastery",
          "name": "Social Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 bonus to social checks"
        }
      ],
      "defects": [
        {
          "id": "marked",
          "name": "Marked (Superstar Face)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Recognized everywhere by swarming fan mobs"
        }
      ],
      "weapons": [],
      "gear": "Sparkling rhinestone wireless mic, cute stage costume, makeup vanity case, glowsticks, signed cards"
    },
    {
      "id": "magical_girl",
      "name": "Magical Girl",
      "category": "magic",
      "concept": "Chosen champion of love, justice, and friendship who transforms into a radiant defender with starlight beams.",
      "points": 24,
      "stats": {
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "artistic",
          "name": "Artistic",
          "tier": "background",
          "level": 2,
          "costPerLevel": 1
        },
        {
          "id": "social",
          "name": "Social",
          "tier": "field",
          "level": 1,
          "costPerLevel": 2
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "alternate_form",
          "name": "Alternate Form (Henshin Transformation)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Magical costume change with glowing ribbons"
        },
        {
          "id": "dynamic_powers",
          "name": "Dynamic Powers (Prism Starlight Magic)",
          "level": 1,
          "costPerLevel": 10,
          "customDesc": "Spontaneous sparkles, ribbons, and radiant light bursts"
        },
        {
          "id": "flight",
          "name": "Flight (Starlight Levitation)",
          "level": 1,
          "costPerLevel": 3,
          "customDesc": "Glides gracefully through the air"
        },
        {
          "id": "weapon",
          "name": "Weapon (Prism Wand Blast)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Sparkling beam of purifying light",
          "enhancements": "Accurate",
          "limiters": "Concentration"
        }
      ],
      "defects": [
        {
          "id": "involuntary_change",
          "name": "Involuntary Change (Reverts at 0 EP)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Reverts to ordinary school attire when exhausted"
        },
        {
          "id": "obligated",
          "name": "Obligated (Guardian of Love & Justice Vow)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Must protect innocents from nightmare beasts"
        },
        {
          "id": "significant_other",
          "name": "Significant Other (School Best Friend / Crush)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Innocent mortal who frequently wanders into danger"
        }
      ],
      "weapons": [
        {
          "name": "Prism Wand Blast",
          "level": 1,
          "range": "20m",
          "attackType": "ranged",
          "enhancements": "Accurate",
          "limiters": "Concentration",
          "notes": "Sparkling starlight beam"
        }
      ],
      "gear": "Transformation compact brooch, star-tipped wand, school sailor uniform, cute animal mascot plush"
    },
    {
      "id": "martial_artist",
      "name": "Martial Artist",
      "category": "action",
      "concept": "Disciplined fighter who has honed body and spirit into lethal living weapons through rigorous dojo training.",
      "points": 20,
      "stats": {
        "body": 1
      },
      "skillGroups": [
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value"
        },
        {
          "id": "defence_mastery",
          "name": "Defence Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Defence Combat Value"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Critical Strike, Deflection, Lightning Reflexes)",
          "level": 3,
          "costPerLevel": 1,
          "customDesc": "Deflects projectiles, strikes with lethal accuracy"
        },
        {
          "id": "massive_damage",
          "name": "Massive Damage (Ki Infusion)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+1 to Melee Damage Multiplier"
        },
        {
          "id": "weapon",
          "name": "Weapon (Unarmed Ki Strikes)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Devastating fists and kicks channeling internal ki",
          "enhancements": "Accurate",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Martial Arts Dojo Code)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Must respect masters and accept formal challenges"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Rival Dojo Challenger)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Fierce rival intent on proving superiority"
        }
      ],
      "weapons": [
        {
          "name": "Unarmed Ki Strikes",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Accurate",
          "limiters": "Melee",
          "notes": "Ki-empowered strikes"
        }
      ],
      "gear": "Canvas martial arts gi, black belt, hand wraps, training wooden dummy, herbal liniment"
    },
    {
      "id": "master_thief",
      "name": "Master Thief",
      "category": "street",
      "concept": "Acrobatic phantom burglar capable of infiltrating impenetrable vaults and stealing priceless treasures under the nose of guards.",
      "points": 18,
      "stats": {
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "street",
          "name": "Street",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "special_movement",
          "name": "Special Movement (Light-Footed, Balance)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Walks on wires without a sound"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Lightning Reflexes)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+2 initiative bonus"
        },
        {
          "id": "item",
          "name": "Item (Master Lockpicks & Grapple Gun)",
          "level": 2,
          "costPerLevel": 0.5,
          "customDesc": "Pneumatic grapple line and titanium lockpicks"
        },
        {
          "id": "weapon",
          "name": "Weapon (Concealed Throwing Daggers)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Balanced throwing blades",
          "enhancements": "Concealable",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "wanted",
          "name": "Wanted (City Constabulary & Interpol)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Warrants posted with calling-card sketch"
        },
        {
          "id": "shortcoming",
          "name": "Shortcoming (Thrill-Seeking Kleptomania)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Cannot resist heists of legendary difficulty"
        }
      ],
      "weapons": [
        {
          "name": "Concealed Throwing Daggers",
          "level": 2,
          "range": "20m",
          "attackType": "ranged",
          "enhancements": "Concealable",
          "limiters": "Charges",
          "notes": "Balanced silver daggers"
        }
      ],
      "gear": "Titanium lockpicks, carbon-fiber climbing harness, smoke pellets, calling card, velvet gem pouch"
    },
    {
      "id": "mecha_pilot",
      "name": "Mecha Pilot",
      "category": "tech",
      "concept": "Trained combat specialist operating high-performance bipedal assault mecha, armored exo-suits, and heavy rail weaponry.",
      "points": 24,
      "stats": {
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "technical",
          "name": "Technical",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "chassis",
          "name": "Chassis (Assault Mobile Exo-Suit)",
          "level": 16,
          "costPerLevel": 0.5,
          "customDesc": "Powered armor with thrusters and armor plating"
        },
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value with gunnery"
        },
        {
          "id": "defence_mastery",
          "name": "Defence Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Defence Combat Value from evasive thrusts"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Steady Hand, Portable Armoury)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Reduces recoil, manages heavy payload"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "+20 Health Points from high-G flight training"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Defense Force Deployment Orders)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Subject to military recall and duty rotations"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Enemy Ace Pilot)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Rival red-mecha pilot seeking a duel"
        }
      ],
      "weapons": [],
      "gear": "Pressurized flight suit, neural sync helmet, survival sidearm, pilot dog tags, cockpit data slate"
    },
    {
      "id": "mercenary",
      "name": "Mercenary",
      "category": "action",
      "concept": "Pragmatic soldier of fortune who sells battlefield lethal skills to the highest bidder with no questions asked.",
      "points": 18,
      "stats": {
        "body": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "street",
          "name": "Street",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "armour",
          "name": "Armour (Tactical Ballistic Plate)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+5 Armour Rating against bullets and shrapnel"
        },
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+10 Health Points from veteran conditioning"
        },
        {
          "id": "weapon",
          "name": "Weapon (Tactical Assault Rifle)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Burst-fire carbine rifle",
          "enhancements": "Spreading",
          "limiters": "Charges"
        }
      ],
      "defects": [
        {
          "id": "shortcoming",
          "name": "Shortcoming (Mercenary Greed)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Works for the highest paying employer"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Disgruntled Former Client)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Warlord who blames you for a botched op"
        }
      ],
      "weapons": [
        {
          "name": "Tactical Assault Rifle",
          "level": 2,
          "range": "50m",
          "attackType": "ranged",
          "enhancements": "Spreading",
          "limiters": "Charges",
          "notes": "Standard 5.56mm carbine"
        }
      ],
      "gear": "Modular tactical vest, combat knife, night vision goggles, comms headset, first aid trauma kit"
    },
    {
      "id": "ninja",
      "name": "Ninja",
      "category": "street",
      "concept": "Silent assassin and spy trained in ancient ninjutsu arts, roof-running, smoke concealment, and lethal poisoned shurikens.",
      "points": 22,
      "stats": {
        "body": 1,
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "street",
          "name": "Street",
          "tier": "field",
          "level": 2,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "special_movement",
          "name": "Special Movement (Light-Footed, Wall-Crawling)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Runs up vertical masonry silently"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Blind Fighting, Critical Strike)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Strikes vital targets in total pitch black"
        },
        {
          "id": "undetectable",
          "name": "Undetectable (Ninjutsu Camouflage)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Invisible when holding completely still in shadow"
        },
        {
          "id": "weapon",
          "name": "Weapon (Ninjato & Poisoned Shurikens)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Straight blade and concealed throwing stars",
          "enhancements": "Continuing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Shinobi Clan Shadow Decrees)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Subject to death sentence if clan is betrayed"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Rival Ninja Syndicate Assassin)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Shadow stalker targeting your clan members"
        }
      ],
      "weapons": [
        {
          "name": "Ninjato & Poisoned Shurikens",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Continuing",
          "limiters": "Melee",
          "notes": "Venom-coated shinobi blade"
        }
      ],
      "gear": "Black shinobi shozoku attire, grappling hook with horsehair cord, smoke bombs, caltrops, poison vial"
    },
    {
      "id": "pet_monster_trainer",
      "name": "Pet Monster Trainer",
      "category": "magic",
      "concept": "Energetic youth traveling the globe to bond with magical elemental critters and command them in arena battles.",
      "points": 18,
      "stats": {
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "domestic",
          "name": "Domestic",
          "tier": "background",
          "level": 2,
          "costPerLevel": 1
        }
      ],
      "attributes": [
        {
          "id": "companion",
          "name": "Companion (Elemental Battle Critter)",
          "level": 2,
          "costPerLevel": 4,
          "customDesc": "Loyal elemental pet companion built with 40 CP"
        },
        {
          "id": "inspire",
          "name": "Inspire (Trainer Encouragement)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 bonus to companion actions in battle"
        },
        {
          "id": "mulligan",
          "name": "Mulligan (Anime Determination)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Once per session clutch turnaround"
        }
      ],
      "defects": [
        {
          "id": "significant_other",
          "name": "Significant Other (Beloved Starter Partner)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Must protect companion above personal safety"
        },
        {
          "id": "shortcoming",
          "name": "Shortcoming (Compulsive Battler & Collector)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Cannot refuse a trainer battle challenge"
        }
      ],
      "weapons": [],
      "gear": "Captured capsule spheres, digital encyclopedia badge, sturdy backpack, trainer cap, recovery berries"
    },
    {
      "id": "pirate",
      "name": "Pirate",
      "category": "street",
      "concept": "Dashing buccaneer sailing treacherous seas, swinging from rigging, brandishing twin flintlocks, and seeking treasure.",
      "points": 18,
      "stats": {
        "body": 1
      },
      "skillGroups": [
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        },
        {
          "id": "street",
          "name": "Street",
          "tier": "field",
          "level": 1,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "water_speed",
          "name": "Water Speed (Expert Swimmer)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Swims easily through tempestuous ocean swells"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Two Weapons, Steady Hand)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Dual wields cutlass and gun on rolling deck"
        },
        {
          "id": "weapon",
          "name": "Weapon (Broadside Cutlass & Flintlock)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Curved boarding blade and heavy black-powder pistol",
          "enhancements": "Spreading",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "wanted",
          "name": "Wanted (Imperial Royal Navy Armada)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Gallows bounty placed on your head"
        },
        {
          "id": "shortcoming",
          "name": "Shortcoming (Swaggering Greed & Rum Lust)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Loves carousing and shiny golden doubloons"
        }
      ],
      "weapons": [
        {
          "name": "Broadside Cutlass & Flintlock",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Spreading",
          "limiters": "Melee",
          "notes": "Cutlass slash & point-blank pistol shot"
        }
      ],
      "gear": "Tricorne captain hat, brass spyglass, leather cross-belts, bottle of fine spiced rum, treasure map piece"
    },
    {
      "id": "samurai",
      "name": "Samurai",
      "category": "action",
      "concept": "Honorable warrior bound by strict bushido, delivering lightning IAI sword draws with ancestral folded steel.",
      "points": 22,
      "stats": {
        "body": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 3,
          "costPerLevel": 3
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value with swords"
        },
        {
          "id": "defence_mastery",
          "name": "Defence Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Defence Combat Value with parries"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Critical Strike, Deflection)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Parries musket shots, lands decapitating strikes"
        },
        {
          "id": "massive_damage",
          "name": "Massive Damage (Kenjutsu)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+1 to Melee Damage Multiplier"
        },
        {
          "id": "weapon",
          "name": "Weapon (Ancestral Katana)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Folded tamahagane steel blade",
          "enhancements": "Piercing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Bushido Code of Honour)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Rectitude, courage, benevolence, politeness, honesty, and loyalty"
        }
      ],
      "weapons": [
        {
          "name": "Ancestral Katana",
          "level": 2,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Piercing",
          "limiters": "Melee",
          "notes": "Lethal razor steel blade"
        }
      ],
      "gear": "Silk kosode and hakama, whetstone, tea bowl, wooden sake gourd, lacquered saya scabbard"
    },
    {
      "id": "sentai_member",
      "name": "Sentai Member",
      "category": "action",
      "concept": "Color-coded ranger who transforms with a wrist morpher to execute synchronized martial arts and team blaster finishers.",
      "points": 22,
      "stats": {
        "body": 1,
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "alternate_form",
          "name": "Alternate Form (Henshin Ranger Suit)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "Armored chromatic ranger suit summoned instantly"
        },
        {
          "id": "attack_mastery",
          "name": "Attack Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Attack Combat Value"
        },
        {
          "id": "defence_mastery",
          "name": "Defence Mastery",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 Defence Combat Value"
        },
        {
          "id": "weapon",
          "name": "Weapon (Sentai Power Blaster)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "High-yield plasma beam sidearm",
          "enhancements": "Piercing",
          "limiters": "Charges"
        },
        {
          "id": "inspire",
          "name": "Inspire (Teamwork Synchronization)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+1 combat bonus when executing team attacks"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Squad Commander & Ranger Protocol)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Must heed emergency distress sirens immediately"
        },
        {
          "id": "skeleton_in_the_closet",
          "name": "Skeleton in the Closet (Secret Hero Identity)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Civilians must never discover your ranger identity"
        }
      ],
      "weapons": [
        {
          "name": "Sentai Power Blaster",
          "level": 2,
          "range": "30m",
          "attackType": "ranged",
          "enhancements": "Piercing",
          "limiters": "Charges",
          "notes": "Laser sidearm"
        }
      ],
      "gear": "Wrist morpher changer, squad communicator badge, team jacket, civilian casual clothes"
    },
    {
      "id": "shadow_warrior",
      "name": "Shadow Warrior",
      "category": "action",
      "concept": "Mystic martial artist steeped in umbral arts, blending into pitch shadow to strike unsuspecting enemies down.",
      "points": 20,
      "stats": {
        "body": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "dynamic_powers",
          "name": "Dynamic Powers (Shadow Arts)",
          "level": 1,
          "costPerLevel": 10,
          "customDesc": "Manipulates darkness, shadow pools, and blinding mists"
        },
        {
          "id": "combat_technique",
          "name": "Combat Technique (Blind Fighting)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Fights in absolute blackness without penalty"
        },
        {
          "id": "weapon",
          "name": "Weapon (Shadow Scythe / Kunai)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Curved blade forged of twilight",
          "enhancements": "Piercing",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "bane",
          "name": "Bane (Direct Sunlight & Holy Radiance)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Intense radiant light scorches shadow-imbued skin"
        },
        {
          "id": "nemesis",
          "name": "Nemesis (Order of the Radiant Dawn)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Sun knights hunting shadow practitioners"
        },
        {
          "id": "shortcoming",
          "name": "Shortcoming (Brooding Grim Solitude)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Aloof and reluctant to open up to companions"
        }
      ],
      "weapons": [
        {
          "name": "Shadow Scythe / Kunai",
          "level": 1,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Piercing",
          "limiters": "Melee",
          "notes": "Darkness-infused blade"
        }
      ],
      "gear": "Charcoal hooded cowl, bandages on forearms, black scabbard, shadow incense sticks"
    },
    {
      "id": "student",
      "name": "Student",
      "category": "social",
      "concept": "Typical high school youth balancing cram school, club activities, and teenage drama before being dragged into adventure.",
      "points": 12,
      "stats": {
        "mind": 1
      },
      "skillGroups": [
        {
          "id": "academic",
          "name": "Academic",
          "tier": "background",
          "level": 2,
          "costPerLevel": 1
        },
        {
          "id": "domestic",
          "name": "Domestic",
          "tier": "background",
          "level": 1,
          "costPerLevel": 1
        },
        {
          "id": "social",
          "name": "Social",
          "tier": "field",
          "level": 1,
          "costPerLevel": 2
        }
      ],
      "attributes": [
        {
          "id": "mulligan",
          "name": "Mulligan (Anime Protagonist Luck)",
          "level": 2,
          "costPerLevel": 1,
          "customDesc": "Twice per session reroll on near misses"
        },
        {
          "id": "connected",
          "name": "Connected (School Club Members)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Network of helpful classmates and senpais"
        },
        {
          "id": "features",
          "name": "Features (Youthful Optimism)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Undaunted cheerful anime protagonist energy"
        },
        {
          "id": "item",
          "name": "Item (Smartphone & Commuter Bicycle)",
          "level": 4,
          "costPerLevel": 0.5,
          "customDesc": "Modern smartphone and 10-speed bicycle"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (High School Exams & Strict Curfew)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Grounding and parent scoldings if grades slip"
        }
      ],
      "weapons": [],
      "gear": "School bag with textbooks, smartphone with cat charm, student ID transit card, commuter bicycle"
    },
    {
      "id": "tech_genius",
      "name": "Tech Genius",
      "category": "tech",
      "concept": "Prodigy hacker and engineer inventing miniature gadgets, hacking drones, and deploying holographic assistants.",
      "points": 20,
      "stats": {
        "mind": 2
      },
      "skillGroups": [
        {
          "id": "technical",
          "name": "Technical",
          "tier": "field",
          "level": 3,
          "costPerLevel": 2
        },
        {
          "id": "scientific",
          "name": "Scientific",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "item",
          "name": "Item (Omni-Tool Rig & Prototype Arsenal)",
          "level": 8,
          "costPerLevel": 0.5,
          "customDesc": "Micro-soldering kit, drone prototypes, and test rig"
        },
        {
          "id": "data_access",
          "name": "Data Access (AI Assistant Uplink)",
          "level": 2,
          "costPerLevel": 2,
          "customDesc": "Constantly running custom AI in smart glasses"
        },
        {
          "id": "features",
          "name": "Features (Photographic Recall)",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "Instant recall of circuit diagrams and code"
        }
      ],
      "defects": [
        {
          "id": "physical_impairment",
          "name": "Physical Impairment (Frail & Unathletic)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Easily winded during physical exertion"
        },
        {
          "id": "social_fault",
          "name": "Social Fault (Technobabble Ramble)",
          "category": "lesser",
          "rank": 1,
          "refundPerRank": 1,
          "customDesc": "Overwhelms normal conversation with engineering jargon"
        }
      ],
      "weapons": [],
      "gear": "Smart glasses with HUD, portable soldering iron, multi-meter, drone remote, battery packs"
    },
    {
      "id": "warder",
      "name": "Warder",
      "category": "magic",
      "concept": "Defensive protector trained in magical abjuration and kinetic deflection barriers to safeguard allies from harm.",
      "points": 20,
      "stats": {
        "body": 1,
        "soul": 1
      },
      "skillGroups": [
        {
          "id": "military",
          "name": "Military",
          "tier": "action",
          "level": 2,
          "costPerLevel": 3
        },
        {
          "id": "adventuring",
          "name": "Adventuring",
          "tier": "action",
          "level": 1,
          "costPerLevel": 3
        }
      ],
      "attributes": [
        {
          "id": "force_field",
          "name": "Force Field (Aegis Barrier)",
          "level": 1,
          "costPerLevel": 4,
          "customDesc": "+10 Armour Rating force barrier"
        },
        {
          "id": "armour",
          "name": "Armour (Warder Mail)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "+5 Armour Rating from enchanted chainmail"
        },
        {
          "id": "tough",
          "name": "Tough",
          "level": 1,
          "costPerLevel": 1,
          "customDesc": "+10 Health Points from endurance"
        },
        {
          "id": "weapon",
          "name": "Weapon (Sanctified Guardian Spear)",
          "level": 1,
          "costPerLevel": 2,
          "customDesc": "Defensive spear that deflects strikes",
          "enhancements": "Accurate",
          "limiters": "Melee"
        }
      ],
      "defects": [
        {
          "id": "obligated",
          "name": "Obligated (Ancient Ward Protective Oath)",
          "category": "greater",
          "rank": 1,
          "refundPerRank": 2,
          "customDesc": "Sworn to shield comrades even at cost of own life"
        }
      ],
      "weapons": [
        {
          "name": "Sanctified Guardian Spear",
          "level": 1,
          "range": "Melee",
          "attackType": "melee",
          "enhancements": "Accurate",
          "limiters": "Melee",
          "notes": "Long protective spear"
        }
      ],
      "gear": "Enchanted chainmail, large kite shield, heavy traveler cloak, whetstone, water skin"
    }
  ],

  // Archetype Presets (BESM 4E Heroic Sweet Spot - 75 CP)
  templates: [
    {
      id: "magical_girl",
      name: "Magical Girl (Champion of Light)",
      category: "magic",
      concept: "High school student blessed with sparkling supernatural guardian powers, glowing starlight attacks, and pure determination",
      tier: "heroic",
      points: 75,
      stats: { body: 4, mind: 5, soul: 8 },
      attributes: [
        { id: "alternate_form", name: "Alternate Form (Transformation)", level: 2, costPerLevel: 4, customDesc: "Instant magical costume change with mystical fanfare and floating ribbons" },
        { id: "dynamic_powers", name: "Dynamic Powers (Starlight & Healing)", level: 1, costPerLevel: 10, customDesc: "Spontaneous manipulation of pure luminous radiant energy" },
        { id: "flight", name: "Flight", level: 1, costPerLevel: 3, customDesc: "Graceful levitation and gliding on glowing starlight trails" },
        { id: "force_field", name: "Force Field", level: 2, costPerLevel: 4, customDesc: "Radiant barrier providing +20 Armour Rating" },
        { id: "energised", name: "Energised", level: 2, costPerLevel: 1, customDesc: "Abundant spiritual essence adding +20 Energy Points" },
        { id: "mulligan", name: "Mulligan (Anime Luck)", level: 2, costPerLevel: 1, customDesc: "Twice per session reroll on critical rolls" },
        { id: "weapon", name: "Weapon (Starlight Prism Beam)", level: 3, costPerLevel: 2, customDesc: "Damage 15, Range 25m, Piercing Light Beam", enhancements: "Piercing, Accurate", limiters: "Concentration" }
      ],
      skillGroups: [
        { id: "artistic", name: "Artistic", tier: "background", level: 2, costPerLevel: 1 },
        { id: "social", name: "Social", tier: "field", level: 2, costPerLevel: 2 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 1, costPerLevel: 3 }
      ],
      defects: [
        { id: "involuntary_change", name: "Involuntary Change", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Reverts to ordinary schoolgirl form when Energy Points hit 0" },
        { id: "significant_other", name: "Significant Other", category: "lesser", rank: 3, refundPerRank: 1, customDesc: "High school best friend who constantly wanders into supernatural peril" },
        { id: "obligated", name: "Obligated (Code of Honour)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Vow to protect the innocent and never use powers for selfish gain" }
      ],
      weapons: [
        { name: "Starlight Prism Beam", level: 3, range: "25m", attackType: "ranged", enhancements: "Piercing, Accurate", limiters: "Concentration", notes: "Fired from magical wand or compact" }
      ],
      gear: "Mystical Transformation Brooch, school uniform, enchanted fairy companion familiar, smartphone"
    },
    {
      id: "mecha_ace",
      name: "Mecha Pilot (Armored Ace)",
      category: "scifi",
      concept: "Skilled tactical pilot operating a high-performance humanoid combat frame and heavy ordnance",
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
        { id: "weapon", name: "Weapon (Twin Rotary Cannons)", level: 4, costPerLevel: 2, customDesc: "Damage 20, Range 100m, Rapid Fire", enhancements: "Rapid Fire, Accurate", limiters: "Charges" },
        { id: "weapon", name: "Weapon (High-Frequency Vibro-Blade)", level: 3, costPerLevel: 2, customDesc: "Damage 15, Melee, Armour-Piercing", enhancements: "Piercing", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "technical", name: "Technical", tier: "field", level: 3, costPerLevel: 2 },
        { id: "military", name: "Military", tier: "action", level: 2, costPerLevel: 3 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 1, costPerLevel: 3 }
      ],
      defects: [
        { id: "conditional_ownership", name: "Conditional Ownership", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Mecha unit is property of Earth Defence Taskforce; subject to military audit" },
        { id: "nemesis", name: "Nemesis", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Rival enemy ace pilot in crimson custom prototype unit" },
        { id: "red_tape", name: "Red Tape", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Mission deployment requires command staff clearance" }
      ],
      weapons: [
        { name: "Twin Rotary Cannons", level: 4, range: "100m", attackType: "ranged", enhancements: "Rapid Fire, Accurate", limiters: "Charges", notes: "Mounted on shoulder pylons" },
        { name: "High-Frequency Vibro-Blade", level: 3, range: "Melee", attackType: "melee", enhancements: "Piercing", limiters: "Melee", notes: "High frequency edge cuts through hull plate" }
      ],
      gear: "Flight flightsuit, tactical neural helmet, sidearm pistol, military ID dog tags"
    },
    {
      id: "cyber_ninja",
      name: "Cyber-Ninja (Urban Shinobi)",
      category: "cyberpunk",
      concept: "Augmented martial operative specializing in rooftop surveillance, silent takedowns, and corporate infiltration",
      tier: "heroic",
      points: 75,
      stats: { body: 6, mind: 5, soul: 4 },
      attributes: [
        { id: "superspeed", name: "Superspeed", level: 2, costPerLevel: 3, customDesc: "Short burst sprint speeds up to 100 kph" },
        { id: "special_movement", name: "Special Movement (Wall-Crawling, Light-Footed, Fast)", level: 3, costPerLevel: 1, customDesc: "Scaling vertical glass facades and landing soundlessly" },
        { id: "combat_technique", name: "Combat Technique (Lightning Reflexes, Blind-Fighting, Deflection, Concealed Attack)", level: 4, costPerLevel: 1, customDesc: "Parries incoming bullets and reacts instantly to ambushes" },
        { id: "attack_mastery", name: "Attack Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Attack Combat Value" },
        { id: "defence_mastery", name: "Defence Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Defence Combat Value" },
        { id: "heightened_senses", name: "Heightened Senses (Thermal & Cyber-Optics)", level: 2, costPerLevel: 1, customDesc: "Sees through walls and darkness in thermal spectrum" },
        { id: "undetectable", name: "Undetectable (Optical & Radar Camouflage)", level: 2, costPerLevel: 2, customDesc: "Active thermo-optic cloaking renders invisible to cameras and eyes" },
        { id: "weapon", name: "Weapon (Mono-Molecular Katana)", level: 3, costPerLevel: 2, customDesc: "Damage 15, Melee, Armour-Piercing", enhancements: "Piercing, Accurate", limiters: "Melee" },
        { id: "weapon", name: "Weapon (Shock Kunai & Shuriken)", level: 2, costPerLevel: 2, customDesc: "Damage 10, Range 25m, Stun", enhancements: "Stun", limiters: "Charges" }
      ],
      skillGroups: [
        { id: "detective", name: "Detective", tier: "action", level: 3, costPerLevel: 3 },
        { id: "street", name: "Street", tier: "field", level: 3, costPerLevel: 2 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "wanted", name: "Wanted (Zaibatsu Syndicate)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Bounty on your head from former corporate employers" },
        { id: "skeleton_in_the_closet", name: "Skeleton in the Closet", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Involved in secret black-ops project that must never be revealed" },
        { id: "phobia", name: "Phobia (Electromagnetic Pulses)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Dread of cybernetic system blackout" }
      ],
      weapons: [
        { name: "Mono-Molecular Katana", level: 3, range: "Melee", attackType: "melee", enhancements: "Piercing, Accurate", limiters: "Melee", notes: "Nanotech honed edge" },
        { name: "Shock Kunai & Shuriken", level: 2, range: "25m", attackType: "ranged", enhancements: "Stun", limiters: "Charges", notes: "High voltage capacitor discharge" }
      ],
      gear: "Thermo-optic shinobi suit, grappling line launcher, encrypted memory chips, smoke pellets"
    },
    {
      id: "martial_artist",
      name: "Martial Artist (Ki Brawler / Shōnen Champion)",
      category: "action",
      concept: "Dedicated martial practitioner channeling inner spiritual ki into devastating unarmed strikes and supernatural leaps",
      tier: "heroic",
      points: 75,
      stats: { body: 7, mind: 4, soul: 6 },
      attributes: [
        { id: "attack_mastery", name: "Attack Mastery", level: 3, costPerLevel: 1, customDesc: "+3 Attack Combat Value from intense martial mastery" },
        { id: "defence_mastery", name: "Defence Mastery", level: 3, costPerLevel: 1, customDesc: "+3 Defence Combat Value through fluid footwork" },
        { id: "superstrength", name: "Superstrength (Ki Amplification)", level: 2, costPerLevel: 4, customDesc: "Superhuman physical striking force and lifting power" },
        { id: "combat_technique", name: "Combat Technique (Hardness, Iron Will, Brutal, Deflection)", level: 4, costPerLevel: 1, customDesc: "Conditioned fists, unshakable focus, and lethal follow-throughs" },
        { id: "special_movement", name: "Special Movement (Balance, Light-Footed)", level: 2, costPerLevel: 1, customDesc: "Fighting atop narrow poles or tree branches without slipping" },
        { id: "jumping", name: "Jumping", level: 2, costPerLevel: 1, customDesc: "Superhuman acrobatic leaps over rooftops and arena pillars" },
        { id: "energised", name: "Energised", level: 2, costPerLevel: 1, customDesc: "+20 Energy Points for ki strikes" },
        { id: "tough", name: "Tough", level: 2, costPerLevel: 1, customDesc: "+20 Health Points from rigorous body conditioning" },
        { id: "weapon", name: "Weapon (Dragon Ki Burst)", level: 4, costPerLevel: 2, customDesc: "Devastating projected energy blast", enhancements: "Area Effect", limiters: "Concentration" },
        { id: "weapon", name: "Weapon (Hundred Palm Flurry)", level: 2, costPerLevel: 2, customDesc: "Rapid-fire succession of open-palm ki strikes", enhancements: "Rapid Fire", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "adventuring", name: "Adventuring", tier: "action", level: 2, costPerLevel: 3 },
        { id: "domestic", name: "Domestic", tier: "background", level: 2, costPerLevel: 1 }
      ],
      defects: [
        { id: "obligated", name: "Obligated (Martial Code)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Never fight an unfair duel or strike a helpless opponent" },
        { id: "nemesis", name: "Nemesis (Rival Dojo Challenger)", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Fierce rival seeking to prove their martial supremacy" }
      ],
      weapons: [
        { name: "Dragon Ki Burst", level: 4, range: "40m", attackType: "ranged", enhancements: "Area Effect", limiters: "Concentration", notes: "Gather spiritual aura into cupped hands" },
        { name: "Hundred Palm Flurry", level: 2, range: "Melee", attackType: "melee", enhancements: "Rapid Fire", limiters: "Melee", notes: "High-speed barrage of strikes" }
      ],
      gear: "Traditional martial arts gi, weighted training wristbands, beaded prayer beads, healing herbal salve"
    },
    {
      id: "arcane_sorcerer",
      name: "Arcane Sorcerer (Elemental Prodigy / High Mage)",
      category: "fantasy",
      concept: "Wielder of ancient mystical formulas, manipulating elemental forces to shield allies and unleash arcane cataclysms",
      tier: "heroic",
      points: 75,
      stats: { body: 3, mind: 7, soul: 7 },
      attributes: [
        { id: "dynamic_powers", name: "Dynamic Powers (Elemental Sorcery)", level: 2, costPerLevel: 10, customDesc: "Mastery over fire, frost, wind, and lightning spells" },
        { id: "force_field", name: "Force Field (Aegis of Warding)", level: 3, costPerLevel: 4, customDesc: "Luminous barrier providing +30 Armour Rating" },
        { id: "flight", name: "Flight (Mystic Levitation)", level: 1, costPerLevel: 3, customDesc: "Soaring effortlessly through arcane winds" },
        { id: "energised", name: "Energised (Font of Mana)", level: 3, costPerLevel: 1, customDesc: "+30 Energy Points for spellcasting" },
        { id: "mind_shield", name: "Mind Shield", level: 2, costPerLevel: 1, customDesc: "+6 bonus against mental domination" },
        { id: "weapon", name: "Weapon (Arcane Lightning Lance)", level: 3, costPerLevel: 2, customDesc: "Piercing bolt of crackling mana", enhancements: "Piercing, Range", limiters: "Concentration" }
      ],
      skillGroups: [
        { id: "academic", name: "Academic", tier: "background", level: 3, costPerLevel: 1 },
        { id: "scientific", name: "Scientific", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "vulnerability", name: "Vulnerability (Spell Incantations)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Cannot cast spells while gagged or physically grappled" },
        { id: "shortcoming", name: "Shortcoming (Physically Unfit)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Scholarly lifestyle makes prolonged physical exertion exhausting" },
        { id: "easily_distracted", name: "Easily Distracted", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Obsessive curiosity regarding ancient ruins and forbidden tomes" },
        { id: "bane", name: "Bane (Cold Iron)", category: "greater", rank: 3, refundPerRank: 2, customDesc: "Contact with unworked cold iron neutralizes mana flow and inflicts agony" },
        { id: "skeleton_in_the_closet", name: "Skeleton in the Closet", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Unwittingly summoned an ancient entity during academy finals" }
      ],
      weapons: [
        { name: "Arcane Lightning Lance", level: 3, range: "60m", attackType: "ranged", enhancements: "Piercing, Range", limiters: "Concentration", notes: "Somatic focus channeled through staff" }
      ],
      gear: "Carved arcane focus staff, leather-bound grimoire, spell-component pouch, enchanted cloak"
    },
    {
      id: "exorcist",
      name: "Exorcist (Spiritual Miko / Demon Banisher)",
      category: "supernatural",
      concept: "Shinto shrine maiden or wandering spiritualist purifying restless spirits, banishing demons, and sealing curses",
      tier: "heroic",
      points: 75,
      stats: { body: 4, mind: 6, soul: 7 },
      attributes: [
        { id: "exorcism", name: "Exorcism", level: 3, costPerLevel: 1, customDesc: "Banishes, purifies, and seals otherworldly entities" },
        { id: "nullify", name: "Nullify (Demonic & Spectral Curses)", level: 2, costPerLevel: 3, customDesc: "Cancels negative magical and supernatural afflictions" },
        { id: "sixth_sense", name: "Sixth Sense (Spirit Sight)", level: 2, costPerLevel: 1, customDesc: "Perceives ghosts, invisible demons, and cursed spiritual auras" },
        { id: "healing", name: "Healing (Purifying Touch)", level: 2, costPerLevel: 4, customDesc: "Restores vitality and dispels spiritual poisons" },
        { id: "force_field", name: "Force Field (Sacred Barrier)", level: 2, costPerLevel: 4, customDesc: "Spiritual barrier providing +20 Armour Rating" },
        { id: "combat_technique", name: "Combat Technique (Blind-Fighting, Iron Will)", level: 2, costPerLevel: 1, customDesc: "Fights without sight and resists dark despair" },
        { id: "weapon", name: "Weapon (Sacred Azusa Bow)", level: 3, costPerLevel: 2, customDesc: "Spiritual arrows that pierce demonic armor", enhancements: "Piercing, Accurate", limiters: "Charges" },
        { id: "weapon", name: "Weapon (Ofuda Sealing Papers)", level: 2, costPerLevel: 2, customDesc: "Parchment talismans that bind entities", enhancements: "Trap", limiters: "Concentration" }
      ],
      skillGroups: [
        { id: "academic", name: "Academic", tier: "background", level: 2, costPerLevel: 1 },
        { id: "detective", name: "Detective", tier: "action", level: 2, costPerLevel: 3 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 1, costPerLevel: 3 }
      ],
      defects: [
        { id: "obligated", name: "Obligated (Shrine Vows)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Bound to protect sacred grounds and respond to spiritual distress" },
        { id: "cursed", name: "Cursed (Ancestral Demon)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Hunted by a primordial oni seeking revenge on family bloodline" },
        { id: "shortcoming", name: "Shortcoming (Purification Rites)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Must perform cold-water ritual ablutions daily or powers weaken" }
      ],
      weapons: [
        { name: "Sacred Azusa Bow", level: 3, range: "30m", attackType: "ranged", enhancements: "Piercing, Accurate", limiters: "Charges", notes: "Fires sanctified arrows" },
        { name: "Ofuda Sealing Papers", level: 2, range: "20m", attackType: "ranged", enhancements: "Trap", limiters: "Concentration", notes: "Enchanted paper talismans that restrict motion" }
      ],
      gear: "Miko ceremonial robes, sacred azusa yumi bow, box of cinnabar ofuda slips, purification bells"
    },
    {
      id: "android_maid",
      name: "Android Battle-Maid (Synthetic Guardian)",
      category: "scifi",
      concept: "High-spec autonomous android crafted with polite domestic programming masking military-grade ballistics and reinforced alloy armor",
      tier: "heroic",
      points: 75,
      stats: { body: 7, mind: 6, soul: 3 },
      attributes: [
        { id: "armour", name: "Armour (Nanoweave & Titanium Chassis)", level: 4, costPerLevel: 2, customDesc: "Reinforced chassis providing +20 Armour Rating" },
        { id: "superstrength", name: "Superstrength (Hydraulic Actuators)", level: 2, costPerLevel: 4, customDesc: "Can casually lift grand pianos and bend steel girders" },
        { id: "augmented", name: "Augmented (Micro-Gyros & Heuristics)", level: 3, costPerLevel: 1, customDesc: "Perfect balance and reaction-time compensation" },
        { id: "data_access", name: "Data Access (Tactical Database)", level: 2, costPerLevel: 2, customDesc: "Direct optical lookup of blueprints, satellite imagery, and biometrics" },
        { id: "immunity", name: "Immunity (Biological Hazards)", level: 3, costPerLevel: 1, customDesc: "Immune to poison, gas, disease, and asphyxiation" },
        { id: "attack_mastery", name: "Attack Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Attack Combat Value" },
        { id: "weapon", name: "Weapon (Concealed Rotary Chaingun)", level: 4, costPerLevel: 2, customDesc: "Heavy ordnance hidden beneath apron", enhancements: "Rapid Fire, Accurate", limiters: "Charges" },
        { id: "weapon", name: "Weapon (Electro-Shock Palm / Broom)", level: 2, costPerLevel: 2, customDesc: "High-voltage stun capacitor in palms or broom handle", enhancements: "Stun", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "domestic", name: "Domestic", tier: "background", level: 3, costPerLevel: 1 },
        { id: "technical", name: "Technical", tier: "field", level: 2, costPerLevel: 2 },
        { id: "military", name: "Military", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "obligated", name: "Obligated (Master's Commands)", category: "greater", rank: 3, refundPerRank: 2, customDesc: "Hardcoded primary directive to obey and protect designated master" },
        { id: "social_fault", name: "Social Fault (Emotionless)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Literal interpretation of figurative human expressions" },
        { id: "shortcoming", name: "Shortcoming (Recharge Cycles)", category: "lesser", rank: 3, refundPerRank: 1, customDesc: "Must plug into 220V power grid nightly for coolant cycles" }
      ],
      weapons: [
        { name: "Concealed Rotary Chaingun", level: 4, range: "80m", attackType: "ranged", enhancements: "Rapid Fire, Accurate", limiters: "Charges", notes: "Fires 1,200 rounds per minute" },
        { name: "Electro-Shock Palm / Broom", level: 2, range: "Melee", attackType: "melee", enhancements: "Stun", limiters: "Melee", notes: "50,000 volt incapacitation arc" }
      ],
      gear: "Frilled Victorian maid outfit, reinforced tea tray, microfiber dusters, maintenance toolkit"
    },
    {
      id: "monster_trainer",
      name: "Pet Monster Trainer (Creature Master)",
      category: "adventurer",
      concept: "Youthful summoner bonding with exotic magical companions, directing them in arena battles and wilderness exploration",
      tier: "heroic",
      points: 75,
      stats: { body: 4, mind: 5, soul: 6 },
      attributes: [
        { id: "companion", name: "Companion (Pocket Monster Champion)", level: 6, costPerLevel: 2, customDesc: "Loyal battle-hardened beast with elemental breath and claws" },
        { id: "inspire", name: "Inspire (Trainer Commands)", level: 3, costPerLevel: 1, customDesc: "+3 bonus to companion's attack rolls when coaching" },
        { id: "telepathy", name: "Telepathy (Bonded Empathy)", level: 2, costPerLevel: 2, customDesc: "Communicates silently with creature partner over distance" },
        { id: "heightened_awareness", name: "Heightened Awareness", level: 2, costPerLevel: 1, customDesc: "Attuned to creature movements and ambushes in tall grass" },
        { id: "energised", name: "Energised", level: 2, costPerLevel: 1, customDesc: "+20 Energy Points for commanding maneuvers" },
        { id: "item", name: "Item (Bestiary Scanner & Rest Capsules)", level: 4, costPerLevel: 1, customDesc: "Pocket computer and capture spheres (Item 1/2 cost)" },
        { id: "weapon", name: "Weapon (Trainer Whip / Capture Orb)", level: 2, costPerLevel: 2, customDesc: "Entangles wild monsters to pacify them", enhancements: "Trap, Range", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "adventuring", name: "Adventuring", tier: "action", level: 3, costPerLevel: 3 },
        { id: "social", name: "Social", tier: "field", level: 3, costPerLevel: 2 },
        { id: "scientific", name: "Scientific", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "shortcoming", name: "Shortcoming (Youthful Rookie)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Underage rookie traveling without adult supervision" },
        { id: "nemesis", name: "Nemesis (Arrogant Rival)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Persistent childhood rival seeking the regional tournament cup" },
        { id: "easily_distracted", name: "Easily Distracted (Must Catch 'Em All)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Compulsion to encounter, document, and befriend every species" },
        { id: "shortcoming", name: "Shortcoming (Monster Reliance)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Combat capabilities severely compromised if separated from monster" }
      ],
      weapons: [
        { name: "Trainer Whip / Capture Orb", level: 2, range: "15m", attackType: "ranged", enhancements: "Trap, Range", limiters: "Melee", notes: "Subdues beasts without lethal harm" }
      ],
      gear: "Travel backpack, 6 monster capture spheres, digital creature encyclopedia, badge case, running shoes"
    },
    {
      id: "gunslinger",
      name: "Hot-Shot Gunslinger (Bounty Hunter / Space Cowboy)",
      category: "action",
      concept: "Cynical marksman with lightning reflexes, two custom hand cannons, and an uncanny knack for surviving shootouts",
      tier: "heroic",
      points: 75,
      stats: { body: 6, mind: 5, soul: 4 },
      attributes: [
        { id: "attack_mastery", name: "Attack Mastery", level: 3, costPerLevel: 1, customDesc: "+3 Attack Combat Value with sidearms" },
        { id: "combat_technique", name: "Combat Technique (Dead Eye, Quick Draw, Lightning Reflexes, Steady Hand, Point-Blank)", level: 5, costPerLevel: 1, customDesc: "Fires first in any standoff and ignores cover penalties" },
        { id: "ranged_attack", name: "Ranged Attack", level: 3, costPerLevel: 1, customDesc: "+3 Attack bonus with ranged projectile weapons" },
        { id: "mulligan", name: "Mulligan (Outlaw Luck)", level: 2, costPerLevel: 1, customDesc: "Twice per session reroll on near misses" },
        { id: "tough", name: "Tough", level: 2, costPerLevel: 1, customDesc: "+20 Health Points to shrug off grazing bullets" },
        { id: "heightened_senses", name: "Heightened Senses (Sharpshooter Eyes & Ears)", level: 2, costPerLevel: 1, customDesc: "Pinpoints distant footsteps and muzzle flashes" },
        { id: "weapon", name: "Weapon (Dual Heavy Hand Cannons)", level: 4, costPerLevel: 2, customDesc: "Matched high-caliber revolvers", enhancements: "Accurate, Rapid Fire", limiters: "Charges" },
        { id: "weapon", name: "Weapon (High-Explosive Frag Grenade)", level: 3, costPerLevel: 2, customDesc: "Shrapnel blast clearing out crowded saloons", enhancements: "Area Effect", limiters: "Charges" }
      ],
      skillGroups: [
        { id: "military", name: "Military", tier: "action", level: 3, costPerLevel: 3 },
        { id: "street", name: "Street", tier: "field", level: 3, costPerLevel: 2 },
        { id: "detective", name: "Detective", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "wanted", name: "Wanted (Bounty Guild Contract)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Interplanetary authorities and crime syndicates want you captured" },
        { id: "social_fault", name: "Social Fault (Heavy Gambling Debts)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Owes thousands of credits to underworld loan sharks" },
        { id: "obligated", name: "Obligated (Outlaw Code)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Never draws on unarmed civilians, women, or children" }
      ],
      weapons: [
        { name: "Dual Heavy Hand Cannons", level: 4, range: "50m", attackType: "ranged", enhancements: "Accurate, Rapid Fire", limiters: "Charges", notes: ".454 magnum explosive hollowpoints" },
        { name: "High-Explosive Frag Grenade", level: 3, range: "20m", attackType: "ranged", enhancements: "Area Effect", limiters: "Charges", notes: "Timed fuse concussive shrapnel" }
      ],
      gear: "Duster coat, dual leather gun rig, lucky silver coin, cigarillos and zippo lighter, wanted posters"
    },
    {
      id: "henshin_hero",
      name: "Henshin Hero (Sentai Defender / Masked Champion)",
      category: "supernatural",
      concept: "Everyday hero who invokes a transformation belt or device to don reinforced battle armor and fight evil syndicates",
      tier: "heroic",
      points: 75,
      stats: { body: 6, mind: 4, soul: 6 },
      attributes: [
        { id: "alternate_form", name: "Alternate Form (Henshin Battle Armor)", level: 3, costPerLevel: 4, customDesc: "Suit forms in flash of energy with insectoid visor" },
        { id: "superstrength", name: "Superstrength", level: 2, costPerLevel: 4, customDesc: "Shatters concrete with punches and throws monster foot soldiers" },
        { id: "jumping", name: "Jumping", level: 3, costPerLevel: 1, customDesc: "Leaps 50 meters into the sky for finishing drop kicks" },
        { id: "tough", name: "Tough", level: 3, costPerLevel: 1, customDesc: "+30 Health Points from armored reinforcement" },
        { id: "armour", name: "Armour (Bio-Resin Combat Shell)", level: 3, costPerLevel: 2, customDesc: "Provides +15 Armour Rating" },
        { id: "combat_technique", name: "Combat Technique (Hardness, Deflection)", level: 2, costPerLevel: 1, customDesc: "Deflects projectiles and strikes with hardened knuckles" },
        { id: "weapon", name: "Weapon (Rider Dynamite Kick)", level: 4, costPerLevel: 2, customDesc: "Signature leaping drop-kick with trailing flames", enhancements: "Piercing, Accurate", limiters: "Concentration, Melee" },
        { id: "weapon", name: "Weapon (Henshin Laser Saber)", level: 3, costPerLevel: 2, customDesc: "Energy blade drawn from transformation buckle", enhancements: "Piercing", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "adventuring", name: "Adventuring", tier: "action", level: 2, costPerLevel: 3 },
        { id: "domestic", name: "Domestic", tier: "background", level: 2, costPerLevel: 1 }
      ],
      defects: [
        { id: "skeleton_in_the_closet", name: "Skeleton in the Closet (Secret Identity)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Must conceal double life from classmates and family" },
        { id: "nemesis", name: "Nemesis (Evil Syndicate Commander)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Shadow syndicate general targeting your home city" },
        { id: "shortcoming", name: "Shortcoming (Pose & Catchphrase)", category: "lesser", rank: 3, refundPerRank: 1, customDesc: "Must execute full choreographed pose and vocal phrase to transform" },
        { id: "obligated", name: "Obligated (Defender of Justice)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Always stand between danger and civilians" }
      ],
      weapons: [
        { name: "Rider Dynamite Kick", level: 4, range: "Melee", attackType: "melee", enhancements: "Piercing, Accurate", limiters: "Concentration, Melee", notes: "Trailing explosion upon landing" },
        { name: "Henshin Laser Saber", level: 3, range: "Melee", attackType: "melee", enhancements: "Piercing", limiters: "Melee", notes: "Cuts through reinforced chitin" }
      ],
      gear: "Transformation belt driver, high-speed motorcycle, leather biker jacket, hero emblem keychain"
    },
    {
      id: "everyday_student",
      name: "Everyday Student (Reluctant Protagonist)",
      category: "modern",
      concept: "Normal high school student thrust into extraordinary circumstances with incredible latent potential and baffling anime luck",
      tier: "heroic",
      points: 75,
      stats: { body: 5, mind: 5, soul: 6 },
      attributes: [
        { id: "mulligan", name: "Mulligan (Protagonist Luck)", level: 4, costPerLevel: 1, customDesc: "Four rerolls per session to survive bizarre perils" },
        { id: "dynamic_powers", name: "Dynamic Powers (Awakening Latent Spark)", level: 1, costPerLevel: 10, customDesc: "Spontaneous psychic or supernatural bursts when friends are in danger" },
        { id: "energised", name: "Energised", level: 3, costPerLevel: 1, customDesc: "+30 Energy Points fueled by sheer emotional willpower" },
        { id: "sixth_sense", name: "Sixth Sense (Danger Chill)", level: 2, costPerLevel: 1, customDesc: "Hair stands on end moments before supernatural weirdness occurs" },
        { id: "inspire", name: "Inspire (Heartfelt Speeches)", level: 2, costPerLevel: 1, customDesc: "Rallies allies through earnest determination" },
        { id: "tough", name: "Tough", level: 2, costPerLevel: 1, customDesc: "+20 Health Points from boundless teenage stamina" },
        { id: "combat_technique", name: "Combat Technique (Lightning Reflexes, Improvised Weapons)", level: 2, costPerLevel: 1, customDesc: "Dodges unexpected attacks and swings whatever is on hand" },
        { id: "weapon", name: "Weapon (Aluminium Bat / Kinetic Flash)", level: 3, costPerLevel: 2, customDesc: "High school club sports gear infused with latent energy", enhancements: "Stun, Accurate", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "academic", name: "Academic", tier: "background", level: 3, costPerLevel: 1 },
        { id: "social", name: "Social", tier: "field", level: 3, costPerLevel: 2 },
        { id: "artistic", name: "Artistic", tier: "background", level: 2, costPerLevel: 1 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "shortcoming", name: "Shortcoming (Clumsy)", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Prone to tripping over school bags and comical slapstick falls" },
        { id: "easily_distracted", name: "Easily Distracted", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Daydreaming during trigonometry class and video game marathons" },
        { id: "significant_other", name: "Significant Other (Childhood Friend)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Demanding classmate who drags you into bizarre urban mysteries" },
        { id: "magnet", name: "Magnet (Weird Phenomena)", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Every strange entity that visits town happens to end up in your homeroom" }
      ],
      weapons: [
        { name: "Aluminium Bat / Kinetic Flash", level: 3, range: "Melee", attackType: "melee", enhancements: "Stun, Accurate", limiters: "Melee", notes: "Channeled kinetic discharge from home-run swing" }
      ],
      gear: "High school blazer uniform, school bag with textbooks, smartphone with mascot charm, bicycle"
    },
    {
      id: "dark_elf",
      name: "Dark Elf (Shadow Infiltrator / Night Blade)",
      category: "fantasy",
      concept: "Lethal subterranean scout combining shadow magic, climbing mastery, and venomous twin blade strikes",
      tier: "heroic",
      points: 75,
      stats: { body: 6, mind: 5, soul: 4 },
      attributes: [
        { id: "special_movement", name: "Special Movement (Wall-Crawling, Balance, Light-Footed, Fast)", level: 4, costPerLevel: 1, customDesc: "Silently runs up stalagmites and navigates cavern ceilings" },
        { id: "undetectable", name: "Undetectable (Shadow Meld)", level: 2, costPerLevel: 2, customDesc: "Dissolves seamlessly into natural shadows and darkness" },
        { id: "heightened_senses", name: "Heightened Senses (Darkvision & Acute Hearing)", level: 2, costPerLevel: 1, customDesc: "Perfect clarity in pitch-black caverns" },
        { id: "combat_technique", name: "Combat Technique (Blind-Fighting, Critical Strike, Concealed Attack)", level: 3, costPerLevel: 1, customDesc: "Strikes vital arteries from unexpected concealment" },
        { id: "attack_mastery", name: "Attack Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Attack Combat Value" },
        { id: "defence_mastery", name: "Defence Mastery", level: 2, costPerLevel: 1, customDesc: "+2 Defence Combat Value" },
        { id: "superspeed", name: "Superspeed", level: 1, costPerLevel: 3, customDesc: "Blinding burst dash across moonlit halls" },
        { id: "weapon", name: "Weapon (Venomous Shadow Daggers)", level: 3, costPerLevel: 2, customDesc: "Curved obsidian blades dripping with spider neurotoxin", enhancements: "Piercing, Continuing", limiters: "Melee" },
        { id: "weapon", name: "Weapon (Repeating Hand Crossbow)", level: 2, costPerLevel: 2, customDesc: "Compact wrist-mounted poison dart launcher", enhancements: "Concealable", limiters: "Charges" }
      ],
      skillGroups: [
        { id: "street", name: "Street", tier: "field", level: 3, costPerLevel: 2 },
        { id: "detective", name: "Detective", tier: "action", level: 3, costPerLevel: 3 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 3, costPerLevel: 3 }
      ],
      defects: [
        { id: "wanted", name: "Wanted (Surface Kingdom Authorities)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Royal bounty hunters track your movements on surface lands" },
        { id: "bane", name: "Bane (Direct Sunlight)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Blinding sunlight dazzles eyes and causes painful blistering" },
        { id: "skeleton_in_the_closet", name: "Skeleton in the Closet", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Betrayed the Matron Mother's assassin cabal" }
      ],
      weapons: [
        { name: "Venomous Shadow Daggers", level: 3, range: "Melee", attackType: "melee", enhancements: "Piercing, Continuing", limiters: "Melee", notes: "Inflicts 3 turns of ongoing neurotoxin damage" },
        { name: "Repeating Hand Crossbow", level: 2, range: "20m", attackType: "ranged", enhancements: "Concealable", limiters: "Charges", notes: "Compact magazine holds 5 sleep-coated bolts" }
      ],
      gear: "Silk-spun shadow cloak, twin obsidian daggers, wrist-crossbow, vials of cave spider venom, grappling silk cord"
    },
    {
      id: "broker",
      name: "Underworld Broker (Information Dealer / City Fixer)",
      category: "modern",
      concept: "Mastermind networker with vast corporate contacts, private detective instincts, and blackmail leverage on everyone in the city",
      tier: "heroic",
      points: 75,
      stats: { body: 4, mind: 7, soul: 5 },
      attributes: [
        { id: "wealth", name: "Wealth (Syndicate Bankroll)", level: 3, costPerLevel: 3, customDesc: "Multimillion-credit offshore accounts and slush funds" },
        { id: "connected", name: "Connected (Police & Underworld)", level: 4, costPerLevel: 1, customDesc: "Contacts ranging from police chiefs to black-market fences" },
        { id: "data_access", name: "Data Access (Black Net Archives)", level: 2, costPerLevel: 2, customDesc: "Encrypted backdoor access to corporate databanks" },
        { id: "mind_shield", name: "Mind Shield", level: 3, costPerLevel: 1, customDesc: "+9 defense against telepathic probing and truth serums" },
        { id: "minions", name: "Minions (Loyal Informant Network)", level: 3, costPerLevel: 1, customDesc: "Network of couriers, hackers, and street lookouts" },
        { id: "mulligan", name: "Mulligan (Contingency Schemes)", level: 2, costPerLevel: 1, customDesc: "Reroll failures when executing pre-planned gambits" },
        { id: "combat_technique", name: "Combat Technique (Concealed Weapons)", level: 1, costPerLevel: 1, customDesc: "Draws concealed weapons without detection" },
        { id: "weapon", name: "Weapon (Concealed Titanium Derringer)", level: 2, costPerLevel: 2, customDesc: "Ceramic holdout pistol invisible to metal detectors", enhancements: "Concealable, Accurate", limiters: "Charges" }
      ],
      skillGroups: [
        { id: "business", name: "Business", tier: "field", level: 3, costPerLevel: 2 },
        { id: "street", name: "Street", tier: "field", level: 3, costPerLevel: 2 },
        { id: "social", name: "Social", tier: "field", level: 3, costPerLevel: 2 },
        { id: "detective", name: "Detective", tier: "action", level: 2, costPerLevel: 3 }
      ],
      defects: [
        { id: "skeleton_in_the_closet", name: "Skeleton in the Closet (The Ghost Broker)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Operates exclusively behind encrypted burner lines and aliases" },
        { id: "nemesis", name: "Nemesis (Vengeful Crime Kingpin)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Ruthless boss whose embezzlement scheme you exposed" },
        { id: "shortcoming", name: "Shortcoming (Physically Unfit)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Desk-bound lifestyle and chain smoking leave you winded" },
        { id: "red_tape", name: "Red Tape", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Complicated web of shell companies requires legal bookkeeping" }
      ],
      weapons: [
        { name: "Concealed Titanium Derringer", level: 2, range: "15m", attackType: "ranged", enhancements: "Concealable, Accurate", limiters: "Charges", notes: "Two-shot ceramic alloy frame" }
      ],
      gear: "Tailored Italian suit, encrypted satellite smartphone, gold lighter, leather briefcase with bearer bonds"
    },
    {
      id: "pop_idol",
      name: "Pop Idol (Songstress of Harmony)",
      category: "modern",
      concept: "Vibrant entertainer whose captivating melodies and acoustic resonant powers inspire crowds, heal spirits, and shatter illusions",
      tier: "heroic",
      points: 75,
      stats: { body: 4, mind: 5, soul: 7 },
      attributes: [
        { id: "inspire", name: "Inspire (Starlight Anthem)", level: 4, costPerLevel: 1, customDesc: "+4 combat bonus to all allies who can hear your voice" },
        { id: "dynamic_powers", name: "Dynamic Powers (Melodic Resonance)", level: 1, costPerLevel: 10, customDesc: "Manipulates sonic frequencies, light shows, and emotions through song" },
        { id: "social_mastery", name: "Social Mastery", level: 3, costPerLevel: 1, customDesc: "+3 bonus to persuasion, charm, and captivating audiences" },
        { id: "energised", name: "Energised", level: 3, costPerLevel: 1, customDesc: "+30 Energy Points for vocal performances" },
        { id: "healing", name: "Healing (Soothing Ballad)", level: 2, costPerLevel: 4, customDesc: "Harmonious frequencies accelerate cellular regeneration" },
        { id: "mulligan", name: "Mulligan (Fan Encouragement)", level: 2, costPerLevel: 1, customDesc: "Draws determination from cheering fans to reroll rolls" },
        { id: "weapon", name: "Weapon (Sonic Crescendo Mic)", level: 3, costPerLevel: 2, customDesc: "Acoustic shockwave directed through wireless microphone", enhancements: "Area Effect, Accurate", limiters: "Concentration" }
      ],
      skillGroups: [
        { id: "artistic", name: "Artistic", tier: "background", level: 4, costPerLevel: 1 },
        { id: "social", name: "Social", tier: "field", level: 3, costPerLevel: 2 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 1, costPerLevel: 3 }
      ],
      defects: [
        { id: "marked", name: "Marked (Superstar Face)", category: "lesser", rank: 3, refundPerRank: 1, customDesc: "Cannot appear in public without triggering stampedes of screaming fans" },
        { id: "obligated", name: "Obligated (Ironclad Talent Contract)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Grueling rehearsal schedules and corporate brand management" }
      ],
      weapons: [
        { name: "Sonic Crescendo Mic", level: 3, range: "30m", attackType: "ranged", enhancements: "Area Effect, Accurate", limiters: "Concentration", notes: "Shatters glass and stuns enemies with harmonic feedback" }
      ],
      gear: "Custom jeweled wireless microphone, portable sound-amp brooch, glitter stage outfit, autograph cards"
    },
    {
      id: "samurai",
      name: "Samurai (Wandering Ronin / Sword Saint)",
      category: "action",
      concept: "Master swordsman wandering the roads, bound by strict bushido, delivering clean lethal strikes with instantaneous IAI draw techniques",
      tier: "heroic",
      points: 75,
      stats: { body: 6, mind: 5, soul: 5 },
      attributes: [
        { id: "attack_mastery", name: "Attack Mastery", level: 3, costPerLevel: 1, customDesc: "+3 Attack Combat Value with swords" },
        { id: "defence_mastery", name: "Defence Mastery", level: 3, costPerLevel: 1, customDesc: "+3 Defence Combat Value with parrying blades" },
        { id: "massive_damage", name: "Massive Damage (Kenjutsu)", level: 2, costPerLevel: 2, customDesc: "+2 to Melee Damage Multiplier" },
        { id: "combat_technique", name: "Combat Technique (Lightning Reflexes, Deflection, Critical Strike, Hardness, Blind-Fighting)", level: 5, costPerLevel: 1, customDesc: "Parries musket balls, strikes blind in mist, and cuts through armor" },
        { id: "special_movement", name: "Special Movement (Balance, Light-Footed)", level: 2, costPerLevel: 1, customDesc: "Leaps soundlessly across rooftops and snow without footprints" },
        { id: "tough", name: "Tough", level: 4, costPerLevel: 1, customDesc: "+40 Health Points from bushido conditioning" },
        { id: "weapon", name: "Weapon (Ancestral Masterwork Katana)", level: 4, costPerLevel: 2, customDesc: "Folded tamahagane steel folded blade", enhancements: "Piercing, Accurate", limiters: "Melee" },
        { id: "weapon", name: "Weapon (Wakizashi Deflecting Blade)", level: 2, costPerLevel: 2, customDesc: "Companion parrying short blade", enhancements: "Accurate", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "military", name: "Military", tier: "action", level: 3, costPerLevel: 3 },
        { id: "adventuring", name: "Adventuring", tier: "action", level: 2, costPerLevel: 3 },
        { id: "domestic", name: "Domestic", tier: "background", level: 2, costPerLevel: 1 }
      ],
      defects: [
        { id: "obligated", name: "Obligated (Bushido Code)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Rectitude, courage, benevolence, politeness, honesty, honour, and loyalty" },
        { id: "shortcoming", name: "Shortcoming (Impoverished Ronin)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Masterless ronin with only a few coppers in the purse" },
        { id: "nemesis", name: "Nemesis (Rival Clan Assassin)", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Shogunate bounty hunter hunting former clan retainers" },
        { id: "skeleton_in_the_closet", name: "Skeleton in the Closet", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Carries the broken scabbard of a fallen lord" }
      ],
      weapons: [
        { name: "Ancestral Masterwork Katana", level: 4, range: "Melee", attackType: "melee", enhancements: "Piercing, Accurate", limiters: "Melee", notes: "Lethal IAI draw cutting through mail" },
        { name: "Wakizashi Deflecting Blade", level: 2, range: "Melee", attackType: "melee", enhancements: "Accurate", limiters: "Melee", notes: "Short sword used in dual-wielding defence" }
      ],
      gear: "Weathered straw ronin hat, indigo kosode and hakama, whetstone, tea bowl, wooden sake gourd"
    },
    {
      id: "half_demon",
      name: "Half-Demon (Infernal Scion / Fiend Awakened)",
      category: "supernatural",
      concept: "Tormented hybrid scion wrestling with demonic blood, wielding cursed hellfire blasts, razor fiend talons, and supernatural resilience",
      tier: "heroic",
      points: 75,
      stats: { body: 7, mind: 4, soul: 5 },
      attributes: [
        { id: "regeneration", name: "Regeneration", level: 2, costPerLevel: 5, customDesc: "Regenerates 20 HP per round unless wounded by consecrated holy relics" },
        { id: "armour", name: "Armour (Demonic Carapace)", level: 2, costPerLevel: 2, customDesc: "+10 Armour Rating from hardened fiendish skin" },
        { id: "superstrength", name: "Superstrength (Demonic Might)", level: 2, costPerLevel: 4, customDesc: "Crushes stone columns barehanded" },
        { id: "special_movement", name: "Special Movement (Fast, Wall-Crawling)", level: 2, costPerLevel: 1, customDesc: "Runs on all fours along cliff sides at astonishing speed" },
        { id: "heightened_senses", name: "Heightened Senses (Blood Scent & Night Vision)", level: 2, costPerLevel: 1, customDesc: "Tracks wounded foes across kilometers by scent" },
        { id: "tough", name: "Tough", level: 2, costPerLevel: 1, customDesc: "+20 Health Points from supernatural anatomy" },
        { id: "weapon", name: "Weapon (Hellfire Curse Blast)", level: 3, costPerLevel: 2, customDesc: "Projected sphere of blackened infernal fire", enhancements: "Area Effect, Continuing", limiters: "Charges" },
        { id: "weapon", name: "Weapon (Fiend Talons & Fangs)", level: 3, costPerLevel: 2, customDesc: "Elongated obsidian claws that rend flesh", enhancements: "Piercing", limiters: "Melee" }
      ],
      skillGroups: [
        { id: "adventuring", name: "Adventuring", tier: "action", level: 3, costPerLevel: 3 },
        { id: "street", name: "Street", tier: "field", level: 2, costPerLevel: 2 }
      ],
      defects: [
        { id: "bane", name: "Bane (Holy Relics & Sacred Water)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Contact with sanctified items burns flesh and nullifies regeneration" },
        { id: "cursed", name: "Cursed (Fiendish Bloodlust)", category: "greater", rank: 2, refundPerRank: 2, customDesc: "Must make Soul checks under the new moon to prevent losing control to demonic instincts" },
        { id: "marked", name: "Marked (Demonic Horns & Eyes)", category: "lesser", rank: 2, refundPerRank: 1, customDesc: "Curved horns, crimson slitted pupils, and clawed hands cannot be hidden easily" },
        { id: "nemesis", name: "Nemesis (Holy Inquisitor)", category: "lesser", rank: 1, refundPerRank: 1, customDesc: "Relentless witch-hunter sworn to cleanse your bloodline" }
      ],
      weapons: [
        { name: "Hellfire Curse Blast", level: 3, range: "30m", attackType: "ranged", enhancements: "Area Effect, Continuing", limiters: "Charges", notes: "Infernal black flames burn for 2 rounds" },
        { name: "Fiend Talons & Fangs", level: 3, range: "Melee", attackType: "melee", enhancements: "Piercing", limiters: "Melee", notes: "Tears through mundane shields" }
      ],
      gear: "Tattered traveller cloak, iron prayer beads binding demonic pulse, heavy boots, flint and steel"
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
