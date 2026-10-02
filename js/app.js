/**
 * Big Eyes, Small Mouth (BESM) 4th Edition - Character Architect Application Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Application State
  const roller = new BESM4EDiceRoller();
  let currentCharacter = BESM4EStorage.getActiveCharacter();
  let currentAttrFilter = "all";
  let currentSkillTierFilter = "all";
  let currentDefectFilter = "all";
  let currentRollMode = "standard";

  // Tactical Conditions Catalog
  const CONDITIONS = [
    { id: "stunned", label: "Stunned", desc: "Cannot take actions for 1 round" },
    { id: "shocked", label: "Shocked", desc: "Suffered single-hit damage >= Shock Threshold; -1 to next action" },
    { id: "prone", label: "Prone", desc: "Attacks against you gain Minor Edge; must spend movement to stand" },
    { id: "blinded", label: "Blinded", desc: "Vision-based actions face Minor Obstacle; DCV reduced" },
    { id: "bleeding", label: "Bleeding", desc: "Suffers 5 HP damage per combat round until treated" },
    { id: "restrained", label: "Restrained", desc: "Locomotion stopped; actions face Minor Obstacle" },
    { id: "cloaked", label: "Concealed / Incorporeal", desc: "Attacks against you face Minor Obstacle" }
  ];

  // ========================================================================
  // Toast Notifications
  // ========================================================================
  function showToast(message, duration = 2500) {
    const toast = document.getElementById("app-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = "block";
    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.transform = "translateY(50px)";
      toast.style.opacity = "0";
      setTimeout(() => { toast.style.display = "none"; }, 300);
    }, duration);
  }

  // ========================================================================
  // Theme Management
  // ========================================================================
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    BESM4EStorage.setTheme(theme);
  }

  const initialTheme = BESM4EStorage.getTheme();
  applyTheme(initialTheme);

  document.getElementById("btn-toggle-theme").addEventListener("click", () => {
    const activeTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = activeTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme} theme`);
  });

  // ========================================================================
  // Tab Navigation
  // ========================================================================
  const navTabs = document.querySelectorAll(".nav-tab");
  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetPaneId = tab.getAttribute("data-tab");
      navTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      const activePane = document.getElementById(targetPaneId);
      if (activePane) {
        activePane.classList.add("active");
      }

      // Re-render views if entering sheet, play, or advancement
      if (targetPaneId === "sheet-pane") {
        renderPrintSheet();
      } else if (targetPaneId === "play-pane") {
        renderPlayMode();
      } else if (targetPaneId === "advancement-pane") {
        renderAdvancement();
      }
    });
  });

  // ========================================================================
  // Modal Utilities
  // ========================================================================
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("open");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("open");
  }

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("open");
      }
    });
  });

  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-backdrop");
      if (modal) modal.classList.remove("open");
    });
  });

  // ========================================================================
  // Character Selector & Management
  // ========================================================================
  function populateCharacterDropdown() {
    const dropdown = document.getElementById("char-select-dropdown");
    dropdown.innerHTML = "";
    const list = BESM4EStorage.getCharacterSummaries();

    list.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name || "Untitled"} (${c.tier.toUpperCase()})`;
      if (currentCharacter && c.id === currentCharacter.id) {
        opt.selected = true;
      }
      dropdown.appendChild(opt);
    });
  }

  document.getElementById("char-select-dropdown").addEventListener("change", (e) => {
    const selectedId = e.target.value;
    const loaded = BESM4EStorage.loadCharacter(selectedId);
    if (loaded) {
      currentCharacter = loaded;
      BESM4EStorage.setActiveId(selectedId);
      refreshAll();
      showToast(`Loaded "${currentCharacter.name || "Untitled Character"}"`);
    }
  });

  // Character Manager Modal
  document.getElementById("btn-open-char-mgr").addEventListener("click", () => {
    renderCharacterManagerList();
    openModal("modal-character-mgr");
  });

  function renderCharacterManagerList() {
    const listEl = document.getElementById("mgr-character-list");
    listEl.innerHTML = "";
    const list = BESM4EStorage.getCharacterSummaries();

    list.forEach(c => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <div class="item-name">${escapeHtml(c.name || "Untitled Character")} <span class="tag-pill">${c.tier.toUpperCase()}</span></div>
          <div class="item-sub">${escapeHtml(c.concept || "No concept specified")} • Updated: ${new Date(c.updatedAt).toLocaleDateString()}</div>
        </div>
        <div class="item-controls">
          <button class="btn btn-secondary btn-sm btn-select-char" data-id="${c.id}">Select</button>
          <button class="btn btn-secondary btn-sm btn-clone-char" data-id="${c.id}" title="Duplicate character">Copy</button>
          <button class="btn btn-danger btn-sm btn-delete-char" data-id="${c.id}" title="Delete character">✕</button>
        </div>
      `;
      listEl.appendChild(row);
    });

    listEl.querySelectorAll(".btn-select-char").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter = BESM4EStorage.loadCharacter(id);
        BESM4EStorage.setActiveId(id);
        populateCharacterDropdown();
        refreshAll();
        closeModal("modal-character-mgr");
        showToast(`Selected "${currentCharacter.name || "Untitled"}"`);
      });
    });

    listEl.querySelectorAll(".btn-clone-char").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const orig = BESM4EStorage.loadCharacter(id);
        if (orig) {
          const cloned = orig.clone();
          BESM4EStorage.saveCharacter(cloned);
          currentCharacter = cloned;
          populateCharacterDropdown();
          refreshAll();
          closeModal("modal-character-mgr");
          showToast(`Cloned into "${cloned.name}"`);
        }
      });
    });

    listEl.querySelectorAll(".btn-delete-char").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const list = BESM4EStorage.getCharacterSummaries();
        if (list.length <= 1) {
          alert("Cannot delete the only character. Create another first.");
          return;
        }
        if (confirm("Are you sure you want to delete this character?")) {
          BESM4EStorage.deleteCharacter(id);
          currentCharacter = BESM4EStorage.getActiveCharacter();
          populateCharacterDropdown();
          refreshAll();
          renderCharacterManagerList();
          showToast("Character deleted");
        }
      });
    });
  }

  // "+ Create Blank Character" button in Manager
  document.getElementById("btn-mgr-new-char").addEventListener("click", () => {
    const newChar = new BESM4ECharacter({
      name: "",
      player: "",
      campaign: "",
      concept: "",
      tier: "heroic",
      customPointBudget: 75,
      stats: { body: 0, mind: 0, soul: 0 },
      attributes: [],
      skillGroups: [],
      defects: [],
      weapons: []
    });
    BESM4EStorage.saveCharacter(newChar);
    currentCharacter = newChar;
    populateCharacterDropdown();
    refreshAll();
    closeModal("modal-character-mgr");
    showToast("New blank character created");
  });

  // ========================================================================
  // Quick Save & Sync
  // ========================================================================
  function saveCurrentCharacter(silent = false) {
    if (!currentCharacter) return;
    readFormValues();
    BESM4EStorage.saveCharacter(currentCharacter);
    populateCharacterDropdown();
    if (!silent) {
      showToast("💾 Character saved!");
    }
  }

  document.getElementById("btn-quick-save").addEventListener("click", () => {
    saveCurrentCharacter(false);
  });

  // Keyboard shortcut Ctrl+S
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveCurrentCharacter(false);
    }
  });

  // ========================================================================
  // Builder Form Synchronization
  // ========================================================================
  function readFormValues() {
    if (!currentCharacter) return;
    currentCharacter.name = document.getElementById("char-name").value.trim();
    currentCharacter.concept = document.getElementById("char-concept").value.trim();
    currentCharacter.player = document.getElementById("char-player").value || "";
    currentCharacter.campaign = document.getElementById("char-campaign").value || "";
    currentCharacter.tier = document.getElementById("char-tier").value || "heroic";
    currentCharacter.customPointBudget = parseInt(document.getElementById("char-custom-budget").value, 10) || 75;
    currentCharacter.gear = document.getElementById("char-gear").value || "";
    currentCharacter.appearance = document.getElementById("char-appearance").value || "";
    currentCharacter.backstory = document.getElementById("char-backstory").value || "";
    currentCharacter.alliesEnemies = document.getElementById("char-allies").value || "";
  }

  function populateBuilderForm() {
    if (!currentCharacter) return;
    document.getElementById("char-name").value = currentCharacter.name || "";
    document.getElementById("char-concept").value = currentCharacter.concept || "";
    document.getElementById("char-player").value = currentCharacter.player || "";
    document.getElementById("char-campaign").value = currentCharacter.campaign || "";
    document.getElementById("char-tier").value = currentCharacter.tier || "heroic";
    document.getElementById("char-custom-budget").value = currentCharacter.customPointBudget || 75;
    document.getElementById("char-gear").value = currentCharacter.gear || "";
    document.getElementById("char-appearance").value = currentCharacter.appearance || "";
    document.getElementById("char-backstory").value = currentCharacter.backstory || "";
    document.getElementById("char-allies").value = currentCharacter.alliesEnemies || "";

    // Show/hide custom budget
    document.getElementById("custom-budget-group").style.display =
      currentCharacter.tier === "custom" ? "block" : "none";

    renderCoreStats();
    renderDerivedStats();
    renderPointBreakdown();
    renderBuilderAttributes();
    renderBuilderSkillGroups();
    renderBuilderDefects();
    renderBuilderWeapons();
  }

  // Reactive text inputs
  ["char-name", "char-concept", "char-player", "char-campaign", "char-custom-budget", "char-gear", "char-appearance", "char-backstory", "char-allies"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        readFormValues();
        renderPointBreakdown();
      });
    }
  });

  document.getElementById("char-tier").addEventListener("change", (e) => {
    readFormValues();
    document.getElementById("custom-budget-group").style.display =
      currentCharacter.tier === "custom" ? "block" : "none";
    renderPointBreakdown();
    saveCurrentCharacter(true);
  });

  // ========================================================================
  // Core Stats Rendering & Steppers (BESM 4E: 2 CP ≤12, 4 CP >12)
  // ========================================================================
  function renderCoreStats() {
    ["body", "mind", "soul"].forEach(stat => {
      const val = currentCharacter.stats[stat] || 0;
      const valEl = document.getElementById(`val-${stat}`);
      const costEl = document.getElementById(`cost-${stat}`);
      if (valEl) valEl.textContent = val;
      const cost = currentCharacter.calculateStatCost(val);
      if (costEl) costEl.textContent = `${cost} CP`;
    });
  }

  function adjustStat(stat, delta) {
    const current = currentCharacter.stats[stat] || 0;
    const target = Math.max(0, Math.min(30, current + delta));
    currentCharacter.setStat(stat, target);
    renderCoreStats();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
  }

  document.getElementById("btn-body-minus").addEventListener("click", () => adjustStat("body", -1));
  document.getElementById("btn-body-plus").addEventListener("click", () => adjustStat("body", 1));
  document.getElementById("btn-mind-minus").addEventListener("click", () => adjustStat("mind", -1));
  document.getElementById("btn-mind-plus").addEventListener("click", () => adjustStat("mind", 1));
  document.getElementById("btn-soul-minus").addEventListener("click", () => adjustStat("soul", -1));
  document.getElementById("btn-soul-plus").addEventListener("click", () => adjustStat("soul", 1));

  // "Human Baseline (4/4/4)" button
  document.getElementById("btn-set-human-avg").addEventListener("click", () => {
    currentCharacter.setHumanAverageStats();
    renderCoreStats();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
    showToast("Stats set to standard human baseline (4/4/4)");
  });

  // ========================================================================
  // Derived Stats Rendering (BESM 4E Chapter 8, p. 168-171)
  // ========================================================================
  function renderDerivedStats() {
    const derived = currentCharacter.getDerived();
    document.getElementById("derived-cv").textContent = derived.baseCV;
    document.getElementById("derived-acv").textContent = derived.acv;
    document.getElementById("derived-dcv").textContent = derived.dcv;
    document.getElementById("derived-hp").textContent = derived.maxHealth;
    document.getElementById("derived-ep").textContent = derived.maxEnergy;
    document.getElementById("derived-dm").textContent = derived.damageMultiplier;
    document.getElementById("derived-melee-dm").textContent = derived.meleeDamageMultiplier;
    document.getElementById("derived-ar").textContent = derived.armorRating;
    document.getElementById("derived-shock").textContent = derived.shockThreshold;
  }

  // ========================================================================
  // Point Accounting Breakdown
  // ========================================================================
  function renderPointBreakdown() {
    const pt = currentCharacter.getPointBreakdown();

    // Header chip
    const chip = document.getElementById("points-chip");
    document.getElementById("points-spent-text").textContent = pt.netSpent;
    document.getElementById("points-budget-text").textContent = pt.totalBudget;

    const remainingTag = document.getElementById("points-remaining-tag");
    if (pt.isOverBudget) {
      chip.className = "points-chip over-budget";
      remainingTag.textContent = `(${Math.abs(pt.remaining)} OVER!)`;
    } else {
      chip.className = "points-chip in-budget";
      remainingTag.textContent = `(${pt.remaining} left)`;
    }

    // Card breakdown
    document.getElementById("breakdown-stats-cp").textContent = `${pt.stats.total} CP`;
    document.getElementById("breakdown-attribs-cp").textContent = `${pt.attributesTotal} CP`;
    document.getElementById("breakdown-skills-cp").textContent = `${pt.skillGroupsTotal} CP`;
    document.getElementById("breakdown-defects-cp").textContent = `-${pt.defectsRefund} CP`;
    document.getElementById("breakdown-net-cp").textContent = `${pt.netSpent} CP`;
    document.getElementById("breakdown-budget-cp").textContent = `${pt.totalBudget} CP (${pt.baseBudget} base + ${pt.earnedXP} XP)`;
    
    const remEl = document.getElementById("breakdown-remaining-cp");
    remEl.textContent = `${pt.remaining} CP`;
    remEl.style.color = pt.isOverBudget ? "var(--color-danger)" : "var(--color-success)";
  }

  // ========================================================================
  // Attributes List Rendering & Interactions (Table 07)
  // ========================================================================
  function renderBuilderAttributes() {
    const container = document.getElementById("builder-attributes-list");
    container.innerHTML = "";

    if (currentCharacter.attributes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          No attributes added yet. Click "+ Add Attribute" to choose powers, combat arts, or defenses.
        </div>
      `;
      return;
    }

    currentCharacter.attributes.forEach(attr => {
      const totalCost = attr.level * attr.costPerLevel;
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <div class="item-name">
            ${escapeHtml(attr.name)}
            <span class="tag-pill">${escapeHtml(attr.category)}</span>
            <span class="rank-badge">Level ${attr.level} (${totalCost} CP)</span>
          </div>
          <div class="item-sub">${escapeHtml(attr.customDesc)}</div>
        </div>
        <div class="item-controls">
          <button class="stepper-btn btn-sm btn-attr-minus" data-id="${attr.id}" title="Decrease level">-</button>
          <button class="stepper-btn btn-sm btn-attr-plus" data-id="${attr.id}" title="Increase level">+</button>
          <button class="btn btn-danger btn-sm btn-attr-delete" data-id="${attr.id}" title="Remove attribute">✕</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll(".btn-attr-minus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const item = currentCharacter.attributes.find(a => a.id === id);
        if (item) {
          currentCharacter.updateAttributeLevel(id, item.level - 1);
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    container.querySelectorAll(".btn-attr-plus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const item = currentCharacter.attributes.find(a => a.id === id);
        if (item) {
          currentCharacter.updateAttributeLevel(id, item.level + 1);
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    container.querySelectorAll(".btn-attr-delete").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.removeAttribute(id);
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });
  }

  // ========================================================================
  // Skill Groups List Rendering & Interactions (BESM 4E p. 120-122)
  // ========================================================================
  function renderBuilderSkillGroups() {
    const container = document.getElementById("builder-skills-list");
    container.innerHTML = "";

    if (currentCharacter.skillGroups.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          No skill groups trained yet. Click "+ Add Skill Group" to add Background (1 CP), Field (2 CP), or Action (3 CP) groups.
        </div>
      `;
      return;
    }

    currentCharacter.skillGroups.forEach(sg => {
      const totalCost = sg.level * sg.costPerLevel;
      const tierBadge = sg.tier ? sg.tier.toUpperCase() : "SKILL";
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <div class="item-name">
            ${escapeHtml(sg.name)} Group
            <span class="tag-pill">${tierBadge} (${sg.costPerLevel} CP/lvl)</span>
            <span class="rank-badge">Level ${sg.level} (+${sg.level} roll bonus) [${totalCost} CP]</span>
          </div>
        </div>
        <div class="item-controls">
          <button class="stepper-btn btn-sm btn-sg-minus" data-id="${sg.id}">-</button>
          <button class="stepper-btn btn-sm btn-sg-plus" data-id="${sg.id}">+</button>
          <button class="btn btn-danger btn-sm btn-sg-delete" data-id="${sg.id}">✕</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll(".btn-sg-minus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const item = currentCharacter.skillGroups.find(s => s.id === id);
        if (item) {
          currentCharacter.updateSkillGroupLevel(id, item.level - 1);
          renderBuilderSkillGroups();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    container.querySelectorAll(".btn-sg-plus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const item = currentCharacter.skillGroups.find(s => s.id === id);
        if (item) {
          currentCharacter.updateSkillGroupLevel(id, item.level + 1);
          renderBuilderSkillGroups();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    container.querySelectorAll(".btn-sg-delete").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.removeSkillGroup(id);
        renderBuilderSkillGroups();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });
  }

  // ========================================================================
  // Defects List Rendering & Interactions (Table 14)
  // ========================================================================
  function renderBuilderDefects() {
    const container = document.getElementById("builder-defects-list");
    container.innerHTML = "";

    if (currentCharacter.defects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          No defects taken. Defects provide bonus Character Points (Lesser -1/rk, Greater -2/rk, Serious -3/rk).
        </div>
      `;
      return;
    }

    currentCharacter.defects.forEach(defect => {
      const refund = defect.rank * defect.refundPerRank;
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <div class="item-name">
            ${escapeHtml(defect.name)}
            <span class="tag-pill">${defect.category.toUpperCase()}</span>
            <span class="refund-badge">+${refund} CP Refund (Rank ${defect.rank})</span>
          </div>
          <div class="item-sub">${escapeHtml(defect.customDesc)}</div>
        </div>
        <div class="item-controls">
          <button class="stepper-btn btn-sm btn-defect-minus" data-id="${defect.id}">-</button>
          <button class="stepper-btn btn-sm btn-defect-plus" data-id="${defect.id}">+</button>
          <button class="btn btn-danger btn-sm btn-defect-delete" data-id="${defect.id}">✕</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll(".btn-defect-minus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const item = currentCharacter.defects.find(d => d.id === id);
        if (item) {
          currentCharacter.updateDefectRank(id, item.rank - 1);
          renderBuilderDefects();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    container.querySelectorAll(".btn-defect-plus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const item = currentCharacter.defects.find(d => d.id === id);
        if (item) {
          currentCharacter.updateDefectRank(id, item.rank + 1);
          renderBuilderDefects();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    container.querySelectorAll(".btn-defect-delete").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.removeDefect(id);
        renderBuilderDefects();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });
  }

  // ========================================================================
  // Weapons List Rendering & Interactions
  // ========================================================================
  function renderBuilderWeapons() {
    const container = document.getElementById("builder-weapons-list");
    container.innerHTML = "";

    if (currentCharacter.weapons.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          No custom attacks or weapons added yet. Click "+ Add Weapon / Attack" to add one.
        </div>
      `;
      return;
    }

    const derived = currentCharacter.getDerived();

    currentCharacter.weapons.forEach(w => {
      const isMelee = (w.range || "").toLowerCase().includes("melee");
      const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
      const baseDamage = w.level * dm;

      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <div class="item-name">
            ${escapeHtml(w.name)}
            <span class="tag-pill" style="color: var(--color-warning);">Base Damage: ${baseDamage} (Lvl ${w.level} × ${dm} DM)</span>
            <span class="tag-pill">${escapeHtml(w.range)}</span>
          </div>
          <div class="item-sub">Enhancements: ${escapeHtml(w.enhancements || "None")} | Limiters: ${escapeHtml(w.limiters || "None")}</div>
        </div>
        <div class="item-controls">
          <button class="btn btn-danger btn-sm btn-weapon-delete" data-id="${w.id}">✕</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll(".btn-weapon-delete").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.removeWeapon(id);
        renderBuilderWeapons();
        saveCurrentCharacter(true);
      });
    });
  }

  // Add Weapon Modal Handler
  function updateWeaponDamagePreview() {
    const lvl = parseInt(document.getElementById("weapon-level").value, 10) || 1;
    const type = document.getElementById("weapon-type").value;
    const derived = currentCharacter.getDerived();
    const dm = type === "melee" ? derived.meleeDamageMultiplier : derived.damageMultiplier;
    const dmg = lvl * dm;
    document.getElementById("weapon-damage-preview").value = `${dmg} Damage (Level ${lvl} × ${dm} DM)`;
  }

  document.getElementById("btn-add-weapon").addEventListener("click", () => {
    document.getElementById("weapon-name").value = "";
    document.getElementById("weapon-level").value = "2";
    document.getElementById("weapon-type").value = "ranged";
    document.getElementById("weapon-range").value = "25m";
    document.getElementById("weapon-tags").value = "Armour-Piercing";
    updateWeaponDamagePreview();
    openModal("modal-add-weapon");
  });

  document.getElementById("weapon-level").addEventListener("input", updateWeaponDamagePreview);
  document.getElementById("weapon-type").addEventListener("change", (e) => {
    if (e.target.value === "melee") {
      document.getElementById("weapon-range").value = "Melee";
    } else {
      document.getElementById("weapon-range").value = "25m";
    }
    updateWeaponDamagePreview();
  });

  document.getElementById("btn-save-weapon").addEventListener("click", () => {
    const name = document.getElementById("weapon-name").value.trim();
    if (!name) {
      alert("Please enter a weapon or attack name.");
      return;
    }
    const level = parseInt(document.getElementById("weapon-level").value, 10) || 1;
    const range = document.getElementById("weapon-range").value.trim() || "Melee";
    const tags = document.getElementById("weapon-tags").value.trim() || "None";

    currentCharacter.addWeapon({
      name,
      level,
      range,
      enhancements: tags,
      limiters: "None",
      notes: ""
    });

    renderBuilderWeapons();
    saveCurrentCharacter(true);
    closeModal("modal-add-weapon");
    showToast(`Added attack "${name}"`);
  });

  // ========================================================================
  // Catalog Modals: Add Attribute, Skill Group, Defect
  // ========================================================================

  // 1. Add Attribute Modal (Table 07)
  document.getElementById("btn-add-attribute").addEventListener("click", () => {
    renderAttributeCatalog();
    openModal("modal-add-attribute");
  });

  document.getElementById("attr-category-filters").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("attr-category-filters").querySelectorAll("button").forEach(b => b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
      currentAttrFilter = btn.getAttribute("data-cat");
      renderAttributeCatalog();
    });
  });

  document.getElementById("attr-search").addEventListener("input", renderAttributeCatalog);

  function renderAttributeCatalog() {
    const listEl = document.getElementById("attr-catalog-list");
    listEl.innerHTML = "";
    const query = document.getElementById("attr-search").value.toLowerCase().trim();

    const filtered = BESM4E_RULES.attributes.filter(a => {
      const matchCat = currentAttrFilter === "all" || a.category === currentAttrFilter;
      const matchText = a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query);
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No matching standard attributes found.</div>`;
      return;
    }

    filtered.forEach(attr => {
      const card = document.createElement("div");
      card.className = "catalog-item-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(attr.name)}</strong>
          <span class="tag-pill" style="color: var(--accent-primary);">${attr.costPerLevel} CP / Level</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${escapeHtml(attr.description)}</div>
      `;
      card.addEventListener("click", () => {
        currentCharacter.addAttribute(attr, 1);
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
        closeModal("modal-add-attribute");
        showToast(`Added "${attr.name}"`);
      });
      listEl.appendChild(card);
    });
  }

  // Custom Attribute creation
  document.getElementById("btn-save-custom-attr").addEventListener("click", () => {
    const name = document.getElementById("custom-attr-name").value.trim();
    if (!name) {
      alert("Please enter a custom attribute name.");
      return;
    }
    const cost = parseInt(document.getElementById("custom-attr-cost").value, 10) || 2;
    const rank = parseInt(document.getElementById("custom-attr-rank").value, 10) || 1;
    const desc = document.getElementById("custom-attr-desc").value.trim();

    currentCharacter.addAttribute({
      id: "custom_" + Date.now(),
      name,
      category: "supernatural",
      costPerLevel: cost,
      maxLevel: 10,
      description: desc
    }, rank, name, desc);

    renderBuilderAttributes();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
    closeModal("modal-add-attribute");
    showToast(`Added custom attribute "${name}"`);
  });

  // 2. Add Skill Group Modal (BESM 4E p. 120-122)
  document.getElementById("btn-add-skill").addEventListener("click", () => {
    renderSkillCatalog();
    openModal("modal-add-skill");
  });

  document.getElementById("skill-tier-filters").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("skill-tier-filters").querySelectorAll("button").forEach(b => b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
      currentSkillTierFilter = btn.getAttribute("data-tier");
      renderSkillCatalog();
    });
  });

  document.getElementById("skill-search").addEventListener("input", renderSkillCatalog);

  function renderSkillCatalog() {
    const listEl = document.getElementById("skill-catalog-list");
    listEl.innerHTML = "";
    const query = document.getElementById("skill-search").value.toLowerCase().trim();

    const filtered = BESM4E_RULES.skillGroups.filter(s => {
      const matchTier = currentSkillTierFilter === "all" || s.tier === currentSkillTierFilter;
      const matchText = s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query);
      return matchTier && matchText;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No matching standard skill groups found.</div>`;
      return;
    }

    filtered.forEach(sg => {
      const card = document.createElement("div");
      card.className = "catalog-item-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(sg.name)} Group</strong>
          <span class="tag-pill" style="color: var(--accent-primary);">${sg.tier.toUpperCase()} • ${sg.costPerLevel} CP/Level</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${escapeHtml(sg.description)}</div>
      `;
      card.addEventListener("click", () => {
        currentCharacter.addSkillGroup(sg, 1);
        renderBuilderSkillGroups();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
        closeModal("modal-add-skill");
        showToast(`Added ${sg.name} Skill Group`);
      });
      listEl.appendChild(card);
    });
  }

  // Custom Skill Group creation
  document.getElementById("btn-save-custom-skill").addEventListener("click", () => {
    const name = document.getElementById("custom-skill-name").value.trim();
    if (!name) {
      alert("Please enter a custom skill group name.");
      return;
    }
    const tier = document.getElementById("custom-skill-tier").value;
    const rank = parseInt(document.getElementById("custom-skill-rank").value, 10) || 1;
    const desc = document.getElementById("custom-skill-desc").value.trim();
    const costPerLevel = tier === "background" ? 1 : (tier === "field" ? 2 : 3);

    currentCharacter.addSkillGroup({
      id: "custom_sg_" + Date.now(),
      name,
      tier,
      costPerLevel,
      maxLevel: 6,
      description: desc
    }, rank);

    renderBuilderSkillGroups();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
    closeModal("modal-add-skill");
    showToast(`Added custom skill group "${name}"`);
  });

  // 3. Add Defect Modal (Table 14)
  document.getElementById("btn-add-defect").addEventListener("click", () => {
    renderDefectCatalog();
    openModal("modal-add-defect");
  });

  document.getElementById("defect-category-filters").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("defect-category-filters").querySelectorAll("button").forEach(b => b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
      currentDefectFilter = btn.getAttribute("data-cat");
      renderDefectCatalog();
    });
  });

  document.getElementById("defect-search").addEventListener("input", renderDefectCatalog);

  function renderDefectCatalog() {
    const listEl = document.getElementById("defect-catalog-list");
    listEl.innerHTML = "";
    const query = document.getElementById("defect-search").value.toLowerCase().trim();

    const filtered = BESM4E_RULES.defects.filter(d => {
      const matchCat = currentDefectFilter === "all" || d.category === currentDefectFilter;
      const matchText = d.name.toLowerCase().includes(query) || d.description.toLowerCase().includes(query);
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No matching standard defects found.</div>`;
      return;
    }

    filtered.forEach(defect => {
      const card = document.createElement("div");
      card.className = "catalog-item-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(defect.name)}</strong>
          <span class="refund-badge">${defect.category.toUpperCase()} • +${defect.refundPerRank} CP / Rank</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${escapeHtml(defect.description)}</div>
      `;
      card.addEventListener("click", () => {
        currentCharacter.addDefect(defect, 1);
        renderBuilderDefects();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
        closeModal("modal-add-defect");
        showToast(`Added defect "${defect.name}"`);
      });
      listEl.appendChild(card);
    });
  }

  // Custom Defect creation
  document.getElementById("btn-save-custom-defect").addEventListener("click", () => {
    const name = document.getElementById("custom-defect-name").value.trim();
    if (!name) {
      alert("Please enter a custom defect name.");
      return;
    }
    const cat = document.getElementById("custom-defect-category").value;
    const rank = parseInt(document.getElementById("custom-defect-rank").value, 10) || 1;
    const desc = document.getElementById("custom-defect-desc").value.trim();
    const refundPerRank = cat === "lesser" ? 1 : (cat === "greater" ? 2 : 3);

    currentCharacter.addDefect({
      id: "custom_def_" + Date.now(),
      name,
      category: cat,
      refundPerRank,
      maxRank: 3,
      description: desc
    }, rank, desc);

    renderBuilderDefects();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
    closeModal("modal-add-defect");
    showToast(`Added custom defect "${name}"`);
  });

  // ========================================================================
  // Template / Archetype Loader Modal
  // ========================================================================
  document.getElementById("btn-load-template").addEventListener("click", () => {
    renderTemplateCatalog();
    openModal("modal-templates");
  });

  function renderTemplateCatalog() {
    const listEl = document.getElementById("template-catalog-list");
    listEl.innerHTML = "";

    (BESM4E_RULES.templates || []).forEach(tmpl => {
      const card = document.createElement("div");
      card.className = "catalog-item-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <strong style="color: var(--text-main); font-size: 1rem;">${escapeHtml(tmpl.name)}</strong>
          <span class="tag-pill" style="color: var(--accent-primary);">${tmpl.tier.toUpperCase()} (${tmpl.points} CP)</span>
        </div>
        <div style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.5rem;">${escapeHtml(tmpl.concept)}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">
          Stats: Body ${tmpl.stats.body}, Mind ${tmpl.stats.mind}, Soul ${tmpl.stats.soul}
        </div>
      `;
      card.addEventListener("click", () => {
        if (confirm(`Load the "${tmpl.name}" archetype preset? This will overwrite the current sheet's stats, attributes, skill groups, and defects.`)) {
          currentCharacter.loadTemplate(tmpl.id);
          saveCurrentCharacter(true);
          refreshAll();
          closeModal("modal-templates");
          showToast(`Loaded archetype "${tmpl.name}"`);
        }
      });
      listEl.appendChild(card);
    });
  }

  // ========================================================================
  // Printable Character Sheet Rendering
  // ========================================================================
  function renderPrintSheet() {
    const container = document.getElementById("print-sheet-content");
    if (!container || !currentCharacter) return;

    const derived = currentCharacter.getDerived();
    const pt = currentCharacter.getPointBreakdown();

    let html = `
      <div class="sheet-header-grid">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem;">
            ${escapeHtml(currentCharacter.name || "Untitled Character")}
          </h1>
          <div style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">
            ${escapeHtml(currentCharacter.concept || "No Concept Specified")}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.25rem;">
            Player: ${escapeHtml(currentCharacter.player || "N/A")} | Campaign: ${escapeHtml(currentCharacter.campaign || "N/A")}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-primary);">
            BESM 4TH EDITION
          </div>
          <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">
            Power Level: ${currentCharacter.tier} (${pt.totalBudget} CP Budget)
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Points Spent: ${pt.netSpent} CP | Unspent: ${pt.remaining} CP
          </div>
        </div>
      </div>

      <!-- Core Stats Row -->
      <div class="sheet-stats-row">
        <div class="sheet-stat-box" style="border-color: var(--color-body);">
          <div class="sheet-stat-title" style="color: var(--color-body);">BODY</div>
          <div class="sheet-stat-num" style="color: var(--color-body);">${currentCharacter.stats.body}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${currentCharacter.calculateStatCost(currentCharacter.stats.body)} CP • Strength & Agility</div>
        </div>
        <div class="sheet-stat-box" style="border-color: var(--color-mind);">
          <div class="sheet-stat-title" style="color: var(--color-mind);">MIND</div>
          <div class="sheet-stat-num" style="color: var(--color-mind);">${currentCharacter.stats.mind}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${currentCharacter.calculateStatCost(currentCharacter.stats.mind)} CP • Intellect & Tactics</div>
        </div>
        <div class="sheet-stat-box" style="border-color: var(--color-soul);">
          <div class="sheet-stat-title" style="color: var(--color-soul);">SOUL</div>
          <div class="sheet-stat-num" style="color: var(--color-soul);">${currentCharacter.stats.soul}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${currentCharacter.calculateStatCost(currentCharacter.stats.soul)} CP • Spirit & Willpower</div>
        </div>
      </div>

      <!-- Derived & Combat Stats Grid -->
      <div class="sheet-derived-grid">
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">COMBAT VALUE (CV)</div>
          <div style="font-size: 1.4rem; font-weight: 800;">${derived.baseCV}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">ATTACK CV (ACV)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">${derived.acv}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">DEFENCE CV (DCV)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">${derived.dcv}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">HEALTH (HP)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-health);">${currentCharacter.currentHealth} / ${derived.maxHealth}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">ENERGY (EP)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-energy);">${currentCharacter.currentEnergy} / ${derived.maxEnergy}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">DAMAGE MULT (DM)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-warning);">${derived.damageMultiplier} (${derived.meleeDamageMultiplier} Melee)</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">ARMOUR RATING (AR)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">${derived.armorRating}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">SHOCK THRESHOLD</div>
          <div style="font-size: 1.4rem; font-weight: 800;">${derived.shockThreshold}</div>
        </div>
      </div>

      <!-- Attributes Table -->
      <div class="sheet-section-title">Attributes & Powers (${pt.attributesTotal} CP)</div>
      <table class="sheet-table">
        <thead>
          <tr>
            <th style="width: 28%;">Attribute</th>
            <th style="width: 12%;">Level</th>
            <th style="width: 10%;">Cost</th>
            <th>Effect & Details</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (currentCharacter.attributes.length === 0) {
      html += `<tr><td colspan="4" style="color: var(--text-dim); text-align: center;">No attributes selected.</td></tr>`;
    } else {
      currentCharacter.attributes.forEach(a => {
        html += `
          <tr>
            <td><strong>${escapeHtml(a.name)}</strong></td>
            <td>Level ${a.level}</td>
            <td>${a.level * a.costPerLevel} CP</td>
            <td>${escapeHtml(a.customDesc)}</td>
          </tr>
        `;
      });
    }

    html += `
        </tbody>
      </table>

      <!-- Skill Groups Table -->
      <div class="sheet-section-title">Skill Groups (${pt.skillGroupsTotal} CP)</div>
      <table class="sheet-table">
        <thead>
          <tr>
            <th style="width: 30%;">Skill Group</th>
            <th style="width: 20%;">Tier</th>
            <th style="width: 15%;">Roll Bonus</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (currentCharacter.skillGroups.length === 0) {
      html += `<tr><td colspan="4" style="color: var(--text-dim); text-align: center;">No skill groups learned.</td></tr>`;
    } else {
      currentCharacter.skillGroups.forEach(s => {
        html += `
          <tr>
            <td><strong>${escapeHtml(s.name)} Group</strong></td>
            <td>${escapeHtml((s.tier || "field").toUpperCase())}</td>
            <td>+${s.level}</td>
            <td>${s.level * s.costPerLevel} CP</td>
          </tr>
        `;
      });
    }

    html += `
        </tbody>
      </table>

      <!-- Defects Table -->
      <div class="sheet-section-title">Defects & Hindrances (+${pt.defectsRefund} CP Refund)</div>
      <table class="sheet-table">
        <thead>
          <tr>
            <th style="width: 35%;">Defect</th>
            <th style="width: 15%;">Refund</th>
            <th>Drawback & Penalty Details</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (currentCharacter.defects.length === 0) {
      html += `<tr><td colspan="3" style="color: var(--text-dim); text-align: center;">No defects taken.</td></tr>`;
    } else {
      currentCharacter.defects.forEach(d => {
        html += `
          <tr>
            <td><strong>${escapeHtml(d.name)}</strong></td>
            <td>+${d.rank * d.refundPerRank} CP (Rank ${d.rank})</td>
            <td>${escapeHtml(d.customDesc)}</td>
          </tr>
        `;
      });
    }

    html += `
        </tbody>
      </table>
    `;

    // Weapons Table
    if (currentCharacter.weapons.length > 0) {
      html += `
        <div class="sheet-section-title">Weapons & Attacks</div>
        <table class="sheet-table">
          <thead>
            <tr>
              <th style="width: 25%;">Weapon</th>
              <th style="width: 12%;">Level</th>
              <th style="width: 18%;">Base Damage</th>
              <th style="width: 15%;">Range</th>
              <th>Properties & Tags</th>
            </tr>
          </thead>
          <tbody>
      `;
      currentCharacter.weapons.forEach(w => {
        const isMelee = (w.range || "").toLowerCase().includes("melee");
        const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
        const dmg = w.level * dm;
        html += `
          <tr>
            <td><strong>${escapeHtml(w.name)}</strong></td>
            <td>Level ${w.level}</td>
            <td><strong>${dmg}</strong> (${w.level} × ${dm} DM)</td>
            <td>${escapeHtml(w.range)}</td>
            <td>Enhancements: ${escapeHtml(w.enhancements || "None")}</td>
          </tr>
        `;
      });
      html += `
          </tbody>
        </table>
      `;
    }

    // Equipment & Gear
    if (currentCharacter.gear) {
      html += `
        <div class="sheet-section-title">Equipment & Possessions</div>
        <div style="font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.25rem;">
          ${escapeHtml(currentCharacter.gear).replace(/\n/g, "<br>")}
        </div>
      `;
    }

    // Background & Notes
    if (currentCharacter.backstory || currentCharacter.appearance || currentCharacter.alliesEnemies) {
      html += `
        <div class="sheet-section-title">Character Background & Narrative</div>
        <div style="font-size: 0.825rem; line-height: 1.5; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
          <div>
            ${currentCharacter.appearance ? `<strong>Appearance:</strong><p style="margin-bottom: 0.5rem;">${escapeHtml(currentCharacter.appearance)}</p>` : ""}
            ${currentCharacter.alliesEnemies ? `<strong>Allies & Enemies:</strong><p>${escapeHtml(currentCharacter.alliesEnemies)}</p>` : ""}
          </div>
          <div>
            ${currentCharacter.backstory ? `<strong>Background:</strong><p>${escapeHtml(currentCharacter.backstory)}</p>` : ""}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  document.getElementById("btn-print-sheet").addEventListener("click", () => {
    renderPrintSheet();
    window.print();
  });

  document.getElementById("btn-copy-markdown").addEventListener("click", () => {
    const md = BESM4EStorage.generateMarkdown(currentCharacter);
    navigator.clipboard.writeText(md).then(() => {
      showToast("📋 Character sheet copied as Markdown!");
    }).catch(() => {
      alert("Failed to copy automatically. Please export via Backup/Share modal.");
    });
  });

  // ========================================================================
  // Live Play Mode (Vitals, Damage, Armor, Conditions, Quick Rolls)
  // ========================================================================
  function renderPlayMode() {
    if (!currentCharacter) return;
    const derived = currentCharacter.getDerived();

    // Vitals
    document.getElementById("play-hp-text").textContent = `${currentCharacter.currentHealth} / ${derived.maxHealth} HP`;
    const hpPct = derived.maxHealth > 0 ? Math.max(0, Math.min(100, (currentCharacter.currentHealth / derived.maxHealth) * 100)) : 100;
    const hpBar = document.getElementById("play-hp-bar");
    hpBar.style.width = `${hpPct}%`;
    if (hpPct <= 30) {
      hpBar.classList.add("low");
    } else {
      hpBar.classList.remove("low");
    }

    document.getElementById("play-ep-text").textContent = `${currentCharacter.currentEnergy} / ${derived.maxEnergy} EP`;
    const epPct = derived.maxEnergy > 0 ? Math.max(0, Math.min(100, (currentCharacter.currentEnergy / derived.maxEnergy) * 100)) : 100;
    document.getElementById("play-ep-bar").style.width = `${epPct}%`;

    // Armour Rating
    document.getElementById("play-ar-text").textContent = derived.armorRating;

    // Conditions
    const condContainer = document.getElementById("conditions-container");
    condContainer.innerHTML = "";
    CONDITIONS.forEach(cond => {
      const isActive = currentCharacter.conditions.includes(cond.id);
      const btn = document.createElement("button");
      btn.className = `btn btn-sm ${isActive ? "btn-danger" : "btn-secondary"}`;
      btn.textContent = `${isActive ? "✓ " : ""}${cond.label}`;
      btn.title = cond.desc;
      btn.addEventListener("click", () => {
        if (isActive) {
          currentCharacter.conditions = currentCharacter.conditions.filter(c => c !== cond.id);
        } else {
          currentCharacter.conditions.push(cond.id);
        }
        saveCurrentCharacter(true);
        renderPlayMode();
      });
      condContainer.appendChild(btn);
    });

    // Session Notes
    document.getElementById("play-session-notes").value = currentCharacter.sessionNotes || "";

    // Quick Roll Modifiers
    document.getElementById("play-roll-body-mod").textContent = currentCharacter.stats.body;
    document.getElementById("play-roll-mind-mod").textContent = currentCharacter.stats.mind;
    document.getElementById("play-roll-soul-mod").textContent = currentCharacter.stats.soul;
    document.getElementById("play-roll-attack-mod").textContent = derived.acv;
    document.getElementById("play-roll-defence-mod").textContent = derived.dcv;

    // Quick Skill Groups Roll Grid
    const skillsGrid = document.getElementById("play-skills-grid");
    skillsGrid.innerHTML = "";
    if (currentCharacter.skillGroups.length === 0) {
      skillsGrid.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-dim); grid-column: span 2;">No skill groups configured.</div>`;
    } else {
      currentCharacter.skillGroups.forEach(sg => {
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary btn-sm quick-roll-btn";
        btn.textContent = `${sg.name} (+${sg.level})`;
        btn.addEventListener("click", () => {
          triggerRoll({
            label: `${sg.name} Skill Check`,
            modifier: sg.level,
            targetNumber: 10
          });
        });
        skillsGrid.appendChild(btn);
      });
    }
  }

  // Health Quick Controls
  document.getElementById("btn-dmg-1").addEventListener("click", () => {
    currentCharacter.applyDamage(1, true);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-dmg-5").addEventListener("click", () => {
    currentCharacter.applyDamage(5, true);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-dmg-10").addEventListener("click", () => {
    currentCharacter.applyDamage(10, true);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-heal-1").addEventListener("click", () => {
    currentCharacter.applyHealing(1);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-heal-5").addEventListener("click", () => {
    currentCharacter.applyHealing(5);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-heal-10").addEventListener("click", () => {
    currentCharacter.applyHealing(10);
    saveCurrentCharacter(true);
    renderPlayMode();
  });

  // Incoming Attack Resolver
  document.getElementById("btn-resolve-damage").addEventListener("click", () => {
    const dmg = parseInt(document.getElementById("play-incoming-dmg").value, 10);
    if (isNaN(dmg) || dmg < 0) return;
    const res = currentCharacter.applyDamage(dmg, false);
    saveCurrentCharacter(true);
    renderPlayMode();

    let msg = `Incoming ${dmg} DMG. Armour absorbed ${res.absorbedByArmor}. ${res.damageDealt} dealt to Health.`;
    if (res.isShocked) msg += " ⚠️ SHOCK THRESHOLD EXCEEDED!";
    if (res.isIncapacitated) msg += " 💀 INCAPACITATED!";
    document.getElementById("play-dmg-feedback").textContent = msg;
    showToast(msg, 3500);
  });

  document.getElementById("btn-bypass-damage").addEventListener("click", () => {
    const dmg = parseInt(document.getElementById("play-incoming-dmg").value, 10);
    if (isNaN(dmg) || dmg < 0) return;
    const res = currentCharacter.applyDamage(dmg, true);
    saveCurrentCharacter(true);
    renderPlayMode();
    const msg = `Armour bypassed! ${res.damageDealt} dealt to Health.`;
    document.getElementById("play-dmg-feedback").textContent = msg;
    showToast(msg, 3000);
  });

  // Energy Controls
  document.getElementById("btn-ep-spend-1").addEventListener("click", () => {
    currentCharacter.spendEnergy(1);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-ep-spend-5").addEventListener("click", () => {
    currentCharacter.spendEnergy(5);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-ep-spend-10").addEventListener("click", () => {
    if (currentCharacter.spendEnergy(10)) {
      saveCurrentCharacter(true);
      renderPlayMode();
      showToast("⚡ Dramatic Feat: Spent 10 EP (+1 roll bonus)!");
    } else {
      alert("Not enough Energy Points to spend 10 EP.");
    }
  });
  document.getElementById("btn-ep-recover-5").addEventListener("click", () => {
    currentCharacter.restoreEnergy(5);
    saveCurrentCharacter(true);
    renderPlayMode();
  });
  document.getElementById("btn-ep-recover-max").addEventListener("click", () => {
    const derived = currentCharacter.getDerived();
    currentCharacter.currentEnergy = derived.maxEnergy;
    saveCurrentCharacter(true);
    renderPlayMode();
    showToast("Energy restored to maximum!");
  });

  document.getElementById("btn-play-full-rest").addEventListener("click", () => {
    if (confirm("Take a Full Rest? This fully recovers Health, Energy, and clears conditions.")) {
      currentCharacter.fullRest();
      saveCurrentCharacter(true);
      renderPlayMode();
      showToast("Full Rest: Health and Energy restored!");
    }
  });

  document.getElementById("play-session-notes").addEventListener("input", (e) => {
    currentCharacter.sessionNotes = e.target.value;
    saveCurrentCharacter(true);
  });

  // Quick Roll Buttons in Play Mode
  document.getElementById("btn-roll-body").addEventListener("click", () => {
    triggerRoll({ label: "Body Stat Check", modifier: currentCharacter.stats.body, targetNumber: 10 });
  });
  document.getElementById("btn-roll-mind").addEventListener("click", () => {
    triggerRoll({ label: "Mind Stat Check", modifier: currentCharacter.stats.mind, targetNumber: 10 });
  });
  document.getElementById("btn-roll-soul").addEventListener("click", () => {
    triggerRoll({ label: "Soul Stat Check", modifier: currentCharacter.stats.soul, targetNumber: 10 });
  });
  document.getElementById("btn-roll-attack").addEventListener("click", () => {
    const d = currentCharacter.getDerived();
    triggerRoll({ label: "Attack Combat Check", modifier: d.acv, targetNumber: 10 });
  });
  document.getElementById("btn-roll-defence").addEventListener("click", () => {
    const d = currentCharacter.getDerived();
    triggerRoll({ label: "Defence Combat Check", modifier: d.dcv, targetNumber: 10 });
  });

  // ========================================================================
  // Advancement & XP Management (Character Updater)
  // ========================================================================
  function renderAdvancement() {
    if (!currentCharacter) return;
    const pt = currentCharacter.getPointBreakdown();

    document.getElementById("adv-base-budget").textContent = `${pt.baseBudget} CP`;
    document.getElementById("adv-earned-xp").textContent = `${currentCharacter.earnedXP} XP`;
    document.getElementById("adv-available-xp").textContent = `${pt.remaining} XP`;

    const tbody = document.getElementById("adv-log-tbody");
    tbody.innerHTML = "";

    if (currentCharacter.advancementLog.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="color: var(--text-dim); text-align: center; padding: 1rem;">No history log yet.</td></tr>`;
      return;
    }

    currentCharacter.advancementLog.forEach(log => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
      tr.innerHTML = `
        <td style="padding: 0.4rem 0.5rem; color: var(--text-muted); font-size: 0.75rem;">${escapeHtml(log.date)}</td>
        <td style="padding: 0.4rem 0.5rem; font-weight: 600;">${escapeHtml(log.action)}</td>
        <td style="padding: 0.4rem 0.5rem; color: ${log.xpChange > 0 ? "var(--color-warning)" : "var(--text-muted)"};">
          ${log.xpChange !== 0 ? (log.xpChange > 0 ? `+${log.xpChange}` : `${log.xpChange}`) : "--"}
        </td>
        <td style="padding: 0.4rem 0.5rem; color: var(--text-muted);">${escapeHtml(log.notes)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById("btn-award-xp").addEventListener("click", () => {
    const amount = parseInt(document.getElementById("adv-xp-amount").value, 10);
    const reason = document.getElementById("adv-xp-reason").value.trim() || "Session reward";
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a positive XP amount.");
      return;
    }
    currentCharacter.addXP(amount, reason);
    document.getElementById("adv-xp-reason").value = "";
    saveCurrentCharacter(true);
    renderAdvancement();
    renderPointBreakdown();
    showToast(`Awarded ${amount} XP to ${currentCharacter.name || "character"}!`);
  });

  document.getElementById("btn-add-log-entry").addEventListener("click", () => {
    const note = prompt("Enter a milestone or journal note for this character:");
    if (note && note.trim()) {
      currentCharacter.recordAdvancement("Journal Milestone", 0, note.trim());
      saveCurrentCharacter(true);
      renderAdvancement();
    }
  });

  // ========================================================================
  // Interactive Dice Roller Drawer & Trigger
  // ========================================================================
  document.getElementById("btn-toggle-roller").addEventListener("click", () => {
    openModal("dice-roller-drawer");
  });
  document.getElementById("btn-close-roller").addEventListener("click", () => {
    closeModal("dice-roller-drawer");
  });

  // Mode Selection
  document.querySelectorAll(".roll-modes .mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".roll-modes .mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentRollMode = btn.getAttribute("data-mode");
    });
  });

  function triggerRoll(options = {}) {
    if (options.label) document.getElementById("roller-label").value = options.label;
    if (typeof options.modifier === "number") document.getElementById("roller-modifier").value = options.modifier;
    if (options.targetNumber) document.getElementById("roller-target").value = options.targetNumber;
    document.getElementById("roller-dramatic-feat").value = "0";
    openModal("dice-roller-drawer");
    executeDiceRoll();
  }

  function executeDiceRoll() {
    const label = document.getElementById("roller-label").value || "Action Check";
    const modifier = parseInt(document.getElementById("roller-modifier").value, 10) || 0;
    const dramaticFeatBonus = parseInt(document.getElementById("roller-dramatic-feat").value, 10) || 0;
    const targetVal = document.getElementById("roller-target").value;
    const targetNumber = targetVal ? parseInt(targetVal, 10) : null;

    // Deduct EP if dramatic feat used
    if (dramaticFeatBonus > 0 && currentCharacter) {
      const epCost = dramaticFeatBonus * 10;
      if (currentCharacter.currentEnergy >= epCost) {
        currentCharacter.spendEnergy(epCost);
        saveCurrentCharacter(true);
        renderPlayMode();
        showToast(`Spent ${epCost} EP on Dramatic Feat (+${dramaticFeatBonus} bonus)`);
      } else {
        alert(`Not enough Energy Points! Requires ${epCost} EP.`);
        return;
      }
    }

    const result = roller.roll({
      label,
      mode: currentRollMode,
      modifier,
      dramaticFeatBonus,
      targetNumber
    });

    renderRollResult(result);
  }

  document.getElementById("btn-execute-roll").addEventListener("click", executeDiceRoll);

  function renderRollResult(result) {
    const diceGroup = document.getElementById("roller-dice-group");
    diceGroup.innerHTML = "";

    result.diceRolls.forEach(d => {
      const box = document.createElement("div");
      let classes = "die-box ";
      if (d.isKept) {
        classes += "kept ";
        if (result.isCriticalSuccess) classes += "crit-success ";
        if (result.isCriticalFumble) classes += "crit-fumble ";
      } else {
        classes += "discarded ";
      }
      box.className = classes;
      box.textContent = d.val;
      diceGroup.appendChild(box);
    });

    const totalEl = document.getElementById("roller-total-display");
    const modStr = result.modifier !== 0 ? (result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`) : "";
    totalEl.textContent = `${result.total} (${result.diceSum}${modStr})`;

    const evalBadge = document.getElementById("roller-eval-badge");
    if (result.isCriticalSuccess) {
      evalBadge.style.display = "inline-block";
      evalBadge.className = "roll-eval-badge success";
      evalBadge.textContent = "CRITICAL TRIUMPH! (Natural 12)";
    } else if (result.isCriticalFumble) {
      evalBadge.style.display = "inline-block";
      evalBadge.className = "roll-eval-badge failure";
      evalBadge.textContent = "CRITICAL FUMBLE! (Natural 2)";
    } else if (result.targetNumber !== null) {
      evalBadge.style.display = "inline-block";
      if (result.success) {
        evalBadge.className = "roll-eval-badge success";
        evalBadge.textContent = `SUCCESS vs ${result.difficultyLabel} (+${result.margin} margin)`;
      } else {
        evalBadge.className = "roll-eval-badge failure";
        evalBadge.textContent = `FAILED vs ${result.difficultyLabel} (${result.margin} margin)`;
      }
    } else {
      evalBadge.style.display = "none";
    }

    renderRollHistory();
  }

  function renderRollHistory() {
    const container = document.getElementById("roller-history-list");
    container.innerHTML = "";
    roller.history.forEach(h => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.fontSize = "0.75rem";
      row.style.padding = "0.25rem 0.5rem";
      row.style.background = "var(--bg-card)";
      row.style.borderRadius = "var(--radius-sm)";

      let evalText = "";
      if (h.isCriticalSuccess) evalText = " [TRIUMPH]";
      else if (h.isCriticalFumble) evalText = " [FUMBLE]";
      else if (h.targetNumber) evalText = h.success ? " [SUCCESS]" : " [FAIL]";

      row.innerHTML = `
        <span style="color: var(--text-muted);">${escapeHtml(h.label)}</span>
        <strong>${h.total}${evalText}</strong>
      `;
      container.appendChild(row);
    });
  }

  document.getElementById("btn-clear-roll-history").addEventListener("click", () => {
    roller.clearHistory();
    renderRollHistory();
  });

  // ========================================================================
  // JSON Backup / Share Modal
  // ========================================================================
  document.getElementById("btn-export-import").addEventListener("click", () => {
    openModal("modal-backup");
  });

  document.getElementById("btn-download-json").addEventListener("click", () => {
    saveCurrentCharacter(true);
    BESM4EStorage.downloadJSON(currentCharacter);
    showToast("Downloaded character JSON");
  });

  document.getElementById("import-json-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const imported = new BESM4ECharacter(parsed);
        BESM4EStorage.saveCharacter(imported);
        currentCharacter = imported;
        refreshAll();
        closeModal("modal-backup");
        showToast(`Successfully imported "${imported.name || "character"}"!`);
      } catch (err) {
        alert("Failed to parse JSON file. Please ensure it is a valid BESM 4E character file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("btn-import-json-text").addEventListener("click", () => {
    const text = document.getElementById("import-json-text").value.trim();
    if (!text) {
      alert("Please paste JSON text first.");
      return;
    }
    try {
      const parsed = JSON.parse(text);
      const imported = new BESM4ECharacter(parsed);
      BESM4EStorage.saveCharacter(imported);
      currentCharacter = imported;
      refreshAll();
      closeModal("modal-backup");
      showToast(`Successfully imported "${imported.name || "character"}"!`);
    } catch (err) {
      alert("Invalid JSON format. Error: " + err.message);
    }
  });

  // ========================================================================
  // Utility: HTML Sanitizer
  // ========================================================================
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ========================================================================
  // Refresh Application State
  // ========================================================================
  function refreshAll() {
    populateBuilderForm();
    renderPrintSheet();
    renderPlayMode();
    renderAdvancement();
  }

  // Initial Boot
  populateCharacterDropdown();
  refreshAll();
});
