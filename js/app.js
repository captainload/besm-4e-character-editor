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
  // Container Context Targeting (Item, Companion, Minions, Alternate Form)
  // ========================================================================
  let activeContainerTarget = null;

  function setActiveContainerTarget(attrId) {
    activeContainerTarget = attrId;
    updateModalContainerBanners();
  }

  function clearActiveContainerTarget() {
    activeContainerTarget = null;
    updateModalContainerBanners();
  }

  function updateModalContainerBanners() {
    const banners = [
      document.getElementById("attr-modal-container-banner"),
      document.getElementById("skill-modal-container-banner"),
      document.getElementById("defect-modal-container-banner"),
      document.getElementById("weapon-modal-container-banner")
    ];

    if (!activeContainerTarget) {
      banners.forEach(b => {
        if (b) {
          b.style.display = "none";
          b.innerHTML = "";
        }
      });
      return;
    }

    const container = currentCharacter.getContainerAttribute(activeContainerTarget);
    if (!container) {
      activeContainerTarget = null;
      banners.forEach(b => {
        if (b) {
          b.style.display = "none";
          b.innerHTML = "";
        }
      });
      return;
    }

    const cType = (container.containerType || "container").toUpperCase();
    banners.forEach(b => {
      if (b) {
        b.style.display = "flex";
        b.innerHTML = `
          <div>
            <span>📦 Adding trait to container: <strong>${escapeHtml(container.name)}</strong> <span class="tag-pill">${cType}</span></span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm btn-cancel-container-target" style="padding: 0.2rem 0.5rem; font-size: 12pt;">
            ✕ Add to Character Instead
          </button>
        `;
        const cancelBtn = b.querySelector(".btn-cancel-container-target");
        if (cancelBtn) {
          cancelBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            clearActiveContainerTarget();
          });
        }
      }
    });
  }

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
    const totalSkillsCP = pt.skillGroupsTotal + (pt.skillsTotal || 0);
    document.getElementById("breakdown-skills-cp").textContent = `${totalSkillsCP} CP`;
    document.getElementById("breakdown-defects-cp").textContent = `-${pt.defectsRefund} CP`;
    document.getElementById("breakdown-net-cp").textContent = `${pt.netSpent} CP`;
    document.getElementById("breakdown-budget-cp").textContent = `${pt.totalBudget} CP (${pt.baseBudget} base + ${pt.earnedXP} XP)`;
    
    const remEl = document.getElementById("breakdown-remaining-cp");
    remEl.textContent = `${pt.remaining} CP`;
    remEl.style.color = pt.isOverBudget ? "var(--color-danger)" : "var(--color-success)";
  }

  // ========================================================================
  // Attributes List Rendering & Interactions (Table 07 + Container Attributes)
  // ========================================================================
  function renderBuilderAttributes() {
    const container = document.getElementById("builder-attributes-list");
    container.innerHTML = "";

    if (currentCharacter.attributes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          No attributes added yet. Click "+ Add Attribute" to choose powers, combat arts, defenses, or container items/companions.
        </div>
      `;
      return;
    }

    currentCharacter.attributes.forEach(attr => {
      if (attr.isContainer) {
        // Container Attribute Card (Item, Companion, Minions, Alternate Form, Chassis)
        const cType = attr.containerType || "item";
        const cpInfo = currentCharacter.getContainerPoints(attr);
        const card = document.createElement("div");
        card.className = "container-attribute-card";

        let rankBadgeText = `Level ${attr.level}`;
        if (cType === "item" || cType === "chassis") {
          rankBadgeText = `${cType.toUpperCase()} Level ${attr.level} (${cpInfo.effectiveCharacterCost} CP Cost)`;
        } else {
          rankBadgeText = `Level ${attr.level} (${cpInfo.effectiveCharacterCost} CP Cost)`;
        }

        let containerInfoText = "";
        let containerIcon = "📦";
        if (cType === "chassis") {
          containerIcon = "🤖";
          containerInfoText = "Chassis Container (BESM Extras): Represents a mecha frame, android body, vehicle hull, or cybernetic frame. Contained attributes, defects, and weapons cost half value (⌊Net Contained / 2⌋ CP).";
        } else if (cType === "item") {
          containerIcon = "📦";
          containerInfoText = "Item Container (BESM 4E p. 101): Represents an external tool, magical device, weapon, or vehicle. Contained traits cost half value (⌊Net Contained / 2⌋ CP).";
        } else if (cType === "companion") {
          containerIcon = "🐾";
          containerInfoText = "Companion Container (BESM 4E p. 84): Represents an allied partner, combat familiar, pet monster, or robot partner with independent Body/Mind/Soul stats and 10 CP budget per Level.";
        } else if (cType === "alternate_form") {
          containerIcon = "✨";
          containerInfoText = "Alternate Form Container (BESM 4E p. 78): Represents a transformed state (magical girl, battle beast, super mode) with independent stats and 10 CP budget per Level.";
        } else if (cType === "minions") {
          containerIcon = "👥";
          containerInfoText = "Minions Container (BESM 4E p. 106): Represents squads of loyal subordinates, corporate security, or summoned minions.";
        }

        let summaryHtml = "";
        if (cType === "item" || cType === "chassis") {
          summaryHtml = `
            <div class="container-summary-bar">
              <span>Contained Value: <strong>${cpInfo.netContainedPoints} CP</strong></span>
              <span>•</span>
              <span style="color: var(--accent-primary); font-weight: bold;">Character Cost (1/2 Net): <strong>${cpInfo.effectiveCharacterCost} CP</strong></span>
              <span style="color: var(--text-muted); font-size: 12pt;">(BESM 4E & Extras: ⌊${cpInfo.netContainedPoints} / 2⌋)</span>
            </div>
          `;
        } else if (cType === "companion" || cType === "alternate_form") {
          const isOver = cpInfo.remainingBudget < 0;
          summaryHtml = `
            <div class="container-summary-bar">
              <span>Character Cost: <strong>${cpInfo.effectiveCharacterCost} CP</strong> (${attr.level} × 4 CP)</span>
              <span>•</span>
              <span>Budget Allowance: <strong>${cpInfo.budgetAllowance} CP</strong> (${attr.level} × 10 CP)</span>
              <span>•</span>
              <span>Spent: <strong>${cpInfo.netContainedPoints} CP</strong></span>
              <span>•</span>
              <span style="color: ${isOver ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight: bold;">
                ${isOver ? `OVER BUDGET by ${Math.abs(cpInfo.remainingBudget)} CP!` : `${cpInfo.remainingBudget} CP left`}
              </span>
            </div>
          `;
        } else {
          summaryHtml = `
            <div class="container-summary-bar">
              <span>Character Cost: <strong>${cpInfo.effectiveCharacterCost} CP</strong></span>
              <span>•</span>
              <span>Contained Value: <strong>${cpInfo.netContainedPoints} CP</strong></span>
            </div>
          `;
        }

        // Companion / Alternate Form Stats Box
        let statsBoxHtml = "";
        if (cType === "companion" || cType === "alternate_form") {
          const stats = attr.containerStats || { body: 0, mind: 0, soul: 0 };
          const cDerived = currentCharacter.getContainerDerived(attr.id);
          statsBoxHtml = `
            <div class="companion-stats-box">
              <div class="companion-stat-item">
                <span class="companion-stat-label" style="color: var(--color-body);">Body</span>
                <div class="companion-stat-controls">
                  <button type="button" class="stepper-btn btn-sm btn-cont-stat-minus" data-id="${attr.id}" data-stat="body" title="Decrease Body">-</button>
                  <span class="companion-stat-value" style="color: var(--color-body);">${stats.body || 0}</span>
                  <button type="button" class="stepper-btn btn-sm btn-cont-stat-plus" data-id="${attr.id}" data-stat="body" title="Increase Body">+</button>
                </div>
              </div>
              <div class="companion-stat-item">
                <span class="companion-stat-label" style="color: var(--color-mind);">Mind</span>
                <div class="companion-stat-controls">
                  <button type="button" class="stepper-btn btn-sm btn-cont-stat-minus" data-id="${attr.id}" data-stat="mind" title="Decrease Mind">-</button>
                  <span class="companion-stat-value" style="color: var(--color-mind);">${stats.mind || 0}</span>
                  <button type="button" class="stepper-btn btn-sm btn-cont-stat-plus" data-id="${attr.id}" data-stat="mind" title="Increase Mind">+</button>
                </div>
              </div>
              <div class="companion-stat-item">
                <span class="companion-stat-label" style="color: var(--color-soul);">Soul</span>
                <div class="companion-stat-controls">
                  <button type="button" class="stepper-btn btn-sm btn-cont-stat-minus" data-id="${attr.id}" data-stat="soul" title="Decrease Soul">-</button>
                  <span class="companion-stat-value" style="color: var(--color-soul);">${stats.soul || 0}</span>
                  <button type="button" class="stepper-btn btn-sm btn-cont-stat-plus" data-id="${attr.id}" data-stat="soul" title="Increase Soul">+</button>
                </div>
              </div>
            </div>
            ${cDerived ? `
              <div class="companion-derived-row">
                <span>CV: <strong>${cDerived.baseCV}</strong></span>
                <span>•</span>
                <span>ACV: <strong>${cDerived.acv}</strong></span>
                <span>•</span>
                <span>DCV: <strong>${cDerived.dcv}</strong></span>
                <span>•</span>
                <span>HP: <strong style="color: var(--color-health);">${cDerived.maxHealth}</strong></span>
                <span>•</span>
                <span>EP: <strong style="color: var(--color-energy);">${cDerived.maxEnergy}</strong></span>
                <span>•</span>
                <span>DM: <strong>${cDerived.damageMultiplier}</strong></span>
                <span>•</span>
                <span>AR: <strong>${cDerived.armorRating}</strong></span>
              </div>
            ` : ""}
          `;
        }

        // Sub-traits list
        const traits = attr.containerTraits || { attributes: [], skillGroups: [], skills: [], defects: [], weapons: [] };
        const totalTraitsCount = (traits.attributes?.length || 0) + 
                                 (traits.skillGroups?.length || 0) + 
                                 (traits.skills?.length || 0) + 
                                 (traits.defects?.length || 0) + 
                                 (traits.weapons?.length || 0);

        let traitsListHtml = "";
        if (totalTraitsCount === 0) {
          traitsListHtml = `
            <div style="font-size: 12pt; color: var(--text-dim); margin-top: 0.35rem; font-style: italic;">
              No traits added yet. Click the buttons above to build powers, skills, defects, or weapons into this ${cType}.
            </div>
          `;
        } else {
          // Attributes
          if (traits.attributes && traits.attributes.length > 0) {
            traitsListHtml += `<div class="container-traits-category-title">✨ Attributes (${cpInfo.attributesCost} CP)</div>`;
            traits.attributes.forEach(ca => {
              const def = BESM4E_RULES.getAttributeDef(ca.attributeId || ca.id);
              const desc = ca.customDesc || (def ? def.description : "");
              const cat = ca.category || (def ? def.category : "supernatural");
              const hasSubTraits = def && Array.isArray(def.subTraits) && def.subTraits.length > 0;
              const hasDetail = def && !!def.detailLabel;
              if (hasSubTraits && !ca.subTrait) {
                ca.subTrait = def.subTraits[0];
              }
              const subTraitTitle = ca.subTrait ? `: <span style="color: var(--accent-primary); font-weight: 700;">${escapeHtml(ca.subTrait)}</span>` : "";
              const detailTitle = ca.detail ? ` <span style="color: var(--text-muted); font-size: 12pt;">[${escapeHtml(ca.detail)}]</span>` : "";
              const subTraitPill = ca.subTrait ? `<span class="tag-pill" style="color: var(--accent-primary); font-weight: 600;">${escapeHtml(ca.subTrait)}</span>` : "";
              const detailPill = ca.detail ? `<span class="tag-pill" style="opacity: 0.9;">[${escapeHtml(ca.detail)}]</span>` : "";

              let configBarHtml = "";
              if (hasSubTraits || hasDetail) {
                configBarHtml = `
                  <div class="trait-config-bar">
                    ${hasSubTraits ? `
                      <span class="trait-config-label">${escapeHtml(def.subTraitLabel || "Sub-Trait")}:</span>
                      <select class="trait-subtrait-select cont-attr-subtrait-select" data-container="${attr.id}" data-id="${ca.id}">
                        ${def.subTraits.map(st => `<option value="${escapeHtml(st)}" ${st === ca.subTrait ? "selected" : ""}>${escapeHtml(st)}</option>`).join("")}
                      </select>
                    ` : ""}
                    ${hasDetail ? `
                      <span class="trait-config-label">${escapeHtml(def.detailLabel)}:</span>
                      <input type="text" class="trait-detail-input cont-attr-detail-input" data-container="${attr.id}" data-id="${ca.id}" placeholder="${escapeHtml(def.detailPlaceholder || 'Enter details...')}" value="${escapeHtml(ca.detail || '')}">
                    ` : ""}
                  </div>
                `;
              }

              traitsListHtml += `
                <div class="container-trait-item-wrap">
                  <div class="container-trait-header">
                    <div>
                      <strong>${escapeHtml(ca.name)}${subTraitTitle}${detailTitle}</strong>
                      <span class="tag-pill">${escapeHtml(cat)}</span>
                      <span class="rank-badge">Level ${ca.level} (${ca.level * ca.costPerLevel} CP)</span>
                    </div>
                    <div style="display: flex; gap: 0.25rem; align-items: center;">
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-minus" data-container="${attr.id}" data-type="attributes" data-trait="${ca.id}">-</button>
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-plus" data-container="${attr.id}" data-type="attributes" data-trait="${ca.id}">+</button>
                      <button type="button" class="btn btn-danger btn-sm btn-cont-trait-delete" data-container="${attr.id}" data-type="attributes" data-trait="${ca.id}" style="padding: 0.1rem 0.35rem; font-size: 12pt;">✕</button>
                    </div>
                  </div>
                  ${configBarHtml}
                  ${desc ? `<div class="container-trait-desc">ℹ️ ${escapeHtml(desc)}</div>` : ""}
                </div>
              `;
            });
          }

          // Skill Groups
          if (traits.skillGroups && traits.skillGroups.length > 0) {
            traitsListHtml += `<div class="container-traits-category-title">🎯 Skill Groups (${cpInfo.skillGroupsCost} CP)</div>`;
            traits.skillGroups.forEach(cs => {
              const def = BESM4E_RULES.getSkillGroupDef(cs.id);
              const desc = cs.customDesc || (def ? def.description : "");
              const constituentSkills = BESM4E_RULES.getConstituentSkills(cs.id);
              const skillsBadges = constituentSkills.map(s => 
                `<span class="skill-tag-pill"><strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span></span>`
              ).join("");

              traitsListHtml += `
                <div class="container-trait-item-wrap">
                  <div class="container-trait-header">
                    <div>
                      <strong>${escapeHtml(cs.name)} Group</strong>
                      <span class="tag-pill">${(cs.tier || "field").toUpperCase()} (${cs.costPerLevel} CP/lvl)</span>
                      <span class="rank-badge">Level ${cs.level} (+${cs.level}) [${cs.level * cs.costPerLevel} CP]</span>
                    </div>
                    <div style="display: flex; gap: 0.25rem; align-items: center;">
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-minus" data-container="${attr.id}" data-type="skillGroups" data-trait="${cs.id}">-</button>
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-plus" data-container="${attr.id}" data-type="skillGroups" data-trait="${cs.id}">+</button>
                      <button type="button" class="btn btn-danger btn-sm btn-cont-trait-delete" data-container="${attr.id}" data-type="skillGroups" data-trait="${cs.id}" style="padding: 0.1rem 0.35rem; font-size: 12pt;">✕</button>
                    </div>
                  </div>
                  ${desc ? `<div class="container-trait-desc">${escapeHtml(desc)}</div>` : ""}
                  ${skillsBadges ? `<div class="skill-constituents-wrapper">${skillsBadges}</div>` : ""}
                </div>
              `;
            });
          }

          // Individual Skills
          if (traits.skills && traits.skills.length > 0) {
            traitsListHtml += `<div class="container-traits-category-title">🎯 Individual Skills (${cpInfo.skillsCost || 0} CP)</div>`;
            traits.skills.forEach(csk => {
              const def = BESM4E_RULES.getSkillDef(csk.id);
              const desc = csk.customDesc || (def ? def.description : "");
              const spec = csk.specialization ? ` (${csk.specialization})` : "";
              const hasSpecs = def && Array.isArray(def.specializations) && def.specializations.length > 0;
              let specBarHtml = "";
              if (hasSpecs) {
                specBarHtml = `
                  <div class="trait-config-bar">
                    <span class="trait-config-label">Specialization:</span>
                    <select class="trait-subtrait-select cont-skill-spec-select" data-container="${attr.id}" data-id="${csk.id}">
                      <option value="">None / General</option>
                      ${def.specializations.map(sp => `<option value="${escapeHtml(sp)}" ${sp === csk.specialization ? "selected" : ""}>${escapeHtml(sp)}</option>`).join("")}
                    </select>
                    <input type="text" class="trait-detail-input cont-skill-spec-input" data-container="${attr.id}" data-id="${csk.id}" placeholder="Or custom specialization..." value="${escapeHtml(def.specializations.includes(csk.specialization) ? '' : (csk.specialization || ''))}">
                  </div>
                `;
              }
              traitsListHtml += `
                <div class="container-trait-item-wrap">
                  <div class="container-trait-header">
                    <div>
                      <strong>${escapeHtml(csk.name)}${escapeHtml(spec)}</strong>
                      <span class="tag-pill">${escapeHtml(csk.stat || "Mind")}</span>
                      ${csk.groupName ? `<span class="tag-pill" style="opacity: 0.7;">${escapeHtml(csk.groupName)} Group</span>` : ""}
                      <span class="rank-badge">Level ${csk.level} (+${csk.level}) [${csk.level * (csk.costPerLevel || 1)} CP]</span>
                    </div>
                    <div style="display: flex; gap: 0.25rem; align-items: center;">
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-minus" data-container="${attr.id}" data-type="skills" data-trait="${csk.id}">-</button>
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-plus" data-container="${attr.id}" data-type="skills" data-trait="${csk.id}">+</button>
                      <button type="button" class="btn btn-danger btn-sm btn-cont-trait-delete" data-container="${attr.id}" data-type="skills" data-trait="${csk.id}" style="padding: 0.1rem 0.35rem; font-size: 12pt;">✕</button>
                    </div>
                  </div>
                  ${specBarHtml}
                  ${desc ? `<div class="container-trait-desc">${escapeHtml(desc)}</div>` : ""}
                </div>
              `;
            });
          }

          // Defects
          if (traits.defects && traits.defects.length > 0) {
            traitsListHtml += `<div class="container-traits-category-title">⚠️ Defects (-${cpInfo.defectsRefund} CP Refund)</div>`;
            traits.defects.forEach(cd => {
              const def = BESM4E_RULES.getDefectDef(cd.defectId || cd.id);
              const desc = cd.customDesc || (def ? def.description : "");
              const hasDetail = def && !!def.detailLabel;
              const detailPill = cd.detail ? `<span class="tag-pill" style="opacity: 0.9;">[${escapeHtml(cd.detail)}]</span>` : "";

              let configBarHtml = "";
              if (hasDetail) {
                configBarHtml = `
                  <div class="trait-config-bar">
                    <span class="trait-config-label">${escapeHtml(def.detailLabel)}:</span>
                    <input type="text" class="trait-detail-input cont-defect-detail-input" data-container="${attr.id}" data-id="${cd.id}" placeholder="${escapeHtml(def.detailPlaceholder || 'Enter details...')}" value="${escapeHtml(cd.detail || '')}">
                  </div>
                `;
              }

              traitsListHtml += `
                <div class="container-trait-item-wrap">
                  <div class="container-trait-header">
                    <div>
                      <strong>${escapeHtml(cd.name)}</strong>
                      ${detailPill}
                      <span class="tag-pill">${(cd.category || "lesser").toUpperCase()}</span>
                      <span class="refund-badge">Rank ${cd.rank} (-${cd.rank * cd.refundPerRank} CP refund)</span>
                    </div>
                    <div style="display: flex; gap: 0.25rem; align-items: center;">
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-minus" data-container="${attr.id}" data-type="defects" data-trait="${cd.id}">-</button>
                      <button type="button" class="stepper-btn btn-sm btn-cont-trait-plus" data-container="${attr.id}" data-type="defects" data-trait="${cd.id}">+</button>
                      <button type="button" class="btn btn-danger btn-sm btn-cont-trait-delete" data-container="${attr.id}" data-type="defects" data-trait="${cd.id}" style="padding: 0.1rem 0.35rem; font-size: 12pt;">✕</button>
                    </div>
                  </div>
                  ${configBarHtml}
                  ${desc ? `<div class="container-trait-desc" style="border-left-color: var(--color-warning);">⚠️ ${escapeHtml(desc)}</div>` : ""}
                </div>
              `;
            });
          }

          // Weapons
          if (traits.weapons && traits.weapons.length > 0) {
            const derived = currentCharacter.getDerived();
            traitsListHtml += `<div class="container-traits-category-title">⚔️ Weapons & Attacks (${cpInfo.weaponsCost} CP Value)</div>`;
            traits.weapons.forEach(cw => {
              const isMelee = (cw.range || "").toLowerCase().includes("melee");
              const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
              const dmg = cw.level * dm;
              traitsListHtml += `
                <div class="container-trait-item-wrap">
                  <div class="container-trait-header">
                    <div>
                      <strong>${escapeHtml(cw.name)}</strong>
                      <span class="tag-pill">Level ${cw.level}</span>
                      <span class="tag-pill" style="color: var(--color-warning);">Base Dmg: ${dmg}</span>
                      <span class="tag-pill">${escapeHtml(cw.range)}</span>
                      <span style="color: var(--text-muted); font-size: 12pt;">(${cw.level * 2} CP value)</span>
                    </div>
                    <div style="display: flex; gap: 0.25rem; align-items: center;">
                      <button type="button" class="btn btn-danger btn-sm btn-cont-trait-delete" data-container="${attr.id}" data-type="weapons" data-trait="${cw.id}" style="padding: 0.1rem 0.35rem; font-size: 12pt;">✕</button>
                    </div>
                  </div>
                  ${(cw.enhancements && cw.enhancements !== "None") || (cw.limiters && cw.limiters !== "None") ? `
                    <div style="font-size: 12pt; margin-top: 0.25rem; display: flex; gap: 0.4rem; flex-wrap: wrap;">
                      ${cw.enhancements && cw.enhancements !== "None" ? `<span style="color: #34d399;">✨ ${escapeHtml(cw.enhancements)}</span>` : ""}
                      ${cw.limiters && cw.limiters !== "None" ? `<span style="color: #f87171;">⚠️ ${escapeHtml(cw.limiters)}</span>` : ""}
                    </div>
                  ` : ""}
                  ${cw.notes ? `<div class="container-trait-desc">${escapeHtml(cw.notes)}</div>` : ""}
                </div>
              `;
            });
          }
        }

        card.innerHTML = `
          <div class="container-header">
            <div class="container-name-wrap">
              <span style="font-size: 1.1rem;">${containerIcon}</span>
              <input type="text" class="container-name-input" data-id="${attr.id}" value="${escapeHtml(attr.name)}" title="Click to rename container">
              <span class="tag-pill" style="color: var(--accent-primary); font-weight: 700;">${cType.toUpperCase()}</span>
              <span class="rank-badge">${rankBadgeText}</span>
            </div>
            <div class="item-controls">
              <button class="stepper-btn btn-sm btn-attr-minus" data-id="${attr.id}" title="Decrease container level">-</button>
              <button class="stepper-btn btn-sm btn-attr-plus" data-id="${attr.id}" title="Increase container level">+</button>
              <button class="btn btn-danger btn-sm btn-attr-delete" data-id="${attr.id}" title="Remove container">✕</button>
            </div>
          </div>
          <div class="container-banner-info">${containerIcon} ${containerInfoText}</div>
          ${attr.customDesc ? `<div class="item-sub" style="margin-bottom: 0.35rem;">${escapeHtml(attr.customDesc)}</div>` : ""}
          ${summaryHtml}
          ${statsBoxHtml}
          <div class="container-quick-buttons">
            <button type="button" class="btn btn-secondary btn-sm btn-open-cont-add" data-id="${attr.id}" data-type="attribute">+ Attribute</button>
            <button type="button" class="btn btn-secondary btn-sm btn-open-cont-add" data-id="${attr.id}" data-type="skill">+ Skill / Group</button>
            <button type="button" class="btn btn-secondary btn-sm btn-open-cont-add" data-id="${attr.id}" data-type="defect">+ Defect</button>
            <button type="button" class="btn btn-secondary btn-sm btn-open-cont-add" data-id="${attr.id}" data-type="weapon">+ Weapon</button>
          </div>
          <div class="container-traits-panel">
            ${traitsListHtml}
          </div>
        `;
        container.appendChild(card);
      } else {
        // Standard Attribute Row
        const def = BESM4E_RULES.getAttributeDef(attr.attributeId || attr.id);
        const hasSubTraits = def && Array.isArray(def.subTraits) && def.subTraits.length > 0;
        const hasDetail = def && !!def.detailLabel;
        if (hasSubTraits && !attr.subTrait) {
          attr.subTrait = def.subTraits[0];
        }
        const subTraitTitle = attr.subTrait ? `: <span style="color: var(--accent-primary); font-weight: 700;">${escapeHtml(attr.subTrait)}</span>` : "";
        const detailTitle = attr.detail ? ` <span style="color: var(--text-muted); font-size: 12pt;">[${escapeHtml(attr.detail)}]</span>` : "";
        const subTraitPill = attr.subTrait ? `<span class="tag-pill" style="color: var(--accent-primary); font-weight: 600;">${escapeHtml(attr.subTrait)}</span>` : "";
        const detailPill = attr.detail ? `<span class="tag-pill" style="opacity: 0.9;">[${escapeHtml(attr.detail)}]</span>` : "";
        const totalCost = attr.level * attr.costPerLevel;

        const allowsMulti = def && (def.allowMultiple || (hasSubTraits && def.subTraits.length > 1) || hasDetail);
        const addAnotherBtn = allowsMulti ? `
          <button type="button" class="btn btn-secondary btn-sm btn-attr-add-another" data-id="${attr.id}" title="Add another instance of ${escapeHtml(def ? def.name : attr.name)}">+ Another</button>
        ` : "";

        let configBarHtml = "";
        if (hasSubTraits || hasDetail) {
          configBarHtml = `
            <div class="trait-config-bar">
              ${hasSubTraits ? `
                <span class="trait-config-label">${escapeHtml(def.subTraitLabel || "Sub-Trait")}:</span>
                <select class="trait-subtrait-select attr-subtrait-select" data-id="${attr.id}">
                  ${def.subTraits.map(st => `<option value="${escapeHtml(st)}" ${st === attr.subTrait ? "selected" : ""}>${escapeHtml(st)}</option>`).join("")}
                </select>
              ` : ""}
              ${hasDetail ? `
                <span class="trait-config-label">${escapeHtml(def.detailLabel)}:</span>
                <input type="text" class="trait-detail-input attr-detail-input" data-id="${attr.id}" placeholder="${escapeHtml(def.detailPlaceholder || 'Enter details...')}" value="${escapeHtml(attr.detail || '')}">
              ` : ""}
            </div>
          `;
        }

        const row = document.createElement("div");
        row.className = "item-row";
        row.style.flexDirection = "column";
        row.style.alignItems = "stretch";
        row.style.gap = "0.35rem";
        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="item-name">
              <strong>${escapeHtml(attr.name)}${subTraitTitle}${detailTitle}</strong>
              <span class="tag-pill">${escapeHtml(attr.category)}</span>
              <span class="rank-badge">Level ${attr.level} (${totalCost} CP)</span>
            </div>
            <div class="item-controls">
              ${addAnotherBtn}
              <button class="stepper-btn btn-sm btn-attr-minus" data-id="${attr.id}" title="Decrease level">-</button>
              <button class="stepper-btn btn-sm btn-attr-plus" data-id="${attr.id}" title="Increase level">+</button>
              <button class="btn btn-danger btn-sm btn-attr-delete" data-id="${attr.id}" title="Remove attribute">✕</button>
            </div>
          </div>
          ${configBarHtml}
          ${attr.customDesc ? `<div class="item-sub" style="margin-top: 0;">${escapeHtml(attr.customDesc)}</div>` : ""}
        `;
        container.appendChild(row);
      }
    });

    // Renaming container inputs
    container.querySelectorAll(".container-name-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        const attr = currentCharacter.attributes.find(a => a.id === id);
        if (attr) {
          attr.name = e.target.value.trim() || attr.name;
          saveCurrentCharacter(true);
          renderPrintSheet();
          renderPlayMode();
        }
      });
    });

    // Opening container trait catalog modals
    container.querySelectorAll(".btn-open-cont-add").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const type = btn.getAttribute("data-type");
        setActiveContainerTarget(id);
        if (type === "attribute") {
          renderAttributeCatalog();
          openModal("modal-add-attribute");
        } else if (type === "skill") {
          renderSkillCatalog();
          openModal("modal-add-skill");
        } else if (type === "defect") {
          renderDefectCatalog();
          openModal("modal-add-defect");
        } else if (type === "weapon") {
          document.getElementById("weapon-name").value = "";
          document.getElementById("weapon-level").value = "2";
          document.getElementById("weapon-type").value = "ranged";
          document.getElementById("weapon-range").value = "25m";
          document.getElementById("weapon-tags").value = "";
          updateWeaponDamagePreview();
          syncWeaponChipsFromInput();
          openModal("modal-add-weapon");
        }
      });
    });

    // Companion Stats Steppers
    container.querySelectorAll(".btn-cont-stat-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const stat = btn.getAttribute("data-stat");
        const attr = currentCharacter.getContainerAttribute(id);
        if (attr && attr.containerStats) {
          const cur = attr.containerStats[stat] || 0;
          currentCharacter.setContainerStat(id, stat, cur - 1);
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    container.querySelectorAll(".btn-cont-stat-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const stat = btn.getAttribute("data-stat");
        const attr = currentCharacter.getContainerAttribute(id);
        if (attr && attr.containerStats) {
          const cur = attr.containerStats[stat] || 0;
          currentCharacter.setContainerStat(id, stat, cur + 1);
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
        }
      });
    });

    // Contained Sub-Trait Level Steppers
    container.querySelectorAll(".btn-cont-trait-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        const cId = btn.getAttribute("data-container");
        const type = btn.getAttribute("data-type");
        const tId = btn.getAttribute("data-trait");
        currentCharacter.updateContainerTraitLevel(cId, type, tId, -1);
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-cont-trait-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        const cId = btn.getAttribute("data-container");
        const type = btn.getAttribute("data-type");
        const tId = btn.getAttribute("data-trait");
        currentCharacter.updateContainerTraitLevel(cId, type, tId, 1);
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    // Contained Sub-Trait Deletion
    container.querySelectorAll(".btn-cont-trait-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const cId = btn.getAttribute("data-container");
        const type = btn.getAttribute("data-type");
        const tId = btn.getAttribute("data-trait");
        currentCharacter.removeContainerTrait(cId, type, tId);
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    // Standard Attribute Level Steppers & Delete
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

    container.querySelectorAll(".btn-attr-add-another").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const item = currentCharacter.attributes.find(a => a.id === id);
        if (item) {
          const def = BESM4E_RULES.getAttributeDef(item.attributeId || item.id);
          if (def) {
            currentCharacter.addAttribute(def, 1);
            renderBuilderAttributes();
            renderDerivedStats();
            renderPointBreakdown();
            saveCurrentCharacter(true);
            showToast(`Added another "${def.name}"`);
          }
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

    // Sub-trait selects for character attributes
    container.querySelectorAll(".attr-subtrait-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const id = sel.getAttribute("data-id");
        currentCharacter.updateAttributeSubTrait(id, e.target.value);
        renderBuilderAttributes();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
      });
    });

    // Detail inputs for character attributes
    container.querySelectorAll(".attr-detail-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        currentCharacter.updateAttributeDetail(id, e.target.value.trim());
        renderBuilderAttributes();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
      });
    });

    // Sub-trait selects for contained attributes
    container.querySelectorAll(".cont-attr-subtrait-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const cId = sel.getAttribute("data-container");
        const id = sel.getAttribute("data-id");
        currentCharacter.updateContainerTraitSubTrait(cId, id, e.target.value);
        renderBuilderAttributes();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
      });
    });

    // Detail inputs for contained attributes
    container.querySelectorAll(".cont-attr-detail-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const cId = inp.getAttribute("data-container");
        const id = inp.getAttribute("data-id");
        currentCharacter.updateContainerTraitDetail(cId, "attributes", id, e.target.value.trim());
        renderBuilderAttributes();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
      });
    });

    // Detail inputs for contained defects
    container.querySelectorAll(".cont-defect-detail-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const cId = inp.getAttribute("data-container");
        const id = inp.getAttribute("data-id");
        currentCharacter.updateContainerTraitDetail(cId, "defects", id, e.target.value.trim());
        renderBuilderAttributes();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
      });
    });

    // Specialization for contained skills
    container.querySelectorAll(".cont-skill-spec-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const cId = sel.getAttribute("data-container");
        const id = sel.getAttribute("data-id");
        currentCharacter.updateContainerSkillSpecialization(cId, id, e.target.value);
        renderBuilderAttributes();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
      });
    });

    container.querySelectorAll(".cont-skill-spec-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const cId = inp.getAttribute("data-container");
        const id = inp.getAttribute("data-id");
        if (e.target.value.trim()) {
          currentCharacter.updateContainerSkillSpecialization(cId, id, e.target.value.trim());
          renderBuilderAttributes();
          saveCurrentCharacter(true);
          renderPrintSheet();
          renderPlayMode();
        }
      });
    });
  }

  // ========================================================================
  // Skill Groups & Individual Skills List Rendering & Interactions (BESM 4E p. 120-122)
  // ========================================================================
  function renderBuilderSkillGroups() {
    const container = document.getElementById("builder-skills-list");
    container.innerHTML = "";

    const hasGroups = currentCharacter.skillGroups && currentCharacter.skillGroups.length > 0;
    const hasIndivSkills = currentCharacter.skills && currentCharacter.skills.length > 0;

    if (!hasGroups && !hasIndivSkills) {
      container.innerHTML = `
        <div class="empty-state">
          No skills trained yet. Click "+ Add Skill / Group" to add Skill Groups (1-3 CP) or individual constituent skills (1 CP/lvl).
        </div>
      `;
      return;
    }

    // Render Skill Groups
    if (hasGroups) {
      const groupHeader = document.createElement("div");
      groupHeader.className = "container-traits-category-title";
      groupHeader.style.margin = "0.5rem 0 0.25rem 0";
      groupHeader.innerHTML = `🎯 Trained Skill Groups (${currentCharacter.getPointBreakdown().skillGroupsTotal} CP)`;
      container.appendChild(groupHeader);

      currentCharacter.skillGroups.forEach(sg => {
        const totalCost = sg.level * sg.costPerLevel;
        const tierBadge = sg.tier ? sg.tier.toUpperCase() : "SKILL";
        const def = BESM4E_RULES.getSkillGroupDef(sg.id);
        const desc = sg.description || (def ? def.description : "");
        const constituentSkills = BESM4E_RULES.getConstituentSkills(sg.id);
        
        const skillsPills = constituentSkills.map(s => 
          `<span class="skill-tag-pill" title="${escapeHtml(s.description)} (${s.specializations.join(', ')})"><strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span></span>`
        ).join("");

        const row = document.createElement("div");
        row.className = "item-row";
        row.style.flexDirection = "column";
        row.style.alignItems = "stretch";
        row.style.gap = "0.35rem";
        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="item-name">
              <strong>${escapeHtml(sg.name)} Group</strong>
              <span class="tag-pill">${tierBadge} (${sg.costPerLevel} CP/lvl)</span>
              <span class="rank-badge">Level ${sg.level} (+${sg.level} roll bonus) [${totalCost} CP]</span>
            </div>
            <div class="item-controls">
              <button class="stepper-btn btn-sm btn-sg-minus" data-id="${sg.id}">-</button>
              <button class="stepper-btn btn-sm btn-sg-plus" data-id="${sg.id}">+</button>
              <button class="btn btn-danger btn-sm btn-sg-delete" data-id="${sg.id}">✕</button>
            </div>
          </div>
          ${desc ? `<div class="item-sub" style="margin-top: 0;">${escapeHtml(desc)}</div>` : ""}
          ${skillsPills ? `
            <div style="margin-top: 0.2rem;">
              <div style="font-size: 12pt; color: var(--text-dim); margin-bottom: 0.2rem; font-weight: 600; text-transform: uppercase;">Covered Constituent Skills (+${sg.level} Bonus to All):</div>
              <div class="skill-constituents-wrapper">${skillsPills}</div>
            </div>
          ` : ""}
        `;
        container.appendChild(row);
      });
    }

    // Render Individual Constituent Skills
    if (hasIndivSkills) {
      const indivHeader = document.createElement("div");
      indivHeader.className = "container-traits-category-title";
      indivHeader.style.margin = "0.75rem 0 0.25rem 0";
      indivHeader.innerHTML = `✨ Individual Skills (${currentCharacter.getPointBreakdown().skillsTotal || 0} CP)`;
      container.appendChild(indivHeader);

      currentCharacter.skills.forEach(sk => {
        const totalCost = sk.level * (sk.costPerLevel || 1);
        const def = BESM4E_RULES.getSkillDef(sk.id);
        const desc = sk.customDesc || (def ? def.description : "");
        const spec = sk.specialization ? `<span class="tag-pill" style="color: var(--accent-primary);">${escapeHtml(sk.specialization)}</span>` : "";
        const grp = sk.groupName ? `<span class="tag-pill" style="opacity: 0.7;">${escapeHtml(sk.groupName)}</span>` : "";
        const hasSpecs = def && Array.isArray(def.specializations) && def.specializations.length > 0;

        let specBarHtml = "";
        if (hasSpecs) {
          specBarHtml = `
            <div class="trait-config-bar">
              <span class="trait-config-label">Specialization:</span>
              <select class="trait-subtrait-select skill-spec-select" data-id="${sk.id}">
                <option value="">None / General</option>
                ${def.specializations.map(sp => `<option value="${escapeHtml(sp)}" ${sp === sk.specialization ? "selected" : ""}>${escapeHtml(sp)}</option>`).join("")}
              </select>
              <input type="text" class="trait-detail-input skill-spec-input" data-id="${sk.id}" placeholder="Or custom specialization..." value="${escapeHtml(def.specializations.includes(sk.specialization) ? '' : (sk.specialization || ''))}">
            </div>
          `;
        }

        const row = document.createElement("div");
        row.className = "item-row";
        row.style.flexDirection = "column";
        row.style.alignItems = "stretch";
        row.style.gap = "0.35rem";
        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="item-name">
              <strong>${escapeHtml(sk.name)}</strong>
              ${spec}
              <span class="tag-pill">${escapeHtml(sk.stat || "Mind")}</span>
              ${grp}
              <span class="rank-badge">Level ${sk.level} (+${sk.level} roll bonus) [${totalCost} CP]</span>
            </div>
            <div class="item-controls">
              <button class="stepper-btn btn-sm btn-sk-minus" data-id="${sk.id}">-</button>
              <button class="stepper-btn btn-sm btn-sk-plus" data-id="${sk.id}">+</button>
              <button class="btn btn-danger btn-sm btn-sk-delete" data-id="${sk.id}">✕</button>
            </div>
          </div>
          ${specBarHtml}
          ${desc ? `<div class="item-sub" style="margin-top: 0;">${escapeHtml(desc)}</div>` : ""}
        `;
        container.appendChild(row);
      });
    }

    // Skill Group Steppers & Delete
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

    // Individual Skill Steppers & Delete
    container.querySelectorAll(".btn-sk-minus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.updateSkillLevel(id, -1);
        renderBuilderSkillGroups();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-sk-plus").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.updateSkillLevel(id, 1);
        renderBuilderSkillGroups();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-sk-delete").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.removeSkill(id);
        renderBuilderSkillGroups();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    // Specialization selects & custom inputs for individual skills
    container.querySelectorAll(".skill-spec-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const id = sel.getAttribute("data-id");
        currentCharacter.updateSkillSpecialization(id, e.target.value);
        renderBuilderSkillGroups();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
      });
    });

    container.querySelectorAll(".skill-spec-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        if (e.target.value.trim()) {
          currentCharacter.updateSkillSpecialization(id, e.target.value.trim());
          renderBuilderSkillGroups();
          saveCurrentCharacter(true);
          renderPrintSheet();
          renderPlayMode();
        }
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
      const def = BESM4E_RULES.getDefectDef(defect.defectId || defect.id);
      const refund = defect.rank * defect.refundPerRank;
      const hasDetail = def && !!def.detailLabel;
      const detailTitle = defect.detail ? ` <span style="color: var(--text-muted); font-size: 12pt;">[${escapeHtml(defect.detail)}]</span>` : "";
      const detailPill = defect.detail ? `<span class="tag-pill" style="opacity: 0.9;">[${escapeHtml(defect.detail)}]</span>` : "";

      let configBarHtml = "";
      if (hasDetail) {
        configBarHtml = `
          <div class="trait-config-bar">
            <span class="trait-config-label">${escapeHtml(def.detailLabel)}:</span>
            <input type="text" class="trait-detail-input defect-detail-input" data-id="${defect.id}" placeholder="${escapeHtml(def.detailPlaceholder || 'Enter details...')}" value="${escapeHtml(defect.detail || '')}">
          </div>
        `;
      }

      const row = document.createElement("div");
      row.className = "item-row";
      row.style.flexDirection = "column";
      row.style.alignItems = "stretch";
      row.style.gap = "0.35rem";
      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div class="item-name">
            <strong>${escapeHtml(defect.name)}${detailTitle}</strong>
            ${detailPill}
            <span class="tag-pill">${defect.category.toUpperCase()}</span>
            <span class="refund-badge">+${refund} CP Refund (Rank ${defect.rank})</span>
          </div>
          <div class="item-controls">
            <button class="stepper-btn btn-sm btn-defect-minus" data-id="${defect.id}">-</button>
            <button class="stepper-btn btn-sm btn-defect-plus" data-id="${defect.id}">+</button>
            <button class="btn btn-danger btn-sm btn-defect-delete" data-id="${defect.id}">✕</button>
          </div>
        </div>
        ${configBarHtml}
        ${defect.customDesc ? `<div class="item-sub" style="margin-top: 0;">${escapeHtml(defect.customDesc)}</div>` : ""}
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

    container.querySelectorAll(".defect-detail-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        currentCharacter.updateDefectDetail(id, e.target.value.trim());
        renderBuilderDefects();
        saveCurrentCharacter(true);
        renderPrintSheet();
        renderPlayMode();
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

  // Add Weapon Modal Handler & Interactive Chips
  function updateWeaponDamagePreview() {
    const lvl = parseInt(document.getElementById("weapon-level").value, 10) || 1;
    const type = document.getElementById("weapon-type").value;
    const derived = currentCharacter.getDerived();
    const dm = type === "melee" ? derived.meleeDamageMultiplier : derived.damageMultiplier;
    const dmg = lvl * dm;
    document.getElementById("weapon-damage-preview").value = `${dmg} Damage (Level ${lvl} × ${dm} DM)`;
  }

  function initWeaponChips() {
    const enhGrid = document.getElementById("weapon-enhancements-chips");
    const limGrid = document.getElementById("weapon-limiters-chips");
    if (!enhGrid || !limGrid) return;

    enhGrid.innerHTML = "";
    (BESM4E_RULES.weaponEnhancements || []).forEach(enh => {
      const chip = document.createElement("div");
      chip.className = "weapon-chip";
      chip.setAttribute("data-type", "enhancement");
      chip.setAttribute("data-name", enh.name);
      const cost = enh.costPerRank || enh.costPerLevel || 1;
      chip.title = `${enh.description} (+${cost} CP/lvl)`;
      chip.innerHTML = `<span>${escapeHtml(enh.name)}</span> <span style="opacity: 0.7; font-size: 12pt;">(+${cost})</span>`;
      chip.addEventListener("click", () => toggleWeaponTag(enh.name));
      enhGrid.appendChild(chip);
    });

    limGrid.innerHTML = "";
    (BESM4E_RULES.weaponLimiters || []).forEach(lim => {
      const chip = document.createElement("div");
      chip.className = "weapon-chip";
      chip.setAttribute("data-type", "limiter");
      chip.setAttribute("data-name", lim.name);
      chip.title = `${lim.description} (-${lim.refundPerRank} CP/rk)`;
      chip.innerHTML = `<span>${escapeHtml(lim.name)}</span> <span style="opacity: 0.7; font-size: 12pt;">(-${lim.refundPerRank})</span>`;
      chip.addEventListener("click", () => toggleWeaponTag(lim.name));
      limGrid.appendChild(chip);
    });

    const tagsInput = document.getElementById("weapon-tags");
    if (tagsInput) {
      tagsInput.addEventListener("input", syncWeaponChipsFromInput);
    }

    const tabEnh = document.getElementById("btn-tab-enhancements");
    const tabLim = document.getElementById("btn-tab-limiters");
    const pickerEnh = document.getElementById("weapon-enhancements-picker");
    const pickerLim = document.getElementById("weapon-limiters-picker");

    if (tabEnh && tabLim && pickerEnh && pickerLim) {
      tabEnh.addEventListener("click", () => {
        tabEnh.classList.add("active-filter", "btn-primary");
        tabEnh.classList.remove("btn-secondary");
        tabLim.classList.remove("active-filter", "btn-primary");
        tabLim.classList.add("btn-secondary");
        pickerEnh.style.display = "block";
        pickerLim.style.display = "none";
      });

      tabLim.addEventListener("click", () => {
        tabLim.classList.add("active-filter", "btn-primary");
        tabLim.classList.remove("btn-secondary");
        tabEnh.classList.remove("active-filter", "btn-primary");
        tabEnh.classList.add("btn-secondary");
        pickerEnh.style.display = "none";
        pickerLim.style.display = "block";
      });
    }
  }

  function toggleWeaponTag(tagName) {
    const input = document.getElementById("weapon-tags");
    if (!input) return;
    const currentVal = input.value.trim();
    const tags = currentVal ? currentVal.split(",").map(t => t.trim()).filter(Boolean) : [];
    const index = tags.findIndex(t => t.toLowerCase() === tagName.toLowerCase());

    if (index >= 0) {
      tags.splice(index, 1);
    } else {
      tags.push(tagName);
    }

    input.value = tags.join(", ");
    syncWeaponChipsFromInput();
  }

  function syncWeaponChipsFromInput() {
    const input = document.getElementById("weapon-tags");
    if (!input) return;
    const currentVal = input.value.trim();
    const tags = currentVal ? currentVal.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    document.querySelectorAll("#weapon-enhancements-chips .weapon-chip").forEach(chip => {
      const name = (chip.getAttribute("data-name") || "").toLowerCase();
      if (tags.includes(name)) {
        chip.classList.add("selected-enhancement");
      } else {
        chip.classList.remove("selected-enhancement");
      }
    });

    document.querySelectorAll("#weapon-limiters-chips .weapon-chip").forEach(chip => {
      const name = (chip.getAttribute("data-name") || "").toLowerCase();
      if (tags.includes(name)) {
        chip.classList.add("selected-limiter");
      } else {
        chip.classList.remove("selected-limiter");
      }
    });
  }

  document.getElementById("btn-add-weapon").addEventListener("click", () => {
    clearActiveContainerTarget();
    document.getElementById("weapon-name").value = "";
    document.getElementById("weapon-level").value = "2";
    document.getElementById("weapon-type").value = "ranged";
    document.getElementById("weapon-range").value = "25m";
    document.getElementById("weapon-tags").value = "Armour-Piercing";
    updateWeaponDamagePreview();
    syncWeaponChipsFromInput();
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
    const rawTags = (document.getElementById("weapon-tags").value.trim() || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const enhList = [];
    const limList = [];

    rawTags.forEach(t => {
      if (t.toLowerCase() === "none") return;
      const isLimiter = (BESM4E_RULES.weaponLimiters || []).some(l => l.name.toLowerCase() === t.toLowerCase());
      if (isLimiter) {
        limList.push(t);
      } else {
        enhList.push(t);
      }
    });

    const wpnData = {
      name,
      level,
      range,
      enhancements: enhList.length > 0 ? enhList.join(", ") : "None",
      limiters: limList.length > 0 ? limList.join(", ") : "None",
      notes: ""
    };

    if (activeContainerTarget) {
      currentCharacter.addContainerTrait(activeContainerTarget, "weapons", wpnData);
      const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
      showToast(`Added attack "${name}" to ${cName}`);
      clearActiveContainerTarget();
    } else {
      currentCharacter.addWeapon(wpnData);
      showToast(`Added attack "${name}"`);
    }

    renderBuilderWeapons();
    renderBuilderAttributes();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
    closeModal("modal-add-weapon");
  });

  // ========================================================================
  // Catalog Modals: Add Attribute, Skill Group, Defect
  // ========================================================================

  // 1. Add Attribute Modal (Table 07)
  document.getElementById("btn-add-attribute").addEventListener("click", () => {
    clearActiveContainerTarget();
    renderAttributeCatalog();
    openModal("modal-add-attribute");
  });

  document.getElementById("attr-category-filters").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("attr-category-filters").querySelectorAll("button").forEach(b => {
        b.classList.remove("btn-primary", "active-filter");
        b.classList.add("btn-secondary");
      });
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary", "active-filter");
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
      const matchSubTraits = Array.isArray(a.subTraits) && a.subTraits.some(st => st.toLowerCase().includes(query));
      const matchSubLabel = a.subTraitLabel && a.subTraitLabel.toLowerCase().includes(query);
      const matchDetail = a.detailLabel && a.detailLabel.toLowerCase().includes(query);
      const matchPlaceholder = a.detailPlaceholder && a.detailPlaceholder.toLowerCase().includes(query);
      const matchText = a.name.toLowerCase().includes(query) ||
                        a.description.toLowerCase().includes(query) ||
                        matchSubTraits || matchSubLabel || matchDetail || matchPlaceholder;
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No matching standard attributes found.</div>`;
      return;
    }

    filtered.forEach(attr => {
      const hasSubTraits = Array.isArray(attr.subTraits) && attr.subTraits.length > 0;
      const hasDetail = !!attr.detailLabel;

      // Check if search query specifically matched a sub-trait
      const matchedSubTrait = (hasSubTraits && query)
        ? attr.subTraits.find(st => st.toLowerCase().includes(query))
        : null;
      const defaultSelectedSubTrait = matchedSubTrait || (hasSubTraits ? attr.subTraits[0] : "");

      const matchBadge = matchedSubTrait
        ? `<span class="tag-pill" style="background: var(--accent-primary); color: #fff; font-weight: 700;">Matched: ${escapeHtml(matchedSubTrait)}</span>`
        : "";

      // Initial sub-trait description
      const initialSubDesc = (hasSubTraits && defaultSelectedSubTrait) ? BESM4E_RULES.getSubTraitDesc(attr.id, defaultSelectedSubTrait) : "";

      // Initial button label: "[attribute]: [subtrait]" if subtrait exists, otherwise "[attribute]"
      let initialBtnLabel = attr.name;
      if (hasSubTraits && defaultSelectedSubTrait) {
        initialBtnLabel = `${attr.name}: ${defaultSelectedSubTrait}`;
      }

      const card = document.createElement("div");
      card.className = "catalog-item-card catalog-fullwidth-card";
      card.innerHTML = `
        <div class="catalog-card-header">
          <div class="catalog-card-title-group">
            <strong class="catalog-card-title">${escapeHtml(attr.name)}</strong>
            <span class="tag-pill">${escapeHtml(attr.category)}</span>
            ${matchBadge}
          </div>
          <div class="catalog-card-action-group">
            <span class="tag-pill" style="color: var(--accent-primary); font-weight: 700;">${attr.costPerLevel} CP / Level</span>
            <button type="button" class="btn btn-primary btn-sm btn-catalog-add-trait" style="font-size: 12pt; white-space: nowrap;">
              + Add "${escapeHtml(initialBtnLabel)}"
            </button>
          </div>
        </div>

        <div class="catalog-card-desc">${escapeHtml(attr.description)}</div>

        ${hasSubTraits ? `
          <div class="catalog-subtrait-control-row">
            <label class="catalog-control-label">${escapeHtml(attr.subTraitLabel || "Choose Sub-Trait")}:</label>
            <select class="catalog-subtrait-select form-control" style="flex: 1 1 200px; font-size: 12pt; background: var(--bg-card); color: var(--text-main);">
              ${attr.subTraits.map(st => `<option value="${escapeHtml(st)}" ${st === defaultSelectedSubTrait ? "selected" : ""}>${escapeHtml(st)}</option>`).join("")}
            </select>
          </div>
          <div class="catalog-subtrait-desc-box" style="${initialSubDesc ? '' : 'display: none;'}">
            <div class="catalog-subtrait-desc-title">⚡ ${escapeHtml(defaultSelectedSubTrait)}:</div>
            <div class="catalog-subtrait-desc-text">${escapeHtml(initialSubDesc)}</div>
          </div>
        ` : ""}

        ${hasDetail ? `
          <div class="catalog-detail-control-row">
            <label class="catalog-control-label">${escapeHtml(attr.detailLabel)}:</label>
            <input type="text" class="catalog-detail-input form-control" placeholder="${escapeHtml(attr.detailPlaceholder || 'Enter details (e.g. Katana, Undead)...')}" style="flex: 1 1 200px; font-size: 12pt; background: var(--bg-card); color: var(--text-main);">
          </div>
        ` : ""}
      `;

      function commitAdd() {
        const sub = hasSubTraits ? (card.querySelector(".catalog-subtrait-select")?.value || "") : "";
        const det = hasDetail ? (card.querySelector(".catalog-detail-input")?.value.trim() || "") : "";

        // Format name as "[attribute]: [subtrait]" when subtrait is present
        let finalName = attr.name;
        if (sub) {
          finalName = `${attr.name}: ${sub}`;
        }

        if (activeContainerTarget) {
          currentCharacter.addContainerTrait(activeContainerTarget, "attributes", attr, 1, finalName, null, "", sub, det);
          const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
          showToast(`Added "${finalName}${det ? ` [${det}]` : ""}" to ${cName}`);
          clearActiveContainerTarget();
        } else {
          currentCharacter.addAttribute(attr, 1, finalName, null, sub, det);
          showToast(`Added "${finalName}${det ? ` [${det}]` : ""}"`);
        }
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
        closeModal("modal-add-attribute");
      }

      function updateAddButtonLabel() {
        const addBtn = card.querySelector(".btn-catalog-add-trait");
        if (!addBtn) return;
        const sub = hasSubTraits ? (card.querySelector(".catalog-subtrait-select")?.value || "") : "";
        const det = hasDetail ? (card.querySelector(".catalog-detail-input")?.value.trim() || "") : "";
        let lbl = attr.name;
        if (sub) {
          lbl = `${attr.name}: ${sub}`;
        }
        if (det) {
          lbl += ` [${det}]`;
        }
        addBtn.textContent = `+ Add "${lbl}"`;
      }

      // Dropdown change: update subtrait description and add button label
      const subSelect = card.querySelector(".catalog-subtrait-select");
      if (subSelect) {
        subSelect.addEventListener("click", e => e.stopPropagation());
        subSelect.addEventListener("change", e => {
          const chosenSt = e.target.value;
          const descBox = card.querySelector(".catalog-subtrait-desc-box");
          const descTitle = card.querySelector(".catalog-subtrait-desc-title");
          const descText = card.querySelector(".catalog-subtrait-desc-text");
          const desc = BESM4E_RULES.getSubTraitDesc(attr.id, chosenSt);

          if (descBox && descTitle && descText) {
            descTitle.textContent = `⚡ ${chosenSt}:`;
            descText.textContent = desc;
            descBox.style.display = desc ? "block" : "none";
          }
          updateAddButtonLabel();
        });
      }

      // Detail input change: update add button label and support Enter
      const detInput = card.querySelector(".catalog-detail-input");
      if (detInput) {
        detInput.addEventListener("click", e => e.stopPropagation());
        detInput.addEventListener("input", () => {
          updateAddButtonLabel();
        });
        detInput.addEventListener("keydown", e => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            commitAdd();
          }
        });
      }

      // Add Button Click
      const addBtn = card.querySelector(".btn-catalog-add-trait");
      if (addBtn) {
        addBtn.addEventListener("click", e => {
          e.stopPropagation();
          commitAdd();
        });
      }

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

    const customAttrDef = {
      id: "custom_" + Date.now(),
      name,
      category: "supernatural",
      costPerLevel: cost,
      maxLevel: 10,
      description: desc
    };

    if (activeContainerTarget) {
      currentCharacter.addContainerTrait(activeContainerTarget, "attributes", customAttrDef, rank, name, desc);
      const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
      showToast(`Added custom attribute "${name}" to ${cName}`);
      clearActiveContainerTarget();
    } else {
      currentCharacter.addAttribute(customAttrDef, rank, name, desc);
      showToast(`Added custom attribute "${name}"`);
    }

    renderBuilderAttributes();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
    closeModal("modal-add-attribute");
    showToast(`Added custom attribute "${name}"`);
  });

  // 2. Add Skill Group Modal (BESM 4E p. 120-122)
  document.getElementById("btn-add-skill").addEventListener("click", () => {
    clearActiveContainerTarget();
    renderSkillCatalog();
    openModal("modal-add-skill");
  });

  document.getElementById("skill-tier-filters").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("skill-tier-filters").querySelectorAll("button").forEach(b => {
        b.classList.remove("btn-primary", "active-filter");
        b.classList.add("btn-secondary");
      });
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary", "active-filter");
      currentSkillTierFilter = btn.getAttribute("data-tier");
      renderSkillCatalog();
    });
  });

  document.getElementById("skill-search").addEventListener("input", renderSkillCatalog);

  function renderSkillCatalog() {
    const listEl = document.getElementById("skill-catalog-list");
    listEl.innerHTML = "";
    const query = document.getElementById("skill-search").value.toLowerCase().trim();
    const targetName = activeContainerTarget ? (currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container") : "Character";

    if (currentSkillTierFilter === "individual") {
      // Individual constituent skills view (BESM 4E p. 120: 1 CP / Level)
      const allSkills = BESM4E_RULES.getAllConstituentSkills ? BESM4E_RULES.getAllConstituentSkills() : [];
      const filteredSkills = allSkills.filter(s => {
        return s.name.toLowerCase().includes(query) ||
               (s.description && s.description.toLowerCase().includes(query)) ||
               (s.groupName && s.groupName.toLowerCase().includes(query)) ||
               (s.specializations && s.specializations.some(sp => sp.toLowerCase().includes(query)));
      });

      if (filteredSkills.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No matching individual constituent skills found.</div>`;
        return;
      }

      filteredSkills.forEach(s => {
        const card = document.createElement("div");
        card.className = "catalog-item-card";
        const specsText = s.specializations && s.specializations.length > 0 ? s.specializations.join(", ") : "";
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;">
            <div>
              <strong style="color: var(--text-main); font-size: 12pt;">${escapeHtml(s.name)}</strong>
              <span class="tag-pill">${escapeHtml(s.stat)}</span>
              <span class="tag-pill" style="opacity: 0.7;">${escapeHtml(s.groupName)} Group</span>
            </div>
            <button type="button" class="btn btn-primary btn-sm btn-add-indiv-skill" style="padding: 0.25rem 0.6rem; font-size: 12pt;">
              + Add (1 CP/lvl)
            </button>
          </div>
          <div style="font-size: 12pt; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.25rem;">
            ${escapeHtml(s.description)}
          </div>
          ${specsText ? `
            <div style="font-size: 12pt; color: var(--text-dim);">
              <strong>Specializations:</strong> ${escapeHtml(specsText)}
            </div>
          ` : ""}
        `;

        card.querySelector(".btn-add-indiv-skill").addEventListener("click", (e) => {
          e.stopPropagation();
          const skillDef = {
            id: s.id,
            name: s.name,
            stat: s.stat,
            groupId: s.groupId,
            groupName: s.groupName,
            costPerLevel: 1,
            description: s.description
          };
          if (activeContainerTarget) {
            currentCharacter.addContainerTrait(activeContainerTarget, "skills", skillDef, 1);
            showToast(`Added skill "${s.name}" (Level 1, 1 CP) to ${targetName}`);
            clearActiveContainerTarget();
          } else {
            currentCharacter.addSkill(skillDef, 1);
            showToast(`Added skill "${s.name}" (Level 1, 1 CP)`);
          }
          renderBuilderSkillGroups();
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
          closeModal("modal-add-skill");
        });

        listEl.appendChild(card);
      });
      return;
    }

    // Standard Skill Groups view
    const filtered = BESM4E_RULES.skillGroups.filter(s => {
      const matchTier = currentSkillTierFilter === "all" || s.tier === currentSkillTierFilter;
      const matchText = s.name.toLowerCase().includes(query) || 
                        s.description.toLowerCase().includes(query) ||
                        (s.skills && s.skills.some(sk => sk.name.toLowerCase().includes(query) || 
                          sk.description.toLowerCase().includes(query) || 
                          (sk.specializations && sk.specializations.some(sp => sp.toLowerCase().includes(query)))));
      return matchTier && matchText;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No matching standard skill groups found.</div>`;
      return;
    }

    // If searching, show any direct matching individual skills at the top for quick access
    if (query.length >= 2) {
      const allSkills = BESM4E_RULES.getAllConstituentSkills ? BESM4E_RULES.getAllConstituentSkills() : [];
      const matchingIndiv = allSkills.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.specializations && s.specializations.some(sp => sp.toLowerCase().includes(query)))
      ).slice(0, 6);

      if (matchingIndiv.length > 0) {
        const quickSection = document.createElement("div");
        quickSection.style.cssText = "grid-column: 1 / -1; background: rgba(6, 182, 212, 0.08); border: 1px solid var(--accent-primary); border-radius: var(--radius-md); padding: 0.6rem 0.8rem; margin-bottom: 0.5rem;";
        quickSection.innerHTML = `
          <div style="font-size: 12pt; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.4rem; text-transform: uppercase;">
            ⚡ Quick Add Individual Skills (1 CP/Level):
          </div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" class="quick-indiv-skills-list"></div>
        `;
        const qList = quickSection.querySelector(".quick-indiv-skills-list");
        matchingIndiv.forEach(s => {
          const pill = document.createElement("span");
          pill.className = "skill-tag-pill interactive-skill-pill";
          pill.style.cssText = "padding: 0.25rem 0.5rem; font-size: 12pt;";
          pill.title = `Click to add ${s.name} individually (1 CP/lvl) to ${targetName}`;
          pill.innerHTML = `<strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span> <span class="pill-add-btn">+</span>`;
          pill.addEventListener("click", (e) => {
            e.stopPropagation();
            const skillDef = {
              id: s.id,
              name: s.name,
              stat: s.stat,
              groupId: s.groupId,
              groupName: s.groupName,
              costPerLevel: 1,
              description: s.description
            };
            if (activeContainerTarget) {
              currentCharacter.addContainerTrait(activeContainerTarget, "skills", skillDef, 1);
              showToast(`Added skill "${s.name}" (Level 1, 1 CP) to ${targetName}`);
              clearActiveContainerTarget();
            } else {
              currentCharacter.addSkill(skillDef, 1);
              showToast(`Added skill "${s.name}" (Level 1, 1 CP)`);
            }
            renderBuilderSkillGroups();
            renderBuilderAttributes();
            renderDerivedStats();
            renderPointBreakdown();
            saveCurrentCharacter(true);
            closeModal("modal-add-skill");
          });
          qList.appendChild(pill);
        });
        listEl.appendChild(quickSection);
      }
    }

    filtered.forEach(sg => {
      const card = document.createElement("div");
      card.className = "catalog-item-card";
      const constituentSkills = sg.skills || [];
      const skillsPills = constituentSkills.map(s => 
        `<span class="skill-tag-pill interactive-skill-pill" data-skill-id="${s.id}" data-group-id="${sg.id}" title="Click to add individual skill ${s.name} (1 CP/lvl) to ${targetName}"><strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span> <span class="pill-add-btn">+</span></span>`
      ).join("");

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
          <div>
            <strong style="color: var(--text-main); font-size: 12pt;">${escapeHtml(sg.name)} Group</strong>
            <span class="tag-pill" style="color: var(--accent-primary);">${sg.tier.toUpperCase()} • ${sg.costPerLevel} CP/Level</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm btn-add-whole-group" style="padding: 0.25rem 0.6rem; font-size: 12pt;">
            + Add Whole Group
          </button>
        </div>
        <div style="font-size: 12pt; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.5rem;">${escapeHtml(sg.description)}</div>
        ${skillsPills ? `
          <div style="font-size: 12pt; color: var(--text-dim); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase;">
            Constituent Skills (${constituentSkills.length}) - <em>click any skill to add individually (1 CP/lvl):</em>
          </div>
          <div class="skill-constituents-wrapper">${skillsPills}</div>
        ` : ""}
      `;

      // Click to add whole skill group
      card.querySelector(".btn-add-whole-group").addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeContainerTarget) {
          currentCharacter.addContainerTrait(activeContainerTarget, "skillGroups", sg, 1);
          showToast(`Added ${sg.name} Skill Group to ${targetName}`);
          clearActiveContainerTarget();
        } else {
          currentCharacter.addSkillGroup(sg, 1);
          showToast(`Added ${sg.name} Skill Group`);
        }
        renderBuilderSkillGroups();
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
        closeModal("modal-add-skill");
      });

      // Interactive constituent skill pills
      card.querySelectorAll(".interactive-skill-pill").forEach(pill => {
        pill.addEventListener("click", (e) => {
          e.stopPropagation();
          const sId = pill.getAttribute("data-skill-id");
          const sDef = constituentSkills.find(s => s.id === sId);
          if (!sDef) return;
          const skillDef = {
            id: sDef.id,
            name: sDef.name,
            stat: sDef.stat,
            groupId: sg.id,
            groupName: sg.name,
            costPerLevel: 1,
            description: sDef.description
          };
          if (activeContainerTarget) {
            currentCharacter.addContainerTrait(activeContainerTarget, "skills", skillDef, 1);
            showToast(`Added skill "${sDef.name}" (Level 1, 1 CP) to ${targetName}`);
            clearActiveContainerTarget();
          } else {
            currentCharacter.addSkill(skillDef, 1);
            showToast(`Added skill "${sDef.name}" (Level 1, 1 CP)`);
          }
          renderBuilderSkillGroups();
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);
          closeModal("modal-add-skill");
        });
      });

      listEl.appendChild(card);
    });
  }

  // Custom Skill or Skill Group setup
  const customSkillKind = document.getElementById("custom-skill-kind");
  const customGroupFields = document.getElementById("custom-skill-group-fields");
  const customIndivFields = document.getElementById("custom-skill-individual-fields");
  if (customSkillKind && customGroupFields && customIndivFields) {
    customSkillKind.addEventListener("change", () => {
      if (customSkillKind.value === "group") {
        customGroupFields.style.display = "grid";
        customIndivFields.style.display = "none";
        document.getElementById("btn-save-custom-skill").textContent = "Add Custom Skill Group";
      } else {
        customGroupFields.style.display = "none";
        customIndivFields.style.display = "grid";
        document.getElementById("btn-save-custom-skill").textContent = "Add Custom Skill";
      }
    });
  }

  // Custom Skill or Skill Group creation
  document.getElementById("btn-save-custom-skill").addEventListener("click", () => {
    const name = document.getElementById("custom-skill-name").value.trim();
    if (!name) {
      alert("Please enter a name for the custom skill or skill group.");
      return;
    }
    const kind = customSkillKind ? customSkillKind.value : "skill";
    const desc = document.getElementById("custom-skill-desc").value.trim();
    const targetName = activeContainerTarget ? (currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container") : "Character";

    if (kind === "skill") {
      const stat = document.getElementById("custom-skill-stat").value;
      const rank = parseInt(document.getElementById("custom-indiv-skill-rank").value, 10) || 1;
      const spec = document.getElementById("custom-skill-spec").value.trim();
      const customSkillDef = {
        id: "custom_sk_" + Date.now(),
        name,
        stat,
        level: Math.min(6, rank),
        costPerLevel: 1,
        specialization: spec,
        description: desc
      };

      if (activeContainerTarget) {
        currentCharacter.addContainerTrait(activeContainerTarget, "skills", customSkillDef, rank, name, desc, spec);
        showToast(`Added custom skill "${name}" to ${targetName}`);
        clearActiveContainerTarget();
      } else {
        currentCharacter.addSkill(customSkillDef, rank, spec);
        showToast(`Added custom skill "${name}"`);
      }
    } else {
      const tier = document.getElementById("custom-skill-tier").value;
      const rank = parseInt(document.getElementById("custom-skill-rank").value, 10) || 1;
      const costPerLevel = tier === "background" ? 1 : (tier === "field" ? 2 : 3);

      const customSgDef = {
        id: "custom_sg_" + Date.now(),
        name,
        tier,
        costPerLevel,
        maxLevel: 6,
        description: desc
      };

      if (activeContainerTarget) {
        currentCharacter.addContainerTrait(activeContainerTarget, "skillGroups", customSgDef, rank);
        showToast(`Added custom skill group "${name}" to ${targetName}`);
        clearActiveContainerTarget();
      } else {
        currentCharacter.addSkillGroup(customSgDef, rank);
        showToast(`Added custom skill group "${name}"`);
      }
    }

    renderBuilderSkillGroups();
    renderBuilderAttributes();
    renderDerivedStats();
    renderPointBreakdown();
    saveCurrentCharacter(true);
    closeModal("modal-add-skill");
  });

  // 3. Add Defect Modal (Table 14)
  document.getElementById("btn-add-defect").addEventListener("click", () => {
    clearActiveContainerTarget();
    renderDefectCatalog();
    openModal("modal-add-defect");
  });

  document.getElementById("defect-category-filters").querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("defect-category-filters").querySelectorAll("button").forEach(b => {
        b.classList.remove("btn-primary", "active-filter");
        b.classList.add("btn-secondary");
      });
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary", "active-filter");
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
      const matchDetail = (d.detailLabel && d.detailLabel.toLowerCase().includes(query)) ||
                          (d.detailPlaceholder && d.detailPlaceholder.toLowerCase().includes(query));
      const matchText = d.name.toLowerCase().includes(query) || d.description.toLowerCase().includes(query) || matchDetail;
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No matching standard defects found.</div>`;
      return;
    }

    filtered.forEach(defect => {
      const hasDetail = !!defect.detailLabel;

      const card = document.createElement("div");
      card.className = "catalog-item-card catalog-fullwidth-card";
      card.innerHTML = `
        <div class="catalog-card-header">
          <div class="catalog-card-title-group">
            <strong class="catalog-card-title">${escapeHtml(defect.name)}</strong>
            <span class="tag-pill">${escapeHtml(defect.category)}</span>
          </div>
          <div class="catalog-card-action-group">
            <span class="refund-badge">+${defect.refundPerRank} CP Refund / Rank</span>
            <button type="button" class="btn btn-primary btn-sm btn-catalog-add-defect" style="font-size: 12pt; white-space: nowrap;">
              + Add "${escapeHtml(defect.name)}"
            </button>
          </div>
        </div>

        <div class="catalog-card-desc">${escapeHtml(defect.description)}</div>

        ${hasDetail ? `
          <div class="catalog-detail-control-row">
            <label class="catalog-control-label">${escapeHtml(defect.detailLabel)}:</label>
            <input type="text" class="catalog-defect-detail-input form-control" placeholder="${escapeHtml(defect.detailPlaceholder || 'Enter details (e.g. Bane substance, Nemesis)...')}" style="flex: 1 1 200px; font-size: 12pt; background: var(--bg-card); color: var(--text-main);">
          </div>
        ` : ""}
      `;

      function commitAddDefect() {
        const det = hasDetail ? (card.querySelector(".catalog-defect-detail-input")?.value.trim() || "") : "";
        if (activeContainerTarget) {
          currentCharacter.addContainerTrait(activeContainerTarget, "defects", defect, 1, null, null, "", "", det);
          const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
          showToast(`Added defect "${defect.name}${det ? ` [${det}]` : ""}" to ${cName}`);
          clearActiveContainerTarget();
        } else {
          currentCharacter.addDefect(defect, 1, null, det);
          showToast(`Added defect "${defect.name}${det ? ` [${det}]` : ""}"`);
        }
        renderBuilderDefects();
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
        closeModal("modal-add-defect");
      }

      function updateAddButtonLabel() {
        const addBtn = card.querySelector(".btn-catalog-add-defect");
        if (!addBtn) return;
        const det = hasDetail ? (card.querySelector(".catalog-defect-detail-input")?.value.trim() || "") : "";
        let lbl = defect.name;
        if (det) {
          lbl += ` [${det}]`;
        }
        addBtn.textContent = `+ Add "${lbl}"`;
      }

      const detInput = card.querySelector(".catalog-defect-detail-input");
      if (detInput) {
        detInput.addEventListener("click", e => e.stopPropagation());
        detInput.addEventListener("input", () => {
          updateAddButtonLabel();
        });
        detInput.addEventListener("keydown", e => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            commitAddDefect();
          }
        });
      }

      const addBtn = card.querySelector(".btn-catalog-add-defect");
      if (addBtn) {
        addBtn.addEventListener("click", e => {
          e.stopPropagation();
          commitAddDefect();
        });
      }

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

    const customDefDef = {
      id: "custom_def_" + Date.now(),
      name,
      category: cat,
      refundPerRank,
      maxRank: 3,
      description: desc
    };

    if (activeContainerTarget) {
      currentCharacter.addContainerTrait(activeContainerTarget, "defects", customDefDef, rank, name, desc);
      const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
      showToast(`Added custom defect "${name}" to ${cName}`);
      clearActiveContainerTarget();
    } else {
      currentCharacter.addDefect(customDefDef, rank, desc);
      showToast(`Added custom defect "${name}"`);
    }

    renderBuilderDefects();
    renderBuilderAttributes();
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
        <div style="font-size: 12pt; color: var(--text-muted); margin-bottom: 0.5rem;">${escapeHtml(tmpl.concept)}</div>
        <div style="font-size: 12pt; color: var(--text-dim);">
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
          <div style="font-size: 12pt; color: var(--text-dim); margin-top: 0.25rem;">
            Player: ${escapeHtml(currentCharacter.player || "N/A")} | Campaign: ${escapeHtml(currentCharacter.campaign || "N/A")}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-primary);">
            BESM 4TH EDITION
          </div>
          <div style="font-size: 12pt; font-weight: 700; text-transform: uppercase;">
            Power Level: ${currentCharacter.tier} (${pt.totalBudget} CP Budget)
          </div>
          <div style="font-size: 12pt; color: var(--text-muted);">
            Points Spent: ${pt.netSpent} CP | Unspent: ${pt.remaining} CP
          </div>
        </div>
      </div>

      <!-- Core Stats Row -->
      <div class="sheet-stats-row">
        <div class="sheet-stat-box" style="border-color: var(--color-body);">
          <div class="sheet-stat-title" style="color: var(--color-body);">BODY</div>
          <div class="sheet-stat-num" style="color: var(--color-body);">${currentCharacter.stats.body}</div>
          <div style="font-size: 12pt; color: var(--text-muted);">${currentCharacter.calculateStatCost(currentCharacter.stats.body)} CP • Strength & Agility</div>
        </div>
        <div class="sheet-stat-box" style="border-color: var(--color-mind);">
          <div class="sheet-stat-title" style="color: var(--color-mind);">MIND</div>
          <div class="sheet-stat-num" style="color: var(--color-mind);">${currentCharacter.stats.mind}</div>
          <div style="font-size: 12pt; color: var(--text-muted);">${currentCharacter.calculateStatCost(currentCharacter.stats.mind)} CP • Intellect & Tactics</div>
        </div>
        <div class="sheet-stat-box" style="border-color: var(--color-soul);">
          <div class="sheet-stat-title" style="color: var(--color-soul);">SOUL</div>
          <div class="sheet-stat-num" style="color: var(--color-soul);">${currentCharacter.stats.soul}</div>
          <div style="font-size: 12pt; color: var(--text-muted);">${currentCharacter.calculateStatCost(currentCharacter.stats.soul)} CP • Spirit & Willpower</div>
        </div>
      </div>

      <!-- Derived & Combat Stats Grid -->
      <div class="sheet-derived-grid">
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">COMBAT VALUE (CV)</div>
          <div style="font-size: 1.4rem; font-weight: 800;">${derived.baseCV}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">ATTACK CV (ACV)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">${derived.acv}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">DEFENCE CV (DCV)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">${derived.dcv}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">HEALTH (HP)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-health);">${currentCharacter.currentHealth} / ${derived.maxHealth}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">ENERGY (EP)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-energy);">${currentCharacter.currentEnergy} / ${derived.maxEnergy}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">DAMAGE MULT (DM)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-warning);">${derived.damageMultiplier} (${derived.meleeDamageMultiplier} Melee)</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">ARMOUR RATING (AR)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">${derived.armorRating}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12pt; font-weight: 700; color: var(--text-muted);">SHOCK THRESHOLD</div>
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
        if (a.isContainer) {
          const cpInfo = currentCharacter.getContainerPoints(a);
          let costStr = `${cpInfo.effectiveCharacterCost} CP`;
          let detailStr = escapeHtml(a.customDesc || "");
          if (a.containerType === "chassis") {
            detailStr += ` (Chassis: Contained ${cpInfo.netContainedPoints} CP &rarr; 1/2 net cost applied)`;
          } else if (a.containerType === "item" || a.id.startsWith("item")) {
            detailStr += ` (Item: Contained ${cpInfo.netContainedPoints} CP &rarr; 1/2 net cost applied)`;
          } else if (a.containerType === "companion" || a.containerType === "alternate_form") {
            detailStr += ` (${a.containerType === "companion" ? "Companion" : "Alt Form"}: ${cpInfo.budgetAllowance} CP Budget, ${cpInfo.netContainedPoints} CP spent, ${cpInfo.remainingBudget} CP left)`;
          }

          html += `
            <tr style="background: rgba(6, 182, 212, 0.08); font-weight: bold;">
              <td><strong>📦 ${escapeHtml(a.name)}</strong> <span class="tag-pill">${(a.containerType || "container").toUpperCase()}</span></td>
              <td>Level ${a.level}</td>
              <td>${costStr}</td>
              <td>${detailStr}</td>
            </tr>
          `;

          // Container Stats
          if (a.containerStats && (a.containerStats.body > 0 || a.containerStats.mind > 0 || a.containerStats.soul > 0)) {
            const cDerived = currentCharacter.getContainerDerived(a.id);
            html += `
              <tr style="font-size: 12pt; color: var(--text-muted);">
                <td style="padding-left: 1.5rem;">↳ <em>Stats</em></td>
                <td colspan="2">Body ${a.containerStats.body}, Mind ${a.containerStats.mind}, Soul ${a.containerStats.soul} (${cpInfo.statsCost} CP)</td>
                <td>CV ${cDerived?.baseCV || 0}, ACV ${cDerived?.acv || 0}, DCV ${cDerived?.dcv || 0} | HP ${cDerived?.maxHealth || 0}, EP ${cDerived?.maxEnergy || 0}, AR ${cDerived?.armorRating || 0}</td>
              </tr>
            `;
          }

          // Container sub-traits
          const traits = a.containerTraits || {};
          (traits.attributes || []).forEach(ca => {
            const def = BESM4E_RULES.getAttributeDef(ca.attributeId || ca.id);
            const desc = ca.customDesc || (def ? def.description : "");
            let caDisplayName = ca.name;
            if (ca.subTrait) caDisplayName += ` (${ca.subTrait})`;
            if (ca.detail) caDisplayName += ` [${ca.detail}]`;
            html += `
              <tr style="font-size: 12pt; color: var(--text-muted);">
                <td style="padding-left: 1.5rem;">↳ <em>Attribute:</em> ${escapeHtml(caDisplayName)}</td>
                <td>Level ${ca.level}</td>
                <td>${ca.level * ca.costPerLevel} CP</td>
                <td>${escapeHtml(desc)}</td>
              </tr>
            `;
          });
          (traits.skillGroups || []).forEach(cs => {
            const constituentSkills = BESM4E_RULES.getConstituentSkills(cs.id);
            const skillNames = constituentSkills.map(s => `${s.name} (${s.stat})`).join(", ");
            html += `
              <tr style="font-size: 12pt; color: var(--text-muted);">
                <td style="padding-left: 1.5rem;">↳ <em>Skill:</em> ${escapeHtml(cs.name)} Group</td>
                <td>Level ${cs.level}</td>
                <td>${cs.level * cs.costPerLevel} CP</td>
                <td>+${cs.level} to roll${skillNames ? ` • Constituents: ${escapeHtml(skillNames)}` : ""}</td>
              </tr>
            `;
          });
          (traits.skills || []).forEach(csk => {
            const def = BESM4E_RULES.getSkillDef(csk.id);
            const desc = csk.customDesc || (def ? def.description : "");
            const spec = csk.specialization ? ` (${csk.specialization})` : "";
            html += `
              <tr style="font-size: 12pt; color: var(--text-muted);">
                <td style="padding-left: 1.5rem;">↳ <em>Skill:</em> ${escapeHtml(csk.name)}${escapeHtml(spec)} [${escapeHtml(csk.stat || "Mind")}]</td>
                <td>Level ${csk.level}</td>
                <td>${csk.level * (csk.costPerLevel || 1)} CP</td>
                <td>+${csk.level} to roll${desc ? ` • ${escapeHtml(desc)}` : ""}</td>
              </tr>
            `;
          });
          (traits.defects || []).forEach(cd => {
            const def = BESM4E_RULES.getDefectDef(cd.defectId || cd.id);
            const desc = cd.customDesc || (def ? def.description : "");
            let cdDisplayName = cd.name;
            if (cd.detail) cdDisplayName += ` [${cd.detail}]`;
            html += `
              <tr style="font-size: 12pt; color: var(--color-success);">
                <td style="padding-left: 1.5rem;">↳ <em>Defect:</em> ${escapeHtml(cdDisplayName)}</td>
                <td>Rank ${cd.rank}</td>
                <td>-${cd.rank * cd.refundPerRank} CP</td>
                <td>${escapeHtml(desc)}</td>
              </tr>
            `;
          });
          (traits.weapons || []).forEach(cw => {
            const enhText = cw.enhancements && cw.enhancements !== "None" ? `Enhancements: ${cw.enhancements}` : "";
            const limText = cw.limiters && cw.limiters !== "None" ? `Limiters: ${cw.limiters}` : "";
            const tagsDesc = [enhText, limText].filter(Boolean).join(" | ") || "Standard";
            html += `
              <tr style="font-size: 12pt; color: var(--text-muted);">
                <td style="padding-left: 1.5rem;">↳ <em>Weapon:</em> ${escapeHtml(cw.name)}</td>
                <td>Level ${cw.level}</td>
                <td>${cw.level * 2} CP value</td>
                <td>Range: ${escapeHtml(cw.range)} | ${escapeHtml(tagsDesc)}</td>
              </tr>
            `;
          });
        } else {
          let aDisplayName = a.name;
          if (a.subTrait) aDisplayName += ` (${a.subTrait})`;
          if (a.detail) aDisplayName += ` [${a.detail}]`;
          html += `
            <tr>
              <td><strong>${escapeHtml(aDisplayName)}</strong></td>
              <td>Level ${a.level}</td>
              <td>${a.level * a.costPerLevel} CP</td>
              <td>${escapeHtml(a.customDesc)}</td>
            </tr>
          `;
        }
      });
    }

    html += `
        </tbody>
      </table>

      <!-- Skills & Skill Groups Table -->
      <div class="sheet-section-title">Skills & Skill Groups (${pt.skillGroupsTotal + (pt.skillsTotal || 0)} CP)</div>
      <table class="sheet-table">
        <thead>
          <tr>
            <th style="width: 35%;">Skill / Group</th>
            <th style="width: 15%;">Type / Stat</th>
            <th style="width: 15%;">Roll Bonus</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
    `;

    const hasAnySkills = currentCharacter.skillGroups.length > 0 || (currentCharacter.skills && currentCharacter.skills.length > 0);
    if (!hasAnySkills) {
      html += `<tr><td colspan="4" style="color: var(--text-dim); text-align: center;">No skills or skill groups learned.</td></tr>`;
    } else {
      currentCharacter.skillGroups.forEach(s => {
        const constituentSkills = BESM4E_RULES.getConstituentSkills(s.id);
        const skillNames = constituentSkills.map(sk => `${sk.name} (${sk.stat})`).join(", ");
        html += `
          <tr>
            <td>
              <strong>${escapeHtml(s.name)} Group</strong>
              ${skillNames ? `<div style="font-size: 12pt; color: var(--text-muted); margin-top: 0.2rem;">Constituents: ${escapeHtml(skillNames)}</div>` : ""}
            </td>
            <td>Group (${escapeHtml((s.tier || "field").toUpperCase())})</td>
            <td>+${s.level}</td>
            <td>${s.level * s.costPerLevel} CP</td>
          </tr>
        `;
      });
      (currentCharacter.skills || []).forEach(sk => {
        const spec = sk.specialization ? ` (${sk.specialization})` : "";
        html += `
          <tr>
            <td>
              <strong>${escapeHtml(sk.name)}${escapeHtml(spec)}</strong>
              ${sk.customDesc ? `<div style="font-size: 12pt; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(sk.customDesc)}</div>` : ""}
            </td>
            <td>Skill (${escapeHtml(sk.stat || "Mind")})</td>
            <td>+${sk.level}</td>
            <td>${sk.level * (sk.costPerLevel || 1)} CP</td>
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
        const def = BESM4E_RULES.getDefectDef(d.defectId || d.id);
        const desc = d.customDesc || (def ? def.description : "");
        let dDisplayName = d.name;
        if (d.detail) dDisplayName += ` [${d.detail}]`;
        html += `
          <tr>
            <td><strong>${escapeHtml(dDisplayName)}</strong></td>
            <td>+${d.rank * d.refundPerRank} CP (Rank ${d.rank})</td>
            <td>${escapeHtml(desc)}</td>
          </tr>
        `;
      });
    }

    html += `
        </tbody>
      </table>
    `;

    // Weapons Table (Character weapons + Container weapons)
    const allWeapons = currentCharacter.getAllWeapons();
    if (allWeapons.length > 0) {
      html += `
        <div class="sheet-section-title">Weapons & Attacks</div>
        <table class="sheet-table">
          <thead>
            <tr>
              <th style="width: 25%;">Weapon</th>
              <th style="width: 12%;">Level</th>
              <th style="width: 18%;">Base Damage</th>
              <th style="width: 15%;">Range</th>
              <th>Properties & Source</th>
            </tr>
          </thead>
          <tbody>
      `;
      allWeapons.forEach(w => {
        const isMelee = (w.range || "").toLowerCase().includes("melee");
        const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
        const dmg = w.level * dm;
        const sourceBadge = w.containerName ? `<span class="tag-pill" style="color: var(--accent-primary);">${escapeHtml(w.containerName)}</span>` : "";
        const enhText = w.enhancements && w.enhancements !== "None" ? `Enhancements: ${w.enhancements}` : "";
        const limText = w.limiters && w.limiters !== "None" ? `Limiters: ${w.limiters}` : "";
        const tagsDesc = [enhText, limText].filter(Boolean).join(" | ") || "Standard";
        html += `
          <tr>
            <td><strong>${escapeHtml(w.name)}</strong></td>
            <td>Level ${w.level}</td>
            <td><strong>${dmg}</strong> (${w.level} × ${dm} DM)</td>
            <td>${escapeHtml(w.range)}</td>
            <td>${sourceBadge} ${escapeHtml(tagsDesc)}</td>
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
        <div style="font-size: 12pt; line-height: 1.5; margin-bottom: 1.25rem;">
          ${escapeHtml(currentCharacter.gear).replace(/\n/g, "<br>")}
        </div>
      `;
    }

    // Background & Notes
    if (currentCharacter.backstory || currentCharacter.appearance || currentCharacter.alliesEnemies) {
      html += `
        <div class="sheet-section-title">Character Background & Narrative</div>
        <div style="font-size: 12pt; line-height: 1.5; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
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

    // Quick Skill Groups & Individual Skills Roll Grid
    const skillsGrid = document.getElementById("play-skills-grid");
    skillsGrid.innerHTML = "";
    const hasAnyRollSkills = currentCharacter.skillGroups.length > 0 || (currentCharacter.skills && currentCharacter.skills.length > 0);
    if (!hasAnyRollSkills) {
      skillsGrid.innerHTML = `<div style="font-size: 12pt; color: var(--text-dim); grid-column: span 2;">No skills configured.</div>`;
    } else {
      currentCharacter.skillGroups.forEach(sg => {
        const constituentSkills = BESM4E_RULES.getConstituentSkills(sg.id);
        const skillList = constituentSkills.map(s => s.name).join(", ");
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary btn-sm quick-roll-btn";
        btn.textContent = `${sg.name} (+${sg.level})`;
        if (skillList) btn.title = `Covers: ${skillList}`;
        btn.addEventListener("click", () => {
          triggerRoll({
            label: `${sg.name} Skill Check`,
            modifier: sg.level,
            targetNumber: 10
          });
        });
        skillsGrid.appendChild(btn);
      });

      (currentCharacter.skills || []).forEach(sk => {
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary btn-sm quick-roll-btn";
        const spec = sk.specialization ? ` (${sk.specialization})` : "";
        btn.textContent = `${sk.name}${spec} (+${sk.level})`;
        if (sk.customDesc) btn.title = `${sk.stat} Skill: ${sk.customDesc}`;
        btn.addEventListener("click", () => {
          triggerRoll({
            label: `${sk.name}${spec} (${sk.stat || "Mind"}) Skill Check`,
            modifier: sk.level,
            targetNumber: 10
          });
        });
        skillsGrid.appendChild(btn);
      });
    }

    // Also add container skills and skill groups if any (e.g. Companion skills)
    currentCharacter.attributes.forEach(attr => {
      if (attr.isContainer && attr.containerTraits) {
        (attr.containerTraits.skillGroups || []).forEach(cs => {
          const constituentSkills = BESM4E_RULES.getConstituentSkills(cs.id);
          const skillList = constituentSkills.map(s => s.name).join(", ");
          const btn = document.createElement("button");
          btn.className = "btn btn-secondary btn-sm quick-roll-btn";
          btn.textContent = `${cs.name} [${attr.name}] (+${cs.level})`;
          if (skillList) btn.title = `Covers: ${skillList} (${attr.name})`;
          btn.addEventListener("click", () => {
            triggerRoll({
              label: `${cs.name} (${attr.name}) Skill Check`,
              modifier: cs.level,
              targetNumber: 10
            });
          });
          skillsGrid.appendChild(btn);
        });

        (attr.containerTraits.skills || []).forEach(csk => {
          const btn = document.createElement("button");
          btn.className = "btn btn-secondary btn-sm quick-roll-btn";
          const spec = csk.specialization ? ` (${csk.specialization})` : "";
          btn.textContent = `${csk.name}${spec} [${attr.name}] (+${csk.level})`;
          if (csk.customDesc) btn.title = `${csk.stat} Skill: ${csk.customDesc} (${attr.name})`;
          btn.addEventListener("click", () => {
            triggerRoll({
              label: `${csk.name}${spec} [${attr.name}] Skill Check`,
              modifier: csk.level,
              targetNumber: 10
            });
          });
          skillsGrid.appendChild(btn);
        });
      }
    });

    // Quick Weapons & Attacks List (Character weapons + Container weapons)
    const weaponsListEl = document.getElementById("play-weapons-list");
    if (weaponsListEl) {
      weaponsListEl.innerHTML = "";
      const allWeapons = currentCharacter.getAllWeapons();
      if (allWeapons.length === 0) {
        weaponsListEl.innerHTML = `<div style="font-size: 12pt; color: var(--text-dim);">No weapons or custom attacks configured.</div>`;
      } else {
        allWeapons.forEach(w => {
          const isMelee = (w.range || "").toLowerCase().includes("melee");
          const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
          const dmg = w.level * dm;
          const sourceBadge = w.containerName ? `<span class="tag-pill" style="color: var(--accent-primary);">${escapeHtml(w.containerName)}</span>` : "";
          const enhText = w.enhancements && w.enhancements !== "None" ? `✨ ${w.enhancements}` : "";
          const limText = w.limiters && w.limiters !== "None" ? `⚠️ ${w.limiters}` : "";
          const tagsDesc = [enhText, limText].filter(Boolean).join(" | ") || "Standard Properties";

          const row = document.createElement("div");
          row.className = "item-row";
          row.style.padding = "0.4rem 0.6rem";
          row.innerHTML = `
            <div class="item-info">
              <div class="item-name" style="font-size: 12pt;">
                ${escapeHtml(w.name)}
                ${sourceBadge}
                <span class="tag-pill" style="color: var(--color-warning);">Base Dmg: ${dmg}</span>
                <span class="tag-pill">${escapeHtml(w.range)}</span>
              </div>
              <div class="item-sub" style="font-size: 12pt;">${escapeHtml(tagsDesc)}</div>
            </div>
            <div class="item-controls">
              <button type="button" class="btn btn-secondary btn-sm quick-roll-btn btn-roll-wpn">
                ⚔️ Roll Attack (ACV +${derived.acv})
              </button>
            </div>
          `;
          row.querySelector(".btn-roll-wpn").addEventListener("click", () => {
            triggerRoll({
              label: `${w.name} Attack Check`,
              modifier: derived.acv,
              targetNumber: 10
            });
          });
          weaponsListEl.appendChild(row);
        });
      }
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
        <td style="padding: 0.4rem 0.5rem; color: var(--text-muted); font-size: 12pt;">${escapeHtml(log.date)}</td>
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
  initWeaponChips();
  populateCharacterDropdown();
  refreshAll();
});
