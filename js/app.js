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
    if (modalId === "modal-add-attribute" || modalId === "modal-add-skill" || modalId === "modal-add-defect" || modalId === "modal-add-weapon") {
      ["modal-add-attribute", "modal-add-skill", "modal-add-defect", "modal-add-weapon"].forEach(id => {
        if (id !== modalId) {
          const other = document.getElementById(id);
          if (other) other.classList.remove("open");
        }
      });
    }
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("open");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
      clearActiveContainerTarget();
    }
  }

  function showTraitInfoModal(traitDef, typeName) {
    if (!traitDef) return;
    const modal = document.getElementById("modal-trait-info");
    if (!modal) return;

    const titleEl = document.getElementById("trait-info-modal-title");
    const badgeEl = document.getElementById("trait-info-modal-badge");
    const costEl = document.getElementById("trait-info-modal-cost");
    const descEl = document.getElementById("trait-info-modal-desc");
    const sourceEl = document.getElementById("trait-info-modal-source");

    const isEnh = (typeName && typeName.toLowerCase().includes("enhancement")) || traitDef.costPerRank !== undefined;
    const icon = isEnh ? "✨ " : "⚠️ ";

    if (titleEl) titleEl.textContent = `${icon}${traitDef.name}`;
    if (badgeEl) {
      badgeEl.textContent = typeName || (isEnh ? "Enhancement" : "Limiter");
      badgeEl.className = isEnh ? "tag-pill modifier-pill-enhancement" : "tag-pill modifier-pill-limiter";
      badgeEl.style.fontWeight = "700";
      badgeEl.style.fontSize = "12pt";
    }
    if (costEl) {
      if (isEnh) {
        costEl.textContent = `+${traitDef.costPerRank || 1} CP / Rank${traitDef.maxRank ? ` (Max Rk: ${traitDef.maxRank})` : ""}`;
        costEl.style.color = "#10b981";
      } else {
        costEl.textContent = `-${traitDef.refundPerRank || 1} CP / Rank Refund${traitDef.maxRank ? ` (Max Rk: ${traitDef.maxRank})` : ""}`;
        costEl.style.color = "#ef4444";
      }
      costEl.style.fontWeight = "700";
      costEl.style.fontSize = "12pt";
    }
    if (descEl) {
      descEl.textContent = traitDef.description || "No detailed rules description available.";
      descEl.style.fontSize = "12pt";
    }
    if (sourceEl) {
      const srcText = traitDef.source === "extras" ? "BESM Extras Rulebook" : "BESM 4th Edition Core Rulebook";
      sourceEl.textContent = `Source: ${srcText}`;
      sourceEl.style.fontSize = "12pt";
    }

    openModal("modal-trait-info");
  }

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("open");
        clearActiveContainerTarget();
      }
    });
  });

  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-backdrop");
      if (modal) {
        modal.classList.remove("open");
        clearActiveContainerTarget();
      }
    });
  });

  // ========================================================================
  // Container Context Targeting (Item, Companion, Minions, Alternate Form)
  // ========================================================================
  let activeContainerTarget = null;

  function setActiveContainerTarget(attrId) {
    if (!attrId) {
      clearActiveContainerTarget();
      return;
    }
    const container = currentCharacter ? currentCharacter.getContainerAttribute(attrId) : null;
    if (!container || !container.isContainer) {
      clearActiveContainerTarget();
      return;
    }
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
          <span>📦 Adding to: <strong>${escapeHtml(container.name)}</strong> <span class="tag-pill" style="font-size: 12pt;">${cType}</span></span>
          <button type="button" class="btn-cancel-container-target" title="Remove target: Add to Character instead">✕</button>
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
      BESM4EStorage.clearCurrentFileHandle();
      currentCharacter = loaded;
      BESM4EStorage.setActiveId(selectedId);
      refreshAll();
      showToast(`Loaded "${currentCharacter.name || "Untitled Character"}"`);
    }
  });

  // Character Manager Modal
  // ========================================================================
  // Conventional Character File Manager (Save & Load Dialog)
  // ========================================================================
  function updateDefaultFolderDisplay() {
    const folderName = BESM4EStorage.getDefaultFolderName();
    const folderDisplays = [
      document.getElementById("dialog-default-folder-path"),
      document.getElementById("settings-folder-display")
    ];
    const clearBtns = [
      document.getElementById("btn-clear-save-folder"),
      document.getElementById("btn-settings-clear-folder")
    ];

    folderDisplays.forEach(el => {
      if (!el) return;
      if (folderName) {
        el.textContent = `📁 ${folderName}`;
        el.style.color = "var(--accent-primary)";
      } else {
        el.textContent = "Not set (Browser Default)";
        el.style.color = "var(--text-muted)";
      }
    });

    clearBtns.forEach(btn => {
      if (!btn) return;
      btn.style.display = folderName ? "inline-flex" : "none";
    });

    const inputPath = document.getElementById("input-folder-path");
    if (inputPath && !inputPath.matches(":focus")) {
      inputPath.value = folderName || "";
    }
  }

  function openSaveLoadDialog(initialTab = "tab-save-char") {
    readFormValues();
    updateDefaultFolderDisplay();

    // Update Save Tab Preview & Filename
    const namePreview = document.getElementById("save-char-name-preview");
    if (namePreview) {
      namePreview.textContent = currentCharacter.name || "Untitled Character";
    }
    const filenameInput = document.getElementById("save-filename-input");
    if (filenameInput) {
      filenameInput.value = BESM4EStorage.getCurrentFileName() || BESM4EStorage.formatSafeFilename(currentCharacter, ".besm4e");
    }

    switchSaveLoadTab(initialTab);
    renderCharacterManagerList();
    openModal("modal-saveload");
  }

  function switchSaveLoadTab(targetTabId) {
    document.querySelectorAll(".saveload-tab-btn").forEach(btn => {
      const tab = btn.getAttribute("data-saveload-tab");
      if (tab === targetTabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    document.querySelectorAll(".saveload-tab-content").forEach(content => {
      if (content.id === targetTabId) {
        content.style.display = "block";
        content.classList.add("active");
      } else {
        content.style.display = "none";
        content.classList.remove("active");
      }
    });
  }

  document.querySelectorAll(".saveload-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-saveload-tab");
      switchSaveLoadTab(tab);
    });
  });

  // ========================================================================
  // Default Save Folder Management & System Folder Tree Browser
  // ========================================================================
  function openFolderSettingsModal() {
    updateDefaultFolderDisplay();
    const inputPath = document.getElementById("input-folder-path");
    if (inputPath) {
      inputPath.value = BESM4EStorage.getDefaultFolderName() || "";
    }
    openModal("modal-folder-settings");
  }

  async function handleBrowseDefaultFolder() {
    // 1. Try modern File System Access API
    if (typeof window !== "undefined" && window.showDirectoryPicker) {
      try {
        const res = await BESM4EStorage.selectDefaultSaveFolder();
        if (res && res.success) {
          updateDefaultFolderDisplay();
          showToast(`Default save folder set to "${res.folderName}"`);
          closeModal("modal-folder-settings");
          return;
        } else if (res && res.cancelled) {
          return;
        }
      } catch (err) {
        console.warn("showDirectoryPicker failed, falling back to native folder input:", err);
      }
    }

    // 2. Fallback to native folder tree picker input (webkitdirectory / directory / mozdirectory)
    const nativePicker = document.getElementById("native-folder-picker-input");
    if (nativePicker) {
      nativePicker.click();
    }
  }

  // Native Folder Picker Change Handler (webkitdirectory)
  const nativeFolderPicker = document.getElementById("native-folder-picker-input");
  if (nativeFolderPicker) {
    nativeFolderPicker.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const firstFile = files[0];
        const relPath = firstFile.webkitRelativePath || "";
        const parts = relPath.split(/[\/\\]/);
        const folderName = parts[0] || "Selected Folder";
        BESM4EStorage.setDefaultFolderName(folderName);
        updateDefaultFolderDisplay();
        showToast(`Default save folder set to "${folderName}" (${files.length} items detected)`);
        closeModal("modal-folder-settings");
      }
      nativeFolderPicker.value = "";
    });
  }

  const btnBrowseFolderTree = document.getElementById("btn-browse-folder-tree");
  if (btnBrowseFolderTree) {
    btnBrowseFolderTree.addEventListener("click", handleBrowseDefaultFolder);
  }

  const btnBrowseFolder = document.getElementById("btn-browse-save-folder");
  if (btnBrowseFolder) {
    btnBrowseFolder.addEventListener("click", handleBrowseDefaultFolder);
  }

  const btnHeaderFolder = document.getElementById("btn-header-set-folder");
  if (btnHeaderFolder) {
    btnHeaderFolder.addEventListener("click", openFolderSettingsModal);
  }

  const btnSaveFolderManual = document.getElementById("btn-save-folder-path");
  if (btnSaveFolderManual) {
    btnSaveFolderManual.addEventListener("click", () => {
      const pathInput = document.getElementById("input-folder-path");
      const val = pathInput ? pathInput.value.trim() : "";
      if (val) {
        BESM4EStorage.setDefaultFolderName(val);
        updateDefaultFolderDisplay();
        showToast(`Default save folder set to "${val}"`);
        closeModal("modal-folder-settings");
      } else {
        BESM4EStorage.clearDefaultFolder();
        updateDefaultFolderDisplay();
        showToast("Default folder reset to browser default");
      }
    });
  }

  document.querySelectorAll(".btn-folder-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = btn.getAttribute("data-path");
      if (p) {
        BESM4EStorage.setDefaultFolderName(p);
        updateDefaultFolderDisplay();
        showToast(`Default save folder set to "${p}"`);
        closeModal("modal-folder-settings");
      }
    });
  });

  const btnClearFolder = document.getElementById("btn-clear-save-folder");
  if (btnClearFolder) {
    btnClearFolder.addEventListener("click", () => {
      BESM4EStorage.clearDefaultFolder();
      updateDefaultFolderDisplay();
      showToast("Default folder reset to browser default");
    });
  }

  const btnSettingsClearFolder = document.getElementById("btn-settings-clear-folder");
  if (btnSettingsClearFolder) {
    btnSettingsClearFolder.addEventListener("click", () => {
      BESM4EStorage.clearDefaultFolder();
      updateDefaultFolderDisplay();
      showToast("Default folder reset to browser default");
    });
  }

  // Open Save/Load Dialog from Header
  const btnOpenLoad = document.getElementById("btn-open-load-dialog");
  if (btnOpenLoad) {
    btnOpenLoad.addEventListener("click", () => {
      openSaveLoadDialog("tab-load-char");
    });
  }

  const btnOpenCharMgr = document.getElementById("btn-open-char-mgr");
  if (btnOpenCharMgr) {
    btnOpenCharMgr.addEventListener("click", () => {
      openSaveLoadDialog("tab-library");
    });
  }

  // Save Character to File (Quick Save / File Menu Save / Ctrl+S)
  async function executeSaveFile() {
    if (!currentCharacter) return;
    readFormValues();
    saveCurrentCharacter(true);

    if (BESM4EStorage.hasCurrentFileHandle()) {
      const res = await BESM4EStorage.saveCurrentFile(currentCharacter);
      if (res && res.success) {
        showToast(`💾 Character saved to "${res.filename}"!`);
        return res;
      }
      if (res && res.cancelled) return res;
    }

    // No active file handle yet: trigger Save As picker / download
    return await executeSaveAsFile();
  }

  // Save As File from Header or Dialog
  async function executeSaveAsFile(customFilename) {
    readFormValues();
    saveCurrentCharacter(true);
    const fname = customFilename || document.getElementById("save-filename-input")?.value.trim() || BESM4EStorage.getCurrentFileName() || BESM4EStorage.formatSafeFilename(currentCharacter, ".besm4e");
    const res = await BESM4EStorage.saveBESM4EWithPicker(currentCharacter, fname);
    if (res && res.success) {
      showToast(`💾 Character saved as "${res.filename || fname}"!`);
      closeModal("modal-saveload");
    }
    return res;
  }

  const btnSaveAs = document.getElementById("btn-save-as-file");
  if (btnSaveAs) {
    btnSaveAs.addEventListener("click", () => {
      executeSaveAsFile();
    });
  }

  const btnDialogSaveFile = document.getElementById("btn-dialog-save-file");
  if (btnDialogSaveFile) {
    btnDialogSaveFile.addEventListener("click", () => {
      const fname = document.getElementById("save-filename-input")?.value.trim();
      executeSaveAsFile(fname);
    });
  }

  const btnDialogSaveLibrary = document.getElementById("btn-dialog-save-library");
  if (btnDialogSaveLibrary) {
    btnDialogSaveLibrary.addEventListener("click", () => {
      saveCurrentCharacter(false);
      renderCharacterManagerList();
      showToast(`Saved "${currentCharacter.name || "Untitled"}" to library`);
    });
  }

  // ========================================================================
  // Desktop Application Menu Bar (File Menu & Settings Menu)
  // ========================================================================
  const APP_VERSION_INFO = {
    version: "1.9.8",
    commit: "868a28d",
    releaseDate: "2026-10-07",
    repo: "captainload/besm-4e-character-editor",
    repoUrl: "https://github.com/captainload/besm-4e-character-editor"
  };

  const menuFileTrigger = document.getElementById("menu-file-trigger");
  const menuFileDropdown = document.getElementById("menu-file-dropdown");
  const menuSettingsTrigger = document.getElementById("menu-settings-trigger");
  const menuSettingsDropdown = document.getElementById("menu-settings-dropdown");

  function closeFileMenu() {
    if (menuFileDropdown && menuFileDropdown.classList.contains("show")) {
      menuFileDropdown.classList.remove("show");
      if (menuFileTrigger) menuFileTrigger.setAttribute("aria-expanded", "false");
    }
    closeSettingsMenu();
  }

  function closeSettingsMenu() {
    if (menuSettingsDropdown && menuSettingsDropdown.classList.contains("show")) {
      menuSettingsDropdown.classList.remove("show");
      if (menuSettingsTrigger) menuSettingsTrigger.setAttribute("aria-expanded", "false");
    }
  }

  function toggleFileMenu(e) {
    if (e) e.stopPropagation();
    if (!menuFileDropdown) return;
    const isExpanded = menuFileDropdown.classList.contains("show");
    if (isExpanded) {
      closeFileMenu();
    } else {
      menuFileDropdown.classList.add("show");
      if (menuFileTrigger) menuFileTrigger.setAttribute("aria-expanded", "true");
    }
  }

  function toggleSettingsMenu(e) {
    if (e) e.stopPropagation();
    if (!menuSettingsDropdown) return;
    const isExpanded = menuSettingsDropdown.classList.contains("show");
    if (isExpanded) {
      closeSettingsMenu();
    } else {
      menuSettingsDropdown.classList.add("show");
      if (menuSettingsTrigger) menuSettingsTrigger.setAttribute("aria-expanded", "true");
    }
  }

  if (menuFileTrigger) {
    menuFileTrigger.addEventListener("click", toggleFileMenu);
  }

  if (menuSettingsTrigger) {
    menuSettingsTrigger.addEventListener("click", toggleSettingsMenu);
  }

  if (menuFileDropdown) {
    menuFileDropdown.addEventListener("click", (e) => {
      // Don't close Main menu when clicking the Settings submenu trigger
      if (e.target.closest(".menu-submenu-trigger")) {
        return;
      }
      // Don't close Main menu when clicking auto-update checkbox or label
      if (e.target.closest(".menu-item-checkbox")) {
        return;
      }
      // Action buttons close the entire menu hierarchy
      if (e.target.closest(".menu-item-btn")) {
        closeFileMenu();
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-dropdown-wrap")) {
      closeFileMenu();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeFileMenu();
    }
    if (e.altKey && (e.key === "m" || e.key === "M" || e.key === "f" || e.key === "F")) {
      e.preventDefault();
      toggleFileMenu();
    }
  });

  // ========================================================================
  // Version Comparison & GitHub Update System
  // ========================================================================
  let updateCheckTimer = null;
  const AUTO_UPDATE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes = 900,000 ms
  const GITHUB_RAW_VERSION_URL = "https://raw.githubusercontent.com/captainload/besm-4e-character-editor/main/version.json";
  const GITHUB_API_COMMITS_URL = "https://api.github.com/repos/captainload/besm-4e-character-editor/commits/main";

  function compareSemver(v1, v2) {
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

  function setUpdateAvailableState(remote) {
    const brandLogo = document.getElementById("brand-logo");
    const btnBrandUpdate = document.getElementById("btn-brand-update");
    if (brandLogo) brandLogo.style.display = "none";
    if (btnBrandUpdate) {
      btnBrandUpdate.style.display = "inline-flex";
      btnBrandUpdate.classList.add("glowing-update");
      const verText = remote.version ? `v${remote.version}` : (remote.commit ? `(${remote.commit})` : "");
      btnBrandUpdate.title = `⚡ BESM 4E Update Available ${verText}! Click to view release notes and update instructions.`;
    }

    const curVerEl = document.getElementById("update-current-version");
    const latVerEl = document.getElementById("update-latest-version");
    const notesEl = document.getElementById("update-release-notes");
    const titleEl = document.getElementById("update-modal-title");
    const iconEl = document.getElementById("update-modal-icon");
    const headerEl = document.getElementById("update-modal-header");
    const instrBox = document.getElementById("update-instructions-box");
    const reloadBtn = document.getElementById("btn-update-reload-page");

    if (titleEl) titleEl.textContent = "New Version Available!";
    if (iconEl) iconEl.textContent = "🚀";
    if (headerEl) headerEl.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))";
    if (instrBox) instrBox.style.display = "block";
    if (reloadBtn) reloadBtn.style.display = "inline-flex";

    const curCommitText = APP_VERSION_INFO.commit ? ` (${APP_VERSION_INFO.commit.slice(0, 7)})` : "";
    if (curVerEl) curVerEl.textContent = `v${APP_VERSION_INFO.version}${curCommitText}`;
    const latCommitText = remote.commit ? ` (${remote.commit.slice(0, 7)})` : "";
    const displayLatest = remote.version ? `v${remote.version}${latCommitText}` : (remote.commit ? `Commit ${remote.commit.slice(0, 7)}` : "Newer Version");
    if (latVerEl) latVerEl.textContent = displayLatest;
    if (notesEl) notesEl.textContent = remote.notes || remote.latestCommitMessage || "A new release or update is available on GitHub.";
  }

  function setUpToDateState(remote) {
    const curVerEl = document.getElementById("update-current-version");
    const latVerEl = document.getElementById("update-latest-version");
    const notesEl = document.getElementById("update-release-notes");
    const titleEl = document.getElementById("update-modal-title");
    const iconEl = document.getElementById("update-modal-icon");
    const headerEl = document.getElementById("update-modal-header");
    const instrBox = document.getElementById("update-instructions-box");
    const reloadBtn = document.getElementById("btn-update-reload-page");

    if (titleEl) titleEl.textContent = "You're Up to Date!";
    if (iconEl) iconEl.textContent = "✅";
    if (headerEl) headerEl.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))";
    if (instrBox) instrBox.style.display = "none";
    if (reloadBtn) reloadBtn.style.display = "none";

    const curCommitText = APP_VERSION_INFO.commit ? ` (${APP_VERSION_INFO.commit.slice(0, 7)})` : "";
    if (curVerEl) curVerEl.textContent = `v${APP_VERSION_INFO.version}${curCommitText}`;
    if (latVerEl) latVerEl.textContent = `v${APP_VERSION_INFO.version}${curCommitText} (Latest)`;
    if (notesEl) notesEl.textContent = `You are running the latest version of BESM 4E: Character Architect (v${APP_VERSION_INFO.version}${curCommitText}). No updates are currently needed.`;
  }

  function setUpdateErrorState(errMsg) {
    const curVerEl = document.getElementById("update-current-version");
    const latVerEl = document.getElementById("update-latest-version");
    const notesEl = document.getElementById("update-release-notes");
    const titleEl = document.getElementById("update-modal-title");
    const iconEl = document.getElementById("update-modal-icon");
    const headerEl = document.getElementById("update-modal-header");
    const instrBox = document.getElementById("update-instructions-box");
    const reloadBtn = document.getElementById("btn-update-reload-page");

    if (titleEl) titleEl.textContent = "Update Check Status";
    if (iconEl) iconEl.textContent = "ℹ️";
    if (headerEl) headerEl.style.background = "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))";
    if (instrBox) instrBox.style.display = "none";
    if (reloadBtn) reloadBtn.style.display = "none";

    if (curVerEl) curVerEl.textContent = `v${APP_VERSION_INFO.version}`;
    if (latVerEl) latVerEl.textContent = "Unavailable";
    if (notesEl) notesEl.textContent = `Could not connect to GitHub repository (${errMsg || 'Network / offline'}).\n\nIf you are offline or behind a firewall, you can view the repository directly at:\nhttps://github.com/captainload/besm-4e-character-editor`;
  }

  function resetUpdateState() {
    const brandLogo = document.getElementById("brand-logo");
    const btnBrandUpdate = document.getElementById("btn-brand-update");
    if (brandLogo) brandLogo.style.display = "";
    if (btnBrandUpdate) {
      btnBrandUpdate.style.display = "none";
      btnBrandUpdate.classList.remove("glowing-update");
    }
  }

  async function fetchRemoteVersionInfo(isManual = false) {
    const fetchFromContentsApi = async () => {
      try {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;
        const resContents = await fetch("https://api.github.com/repos/captainload/besm-4e-character-editor/contents/version.json", {
          cache: "no-store",
          headers: { "Accept": "application/vnd.github.v3+json" },
          signal: controller ? controller.signal : undefined
        });
        if (timeoutId) clearTimeout(timeoutId);
        if (resContents.ok) {
          const fileData = await resContents.json();
          if (fileData && fileData.content) {
            let decoded = "";
            if (typeof atob === "function") {
              decoded = atob(fileData.content.replace(/\s/g, ""));
            } else if (typeof Buffer !== "undefined") {
              decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
            }
            const data = JSON.parse(decoded);
            if (data && data.version) {
              return data;
            }
          }
        }
      } catch (e) {
        console.warn("Contents API warning:", e);
      }
      return null;
    };

    const fetchFromRawGithub = async () => {
      try {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;
        const res = await fetch(`${GITHUB_RAW_VERSION_URL}?_t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Accept": "application/json" },
          signal: controller ? controller.signal : undefined
        });
        if (timeoutId) clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            return data;
          }
        }
      } catch (e) {
        console.warn("Raw GitHub warning:", e);
      }
      return null;
    };

    // On manual check, prioritize Contents API for instantaneous zero-cache results;
    // On automated 15-min background check, prioritize raw GitHub for unmetered requests.
    const primaryFetch = isManual ? fetchFromContentsApi : fetchFromRawGithub;
    const fallbackFetch = isManual ? fetchFromRawGithub : fetchFromContentsApi;

    let result = await primaryFetch();
    if (result && result.version) return result;

    result = await fallbackFetch();
    if (result && result.version) return result;

    // 3. Try GitHub Releases API as last resort
    try {
      const controller3 = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId3 = controller3 ? setTimeout(() => controller3.abort(), 6000) : null;
      const resReleases = await fetch("https://api.github.com/repos/captainload/besm-4e-character-editor/releases/latest", {
        cache: "no-store",
        headers: { "Accept": "application/vnd.github.v3+json" },
        signal: controller3 ? controller3.signal : undefined
      });
      if (timeoutId3) clearTimeout(timeoutId3);
      if (resReleases.ok) {
        const relData = await resReleases.json();
        if (relData && relData.tag_name) {
          return {
            version: relData.tag_name.replace(/^v/, ""),
            releaseDate: relData.published_at ? relData.published_at.split("T")[0] : "",
            notes: relData.body || relData.name || "Latest release from GitHub."
          };
        }
      }
    } catch (e) {
      console.warn("Releases API fallback warning:", e);
    }

    throw new Error("Unable to connect to GitHub repository.");
  }

  async function checkAppUpdates(isManual = false) {
    const btnCheck = document.getElementById("btn-check-updates");
    const originalText = btnCheck ? btnCheck.querySelector(".menu-item-text")?.textContent : "";

    if (isManual) {
      showToast("Checking GitHub for updates...");
      if (btnCheck) {
        btnCheck.disabled = true;
        const textSpan = btnCheck.querySelector(".menu-item-text");
        if (textSpan) textSpan.textContent = "Checking GitHub...";
      }
    }

    try {
      const remote = await fetchRemoteVersionInfo(isManual);
      const semverCmp = compareSemver(remote.version, APP_VERSION_INFO.version);
      const remoteCommitShort = remote.commit ? String(remote.commit).trim().slice(0, 7).toLowerCase() : "";
      const currentCommitShort = APP_VERSION_INFO.commit ? String(APP_VERSION_INFO.commit).trim().slice(0, 7).toLowerCase() : "";

      const updateFound = semverCmp > 0;

      if (updateFound) {
        setUpdateAvailableState(remote);
        if (isManual) {
          openModal("modal-app-update");
        } else {
          showToast(`⚡ Update available: v${remote.version}! Logo updated to 'Update!' button.`);
        }
      } else {
        // If current version is equal to or newer than remote, ensure normal logo state
        resetUpdateState();
        if (isManual) {
          setUpToDateState(remote);
          openModal("modal-app-update");
          showToast(`You are running the latest version of BESM 4E (v${APP_VERSION_INFO.version}).`);
        }
      }
      return { success: true, updateFound, remote };
    } catch (err) {
      if (isManual) {
        setUpdateErrorState(err.message);
        openModal("modal-app-update");
        showToast(`Could not check for updates: ${err.message || 'Network error'}`);
      }
      return { success: false, error: err.message };
    } finally {
      if (isManual && btnCheck) {
        btnCheck.disabled = false;
        const textSpan = btnCheck.querySelector(".menu-item-text");
        if (textSpan && originalText) textSpan.textContent = originalText;
      }
    }
  }

  function startAutoUpdateInterval() {
    stopAutoUpdateInterval();
    updateCheckTimer = setInterval(() => {
      checkAppUpdates(false);
    }, AUTO_UPDATE_INTERVAL_MS);
  }

  function stopAutoUpdateInterval() {
    if (updateCheckTimer) {
      clearInterval(updateCheckTimer);
      updateCheckTimer = null;
    }
  }

  function updateAboutModalStatus() {
    const isEnabled = localStorage.getItem("besm4e_auto_update_check") !== "false";
    const statusEl = document.getElementById("about-autocheck-status");
    if (statusEl) {
      statusEl.textContent = isEnabled ? "Enabled (Every 15 min)" : "Disabled";
      statusEl.style.color = isEnabled ? "#10b981" : "var(--text-muted)";
    }
    const verEl = document.getElementById("about-version-display");
    if (verEl) verEl.textContent = `v${APP_VERSION_INFO.version}`;
    const dateEl = document.getElementById("about-date-display");
    if (dateEl) dateEl.textContent = APP_VERSION_INFO.releaseDate;
    const commitEl = document.getElementById("about-commit-display");
    if (commitEl) commitEl.textContent = APP_VERSION_INFO.commit ? APP_VERSION_INFO.commit.slice(0, 7) : "";
    const curVerEl = document.getElementById("update-current-version");
    if (curVerEl) curVerEl.textContent = `v${APP_VERSION_INFO.version}`;
  }

  // Hook Settings Menu Buttons & Controls
  const btnCheckUpdates = document.getElementById("btn-check-updates");
  if (btnCheckUpdates) {
    btnCheckUpdates.addEventListener("click", () => {
      checkAppUpdates(true);
    });
  }

  const chkAutoUpdate = document.getElementById("chk-auto-update");
  const isAutoCheckEnabled = localStorage.getItem("besm4e_auto_update_check") !== "false";
  if (chkAutoUpdate) {
    chkAutoUpdate.checked = isAutoCheckEnabled;
    chkAutoUpdate.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      localStorage.setItem("besm4e_auto_update_check", enabled ? "true" : "false");
      if (enabled) {
        startAutoUpdateInterval();
        showToast("Auto-check for updates enabled (every 15 min).");
      } else {
        stopAutoUpdateInterval();
        showToast("Auto-check for updates disabled.");
      }
      updateAboutModalStatus();
    });
  }

  const btnAboutApp = document.getElementById("btn-about-app");
  if (btnAboutApp) {
    btnAboutApp.addEventListener("click", () => {
      updateAboutModalStatus();
      openModal("modal-about-app");
    });
  }

  const btnBrandUpdate = document.getElementById("btn-brand-update");
  if (btnBrandUpdate) {
    btnBrandUpdate.addEventListener("click", () => {
      openModal("modal-app-update");
    });
  }

  const btnCopyGitPull = document.getElementById("btn-copy-git-pull");
  if (btnCopyGitPull) {
    btnCopyGitPull.addEventListener("click", () => {
      const cmd = "git pull origin main";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cmd).then(() => {
          showToast("Copied to clipboard: git pull origin main");
        }).catch(() => {
          showToast("Command: git pull origin main");
        });
      } else {
        showToast("Command: git pull origin main");
      }
    });
  }

  const btnUpdateReload = document.getElementById("btn-update-reload-page");
  if (btnUpdateReload) {
    btnUpdateReload.addEventListener("click", () => {
      window.location.reload();
    });
  }

  // Start background auto-check timer if enabled
  if (isAutoCheckEnabled) {
    startAutoUpdateInterval();
    // Non-intrusive initial check after short initial load delay
    setTimeout(() => {
      checkAppUpdates(false);
    }, 4500);
  }

  // Export testing and diagnostics hooks to window
  window.APP_VERSION_INFO = APP_VERSION_INFO;
  window.checkAppUpdates = checkAppUpdates;
  window.compareSemver = compareSemver;
  window.setUpdateAvailableState = setUpdateAvailableState;
  window.resetBESMUpdate = resetUpdateState;
  window.AUTO_UPDATE_INTERVAL_MS = AUTO_UPDATE_INTERVAL_MS;
  window.simulateBESMUpdate = function(mockVersion = "1.8.1", mockNotes = "Test update simulation") {
    setUpdateAvailableState({
      version: mockVersion,
      commit: "abc1234",
      notes: mockNotes
    });
    showToast(`Simulation: Update to v${mockVersion} detected! Logo changed to glowing 'Update!' button.`);
  };

  const btnOpenLibraryMenu = document.getElementById("btn-open-library-menu");
  if (btnOpenLibraryMenu) {
    btnOpenLibraryMenu.addEventListener("click", () => {
      openSaveLoadDialog("tab-library");
    });
  }

  // ========================================================================
  // PDF Export Engine (html2pdf & Native Print-to-PDF Fallback)
  // ========================================================================
  async function exportCharacterPDF() {
    if (!currentCharacter) return;
    readFormValues();
    renderPrintSheet();

    const fname = BESM4EStorage.formatSafeFilename(currentCharacter, ".pdf");

    if (typeof html2pdf === "undefined") {
      showToast("Opening Print / Save as PDF dialog...");
      openPrintPreview();
      setTimeout(() => { window.print(); }, 250);
      return;
    }

    // 1. Create a full-screen loading overlay to prevent screen flicker
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "pdf-loading-overlay";
    loadingOverlay.style.cssText = "position: fixed; inset: 0; z-index: 100000; background: rgba(11, 15, 25, 0.88); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #ffffff; font-family: var(--font-family); font-size: 14pt; font-weight: 700;";
    loadingOverlay.innerHTML = `
      <div style="font-size: 32pt; animation: spin 1s linear infinite;">⏳</div>
      <div>Generating PDF Character Sheet...</div>
      <div style="font-size: 12pt; font-weight: 500; color: #94a3b8;">Formatting high-resolution printable sheet</div>
    `;
    document.body.appendChild(loadingOverlay);

    // 2. Create the printable sandbox element in the viewport (left: 0, top: 0, z-index: 99999)
    // Placed behind the loadingOverlay so user only sees the sleek loading indicator,
    // while html2canvas has an in-viewport, 100% visible, fully rendered element to snapshot.
    const sandbox = document.createElement("div");
    sandbox.className = "print-sheet pdf-export-mode";
    sandbox.setAttribute("data-theme", "light");
    sandbox.style.cssText = "position: fixed; top: 0; left: 0; width: 850px; min-height: 1000px; z-index: 99999; background: #ffffff !important; color: #111827 !important; padding: 24px; box-sizing: border-box; overflow: visible;";

    const src = document.getElementById("print-sheet-content");
    sandbox.innerHTML = src ? src.innerHTML : "";
    document.body.appendChild(sandbox);

    // Give browser time to complete layout, parse fonts, and compute styles
    await new Promise(resolve => setTimeout(resolve, 200));

    const opt = {
      margin: [10, 10, 10, 10], // mm
      filename: fname,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: 850
      },
      jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    try {
      await html2pdf().set(opt).from(sandbox).save();
      showToast(`Exported "${fname}" as PDF!`);
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("Direct download failed. Opening Print / Save as PDF dialog...");
      openPrintPreview();
      setTimeout(() => { window.print(); }, 250);
    } finally {
      if (sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
      if (loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);
    }
  }

  window.exportCharacterPDF = exportCharacterPDF;

  // File Menu: Export Character as PDF
  const btnMenuExportPdf = document.getElementById("btn-menu-export-pdf") || document.getElementById("btn-menu-export-md");
  if (btnMenuExportPdf) {
    btnMenuExportPdf.addEventListener("click", () => {
      exportCharacterPDF();
    });
  }

  // ========================================================================
  // Character Sheet Print Preview (File Menu & Ctrl+P)
  // ========================================================================
  function openPrintPreview() {
    if (!currentCharacter) return;
    readFormValues();
    renderPrintSheet();
    openModal("modal-print-preview");
  }

  const btnMenuPrintPreview = document.getElementById("btn-menu-print-preview");
  if (btnMenuPrintPreview) {
    btnMenuPrintPreview.addEventListener("click", openPrintPreview);
  }

  const btnModalPrintSheet = document.getElementById("btn-modal-print-sheet");
  if (btnModalPrintSheet) {
    btnModalPrintSheet.addEventListener("click", () => {
      renderPrintSheet();
      window.print();
    });
  }

  const btnModalExportPdf = document.getElementById("btn-modal-export-pdf") || document.getElementById("btn-modal-copy-markdown");
  if (btnModalExportPdf) {
    btnModalExportPdf.addEventListener("click", () => {
      exportCharacterPDF();
    });
  }

  window.addEventListener("beforeprint", () => {
    if (currentCharacter) {
      readFormValues();
      renderPrintSheet();
    }
  });

  // Open File Handling (Picker + Drag & Drop)
  function importCharacterFromJSON(rawText, sourceFilename = "", fileHandle = null) {
    try {
      const imported = BESM4EStorage.parseCharacter(rawText);
      BESM4EStorage.saveCharacter(imported);
      if (fileHandle) {
        BESM4EStorage.setCurrentFileHandle(fileHandle, sourceFilename || fileHandle.name);
      } else {
        BESM4EStorage.clearCurrentFileHandle();
        if (sourceFilename && !sourceFilename.includes("pasted")) {
          BESM4EStorage._currentFileName = sourceFilename;
        }
      }
      currentCharacter = imported;
      populateCharacterDropdown();
      refreshAll();
      closeModal("modal-saveload");
      closeModal("modal-backup");
      showToast(`Loaded "${imported.name || "character"}" from ${sourceFilename || ".besm4e file"}!`);
    } catch (err) {
      alert("Failed to load character file. Please verify it is a valid .besm4e or JSON file.\nError: " + err.message);
    }
  }

  const btnBrowseOpenFile = document.getElementById("btn-browse-open-file");
  const fileInputBesm4e = document.getElementById("file-input-besm4e");
  if (btnBrowseOpenFile && fileInputBesm4e) {
    btnBrowseOpenFile.addEventListener("click", async () => {
      if (window.showOpenFilePicker) {
        try {
          const res = await BESM4EStorage.openBESM4EWithPicker();
          if (res && res.success) {
            importCharacterFromJSON(res.text, res.filename, res.handle);
            return;
          }
        } catch (e) {
          console.warn("Picker error:", e);
        }
      }
      fileInputBesm4e.click();
    });

    fileInputBesm4e.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        importCharacterFromJSON(evt.target.result, file.name);
      };
      reader.readAsText(file);
      fileInputBesm4e.value = "";
    });
  }

  // Drag and drop zone
  const dropZone = document.getElementById("drop-zone-besm4e");
  if (dropZone) {
    ["dragenter", "dragover"].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("drag-over");
      });
    });
    ["dragleave", "drop"].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("drag-over");
      });
    });
    dropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-over");
      let fileHandle = null;
      if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items[0]) {
        const item = e.dataTransfer.items[0];
        if (typeof item.getAsFileSystemHandle === "function") {
          try {
            const h = await item.getAsFileSystemHandle();
            if (h && h.kind === "file") {
              fileHandle = h;
            }
          } catch (err) {}
        }
      }
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          importCharacterFromJSON(evt.target.result, file.name, fileHandle);
        };
        reader.readAsText(file);
      }
    });
  }

  // Text code import
  const btnImportText = document.getElementById("btn-import-json-text");
  if (btnImportText) {
    btnImportText.addEventListener("click", () => {
      const text = document.getElementById("import-json-text")?.value.trim();
      if (!text) {
        alert("Please paste character code / JSON first.");
        return;
      }
      importCharacterFromJSON(text, "pasted data");
    });
  }

  // New Blank Character function
  function createBlankCharacter() {
    BESM4EStorage.clearCurrentFileHandle();
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
    closeModal("modal-saveload");
    closeModal("modal-character-mgr");
    showToast("Created new blank character");
  }

  const btnNewChar = document.getElementById("btn-new-char");
  if (btnNewChar) {
    btnNewChar.addEventListener("click", createBlankCharacter);
  }

  const btnMgrNewChar = document.getElementById("btn-mgr-new-char");
  if (btnMgrNewChar) {
    btnMgrNewChar.addEventListener("click", createBlankCharacter);
  }

  function renderCharacterManagerList() {
    const listEl = document.getElementById("mgr-character-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    const list = BESM4EStorage.getCharacterSummaries();
    const countEl = document.getElementById("library-count");
    if (countEl) countEl.textContent = list.length;

    list.forEach(c => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <div class="item-name">${escapeHtml(c.name || "Untitled Character")} <span class="tag-pill">${c.tier.toUpperCase()}</span></div>
          <div class="item-sub">${escapeHtml(c.concept || "No concept specified")} • Updated: ${new Date(c.updatedAt).toLocaleDateString()}</div>
        </div>
        <div class="item-controls" style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary btn-sm btn-select-char" data-id="${c.id}">📂 Open</button>
          <button type="button" class="btn btn-secondary btn-sm btn-export-row-char" data-id="${c.id}" title="Save as .besm4e file">💾 Save As</button>
          <button type="button" class="btn btn-secondary btn-sm btn-clone-char" data-id="${c.id}" title="Duplicate character">Copy</button>
          <button type="button" class="btn btn-danger btn-sm btn-delete-char" data-id="${c.id}" title="Delete character">✕</button>
        </div>
      `;
      listEl.appendChild(row);
    });

    listEl.querySelectorAll(".btn-select-char").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        BESM4EStorage.clearCurrentFileHandle();
        currentCharacter = BESM4EStorage.loadCharacter(id);
        BESM4EStorage.setActiveId(id);
        populateCharacterDropdown();
        refreshAll();
        closeModal("modal-saveload");
        closeModal("modal-character-mgr");
        showToast(`Selected "${currentCharacter.name || "Untitled"}"`);
      });
    });

    listEl.querySelectorAll(".btn-export-row-char").forEach(b => {
      b.addEventListener("click", async () => {
        const id = b.getAttribute("data-id");
        const char = BESM4EStorage.loadCharacter(id);
        if (char) {
          const fname = BESM4EStorage.formatSafeFilename(char, ".besm4e");
          await BESM4EStorage.saveBESM4EWithPicker(char, fname);
          showToast(`Exported "${char.name || "Character"}"`);
        }
      });
    });

    listEl.querySelectorAll(".btn-clone-char").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const orig = BESM4EStorage.loadCharacter(id);
        if (orig) {
          BESM4EStorage.clearCurrentFileHandle();
          const cloned = orig.clone();
          BESM4EStorage.saveCharacter(cloned);
          currentCharacter = cloned;
          populateCharacterDropdown();
          refreshAll();
          renderCharacterManagerList();
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
          BESM4EStorage.clearCurrentFileHandle();
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

  // ========================================================================
  // Quick Save & Sync
  // ========================================================================
  function saveCurrentCharacter(silent = false) {
    if (!currentCharacter) return;
    readFormValues();
    BESM4EStorage.saveCharacter(currentCharacter);
    populateCharacterDropdown();
    if (!silent) {
      showToast("💾 Character saved to library!");
    }
  }

  const btnQuickSave = document.getElementById("btn-quick-save");
  if (btnQuickSave) {
    btnQuickSave.addEventListener("click", () => {
      executeSaveFile();
    });
  }

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Ctrl+S / Cmd+S: Save Character File (.besm4e) & Sync Library
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      executeSaveFile();
    }
    // Ctrl+O / Cmd+O: Open / Load Character
    if ((e.ctrlKey || e.metaKey) && (e.key === "o" || e.key === "O")) {
      e.preventDefault();
      openSaveLoadDialog("tab-load-char");
    }
    // Ctrl+N / Cmd+N: New Character
    if ((e.ctrlKey || e.metaKey) && (e.key === "n" || e.key === "N")) {
      e.preventDefault();
      createBlankCharacter();
    }
    // Ctrl+P / Cmd+P: Print Preview / Print Sheet
    if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
      e.preventDefault();
      openPrintPreview();
    }
    // Alt+F: Toggle File Menu
    if (e.altKey && (e.key === "f" || e.key === "F")) {
      e.preventDefault();
      toggleFileMenu();
    }
    // Escape: Close File Menu and any open modal
    if (e.key === "Escape") {
      closeFileMenu();
      const openModals = document.querySelectorAll(".modal-backdrop.open");
      if (openModals.length > 0) {
        const topModal = openModals[openModals.length - 1];
        topModal.classList.remove("open");
        clearActiveContainerTarget();
      }
    }
  });

  // ========================================================================
  // Builder Form Synchronization
  // ========================================================================
  function readFormValues() {
    if (!currentCharacter) return;
    currentCharacter.name = document.getElementById("char-name").value.trim();
    currentCharacter.concept = document.getElementById("char-concept").value.trim();
    const raceEl = document.getElementById("char-race");
    if (raceEl) currentCharacter.race = raceEl.value.trim();
    const classEl = document.getElementById("char-class");
    if (classEl) currentCharacter.characterClass = classEl.value.trim();
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
    const raceEl = document.getElementById("char-race");
    if (raceEl) raceEl.value = currentCharacter.race || "";
    const classEl = document.getElementById("char-class");
    if (classEl) classEl.value = currentCharacter.characterClass || "";
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
  ["char-name", "char-concept", "char-race", "char-class", "char-player", "char-campaign", "char-custom-budget", "char-gear", "char-appearance", "char-backstory", "char-allies"].forEach(id => {
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
  // ========================================================================
  // Core Stats Rendering & Steppers (BESM 4E: 2 CP ≤12, 4 CP >12)
  // ========================================================================
  function renderCoreStats() {
    ["body", "mind", "soul"].forEach(stat => {
      const val = currentCharacter.stats[stat] || 0;
      const valEl = document.getElementById(`val-${stat}`);
      const costEl = document.getElementById(`cost-${stat}`);
      if (valEl) {
        if (valEl.tagName === "INPUT") {
          valEl.value = val;
        } else {
          valEl.textContent = val;
        }
      }
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

  // Direct typing in Core Stats combo stepper inputs
  ["body", "mind", "soul"].forEach(stat => {
    const el = document.getElementById(`val-${stat}`);
    if (el) {
      el.addEventListener("change", (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        val = Math.max(0, Math.min(30, val));
        currentCharacter.setStat(stat, val);
        renderCoreStats();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    }
  });

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
    const statsEl = document.getElementById("breakdown-stats-cp");
    if (statsEl) statsEl.textContent = `${pt.stats.total} CP`;

    const attribsEl = document.getElementById("breakdown-attribs-cp");
    if (attribsEl) attribsEl.textContent = `${pt.attributesTotal} CP`;

    const totalSkillsCP = pt.skillGroupsTotal + (pt.skillsTotal || 0);
    const skillsEl = document.getElementById("breakdown-skills-cp");
    if (skillsEl) skillsEl.textContent = `${totalSkillsCP} CP`;

    const defectsEl = document.getElementById("breakdown-defects-cp");
    if (defectsEl) defectsEl.textContent = `-${pt.defectsRefund} CP`;

    const netEl = document.getElementById("breakdown-net-cp");
    if (netEl) netEl.textContent = `${pt.netSpent} CP`;

    const budgetEl = document.getElementById("breakdown-budget-cp");
    if (budgetEl) budgetEl.textContent = `${pt.totalBudget} CP (${pt.baseBudget} base + ${pt.earnedXP} XP)`;
    
    const remEl = document.getElementById("breakdown-remaining-cp");
    if (remEl) {
      remEl.textContent = `${pt.remaining} CP`;
      remEl.style.color = pt.isOverBudget ? "var(--color-danger)" : "var(--color-success)";
    }

    const remItem = document.getElementById("accounting-rem-item");
    if (remItem) {
      remItem.classList.toggle("over-budget", pt.isOverBudget);
    }

    const statusBadge = document.getElementById("point-accounting-status-badge");
    if (statusBadge) {
      if (pt.isOverBudget) {
        statusBadge.className = "tag-pill tag-serious";
        statusBadge.textContent = "OVER BUDGET";
      } else {
        statusBadge.className = "tag-pill tag-heroic";
        statusBadge.textContent = "IN BUDGET";
      }
    }
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
                <div class="combo-stepper combo-stepper-sm">
                  <button type="button" class="combo-stepper-btn combo-stepper-minus btn-cont-stat-minus" data-id="${attr.id}" data-stat="body" title="Decrease Body" aria-label="Decrease Body">−</button>
                  <input type="number" class="combo-stepper-input input-cont-stat" data-id="${attr.id}" data-stat="body" value="${stats.body || 0}" min="0" max="30" style="color: var(--color-body);">
                  <button type="button" class="combo-stepper-btn combo-stepper-plus btn-cont-stat-plus" data-id="${attr.id}" data-stat="body" title="Increase Body" aria-label="Increase Body">+</button>
                </div>
              </div>
              <div class="companion-stat-item">
                <span class="companion-stat-label" style="color: var(--color-mind);">Mind</span>
                <div class="combo-stepper combo-stepper-sm">
                  <button type="button" class="combo-stepper-btn combo-stepper-minus btn-cont-stat-minus" data-id="${attr.id}" data-stat="mind" title="Decrease Mind" aria-label="Decrease Mind">−</button>
                  <input type="number" class="combo-stepper-input input-cont-stat" data-id="${attr.id}" data-stat="mind" value="${stats.mind || 0}" min="0" max="30" style="color: var(--color-mind);">
                  <button type="button" class="combo-stepper-btn combo-stepper-plus btn-cont-stat-plus" data-id="${attr.id}" data-stat="mind" title="Increase Mind" aria-label="Increase Mind">+</button>
                </div>
              </div>
              <div class="companion-stat-item">
                <span class="companion-stat-label" style="color: var(--color-soul);">Soul</span>
                <div class="combo-stepper combo-stepper-sm">
                  <button type="button" class="combo-stepper-btn combo-stepper-minus btn-cont-stat-minus" data-id="${attr.id}" data-stat="soul" title="Decrease Soul" aria-label="Decrease Soul">−</button>
                  <input type="number" class="combo-stepper-input input-cont-stat" data-id="${attr.id}" data-stat="soul" value="${stats.soul || 0}" min="0" max="30" style="color: var(--color-soul);">
                  <button type="button" class="combo-stepper-btn combo-stepper-plus btn-cont-stat-plus" data-id="${attr.id}" data-stat="soul" title="Increase Soul" aria-label="Increase Soul">+</button>
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
              if (hasDetail && def.id !== "weapon" && !ca.detail && ca.name && ca.name.includes("(") && ca.name.includes(")")) {
                const parenMatch = ca.name.match(/^([^(]+)\s*\(([^)]+)\)$/);
                if (parenMatch && def && parenMatch[1].trim().toLowerCase() === def.name.toLowerCase()) {
                  ca.name = def.name;
                  ca.detail = parenMatch[2].trim();
                }
              }
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
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                      <div class="combo-stepper combo-stepper-sm" title="Adjust Level">
                        <button type="button" class="combo-stepper-btn combo-stepper-minus btn-cont-trait-minus" data-container="${attr.id}" data-type="attributes" data-trait="${ca.id}" aria-label="Decrease level">−</button>
                        <input type="number" class="combo-stepper-input input-cont-trait-level" data-container="${attr.id}" data-type="attributes" data-trait="${ca.id}" value="${ca.level || 1}" min="1" max="100">
                        <button type="button" class="combo-stepper-btn combo-stepper-plus btn-cont-trait-plus" data-container="${attr.id}" data-type="attributes" data-trait="${ca.id}" aria-label="Increase level">+</button>
                      </div>
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
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                      <div class="combo-stepper combo-stepper-sm" title="Adjust Level">
                        <button type="button" class="combo-stepper-btn combo-stepper-minus btn-cont-trait-minus" data-container="${attr.id}" data-type="skillGroups" data-trait="${cs.id}" aria-label="Decrease level">−</button>
                        <input type="number" class="combo-stepper-input input-cont-trait-level" data-container="${attr.id}" data-type="skillGroups" data-trait="${cs.id}" value="${cs.level || 1}" min="1" max="6">
                        <button type="button" class="combo-stepper-btn combo-stepper-plus btn-cont-trait-plus" data-container="${attr.id}" data-type="skillGroups" data-trait="${cs.id}" aria-label="Increase level">+</button>
                      </div>
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
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                      <div class="combo-stepper combo-stepper-sm" title="Adjust Level">
                        <button type="button" class="combo-stepper-btn combo-stepper-minus btn-cont-trait-minus" data-container="${attr.id}" data-type="skills" data-trait="${csk.id}" aria-label="Decrease level">−</button>
                        <input type="number" class="combo-stepper-input input-cont-trait-level" data-container="${attr.id}" data-type="skills" data-trait="${csk.id}" value="${csk.level || 1}" min="1" max="6">
                        <button type="button" class="combo-stepper-btn combo-stepper-plus btn-cont-trait-plus" data-container="${attr.id}" data-type="skills" data-trait="${csk.id}" aria-label="Increase level">+</button>
                      </div>
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
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                      <div class="combo-stepper combo-stepper-sm" title="Adjust Rank">
                        <button type="button" class="combo-stepper-btn combo-stepper-minus btn-cont-trait-minus" data-container="${attr.id}" data-type="defects" data-trait="${cd.id}" aria-label="Decrease rank">−</button>
                        <input type="number" class="combo-stepper-input input-cont-trait-level" data-container="${attr.id}" data-type="defects" data-trait="${cd.id}" value="${cd.rank || 1}" min="1" max="6">
                        <button type="button" class="combo-stepper-btn combo-stepper-plus btn-cont-trait-plus" data-container="${attr.id}" data-type="defects" data-trait="${cd.id}" aria-label="Increase rank">+</button>
                      </div>
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
              <div class="combo-stepper combo-stepper-sm" title="Adjust container level">
                <button type="button" class="combo-stepper-btn combo-stepper-minus btn-attr-minus" data-id="${attr.id}" title="Decrease container level" aria-label="Decrease container level">−</button>
                <input type="number" class="combo-stepper-input input-attr-level" data-id="${attr.id}" value="${attr.level}" min="1" max="50" style="width: 2.5rem;" title="Container Level">
                <button type="button" class="combo-stepper-btn combo-stepper-plus btn-attr-plus" data-id="${attr.id}" title="Increase container level" aria-label="Increase container level">+</button>
              </div>
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
        if (hasDetail && def.id !== "weapon" && !attr.detail && attr.name && attr.name.includes("(") && attr.name.includes(")")) {
          const parenMatch = attr.name.match(/^([^(]+)\s*\(([^)]+)\)$/);
          if (parenMatch && def && parenMatch[1].trim().toLowerCase() === def.name.toLowerCase()) {
            attr.name = def.name;
            attr.detail = parenMatch[2].trim();
          }
        }
        if (hasSubTraits && !attr.subTrait) {
          attr.subTrait = def.subTraits[0];
        }
        const subTraitTitle = attr.subTrait ? `: <span style="color: var(--accent-primary); font-weight: 700;">${escapeHtml(attr.subTrait)}</span>` : "";
        const detailTitle = attr.detail ? ` <span style="color: var(--text-muted); font-size: 12pt;">[${escapeHtml(attr.detail)}]</span>` : "";
        const subTraitPill = attr.subTrait ? `<span class="tag-pill" style="color: var(--accent-primary); font-weight: 600;">${escapeHtml(attr.subTrait)}</span>` : "";
        const detailPill = attr.detail ? `<span class="tag-pill" style="opacity: 0.9;">[${escapeHtml(attr.detail)}]</span>` : "";
        const baseAttrId = (attr.attributeId || attr.id || "").replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
        const acceptsModifiers = BESM4E_RULES.attributeAcceptsModifiers(baseAttrId);
        const costInfo = BESM4E_RULES.calculateAttributeCost(attr);
        const totalCost = costInfo.totalCost;

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

        let modifiersPanelHtml = "";
        if (acceptsModifiers) {
          const legalEnhancements = BESM4E_RULES.getLegalEnhancementsForAttribute(baseAttrId);
          const legalLimiters = BESM4E_RULES.getLegalLimitersForAttribute(baseAttrId);

          const enhOptions = legalEnhancements.map(e => `<option value="${escapeHtml(e.id)}" title="${escapeHtml(e.description || '')}">${escapeHtml(e.name)} (+${e.costPerRank || 1} CP/rk)</option>`).join("");
          const limOptions = legalLimiters.map(l => `<option value="${escapeHtml(l.id)}" title="${escapeHtml(l.description || '')}">${escapeHtml(l.name)} (-${l.refundPerRank || 1} CP/rk)</option>`).join("");

          const enhPills = (costInfo.enhancements || []).map(e => `
            <span class="modifier-pill modifier-pill-enhancement">
              <span class="btn-trait-pill-info" data-attr-id="${attr.id}" data-mod-id="${escapeHtml(e.id || e.name)}" data-type="Enhancement" title="Click to view trait details" style="cursor: pointer;">
                ✨ ${escapeHtml(e.name)}
              </span>
              <div class="combo-stepper combo-stepper-sm" style="display: inline-flex; margin: 0 0.25rem;">
                <button type="button" class="combo-stepper-btn combo-stepper-minus btn-attr-enh-pill-minus" data-id="${attr.id}" data-enh="${escapeHtml(e.id || e.name)}" title="Decrease Rank" aria-label="Decrease Rank">−</button>
                <input type="number" class="combo-stepper-input input-attr-enh-pill-rank" data-id="${attr.id}" data-enh="${escapeHtml(e.id || e.name)}" value="${e.rank}" min="1" max="5" style="width: 2.2rem; font-size: 12pt;" title="Rank">
                <button type="button" class="combo-stepper-btn combo-stepper-plus btn-attr-enh-pill-plus" data-id="${attr.id}" data-enh="${escapeHtml(e.id || e.name)}" title="Increase Rank" aria-label="Increase Rank">+</button>
              </div>
              <span style="font-weight: 700;">(+${e.rank * (e.costPerRank || 1)} CP)</span>
              <button type="button" class="modifier-pill-del btn-attr-del-enh" data-id="${attr.id}" data-enh="${escapeHtml(e.id || e.name)}" title="Remove Enhancement">✕</button>
            </span>
          `).join("");

          const limPills = (costInfo.limiters || []).map(l => `
            <span class="modifier-pill modifier-pill-limiter">
              <span class="btn-trait-pill-info" data-attr-id="${attr.id}" data-mod-id="${escapeHtml(l.id || l.name)}" data-type="Limiter" title="Click to view trait details" style="cursor: pointer;">
                ⚠️ ${escapeHtml(l.name)}
              </span>
              <div class="combo-stepper combo-stepper-sm" style="display: inline-flex; margin: 0 0.25rem;">
                <button type="button" class="combo-stepper-btn combo-stepper-minus btn-attr-lim-pill-minus" data-id="${attr.id}" data-lim="${escapeHtml(l.id || l.name)}" title="Decrease Rank" aria-label="Decrease Rank">−</button>
                <input type="number" class="combo-stepper-input input-attr-lim-pill-rank" data-id="${attr.id}" data-lim="${escapeHtml(l.id || l.name)}" value="${l.rank}" min="1" max="5" style="width: 2.2rem; font-size: 12pt;" title="Rank">
                <button type="button" class="combo-stepper-btn combo-stepper-plus btn-attr-lim-pill-plus" data-id="${attr.id}" data-lim="${escapeHtml(l.id || l.name)}" title="Increase Rank" aria-label="Increase Rank">+</button>
              </div>
              <span style="font-weight: 700;">(-${l.rank * (l.refundPerRank || 1)} CP)</span>
              <button type="button" class="modifier-pill-del btn-attr-del-lim" data-id="${attr.id}" data-lim="${escapeHtml(l.id || l.name)}" title="Remove Limiter">✕</button>
            </span>
          `).join("");

          const hasPills = enhPills || limPills;

          modifiersPanelHtml = `
            <div class="attribute-modifiers-panel">
              <div class="modifier-panel-header">
                <span>✨ Legal Enhancements & ⚠️ Limiters</span>
                <span class="modifier-summary-badge">Base: ${costInfo.baseCost} CP | Enh: +${costInfo.enhCost} CP | Lim: -${costInfo.limRefund} CP</span>
              </div>
              <div class="modifier-dropdown-row">
                <div class="modifier-select-group">
                  <label>Enhancement:</label>
                  <select class="modifier-select attr-enh-select" data-id="${attr.id}">
                    <option value="">-- Choose Legal Enhancement --</option>
                    ${enhOptions}
                  </select>
                  <button type="button" class="btn btn-secondary btn-sm btn-trait-info btn-attr-enh-info" data-id="${attr.id}" title="View selected enhancement description">❓</button>
                  <div class="combo-stepper combo-stepper-sm" style="width: auto;">
                    <button type="button" class="combo-stepper-btn combo-stepper-minus btn-attr-enh-rank-minus" data-id="${attr.id}" title="Decrease Rank" aria-label="Decrease Rank">−</button>
                    <input type="number" class="combo-stepper-input attr-enh-rank" data-id="${attr.id}" min="1" max="5" value="1" style="width: 2.5rem; font-size: 12pt;" title="Rank">
                    <button type="button" class="combo-stepper-btn combo-stepper-plus btn-attr-enh-rank-plus" data-id="${attr.id}" title="Increase Rank" aria-label="Increase Rank">+</button>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm btn-attr-add-enh" data-id="${attr.id}" style="font-size: 12pt;">+ Add</button>
                </div>
                <div class="modifier-select-group">
                  <label>Limiter:</label>
                  <select class="modifier-select attr-lim-select" data-id="${attr.id}">
                    <option value="">-- Choose Legal Limiter --</option>
                    ${limOptions}
                  </select>
                  <button type="button" class="btn btn-secondary btn-sm btn-trait-info btn-attr-lim-info" data-id="${attr.id}" title="View selected limiter description">❓</button>
                  <div class="combo-stepper combo-stepper-sm" style="width: auto;">
                    <button type="button" class="combo-stepper-btn combo-stepper-minus btn-attr-lim-rank-minus" data-id="${attr.id}" title="Decrease Rank" aria-label="Decrease Rank">−</button>
                    <input type="number" class="combo-stepper-input attr-lim-rank" data-id="${attr.id}" min="1" max="5" value="1" style="width: 2.5rem; font-size: 12pt;" title="Rank">
                    <button type="button" class="combo-stepper-btn combo-stepper-plus btn-attr-lim-rank-plus" data-id="${attr.id}" title="Increase Rank" aria-label="Increase Rank">+</button>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm btn-attr-add-lim" data-id="${attr.id}" style="font-size: 12pt;">+ Add</button>
                </div>
              </div>
              <div class="attr-modifier-desc-box" id="attr-desc-${attr.id}"></div>
              <div class="modifier-pills-list">
                ${hasPills ? (enhPills + limPills) : `<span style="color: var(--text-dim); font-size: 12pt; font-style: italic;">No modifiers assigned. Select legal options above.</span>`}
              </div>
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
              <div class="combo-stepper combo-stepper-sm" title="Adjust attribute level">
                <button type="button" class="combo-stepper-btn combo-stepper-minus btn-attr-minus" data-id="${attr.id}" title="Decrease level" aria-label="Decrease level">−</button>
                <input type="number" class="combo-stepper-input input-attr-level" data-id="${attr.id}" value="${attr.level}" min="1" max="50" style="width: 2.5rem;" title="Attribute Level">
                <button type="button" class="combo-stepper-btn combo-stepper-plus btn-attr-plus" data-id="${attr.id}" title="Increase level" aria-label="Increase level">+</button>
              </div>
              <button class="btn btn-danger btn-sm btn-attr-delete" data-id="${attr.id}" title="Remove attribute">✕</button>
            </div>
          </div>
          ${configBarHtml}
          ${modifiersPanelHtml}
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
          openWeaponModal();
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
          renderBuilderWeapons();
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
          renderBuilderWeapons();
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
            renderBuilderWeapons();
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
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    // Attribute Enhancements & Limiters Modifiers Wiring
    container.querySelectorAll(".btn-attr-add-enh").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const sel = panel ? panel.querySelector(`.attr-enh-select[data-id="${id}"]`) : null;
        const rankInp = panel ? panel.querySelector(`.attr-enh-rank[data-id="${id}"]`) : null;
        if (!sel || !sel.value) {
          showToast("Please choose an enhancement from the dropdown first.");
          return;
        }
        const rank = parseInt(rankInp?.value, 10) || 1;
        currentCharacter.addAttributeEnhancement(id, sel.value, rank);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-attr-add-lim").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const sel = panel ? panel.querySelector(`.attr-lim-select[data-id="${id}"]`) : null;
        const rankInp = panel ? panel.querySelector(`.attr-lim-rank[data-id="${id}"]`) : null;
        if (!sel || !sel.value) {
          showToast("Please choose a limiter from the dropdown first.");
          return;
        }
        const rank = parseInt(rankInp?.value, 10) || 1;
        currentCharacter.addAttributeLimiter(id, sel.value, rank);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-attr-del-enh").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const enh = btn.getAttribute("data-enh");
        currentCharacter.removeAttributeEnhancement(id, enh);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-attr-del-lim").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const lim = btn.getAttribute("data-lim");
        currentCharacter.removeAttributeLimiter(id, lim);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    // Attribute Trait Info Buttons & Dropdown Handlers
    container.querySelectorAll(".btn-attr-enh-info").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const sel = panel ? panel.querySelector(`.attr-enh-select[data-id="${id}"]`) : null;
        if (!sel || !sel.value) {
          showToast("Please choose an enhancement from the dropdown first to view its description.");
          return;
        }
        const baseAttrId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
        const def = BESM4E_RULES.getModifierDef ? BESM4E_RULES.getModifierDef(baseAttrId, "enhancement", sel.value) : (BESM4E_RULES.getGeneralEnhancementDef(sel.value) || BESM4E_RULES.getWeaponEnhancementDef(sel.value));
        if (def) {
          showTraitInfoModal(def, "Enhancement");
        }
      });
    });

    container.querySelectorAll(".btn-attr-lim-info").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const sel = panel ? panel.querySelector(`.attr-lim-select[data-id="${id}"]`) : null;
        if (!sel || !sel.value) {
          showToast("Please choose a limiter from the dropdown first to view its description.");
          return;
        }
        const baseAttrId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
        const def = BESM4E_RULES.getModifierDef ? BESM4E_RULES.getModifierDef(baseAttrId, "limiter", sel.value) : (BESM4E_RULES.getGeneralLimiterDef(sel.value) || BESM4E_RULES.getWeaponLimiterDef(sel.value));
        if (def) {
          showTraitInfoModal(def, "Limiter");
        }
      });
    });

    // Dropdown change listeners to display inline description
    container.querySelectorAll(".attr-enh-select").forEach(sel => {
      sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-id");
        const descBox = document.getElementById(`attr-desc-${id}`);
        if (!descBox) return;
        if (!sel.value) {
          descBox.classList.remove("active");
          descBox.innerHTML = "";
          return;
        }
        const baseAttrId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
        const def = BESM4E_RULES.getModifierDef ? BESM4E_RULES.getModifierDef(baseAttrId, "enhancement", sel.value) : (BESM4E_RULES.getGeneralEnhancementDef(sel.value) || BESM4E_RULES.getWeaponEnhancementDef(sel.value));
        if (def && def.description) {
          descBox.classList.add("active");
          descBox.innerHTML = `<strong>✨ ${escapeHtml(def.name)} (+${def.costPerRank || 1} CP/rk):</strong> ${escapeHtml(def.description)}`;
        }
      });
    });

    container.querySelectorAll(".attr-lim-select").forEach(sel => {
      sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-id");
        const descBox = document.getElementById(`attr-desc-${id}`);
        if (!descBox) return;
        if (!sel.value) {
          descBox.classList.remove("active");
          descBox.innerHTML = "";
          return;
        }
        const baseAttrId = id.replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
        const def = BESM4E_RULES.getModifierDef ? BESM4E_RULES.getModifierDef(baseAttrId, "limiter", sel.value) : (BESM4E_RULES.getGeneralLimiterDef(sel.value) || BESM4E_RULES.getWeaponLimiterDef(sel.value));
        if (def && def.description) {
          descBox.classList.add("active");
          descBox.innerHTML = `<strong>⚠️ ${escapeHtml(def.name)} (-${def.refundPerRank || 1} CP/rk):</strong> ${escapeHtml(def.description)}`;
        }
      });
    });

    // Assigned modifier pill clicks for Attributes
    container.querySelectorAll(".btn-trait-pill-info").forEach(pill => {
      pill.addEventListener("click", (e) => {
        if (e.target.closest(".modifier-pill-del")) return;
        const attrId = pill.getAttribute("data-attr-id");
        const modId = pill.getAttribute("data-mod-id");
        const modType = pill.getAttribute("data-type");
        const baseAttrId = (attrId || "").replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
        const def = BESM4E_RULES.getModifierDef ? BESM4E_RULES.getModifierDef(baseAttrId, modType?.toLowerCase(), modId) : (BESM4E_RULES.getGeneralEnhancementDef(modId) || BESM4E_RULES.getWeaponEnhancementDef(modId) || BESM4E_RULES.getGeneralLimiterDef(modId) || BESM4E_RULES.getWeaponLimiterDef(modId));
        if (def) {
          showTraitInfoModal(def, modType);
        }
      });
    });

    // Rank Stepper buttons for Add Enhancement & Limiter Fields
    container.querySelectorAll(".btn-attr-enh-rank-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const inp = panel ? panel.querySelector(`.attr-enh-rank[data-id="${id}"]`) : null;
        if (inp) {
          const cur = parseInt(inp.value, 10) || 1;
          inp.value = Math.max(1, cur - 1);
        }
      });
    });

    container.querySelectorAll(".btn-attr-enh-rank-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const inp = panel ? panel.querySelector(`.attr-enh-rank[data-id="${id}"]`) : null;
        if (inp) {
          const cur = parseInt(inp.value, 10) || 1;
          inp.value = Math.min(5, cur + 1);
        }
      });
    });

    container.querySelectorAll(".btn-attr-lim-rank-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const inp = panel ? panel.querySelector(`.attr-lim-rank[data-id="${id}"]`) : null;
        if (inp) {
          const cur = parseInt(inp.value, 10) || 1;
          inp.value = Math.max(1, cur - 1);
        }
      });
    });

    container.querySelectorAll(".btn-attr-lim-rank-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const panel = btn.closest(".attribute-modifiers-panel");
        const inp = panel ? panel.querySelector(`.attr-lim-rank[data-id="${id}"]`) : null;
        if (inp) {
          const cur = parseInt(inp.value, 10) || 1;
          inp.value = Math.min(5, cur + 1);
        }
      });
    });

    // Direct typing in Rank Inputs for Add Enhancement & Limiter Fields
    container.querySelectorAll(".attr-enh-rank, .attr-lim-rank").forEach(inp => {
      inp.addEventListener("change", (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 5) val = 5;
        e.target.value = val;
      });
    });

    // Assigned Modifier Pills Steppers
    container.querySelectorAll(".btn-attr-enh-pill-minus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const enh = btn.getAttribute("data-enh");
        currentCharacter.updateAttributeEnhancementRank(id, enh, -1, true);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-attr-enh-pill-plus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const enh = btn.getAttribute("data-enh");
        currentCharacter.updateAttributeEnhancementRank(id, enh, 1, true);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".input-attr-enh-pill-rank").forEach(inp => {
      inp.addEventListener("click", (e) => e.stopPropagation());
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        const enh = inp.getAttribute("data-enh");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 5) val = 5;
        currentCharacter.updateAttributeEnhancementRank(id, enh, val, false);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-attr-lim-pill-minus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const lim = btn.getAttribute("data-lim");
        currentCharacter.updateAttributeLimiterRank(id, lim, -1, true);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".btn-attr-lim-pill-plus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const lim = btn.getAttribute("data-lim");
        currentCharacter.updateAttributeLimiterRank(id, lim, 1, true);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".input-attr-lim-pill-rank").forEach(inp => {
      inp.addEventListener("click", (e) => e.stopPropagation());
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        const lim = inp.getAttribute("data-lim");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 5) val = 5;
        currentCharacter.updateAttributeLimiterRank(id, lim, val, false);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    // Combo stepper direct typing inputs for attributes & containers
    container.querySelectorAll(".input-attr-level").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        currentCharacter.updateAttributeLevel(id, val);
        renderBuilderAttributes();
        renderBuilderWeapons();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".input-cont-stat").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        const stat = inp.getAttribute("data-stat");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        currentCharacter.setContainerStat(id, stat, val);
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".input-cont-trait-level").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const cId = inp.getAttribute("data-container");
        const type = inp.getAttribute("data-type");
        const tId = inp.getAttribute("data-trait");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        currentCharacter.updateContainerTraitLevel(cId, type, tId, val);
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
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inp.blur();
        }
      });
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
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inp.blur();
        }
      });
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
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inp.blur();
        }
      });
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
              <div class="combo-stepper combo-stepper-sm" title="Adjust Skill Group level">
                <button type="button" class="combo-stepper-btn combo-stepper-minus btn-sg-minus" data-id="${sg.id}" title="Decrease level" aria-label="Decrease level">−</button>
                <input type="number" class="combo-stepper-input input-sg-level" data-id="${sg.id}" value="${sg.level}" min="1" max="6" style="width: 2.5rem;" title="Skill Group Level">
                <button type="button" class="combo-stepper-btn combo-stepper-plus btn-sg-plus" data-id="${sg.id}" title="Increase level" aria-label="Increase level">+</button>
              </div>
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
              <div class="combo-stepper combo-stepper-sm" title="Adjust Skill level">
                <button type="button" class="combo-stepper-btn combo-stepper-minus btn-sk-minus" data-id="${sk.id}" title="Decrease level" aria-label="Decrease level">−</button>
                <input type="number" class="combo-stepper-input input-sk-level" data-id="${sk.id}" value="${sk.level}" min="1" max="6" style="width: 2.5rem;" title="Skill Level">
                <button type="button" class="combo-stepper-btn combo-stepper-plus btn-sk-plus" data-id="${sk.id}" title="Increase level" aria-label="Increase level">+</button>
              </div>
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

    // Combo stepper direct typing for skill groups
    container.querySelectorAll(".input-sg-level").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 6) val = 6;
        currentCharacter.updateSkillGroupLevel(id, val);
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
        if (document.getElementById("modal-add-skill")?.classList.contains("open")) {
          renderSkillCatalog();
        }
      });
    });

    // Combo stepper direct typing for individual skills
    container.querySelectorAll(".input-sk-level").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 6) val = 6;
        currentCharacter.updateSkillLevel(id, val);
        renderBuilderSkillGroups();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
        if (document.getElementById("modal-add-skill")?.classList.contains("open")) {
          renderSkillCatalog();
        }
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
            <div class="combo-stepper combo-stepper-sm" title="Adjust Defect rank">
              <button type="button" class="combo-stepper-btn combo-stepper-minus btn-defect-minus" data-id="${defect.id}" title="Decrease rank" aria-label="Decrease rank">−</button>
              <input type="number" class="combo-stepper-input input-defect-rank" data-id="${defect.id}" value="${defect.rank}" min="1" max="3" style="width: 2.5rem;" title="Defect Rank">
              <button type="button" class="combo-stepper-btn combo-stepper-plus btn-defect-plus" data-id="${defect.id}" title="Increase rank" aria-label="Increase rank">+</button>
            </div>
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

    // Combo stepper direct typing for defects
    container.querySelectorAll(".input-defect-rank").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = inp.getAttribute("data-id");
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 3) val = 3;
        currentCharacter.updateDefectRank(id, val);
        renderBuilderDefects();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });

    container.querySelectorAll(".defect-detail-input").forEach(inp => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inp.blur();
        }
      });
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
      const isMelee = (w.range || w.attackType || "").toLowerCase().includes("melee");
      const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
      const baseDamage = (w.level || 1) * dm;
      const costInfo = BESM4E_RULES.calculateWeaponCost(w);

      const enhPills = (costInfo.enhancements || []).map(e => `
        <span class="modifier-pill modifier-pill-enhancement btn-trait-pill-info" data-id="${escapeHtml(e.id || e.name)}" data-type="Weapon Enhancement" title="Click to view trait details">
          ✨ ${escapeHtml(e.name)} (Rk ${e.rank}: +${e.rank * (e.costPerRank || 1)} CP)
        </span>
      `).join("");

      const limPills = (costInfo.limiters || []).map(l => `
        <span class="modifier-pill modifier-pill-limiter btn-trait-pill-info" data-id="${escapeHtml(l.id || l.name)}" data-type="Weapon Limiter" title="Click to view trait details">
          ⚠️ ${escapeHtml(l.name)} (Rk ${l.rank}: -${l.rank * (l.refundPerRank || 1)} CP)
        </span>
      `).join("");

      const row = document.createElement("div");
      row.className = "item-row";
      row.style.flexDirection = "column";
      row.style.alignItems = "stretch";
      row.style.gap = "0.35rem";
      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div class="item-name">
            <strong>${escapeHtml(w.name)}</strong>
            <span class="tag-pill" style="color: var(--color-warning); font-weight: 700;">Base Damage: ${baseDamage} (Lvl ${w.level} × ${dm} DM)</span>
            <span class="tag-pill">${escapeHtml(w.range || "Melee")}</span>
            <span class="tag-pill" style="opacity: 0.85;">${isMelee ? "Melee Attack" : "Ranged Attack"}</span>
            <span class="rank-badge">${costInfo.totalCost} CP</span>
          </div>
          <div class="item-controls">
            <button type="button" class="btn btn-secondary btn-sm btn-weapon-edit" data-id="${w.id}" title="Edit Weapon & Modifiers">✏️ Edit</button>
            <button type="button" class="btn btn-danger btn-sm btn-weapon-delete" data-id="${w.id}" title="Delete Weapon">✕</button>
          </div>
        </div>
        <div class="item-sub" style="margin-top: 0; font-size: 12pt;">
          <span style="color: var(--text-dim);">Point Accounting:</span> Base: ${costInfo.baseCost} CP | Enh: +${costInfo.enhCost} CP | Lim: -${costInfo.limRefund} CP | Eff Lvl: ${costInfo.effectiveLevel}
        </div>
        ${(enhPills || limPills) ? `
          <div class="modifier-pills-list" style="margin-top: 0.2rem;">
            ${enhPills}${limPills}
          </div>
        ` : ""}
        ${w.notes ? `<div class="item-sub" style="margin-top: 0; font-style: italic;">${escapeHtml(w.notes)}</div>` : ""}
      `;
      container.appendChild(row);
    });

    container.querySelectorAll(".btn-trait-pill-info").forEach(pill => {
      pill.addEventListener("click", () => {
        const id = pill.getAttribute("data-id");
        const type = pill.getAttribute("data-type");
        const def = BESM4E_RULES.getWeaponEnhancementDef(id) || BESM4E_RULES.getWeaponLimiterDef(id) || BESM4E_RULES.getGeneralEnhancementDef(id) || BESM4E_RULES.getGeneralLimiterDef(id);
        if (def) {
          showTraitInfoModal(def, type);
        }
      });
    });

    container.querySelectorAll(".btn-weapon-edit").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        const wpn = currentCharacter.weapons.find(w => w.id === id);
        if (wpn) {
          openWeaponModal(wpn);
        }
      });
    });

    container.querySelectorAll(".btn-weapon-delete").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        currentCharacter.removeWeapon(id);
        renderBuilderWeapons();
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);
      });
    });
  }

  // Active Weapon Modal State
  let activeWeaponModalData = {
    id: null,
    name: "",
    level: 2,
    attackType: "ranged",
    range: "25m",
    enhancements: [],
    limiters: [],
    notes: ""
  };

  function openWeaponModal(wpn = null) {
    if (wpn) {
      const costInfo = BESM4E_RULES.calculateWeaponCost(wpn);
      activeWeaponModalData = {
        id: wpn.id || null,
        name: wpn.name || "",
        level: Math.max(1, parseInt(wpn.level, 10) || 1),
        attackType: wpn.attackType || ((wpn.range || "").toLowerCase().includes("melee") ? "melee" : "ranged"),
        range: wpn.range || "25m",
        enhancements: JSON.parse(JSON.stringify(costInfo.enhancements || [])),
        limiters: JSON.parse(JSON.stringify(costInfo.limiters || [])),
        notes: wpn.notes || ""
      };
    } else {
      activeWeaponModalData = {
        id: null,
        name: "",
        level: 2,
        attackType: "ranged",
        range: "25m",
        enhancements: [],
        limiters: [],
        notes: ""
      };
    }

    const saveBtn = document.getElementById("btn-save-weapon");
    if (saveBtn) {
      if (activeWeaponModalData.id) {
        saveBtn.textContent = "Save Weapon Changes";
      } else if (activeContainerTarget) {
        const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
        saveBtn.textContent = `Add Attack to ${cName}`;
      } else {
        saveBtn.textContent = "Add Weapon to Sheet";
      }
    }

    populateWeaponModalDropdowns();
    renderWeaponModalView();
    openModal("modal-add-weapon");
  }

  function populateWeaponModalDropdowns() {
    const enhSel = document.getElementById("weapon-modal-enh-select");
    const limSel = document.getElementById("weapon-modal-lim-select");
    if (!enhSel || !limSel) return;

    const legalEnh = BESM4E_RULES.getLegalEnhancementsForAttribute("weapon");
    const legalLim = BESM4E_RULES.getLegalLimitersForAttribute("weapon");

    enhSel.innerHTML = `<option value="">-- Choose Enhancement --</option>` +
      legalEnh.map(e => `<option value="${escapeHtml(e.id)}" title="${escapeHtml(e.description || '')}">${escapeHtml(e.name)} (+${e.costPerRank || 1} CP/rk)</option>`).join("");

    limSel.innerHTML = `<option value="">-- Choose Limiter --</option>` +
      legalLim.map(l => `<option value="${escapeHtml(l.id)}" title="${escapeHtml(l.description || '')}">${escapeHtml(l.name)} (-${l.refundPerRank || 1} CP/rk)</option>`).join("");
  }

  function renderWeaponModalView() {
    const editIdEl = document.getElementById("weapon-edit-id");
    const nameEl = document.getElementById("weapon-name");
    const lvlEl = document.getElementById("weapon-level");
    const typeEl = document.getElementById("weapon-type");
    const rangeEl = document.getElementById("weapon-range");

    if (editIdEl) editIdEl.value = activeWeaponModalData.id || "";
    if (nameEl) nameEl.value = activeWeaponModalData.name || "";
    if (lvlEl) lvlEl.value = activeWeaponModalData.level || 2;
    if (typeEl) typeEl.value = activeWeaponModalData.attackType || "ranged";
    if (rangeEl) rangeEl.value = activeWeaponModalData.range || (activeWeaponModalData.attackType === "melee" ? "Melee" : "25m");

    const derived = currentCharacter.getDerived();
    const isMelee = activeWeaponModalData.attackType === "melee";
    const dm = isMelee ? derived.meleeDamageMultiplier : derived.damageMultiplier;
    const dmg = (activeWeaponModalData.level || 1) * dm;
    const previewEl = document.getElementById("weapon-damage-preview");
    if (previewEl) {
      previewEl.value = `${dmg} Damage (Level ${activeWeaponModalData.level} × ${dm} DM)`;
    }

    const costInfo = BESM4E_RULES.calculateWeaponCost(activeWeaponModalData);
    const baseCostEl = document.getElementById("weapon-stat-base-cost");
    const enhCostEl = document.getElementById("weapon-stat-enh-cost");
    const limCostEl = document.getElementById("weapon-stat-lim-refund");
    const totalCostEl = document.getElementById("weapon-stat-total-cost");
    const effLevelEl = document.getElementById("weapon-stat-eff-level");

    if (baseCostEl) baseCostEl.textContent = `${costInfo.baseCost} CP`;
    if (enhCostEl) enhCostEl.textContent = `+${costInfo.enhCost} CP`;
    if (limCostEl) limCostEl.textContent = `-${costInfo.limRefund} CP`;
    if (totalCostEl) totalCostEl.textContent = `${costInfo.totalCost} CP`;
    if (effLevelEl) effLevelEl.textContent = `Lvl ${costInfo.effectiveLevel}`;

    // Active Pills List
    const pillsContainer = document.getElementById("weapon-assigned-pills");
    const countEl = document.getElementById("weapon-assigned-count");
    if (pillsContainer) {
      const enhPills = (activeWeaponModalData.enhancements || []).map(e => `
        <span class="modifier-pill modifier-pill-enhancement">
          <span class="btn-trait-pill-info" data-id="${escapeHtml(e.id || e.name)}" data-type="Weapon Enhancement" title="Click to view trait details" style="cursor: pointer;">
            ✨ ${escapeHtml(e.name)}
          </span>
          <div class="combo-stepper combo-stepper-sm" style="display: inline-flex; margin: 0 0.25rem;">
            <button type="button" class="combo-stepper-btn combo-stepper-minus btn-modal-enh-pill-minus" data-id="${escapeHtml(e.id || e.name)}" title="Decrease Rank" aria-label="Decrease Rank">−</button>
            <input type="number" class="combo-stepper-input input-modal-enh-pill-rank" data-id="${escapeHtml(e.id || e.name)}" value="${e.rank || 1}" min="1" max="5" style="width: 2.2rem; font-size: 12pt;" title="Rank">
            <button type="button" class="combo-stepper-btn combo-stepper-plus btn-modal-enh-pill-plus" data-id="${escapeHtml(e.id || e.name)}" title="Increase Rank" aria-label="Increase Rank">+</button>
          </div>
          <span style="font-weight: 700;">(+${(e.rank || 1) * (e.costPerRank || 1)} CP)</span>
          <button type="button" class="modifier-pill-del btn-modal-del-enh" data-id="${escapeHtml(e.id || e.name)}" title="Remove">✕</button>
        </span>
      `).join("");

      const limPills = (activeWeaponModalData.limiters || []).map(l => `
        <span class="modifier-pill modifier-pill-limiter">
          <span class="btn-trait-pill-info" data-id="${escapeHtml(l.id || l.name)}" data-type="Weapon Limiter" title="Click to view trait details" style="cursor: pointer;">
            ⚠️ ${escapeHtml(l.name)}
          </span>
          <div class="combo-stepper combo-stepper-sm" style="display: inline-flex; margin: 0 0.25rem;">
            <button type="button" class="combo-stepper-btn combo-stepper-minus btn-modal-lim-pill-minus" data-id="${escapeHtml(l.id || l.name)}" title="Decrease Rank" aria-label="Decrease Rank">−</button>
            <input type="number" class="combo-stepper-input input-modal-lim-pill-rank" data-id="${escapeHtml(l.id || l.name)}" value="${l.rank || 1}" min="1" max="5" style="width: 2.2rem; font-size: 12pt;" title="Rank">
            <button type="button" class="combo-stepper-btn combo-stepper-plus btn-modal-lim-pill-plus" data-id="${escapeHtml(l.id || l.name)}" title="Increase Rank" aria-label="Increase Rank">+</button>
          </div>
          <span style="font-weight: 700;">(-${(l.rank || 1) * (l.refundPerRank || 1)} CP)</span>
          <button type="button" class="modifier-pill-del btn-modal-del-lim" data-id="${escapeHtml(l.id || l.name)}" title="Remove">✕</button>
        </span>
      `).join("");

      const totalMods = (activeWeaponModalData.enhancements || []).length + (activeWeaponModalData.limiters || []).length;
      if (countEl) countEl.textContent = `${totalMods} modifier${totalMods === 1 ? '' : 's'}`;

      if (enhPills || limPills) {
        pillsContainer.innerHTML = enhPills + limPills;
      } else {
        pillsContainer.innerHTML = `<span style="color: var(--text-dim); font-size: 12pt; font-style: italic;">No modifiers assigned yet. Use the dropdown selectors on the right to add legal enhancements and limiters.</span>`;
      }

      pillsContainer.querySelectorAll(".btn-modal-del-enh").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id").toLowerCase();
          activeWeaponModalData.enhancements = activeWeaponModalData.enhancements.filter(e => (e.id && e.id.toLowerCase() !== id) && (e.name && e.name.toLowerCase() !== id));
          renderWeaponModalView();
        });
      });

      pillsContainer.querySelectorAll(".btn-modal-del-lim").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id").toLowerCase();
          activeWeaponModalData.limiters = activeWeaponModalData.limiters.filter(l => (l.id && l.id.toLowerCase() !== id) && (l.name && l.name.toLowerCase() !== id));
          renderWeaponModalView();
        });
      });

      pillsContainer.querySelectorAll(".btn-modal-enh-pill-minus").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id").toLowerCase();
          const item = (activeWeaponModalData.enhancements || []).find(x => (x.id && x.id.toLowerCase() === id) || (x.name && x.name.toLowerCase() === id));
          if (item) {
            item.rank = (item.rank || 1) - 1;
            if (item.rank <= 0) {
              activeWeaponModalData.enhancements = activeWeaponModalData.enhancements.filter(x => x !== item);
            }
            renderWeaponModalView();
          }
        });
      });

      pillsContainer.querySelectorAll(".btn-modal-enh-pill-plus").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id").toLowerCase();
          const item = (activeWeaponModalData.enhancements || []).find(x => (x.id && x.id.toLowerCase() === id) || (x.name && x.name.toLowerCase() === id));
          if (item) {
            item.rank = Math.min(5, (item.rank || 1) + 1);
            renderWeaponModalView();
          }
        });
      });

      pillsContainer.querySelectorAll(".input-modal-enh-pill-rank").forEach(inp => {
        inp.addEventListener("click", (e) => e.stopPropagation());
        inp.addEventListener("change", (e) => {
          const id = inp.getAttribute("data-id").toLowerCase();
          const item = (activeWeaponModalData.enhancements || []).find(x => (x.id && x.id.toLowerCase() === id) || (x.name && x.name.toLowerCase() === id));
          if (item) {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            if (val > 5) val = 5;
            item.rank = val;
            renderWeaponModalView();
          }
        });
      });

      pillsContainer.querySelectorAll(".btn-modal-lim-pill-minus").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id").toLowerCase();
          const item = (activeWeaponModalData.limiters || []).find(x => (x.id && x.id.toLowerCase() === id) || (x.name && x.name.toLowerCase() === id));
          if (item) {
            item.rank = (item.rank || 1) - 1;
            if (item.rank <= 0) {
              activeWeaponModalData.limiters = activeWeaponModalData.limiters.filter(x => x !== item);
            }
            renderWeaponModalView();
          }
        });
      });

      pillsContainer.querySelectorAll(".btn-modal-lim-pill-plus").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id").toLowerCase();
          const item = (activeWeaponModalData.limiters || []).find(x => (x.id && x.id.toLowerCase() === id) || (x.name && x.name.toLowerCase() === id));
          if (item) {
            item.rank = Math.min(5, (item.rank || 1) + 1);
            renderWeaponModalView();
          }
        });
      });

      pillsContainer.querySelectorAll(".input-modal-lim-pill-rank").forEach(inp => {
        inp.addEventListener("click", (e) => e.stopPropagation());
        inp.addEventListener("change", (e) => {
          const id = inp.getAttribute("data-id").toLowerCase();
          const item = (activeWeaponModalData.limiters || []).find(x => (x.id && x.id.toLowerCase() === id) || (x.name && x.name.toLowerCase() === id));
          if (item) {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            if (val > 5) val = 5;
            item.rank = val;
            renderWeaponModalView();
          }
        });
      });

      pillsContainer.querySelectorAll(".btn-trait-pill-info").forEach(pill => {
        pill.addEventListener("click", (e) => {
          if (e.target.closest(".modifier-pill-del") || e.target.closest(".combo-stepper")) return;
          const id = pill.getAttribute("data-id");
          const type = pill.getAttribute("data-type");
          const def = BESM4E_RULES.getWeaponEnhancementDef(id) || BESM4E_RULES.getWeaponLimiterDef(id) || BESM4E_RULES.getGeneralEnhancementDef(id) || BESM4E_RULES.getGeneralLimiterDef(id);
          if (def) {
            showTraitInfoModal(def, type);
          }
        });
      });
    }

    syncWeaponChipsFromActiveModal();
  }

  function syncWeaponChipsFromActiveModal() {
    const activeEnhNames = (activeWeaponModalData.enhancements || []).map(e => e.name.toLowerCase());
    const activeLimNames = (activeWeaponModalData.limiters || []).map(l => l.name.toLowerCase());

    document.querySelectorAll("#weapon-enhancements-chips .weapon-chip").forEach(chip => {
      const name = (chip.getAttribute("data-name") || "").toLowerCase();
      if (activeEnhNames.includes(name)) {
        chip.classList.add("selected-enhancement");
      } else {
        chip.classList.remove("selected-enhancement");
      }
    });

    document.querySelectorAll("#weapon-limiters-chips .weapon-chip").forEach(chip => {
      const name = (chip.getAttribute("data-name") || "").toLowerCase();
      if (activeLimNames.includes(name)) {
        chip.classList.add("selected-limiter");
      } else {
        chip.classList.remove("selected-limiter");
      }
    });
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
      chip.title = `${enh.description} (+${cost} CP/rk)`;
      chip.innerHTML = `<span>${escapeHtml(enh.name)}</span> <span style="opacity: 0.7; font-size: 12pt;">(+${cost})</span>`;
      chip.addEventListener("click", () => {
        const lower = enh.name.toLowerCase();
        const existingIdx = (activeWeaponModalData.enhancements || []).findIndex(e => e.name.toLowerCase() === lower);
        if (existingIdx >= 0) {
          activeWeaponModalData.enhancements.splice(existingIdx, 1);
        } else {
          activeWeaponModalData.enhancements.push({
            id: enh.id,
            name: enh.name,
            rank: 1,
            costPerRank: enh.costPerRank || 1
          });
        }
        renderWeaponModalView();
      });
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
      chip.addEventListener("click", () => {
        const lower = lim.name.toLowerCase();
        const existingIdx = (activeWeaponModalData.limiters || []).findIndex(l => l.name.toLowerCase() === lower);
        if (existingIdx >= 0) {
          activeWeaponModalData.limiters.splice(existingIdx, 1);
        } else {
          activeWeaponModalData.limiters.push({
            id: lim.id,
            name: lim.name,
            rank: 1,
            refundPerRank: lim.refundPerRank || 1
          });
        }
        renderWeaponModalView();
      });
      limGrid.appendChild(chip);
    });

    // Tab buttons
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

    // Modal Dropdown Add Enhancement Handler
    const enhSel = document.getElementById("weapon-modal-enh-select");
    const enhDescBox = document.getElementById("weapon-enh-desc-box");
    if (enhSel && enhDescBox) {
      enhSel.addEventListener("change", () => {
        const def = BESM4E_RULES.getWeaponEnhancementDef(enhSel.value);
        if (def && def.description) {
          enhDescBox.style.display = "block";
          enhDescBox.innerHTML = `<strong>⚡ ${escapeHtml(def.name)}:</strong> ${escapeHtml(def.description)}`;
        } else {
          enhDescBox.style.display = "none";
          enhDescBox.innerHTML = "";
        }
      });
    }

    // Modal Trait Info Button - Enhancement
    const btnModalEnhInfo = document.getElementById("btn-weapon-modal-enh-info");
    if (btnModalEnhInfo) {
      btnModalEnhInfo.addEventListener("click", () => {
        const val = enhSel?.value;
        if (!val) {
          showToast("Please choose an enhancement from the dropdown first to view its description.");
          return;
        }
        const def = BESM4E_RULES.getWeaponEnhancementDef(val) || BESM4E_RULES.getGeneralEnhancementDef(val);
        if (def) {
          showTraitInfoModal(def, "Weapon Enhancement");
        }
      });
    }

    const btnAddModalEnh = document.getElementById("btn-weapon-modal-add-enh");
    if (btnAddModalEnh) {
      btnAddModalEnh.addEventListener("click", () => {
        const val = enhSel?.value;
        if (!val) {
          showToast("Please choose an enhancement from the dropdown first.");
          return;
        }
        const rank = parseInt(document.getElementById("weapon-modal-enh-rank")?.value, 10) || 1;
        const def = BESM4E_RULES.getWeaponEnhancementDef(val);
        if (def) {
          const existing = (activeWeaponModalData.enhancements || []).find(e => e.id === def.id || e.name.toLowerCase() === def.name.toLowerCase());
          if (existing) {
            existing.rank = Math.min(def.maxRank || 5, existing.rank + rank);
          } else {
            activeWeaponModalData.enhancements.push({
              id: def.id,
              name: def.name,
              rank: Math.min(def.maxRank || 5, rank),
              costPerRank: def.costPerRank || 1
            });
          }
          renderWeaponModalView();
        }
      });
    }

    // Modal Dropdown Add Limiter Handler
    const limSel = document.getElementById("weapon-modal-lim-select");
    const limDescBox = document.getElementById("weapon-lim-desc-box");
    if (limSel && limDescBox) {
      limSel.addEventListener("change", () => {
        const def = BESM4E_RULES.getWeaponLimiterDef(limSel.value);
        if (def && def.description) {
          limDescBox.style.display = "block";
          limDescBox.innerHTML = `<strong>⚠️ ${escapeHtml(def.name)}:</strong> ${escapeHtml(def.description)}`;
        } else {
          limDescBox.style.display = "none";
          limDescBox.innerHTML = "";
        }
      });
    }

    // Modal Trait Info Button - Limiter
    const btnModalLimInfo = document.getElementById("btn-weapon-modal-lim-info");
    if (btnModalLimInfo) {
      btnModalLimInfo.addEventListener("click", () => {
        const val = limSel?.value;
        if (!val) {
          showToast("Please choose a limiter from the dropdown first to view its description.");
          return;
        }
        const def = BESM4E_RULES.getWeaponLimiterDef(val) || BESM4E_RULES.getGeneralLimiterDef(val);
        if (def) {
          showTraitInfoModal(def, "Weapon Limiter");
        }
      });
    }

    const btnAddModalLim = document.getElementById("btn-weapon-modal-add-lim");
    if (btnAddModalLim) {
      btnAddModalLim.addEventListener("click", () => {
        const val = limSel?.value;
        if (!val) {
          showToast("Please choose a limiter from the dropdown first.");
          return;
        }
        const rank = parseInt(document.getElementById("weapon-modal-lim-rank")?.value, 10) || 1;
        const def = BESM4E_RULES.getWeaponLimiterDef(val);
        if (def) {
          const existing = (activeWeaponModalData.limiters || []).find(l => l.id === def.id || l.name.toLowerCase() === def.name.toLowerCase());
          if (existing) {
            existing.rank = Math.min(def.maxRank || 5, existing.rank + rank);
          } else {
            activeWeaponModalData.limiters.push({
              id: def.id,
              name: def.name,
              rank: Math.min(def.maxRank || 5, rank),
              refundPerRank: def.refundPerRank || 1
            });
          }
          renderWeaponModalView();
        }
      });
    }

    // Rank steppers inside modal
    document.getElementById("btn-weapon-modal-enh-minus")?.addEventListener("click", () => {
      const inp = document.getElementById("weapon-modal-enh-rank");
      if (inp) inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) - 1);
    });
    document.getElementById("btn-weapon-modal-enh-plus")?.addEventListener("click", () => {
      const inp = document.getElementById("weapon-modal-enh-rank");
      if (inp) inp.value = Math.min(5, (parseInt(inp.value, 10) || 1) + 1);
    });

    document.getElementById("btn-weapon-modal-lim-minus")?.addEventListener("click", () => {
      const inp = document.getElementById("weapon-modal-lim-rank");
      if (inp) inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) - 1);
    });
    document.getElementById("btn-weapon-modal-lim-plus")?.addEventListener("click", () => {
      const inp = document.getElementById("weapon-modal-lim-rank");
      if (inp) inp.value = Math.min(5, (parseInt(inp.value, 10) || 1) + 1);
    });

    document.getElementById("weapon-modal-enh-rank")?.addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 5) val = 5;
      e.target.value = val;
    });

    document.getElementById("weapon-modal-lim-rank")?.addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 5) val = 5;
      e.target.value = val;
    });

    // Inputs inside modal
    document.getElementById("weapon-name")?.addEventListener("input", (e) => {
      activeWeaponModalData.name = e.target.value.trim();
    });

    document.getElementById("weapon-level")?.addEventListener("input", (e) => {
      activeWeaponModalData.level = Math.max(1, parseInt(e.target.value, 10) || 1);
      renderWeaponModalView();
    });

    document.getElementById("weapon-type")?.addEventListener("change", (e) => {
      activeWeaponModalData.attackType = e.target.value;
      if (e.target.value === "melee") {
        activeWeaponModalData.range = "Melee";
      } else if (!activeWeaponModalData.range || activeWeaponModalData.range.toLowerCase() === "melee") {
        activeWeaponModalData.range = "25m";
      }
      renderWeaponModalView();
    });

    document.getElementById("weapon-range")?.addEventListener("input", (e) => {
      activeWeaponModalData.range = e.target.value.trim();
    });
  }

  document.getElementById("btn-add-weapon").addEventListener("click", () => {
    clearActiveContainerTarget();
    openWeaponModal();
  });

  document.getElementById("btn-save-weapon").addEventListener("click", () => {
    const name = document.getElementById("weapon-name").value.trim();
    if (!name) {
      alert("Please enter a weapon or attack name.");
      return;
    }
    const level = parseInt(document.getElementById("weapon-level").value, 10) || 1;
    const range = document.getElementById("weapon-range").value.trim() || (activeWeaponModalData.attackType === "melee" ? "Melee" : "25m");
    const attackType = document.getElementById("weapon-type").value || "ranged";

    const wpnData = {
      name,
      level,
      range,
      attackType,
      enhancements: JSON.parse(JSON.stringify(activeWeaponModalData.enhancements || [])),
      limiters: JSON.parse(JSON.stringify(activeWeaponModalData.limiters || [])),
      notes: activeWeaponModalData.notes || ""
    };

    if (activeContainerTarget) {
      currentCharacter.addContainerTrait(activeContainerTarget, "weapons", wpnData);
      const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
      showToast(`Added attack "${name}" to ${cName}`);
      clearActiveContainerTarget();
    } else if (activeWeaponModalData.id) {
      currentCharacter.updateWeapon(activeWeaponModalData.id, wpnData);
      showToast(`Updated attack "${name}"`);
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
    if (activeContainerTarget && (!currentCharacter || !currentCharacter.getContainerAttribute(activeContainerTarget)?.isContainer)) {
      clearActiveContainerTarget();
    }
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

        const initLevel = attr.id === "weapon" ? 2 : 1;

        // Format name as "[attribute]: [subtrait]" when subtrait is present
        let finalName = attr.name;
        if (sub) {
          finalName = `${attr.name}: ${sub}`;
        }

        if (activeContainerTarget) {
          currentCharacter.addContainerTrait(activeContainerTarget, "attributes", attr, initLevel, finalName, null, "", sub, det);
          const cName = currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container";
          showToast(`Added "${finalName}${det ? ` [${det}]` : ""}" to ${cName}`);
          clearActiveContainerTarget();
        } else {
          currentCharacter.addAttribute(attr, initLevel, finalName, null, sub, det);
          showToast(`Added "${finalName}${det ? ` [${det}]` : ""}"`);
        }
        renderBuilderAttributes();
        renderBuilderWeapons();
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

  function isSkillOnTarget(skillId) {
    if (!currentCharacter || !skillId) return false;
    const baseId = String(skillId).replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
    if (activeContainerTarget) {
      const container = currentCharacter.getContainerAttribute(activeContainerTarget);
      const cSkills = container?.containerTraits?.skills || [];
      return cSkills.some(s => (s.skillId && String(s.skillId).toLowerCase() === baseId) || (s.id && String(s.id).toLowerCase() === baseId));
    } else {
      return (currentCharacter.skills || []).some(s => (s.skillId && String(s.skillId).toLowerCase() === baseId) || (s.id && String(s.id).toLowerCase() === baseId));
    }
  }

  function getSkillLevelOnTarget(skillId) {
    if (!currentCharacter || !skillId) return 0;
    const baseId = String(skillId).replace(/_\d+_[a-z0-9]+$/, '').replace(/_\d+$/, '').toLowerCase();
    let list = [];
    if (activeContainerTarget) {
      const container = currentCharacter.getContainerAttribute(activeContainerTarget);
      list = container?.containerTraits?.skills || [];
    } else {
      list = currentCharacter.skills || [];
    }
    const matching = list.filter(s => (s.skillId && String(s.skillId).toLowerCase() === baseId) || (s.id && String(s.id).toLowerCase() === baseId));
    return matching.length > 0 ? matching[matching.length - 1].level : 0;
  }

  function populateSkillDropdown() {
    const sel = document.getElementById("skill-dropdown-select");
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = `<option value="">-- Choose Individual Skill from Dropdown (1 CP/lvl) --</option>`;

    const allSkills = BESM4E_RULES.getAllConstituentSkills ? BESM4E_RULES.getAllConstituentSkills() : [];
    const sorted = [...allSkills].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(s => {
      const isRepeatable = BESM4E_RULES.isSkillRepeatable(s);
      const alreadyAdded = isSkillOnTarget(s.id);

      // A single-instance skill that was added would not be shown on the skill dropdown!
      if (!isRepeatable && alreadyAdded) {
        return;
      }

      const opt = document.createElement("option");
      opt.value = s.id;
      const repLabel = isRepeatable ? " - Repeatable" : "";
      const grpLabel = s.groupName ? ` (${s.groupName})` : "";
      opt.textContent = `${s.name} [${s.stat}]${grpLabel}${repLabel}`;
      sel.appendChild(opt);
    });

    if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
      sel.value = currentVal;
    } else {
      sel.value = "";
    }
  }

  const btnAddFromDropdown = document.getElementById("btn-add-from-skill-dropdown");
  if (btnAddFromDropdown) {
    btnAddFromDropdown.addEventListener("click", () => {
      const sel = document.getElementById("skill-dropdown-select");
      if (!sel || !sel.value) {
        showToast("Please choose a skill from the dropdown first.");
        return;
      }
      const skillId = sel.value;
      const allSkills = BESM4E_RULES.getAllConstituentSkills ? BESM4E_RULES.getAllConstituentSkills() : [];
      const sDef = allSkills.find(s => s.id === skillId);
      if (!sDef) return;

      const isRepeatable = BESM4E_RULES.isSkillRepeatable(sDef);
      const skillDef = {
        id: sDef.id,
        name: sDef.name,
        stat: sDef.stat,
        groupId: sDef.groupId,
        groupName: sDef.groupName,
        costPerLevel: 1,
        allowMultiple: isRepeatable,
        description: sDef.description
      };

      const targetName = activeContainerTarget ? (currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container") : "Character";

      if (activeContainerTarget) {
        currentCharacter.addContainerTrait(activeContainerTarget, "skills", skillDef, 1);
        showToast(`Added skill "${sDef.name}" (Level 1, 1 CP) to ${targetName}`);
      } else {
        currentCharacter.addSkill(skillDef, 1);
        showToast(`Added skill "${sDef.name}" (Level 1, 1 CP)`);
      }

      renderBuilderSkillGroups();
      renderBuilderAttributes();
      renderDerivedStats();
      renderPointBreakdown();
      saveCurrentCharacter(true);

      renderSkillCatalog();
    });
  }

  function renderSkillCatalog() {
    if (activeContainerTarget && (!currentCharacter || !currentCharacter.getContainerAttribute(activeContainerTarget)?.isContainer)) {
      clearActiveContainerTarget();
    }
    const listEl = document.getElementById("skill-catalog-list");
    listEl.innerHTML = "";
    populateSkillDropdown();
    const query = document.getElementById("skill-search").value.toLowerCase().trim();
    const targetName = activeContainerTarget ? (currentCharacter.getContainerAttribute(activeContainerTarget)?.name || "Container") : "Character";

    if (currentSkillTierFilter === "individual") {
      // Individual constituent skills view (BESM 4E p. 120: 1 CP / Level)
      const allSkills = BESM4E_RULES.getAllConstituentSkills ? BESM4E_RULES.getAllConstituentSkills() : [];
      const filteredSkills = allSkills.filter(s => {
        const isRepeatable = BESM4E_RULES.isSkillRepeatable(s);
        const alreadyAdded = isSkillOnTarget(s.id);
        // A single-instance skill that was added would not be shown on the skill dropdown / individual skills list!
        if (!isRepeatable && alreadyAdded) return false;
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
        const isRepeatable = BESM4E_RULES.isSkillRepeatable(s);
        const btnClass = "btn btn-primary btn-sm btn-add-indiv-skill";
        const btnText = isRepeatable ? `+ Add (${s.specializations ? 'Specialized, ' : ''}1 CP/lvl)` : `+ Add (1 CP/lvl)`;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;">
            <div>
              <strong style="color: var(--text-main); font-size: 12pt;">${escapeHtml(s.name)}</strong>
              <span class="tag-pill">${escapeHtml(s.stat)}</span>
              <span class="tag-pill" style="opacity: 0.7;">${escapeHtml(s.groupName)} Group</span>
              ${isRepeatable ? `<span class="tag-pill" style="color: var(--accent-primary);">Repeatable</span>` : ""}
            </div>
            <button type="button" class="${btnClass}" style="padding: 0.25rem 0.6rem; font-size: 12pt;">
              ${btnText}
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
            allowMultiple: isRepeatable,
            description: s.description
          };
          if (activeContainerTarget) {
            currentCharacter.addContainerTrait(activeContainerTarget, "skills", skillDef, 1);
            showToast(`Added skill "${s.name}" (Level 1, 1 CP) to ${targetName}`);
          } else {
            currentCharacter.addSkill(skillDef, 1);
            showToast(`Added skill "${s.name}" (Level 1, 1 CP)`);
          }
          renderBuilderSkillGroups();
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);

          // Refresh catalog and skill dropdown so added single-instance skill is removed from view
          renderSkillCatalog();
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
      const matchingIndiv = allSkills.filter(s => {
        const isRepeatable = BESM4E_RULES.isSkillRepeatable(s);
        const alreadyAdded = isSkillOnTarget(s.id);
        if (!isRepeatable && alreadyAdded) return false;
        return s.name.toLowerCase().includes(query) || 
               (s.specializations && s.specializations.some(sp => sp.toLowerCase().includes(query)));
      }).slice(0, 6);

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
          const isRepeatable = BESM4E_RULES.isSkillRepeatable(s);
          const alreadyAdded = isSkillOnTarget(s.id);
          const isLit = !isRepeatable && alreadyAdded;
          const curLvl = alreadyAdded ? getSkillLevelOnTarget(s.id) : 0;
          pill.className = `skill-tag-pill interactive-skill-pill${isLit ? " pill-lit" : ""}`;
          pill.setAttribute("data-skill-id", s.id);
          pill.style.cssText = "padding: 0.25rem 0.5rem; font-size: 12pt;";
          pill.title = isRepeatable
            ? `Click to add ${s.name} individually (Repeatable / Multiple specializations, 1 CP/lvl) to ${targetName}`
            : (alreadyAdded ? `${s.name} is on ${targetName} (Level ${curLvl}) - Click to remove` : `Click to add ${s.name} individually (1 CP/lvl) to ${targetName}`);
          pill.innerHTML = `<strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span> <span class="pill-add-btn">${isLit ? "✓" : "+"}</span>`;

          pill.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isRepeatable && isSkillOnTarget(s.id)) {
              if (activeContainerTarget) {
                const container = currentCharacter.getContainerAttribute(activeContainerTarget);
                const matching = container?.containerTraits?.skills?.find(x => x.id === s.id || x.skillId === s.id);
                if (matching) {
                  currentCharacter.removeContainerTrait(activeContainerTarget, "skills", matching.id);
                  showToast(`Removed skill "${s.name}" from ${targetName}`);
                }
              } else {
                const matching = currentCharacter.skills.find(x => x.id === s.id || x.skillId === s.id);
                if (matching) {
                  currentCharacter.removeSkill(matching.id);
                  showToast(`Removed skill "${s.name}"`);
                }
              }
              renderBuilderSkillGroups();
              renderBuilderAttributes();
              renderDerivedStats();
              renderPointBreakdown();
              saveCurrentCharacter(true);

              const allMatchingPills = listEl.querySelectorAll(`.interactive-skill-pill[data-skill-id="${s.id}"]`);
              allMatchingPills.forEach(p => {
                p.classList.remove("pill-lit");
                p.title = `Click to add individual skill ${s.name} (1 CP/lvl) to ${targetName}`;
                const btn = p.querySelector(".pill-add-btn");
                if (btn) btn.textContent = "+";
                p.innerHTML = `<strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span> <span class="pill-add-btn">+</span>`;
              });
              populateSkillDropdown();
              return;
            }

            const skillDef = {
              id: s.id,
              name: s.name,
              stat: s.stat,
              groupId: s.groupId,
              groupName: s.groupName,
              costPerLevel: 1,
              allowMultiple: isRepeatable,
              description: s.description
            };
            if (activeContainerTarget) {
              currentCharacter.addContainerTrait(activeContainerTarget, "skills", skillDef, 1);
              showToast(`Added skill "${s.name}" (Level 1, 1 CP) to ${targetName}`);
            } else {
              currentCharacter.addSkill(skillDef, 1);
              showToast(`Added skill "${s.name}" (Level 1, 1 CP)`);
            }
            renderBuilderSkillGroups();
            renderBuilderAttributes();
            renderDerivedStats();
            renderPointBreakdown();
            saveCurrentCharacter(true);

            if (!isRepeatable) {
              const allMatchingPills = listEl.querySelectorAll(`.interactive-skill-pill[data-skill-id="${s.id}"]`);
              allMatchingPills.forEach(p => {
                p.classList.add("pill-lit");
                p.title = `${s.name} is on ${targetName} (Level 1) - Click to remove`;
                const btn = p.querySelector(".pill-add-btn");
                if (btn) btn.textContent = "✓";
                p.innerHTML = `<strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span> <span class="pill-add-btn">✓</span>`;
              });
              populateSkillDropdown();
            } else {
              pill.classList.remove("pill-blink-briefly");
              void pill.offsetWidth;
              pill.classList.add("pill-blink-briefly");
              setTimeout(() => {
                pill.classList.remove("pill-blink-briefly");
                pill.innerHTML = `<strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span> <span class="pill-add-btn">+</span>`;
              }, 750);
            }
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
      const skillsPills = constituentSkills.map(s => {
        const isRepeatable = BESM4E_RULES.isSkillRepeatable(s);
        const alreadyAdded = isSkillOnTarget(s.id);
        const isLit = !isRepeatable && alreadyAdded;
        const curLvl = alreadyAdded ? getSkillLevelOnTarget(s.id) : 0;
        const titleText = isRepeatable
          ? `Click to add ${s.name} (Repeatable / Multiple specializations, 1 CP/lvl) to ${targetName}`
          : (alreadyAdded ? `${s.name} is on ${targetName} (Level ${curLvl}) - Click to remove` : `Click to add individual skill ${s.name} (1 CP/lvl) to ${targetName}`);
        const actionSymbol = isLit ? "✓" : "+";
        const litClass = isLit ? " pill-lit" : "";
        return `<span class="skill-tag-pill interactive-skill-pill${litClass}" data-skill-id="${s.id}" data-group-id="${sg.id}" title="${titleText}"><strong>${escapeHtml(s.name)}</strong> <span class="skill-tag-stat">${s.stat}</span> <span class="pill-add-btn">${actionSymbol}</span></span>`;
      }).join("");

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
        let curLvl = 1;
        if (activeContainerTarget) {
          currentCharacter.addContainerTrait(activeContainerTarget, "skillGroups", sg, 1);
          const container = currentCharacter.getContainerAttribute(activeContainerTarget);
          const existing = container?.containerTraits?.skillGroups?.find(x => x.id === sg.id);
          curLvl = existing ? existing.level : 1;
          showToast(`Added ${sg.name} Skill Group (Level ${curLvl}) to ${targetName}`);
        } else {
          currentCharacter.addSkillGroup(sg, 1);
          const existing = currentCharacter.skillGroups.find(x => x.id === sg.id);
          curLvl = existing ? existing.level : 1;
          showToast(`Added ${sg.name} Skill Group (Level ${curLvl})`);
        }
        renderBuilderSkillGroups();
        renderBuilderAttributes();
        renderDerivedStats();
        renderPointBreakdown();
        saveCurrentCharacter(true);

        const btn = card.querySelector(".btn-add-whole-group");
        if (btn) {
          const origText = btn.textContent;
          btn.textContent = `✓ Added (Lvl ${curLvl})`;
          btn.classList.add("btn-success");
          setTimeout(() => {
            btn.textContent = origText;
            btn.classList.remove("btn-success");
          }, 1200);
        }
      });

      // Interactive constituent skill pills
      card.querySelectorAll(".interactive-skill-pill").forEach(pill => {
        pill.addEventListener("click", (e) => {
          e.stopPropagation();
          const sId = pill.getAttribute("data-skill-id");
          const sDef = constituentSkills.find(s => s.id === sId);
          if (!sDef) return;
          const isRepeatable = BESM4E_RULES.isSkillRepeatable(sDef);

          if (!isRepeatable && isSkillOnTarget(sDef.id)) {
            // Clicking a single-instance skill's pill a second time should *remove* the skill!
            if (activeContainerTarget) {
              const container = currentCharacter.getContainerAttribute(activeContainerTarget);
              const matching = container?.containerTraits?.skills?.find(x => x.id === sDef.id || x.skillId === sDef.id);
              if (matching) {
                currentCharacter.removeContainerTrait(activeContainerTarget, "skills", matching.id);
                showToast(`Removed skill "${sDef.name}" from ${targetName}`);
              }
            } else {
              const matching = currentCharacter.skills.find(x => x.id === sDef.id || x.skillId === sDef.id);
              if (matching) {
                currentCharacter.removeSkill(matching.id);
                showToast(`Removed skill "${sDef.name}"`);
              }
            }
            renderBuilderSkillGroups();
            renderBuilderAttributes();
            renderDerivedStats();
            renderPointBreakdown();
            saveCurrentCharacter(true);

            const allMatchingPills = listEl.querySelectorAll(`.interactive-skill-pill[data-skill-id="${sDef.id}"]`);
            allMatchingPills.forEach(p => {
              p.classList.remove("pill-lit");
              p.title = `Click to add individual skill ${sDef.name} (1 CP/lvl) to ${targetName}`;
              const btn = p.querySelector(".pill-add-btn");
              if (btn) btn.textContent = "+";
              p.innerHTML = `<strong>${escapeHtml(sDef.name)}</strong> <span class="skill-tag-stat">${sDef.stat}</span> <span class="pill-add-btn">+</span>`;
            });
            populateSkillDropdown();
            return;
          }

          const skillDef = {
            id: sDef.id,
            name: sDef.name,
            stat: sDef.stat,
            groupId: sg.id,
            groupName: sg.name,
            costPerLevel: 1,
            allowMultiple: isRepeatable,
            description: sDef.description
          };
          if (activeContainerTarget) {
            currentCharacter.addContainerTrait(activeContainerTarget, "skills", skillDef, 1);
            showToast(`Added skill "${sDef.name}" (Level 1, 1 CP) to ${targetName}`);
          } else {
            currentCharacter.addSkill(skillDef, 1);
            showToast(`Added skill "${sDef.name}" (Level 1, 1 CP)`);
          }
          renderBuilderSkillGroups();
          renderBuilderAttributes();
          renderDerivedStats();
          renderPointBreakdown();
          saveCurrentCharacter(true);

          if (!isRepeatable) {
            // Single-instance skill: LIGHT UP!
            const allMatchingPills = listEl.querySelectorAll(`.interactive-skill-pill[data-skill-id="${sDef.id}"]`);
            allMatchingPills.forEach(p => {
              p.classList.add("pill-lit");
              p.title = `${sDef.name} is on ${targetName} (Level 1) - Click to remove`;
              const btn = p.querySelector(".pill-add-btn");
              if (btn) btn.textContent = "✓";
              p.innerHTML = `<strong>${escapeHtml(sDef.name)}</strong> <span class="skill-tag-stat">${sDef.stat}</span> <span class="pill-add-btn">✓</span>`;
            });
            populateSkillDropdown();
          } else {
            // Repeatable skill: BLINK BRIEFLY!
            pill.classList.remove("pill-blink-briefly");
            void pill.offsetWidth;
            pill.classList.add("pill-blink-briefly");
            setTimeout(() => {
              pill.classList.remove("pill-blink-briefly");
              pill.innerHTML = `<strong>${escapeHtml(sDef.name)}</strong> <span class="skill-tag-stat">${sDef.stat}</span> <span class="pill-add-btn">+</span>`;
            }, 750);
          }
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

    // Reset inputs for another custom skill
    document.getElementById("custom-skill-name").value = "";
    document.getElementById("custom-skill-desc").value = "";
    const specEl = document.getElementById("custom-skill-spec");
    if (specEl) specEl.value = "";
    const rankEl = document.getElementById("custom-indiv-skill-rank");
    if (rankEl) rankEl.value = "1";
    const groupRankEl = document.getElementById("custom-skill-rank");
    if (groupRankEl) groupRankEl.value = "1";

    const saveBtn = document.getElementById("btn-save-custom-skill");
    if (saveBtn) {
      const origText = saveBtn.textContent;
      saveBtn.textContent = "✓ Added!";
      saveBtn.classList.add("btn-success");
      setTimeout(() => {
        saveBtn.textContent = origText;
        saveBtn.classList.remove("btn-success");
      }, 1200);
    }
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
    if (activeContainerTarget && (!currentCharacter || !currentCharacter.getContainerAttribute(activeContainerTarget)?.isContainer)) {
      clearActiveContainerTarget();
    }
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
  // Template / Archetype Loader Modal (Races, Classes, Full Archetypes)
  // ========================================================================
  let activeTemplateTab = "races";
  let activeTemplateCategory = "all";
  let activeTemplateSearch = "";

  function openTemplatesModal(tab = "races") {
    activeTemplateTab = tab;
    activeTemplateCategory = "all";
    activeTemplateSearch = "";
    const searchInput = document.getElementById("template-search-input");
    if (searchInput) searchInput.value = "";

    document.querySelectorAll(".template-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-template-tab") === tab);
    });

    renderTemplateFilterPills();
    renderTemplateCatalog();
    openModal("modal-templates");
  }

  const btnLoadTemplate = document.getElementById("btn-load-template");
  if (btnLoadTemplate) {
    btnLoadTemplate.addEventListener("click", () => {
      openTemplatesModal("races");
    });
  }

  const btnBrowseRaces = document.getElementById("btn-browse-races");
  if (btnBrowseRaces) {
    btnBrowseRaces.addEventListener("click", () => {
      openTemplatesModal("races");
    });
  }

  const btnBrowseClasses = document.getElementById("btn-browse-classes");
  if (btnBrowseClasses) {
    btnBrowseClasses.addEventListener("click", () => {
      openTemplatesModal("classes");
    });
  }

  // Template Mode Tab Clicks
  document.querySelectorAll(".template-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-template-tab") || "races";
      activeTemplateTab = tab;
      activeTemplateCategory = "all";
      activeTemplateSearch = "";
      const searchInput = document.getElementById("template-search-input");
      if (searchInput) searchInput.value = "";

      document.querySelectorAll(".template-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      renderTemplateFilterPills();
      renderTemplateCatalog();
    });
  });

  const templateSearchInput = document.getElementById("template-search-input");
  if (templateSearchInput) {
    templateSearchInput.addEventListener("input", (e) => {
      activeTemplateSearch = (e.target.value || "").trim().toLowerCase();
      renderTemplateCatalog();
    });
  }

  function renderTemplateFilterPills() {
    const pillsContainer = document.getElementById("archetype-genre-pills");
    const introEl = document.getElementById("template-modal-intro");
    const searchInput = document.getElementById("template-search-input");
    if (!pillsContainer) return;

    let categories = [];
    if (activeTemplateTab === "races") {
      categories = [
        { id: "all", label: "All Races (26)" },
        { id: "fantasy", label: "🐉 Fantasy & Myth" },
        { id: "supernatural", label: "⛩️ Supernatural & Spirit" },
        { id: "alien", label: "👽 Alien & Sci-Fi" },
        { id: "beast", label: "🐺 Beast & Lycan" },
        { id: "undead", label: "💀 Undead & Constructs" },
        { id: "human", label: "👤 Human" }
      ];
      if (introEl) {
        introEl.textContent = "Select a Race Template to apply species-specific biological, mystical, or mechanical traits and stat adjustments to your character.";
      }
      if (searchInput) {
        searchInput.placeholder = "🔍 Search 26 race templates by name, concept, powers...";
      }
    } else if (activeTemplateTab === "classes") {
      categories = [
        { id: "all", label: "All Classes (25)" },
        { id: "action", label: "🥋 Action & Martial" },
        { id: "magic", label: "✨ Magic & Spiritual" },
        { id: "street", label: "🕶️ Street & Rogue" },
        { id: "tech", label: "🤖 Tech & Pilot" },
        { id: "social", label: "🏙️ Social & Civilian" }
      ];
      if (introEl) {
        introEl.textContent = "Select a Class Template to apply professional training, skill packages, equipment, and combat capabilities to your character.";
      }
      if (searchInput) {
        searchInput.placeholder = "🔍 Search 25 class templates by name, concept, skills, powers...";
      }
    } else {
      categories = [
        { id: "all", label: "All Archetypes (16)" },
        { id: "action", label: "🥋 Action & Martial" },
        { id: "magic", label: "✨ Magic & Fantasy" },
        { id: "supernatural", label: "⛩️ Supernatural" },
        { id: "scifi", label: "🤖 Sci-Fi & Mecha" },
        { id: "modern", label: "🏙️ Modern & School" }
      ];
      if (introEl) {
        introEl.textContent = "Choose an archetype preset to jumpstart your character creation. Loading a preset populates stats, attributes, skill groups, attacks, and defects balanced to BESM 4E rules.";
      }
      if (searchInput) {
        searchInput.placeholder = "🔍 Search 16 anime archetypes by name, concept, genre, or powers...";
      }
    }

    pillsContainer.innerHTML = categories.map(cat => `
      <button type="button" class="btn btn-sm btn-secondary archetype-filter-btn ${cat.id === activeTemplateCategory ? 'active' : ''}" data-category="${cat.id}">
        ${cat.label}
      </button>
    `).join("");

    pillsContainer.querySelectorAll(".archetype-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        pillsContainer.querySelectorAll(".archetype-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeTemplateCategory = btn.getAttribute("data-category") || "all";
        renderTemplateCatalog();
      });
    });
  }

  function matchesArchetypeCategory(tmpl, cat) {
    return matchesTemplateCategory(tmpl, cat, "archetypes");
  }

  function matchesTemplateCategory(tmpl, cat, tab) {
    if (cat === "all") return true;
    if (tab === "races") {
      if (cat === "fantasy") return tmpl.category === "fantasy";
      if (cat === "supernatural") return tmpl.category === "supernatural" || tmpl.category === "spirit";
      if (cat === "alien") return tmpl.category === "alien" || tmpl.category === "scifi";
      if (cat === "beast") return tmpl.category === "beast";
      if (cat === "undead") return tmpl.category === "undead";
      if (cat === "human") return tmpl.category === "human";
      return tmpl.category === cat;
    } else if (tab === "classes") {
      if (cat === "action") return tmpl.category === "action";
      if (cat === "magic") return tmpl.category === "magic";
      if (cat === "street") return tmpl.category === "street";
      if (cat === "tech") return tmpl.category === "tech";
      if (cat === "social") return tmpl.category === "social";
      return tmpl.category === cat;
    } else {
      if (cat === "action") return tmpl.category === "action" || tmpl.category === "cyberpunk";
      if (cat === "magic") return tmpl.category === "magic" || tmpl.category === "fantasy";
      if (cat === "supernatural") return tmpl.category === "supernatural";
      if (cat === "scifi") return tmpl.category === "scifi" || tmpl.category === "cyberpunk";
      if (cat === "modern") return tmpl.category === "modern" || tmpl.category === "adventurer";
      return tmpl.category === cat;
    }
  }

  function getTemplateCategoryBadge(tmpl, tab) {
    if (tab === "races") {
      switch (tmpl.category) {
        case "human": return "👤 Baseline Mortal";
        case "fantasy": return "🐉 Fantasy & Myth";
        case "supernatural": return "⛩️ Supernatural";
        case "spirit": return "👻 Ethereal Spirit";
        case "alien": return "👽 Alien Species";
        case "scifi": return "🤖 Cyber / Synthetic";
        case "beast": return "🐺 Beast / Lycan";
        case "undead": return "💀 Undead Being";
        default: return "🐾 Race Template";
      }
    } else if (tab === "classes") {
      switch (tmpl.category) {
        case "action": return "🥋 Action & Combat";
        case "magic": return "✨ Magic & Spirit";
        case "street": return "🕶️ Rogue & Street";
        case "tech": return "🤖 Tech & Engineer";
        case "social": return "🏙️ Social Calling";
        default: return "⚔️ Class Template";
      }
    } else {
      switch (tmpl.category) {
        case "action": return "🥋 Action & Martial";
        case "magic": return "✨ Magic & Fantasy";
        case "fantasy": return "🐉 High Fantasy";
        case "supernatural": return "⛩️ Supernatural";
        case "scifi": return "🤖 Sci-Fi & Mecha";
        case "cyberpunk": return "🥷 Cyberpunk";
        case "modern": return "🏙️ Modern & School";
        case "adventurer": return "🐾 Creature Tamer";
        default: return "🌟 Heroic Archetype";
      }
    }
  }

  function renderTemplateCatalog() {
    const listEl = document.getElementById("template-catalog-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    let allTemplates = [];
    if (activeTemplateTab === "races") {
      allTemplates = BESM4E_RULES.raceTemplates || [];
    } else if (activeTemplateTab === "classes") {
      allTemplates = BESM4E_RULES.classTemplates || [];
    } else {
      allTemplates = BESM4E_RULES.templates || [];
    }

    const matching = allTemplates.filter(tmpl => {
      const matchCat = matchesTemplateCategory(tmpl, activeTemplateCategory, activeTemplateTab);
      if (!matchCat) return false;

      if (!activeTemplateSearch) return true;
      const haystack = [
        tmpl.name,
        tmpl.concept,
        tmpl.category,
        tmpl.gear || "",
        ...(tmpl.attributes || []).map(a => (a.name || a.id) + " " + (a.customDesc || "")),
        ...(tmpl.weapons || []).map(w => w.name + " " + (w.notes || "")),
        ...(tmpl.skillGroups || []).map(s => s.name || s.id),
        ...(tmpl.defects || []).map(d => (d.name || d.id) + " " + (d.customDesc || ""))
      ].join(" ").toLowerCase();

      return haystack.includes(activeTemplateSearch);
    });

    const countBadge = document.getElementById("archetype-count-badge");
    if (countBadge) {
      countBadge.textContent = matching.length;
    }

    if (matching.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-size: 12pt;">
          No templates found matching "${escapeHtml(activeTemplateSearch)}".<br/>Try searching for other keywords or selecting a different category above.
        </div>
      `;
      return;
    }

    matching.forEach(tmpl => {
      const card = document.createElement("div");
      card.className = "archetype-card";

      if (activeTemplateTab === "races") {
        // Race Card Rendering
        const statPills = [];
        if (tmpl.stats) {
          if (tmpl.stats.body) statPills.push(`<span class="archetype-pill" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1);">💪 +${tmpl.stats.body} Body</span>`);
          if (tmpl.stats.mind) statPills.push(`<span class="archetype-pill" style="color: #06b6d4; border-color: rgba(6, 182, 212, 0.3); background: rgba(6, 182, 212, 0.1);">🧠 +${tmpl.stats.mind} Mind</span>`);
          if (tmpl.stats.soul) statPills.push(`<span class="archetype-pill" style="color: #a855f7; border-color: rgba(168, 85, 247, 0.3); background: rgba(168, 85, 247, 0.1);">✨ +${tmpl.stats.soul} Soul</span>`);
        }

        const attrPills = (tmpl.attributes || []).map(a => `
          <span class="archetype-pill archetype-pill-attr" title="${escapeHtml(a.customDesc || a.name)}">
            ⭐ ${escapeHtml(a.name.replace(/ \(.*\)/, ''))} ${a.level || 1}
          </span>
        `).join("");

        const weaponPills = (tmpl.weapons || []).map(w => `
          <span class="archetype-pill archetype-pill-weapon" title="Range: ${escapeHtml(w.range || 'Melee')} | Attack: ${escapeHtml(w.attackType || 'attack')}">
            ⚔️ ${escapeHtml(w.name)} (Lvl ${w.level || 1})
          </span>
        `).join("");

        const defectPills = (tmpl.defects || []).map(d => `
          <span class="archetype-pill archetype-pill-defect" title="${escapeHtml(d.customDesc || d.name)}">
            ⚠️ ${escapeHtml((d.name || d.id).replace(/ \(.*\)/, ''))} ${d.rank > 1 ? `Rank ${d.rank}` : ''}
          </span>
        `).join("");

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
            <div>
              <div style="font-weight: 700; font-size: 1.15rem; color: var(--accent-primary); margin-bottom: 0.2rem;">
                ${escapeHtml(tmpl.name)}
              </div>
              <div style="font-size: 12pt; color: var(--text-muted); line-height: 1.4;">
                ${escapeHtml(tmpl.concept)}
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
              <span class="tag-pill" style="font-size: 12pt; font-weight: 600;">${getTemplateCategoryBadge(tmpl, "races")}</span>
              <span class="tag-pill" style="color: var(--accent-primary); font-size: 12pt; font-weight: 700;">${tmpl.points === 0 ? '0 CP (Baseline)' : `+${tmpl.points} CP`}</span>
            </div>
          </div>

          <div class="archetype-pills-row">
            ${statPills.join("")}
            ${attrPills}
            ${weaponPills}
            ${defectPills}
          </div>

          <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 0.25rem;">
            <button type="button" class="btn btn-primary btn-sm btn-apply-race-action" data-id="${tmpl.id}">
              🐾 Apply Race Template
            </button>
          </div>
        `;

        card.addEventListener("click", (e) => {
          if (confirm(`Apply the "${tmpl.name}" race template (${tmpl.points === 0 ? '0 CP' : `+${tmpl.points} CP`})?\n\nThis will apply species attributes, weapons, defects, and stat adjustments to ${currentCharacter.name || 'your character'}.`)) {
            currentCharacter.applyRaceTemplate(tmpl.id);
            saveCurrentCharacter(true);
            refreshAll();
            closeModal("modal-templates");
            showToast(`Applied Race Template: ${tmpl.name} (${tmpl.points === 0 ? '0 CP' : `+${tmpl.points} CP`})`);
          }
        });
      } else if (activeTemplateTab === "classes") {
        // Class Card Rendering
        const statPills = [];
        if (tmpl.stats) {
          if (tmpl.stats.body) statPills.push(`<span class="archetype-pill" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1);">💪 +${tmpl.stats.body} Body</span>`);
          if (tmpl.stats.mind) statPills.push(`<span class="archetype-pill" style="color: #06b6d4; border-color: rgba(6, 182, 212, 0.3); background: rgba(6, 182, 212, 0.1);">🧠 +${tmpl.stats.mind} Mind</span>`);
          if (tmpl.stats.soul) statPills.push(`<span class="archetype-pill" style="color: #a855f7; border-color: rgba(168, 85, 247, 0.3); background: rgba(168, 85, 247, 0.1);">✨ +${tmpl.stats.soul} Soul</span>`);
        }

        const skillPills = (tmpl.skillGroups || []).map(sg => `
          <span class="archetype-pill archetype-pill-skill">
            📚 ${escapeHtml(sg.name || sg.id)} ${sg.level || 1}
          </span>
        `).join("");

        const attrPills = (tmpl.attributes || []).map(a => `
          <span class="archetype-pill archetype-pill-attr" title="${escapeHtml(a.customDesc || a.name)}">
            ⭐ ${escapeHtml(a.name.replace(/ \(.*\)/, ''))} ${a.level || 1}
          </span>
        `).join("");

        const weaponPills = (tmpl.weapons || []).map(w => `
          <span class="archetype-pill archetype-pill-weapon" title="Range: ${escapeHtml(w.range || 'Melee')} | Attack: ${escapeHtml(w.attackType || 'attack')}">
            ⚔️ ${escapeHtml(w.name)} (Lvl ${w.level || 1})
          </span>
        `).join("");

        const defectPills = (tmpl.defects || []).map(d => `
          <span class="archetype-pill archetype-pill-defect" title="${escapeHtml(d.customDesc || d.name)}">
            ⚠️ ${escapeHtml((d.name || d.id).replace(/ \(.*\)/, ''))} ${d.rank > 1 ? `Rank ${d.rank}` : ''}
          </span>
        `).join("");

        const gearPill = tmpl.gear ? `
          <span class="archetype-pill" style="color: var(--text-main); border-color: var(--border-subtle); background: var(--bg-surface);" title="${escapeHtml(tmpl.gear)}">
            🎒 Gear: ${escapeHtml(tmpl.gear.length > 50 ? tmpl.gear.slice(0, 48) + '...' : tmpl.gear)}
          </span>
        ` : "";

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
            <div>
              <div style="font-weight: 700; font-size: 1.15rem; color: var(--accent-primary); margin-bottom: 0.2rem;">
                ${escapeHtml(tmpl.name)}
              </div>
              <div style="font-size: 12pt; color: var(--text-muted); line-height: 1.4;">
                ${escapeHtml(tmpl.concept)}
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
              <span class="tag-pill" style="font-size: 12pt; font-weight: 600;">${getTemplateCategoryBadge(tmpl, "classes")}</span>
              <span class="tag-pill" style="color: var(--accent-primary); font-size: 12pt; font-weight: 700;">+${tmpl.points} CP</span>
            </div>
          </div>

          <div class="archetype-pills-row">
            ${statPills.join("")}
            ${skillPills}
            ${attrPills}
            ${weaponPills}
            ${defectPills}
            ${gearPill}
          </div>

          <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 0.25rem;">
            <button type="button" class="btn btn-primary btn-sm btn-apply-class-action" data-id="${tmpl.id}">
              ⚔️ Apply Class Template
            </button>
          </div>
        `;

        card.addEventListener("click", (e) => {
          if (confirm(`Apply the "${tmpl.name}" class template (+${tmpl.points} CP)?\n\nThis will add class skill training, attributes, weapons, defects, and starting equipment to ${currentCharacter.name || 'your character'}.`)) {
            currentCharacter.applyClassTemplate(tmpl.id);
            saveCurrentCharacter(true);
            refreshAll();
            closeModal("modal-templates");
            showToast(`Applied Class Template: ${tmpl.name} (+${tmpl.points} CP)`);
          }
        });
      } else {
        // Full Archetype Card Rendering
        const b = tmpl.stats.body || 0;
        const m = tmpl.stats.mind || 0;
        const s = tmpl.stats.soul || 0;
        const cv = Math.floor((b + m + s) / 3);
        const toughAttr = (tmpl.attributes || []).find(a => a.id === "tough");
        const toughLvl = toughAttr ? (toughAttr.level || 0) : 0;
        const hp = (b + s) * 5 + (toughLvl * 10);
        const energisedAttr = (tmpl.attributes || []).find(a => a.id === "energised");
        const energisedLvl = energisedAttr ? (energisedAttr.level || 0) : 0;
        const ep = (m + s) * 5 + (energisedLvl * 10);

        const attrPills = (tmpl.attributes || []).slice(0, 5).map(a => `
          <span class="archetype-pill archetype-pill-attr" title="${escapeHtml(a.customDesc || a.name)}">
            ⭐ ${escapeHtml(a.name.replace(/ \(.*\)/, ''))} ${a.level || 1}
          </span>
        `).join("");

        const weaponPills = (tmpl.weapons || []).map(w => `
          <span class="archetype-pill archetype-pill-weapon" title="Range: ${escapeHtml(w.range || 'Melee')} | Attack: ${escapeHtml(w.attackType || 'attack')}">
            ⚔️ ${escapeHtml(w.name)} (Lvl ${w.level || 1})
          </span>
        `).join("");

        const skillPills = (tmpl.skillGroups || []).map(sg => `
          <span class="archetype-pill archetype-pill-skill">
            📚 ${escapeHtml(sg.name || sg.id)} ${sg.level || 1}
          </span>
        `).join("");

        const defectPills = (tmpl.defects || []).slice(0, 3).map(d => `
          <span class="archetype-pill archetype-pill-defect" title="${escapeHtml(d.customDesc || d.name)}">
            ⚠️ ${escapeHtml((d.name || d.id).replace(/ \(.*\)/, ''))}
          </span>
        `).join("");

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
            <div>
              <div style="font-weight: 700; font-size: 1.15rem; color: var(--accent-primary); margin-bottom: 0.2rem;">
                ${escapeHtml(tmpl.name)}
              </div>
              <div style="font-size: 12pt; color: var(--text-muted); line-height: 1.4;">
                ${escapeHtml(tmpl.concept)}
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
              <span class="tag-pill" style="font-size: 12pt; font-weight: 600;">${getTemplateCategoryBadge(tmpl, "archetypes")}</span>
              <span class="tag-pill" style="color: var(--accent-primary); font-size: 12pt; font-weight: 700;">${tmpl.tier.toUpperCase()} • ${tmpl.points} CP</span>
            </div>
          </div>

          <div class="archetype-stats-ribbon">
            <div class="archetype-stat-item">
              <span class="archetype-stat-label" style="color: #ef4444;">BOD:</span>
              <span class="archetype-stat-val">${b}</span>
            </div>
            <div class="archetype-stat-item">
              <span class="archetype-stat-label" style="color: #06b6d4;">MND:</span>
              <span class="archetype-stat-val">${m}</span>
            </div>
            <div class="archetype-stat-item">
              <span class="archetype-stat-label" style="color: #a855f7;">SOL:</span>
              <span class="archetype-stat-val">${s}</span>
            </div>
            <div class="archetype-stat-item" style="margin-left: 0.5rem; opacity: 0.9;">
              <span class="archetype-stat-label">CV:</span>
              <span class="archetype-stat-val">${cv}</span>
            </div>
            <div class="archetype-stat-item" style="opacity: 0.9;">
              <span class="archetype-stat-label">HP:</span>
              <span class="archetype-stat-val">${hp}</span>
            </div>
            <div class="archetype-stat-item" style="opacity: 0.9;">
              <span class="archetype-stat-label">EP:</span>
              <span class="archetype-stat-val">${ep}</span>
            </div>
          </div>

          <div class="archetype-pills-row">
            ${weaponPills}
            ${attrPills}
            ${skillPills}
            ${defectPills}
          </div>

          <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 0.25rem;">
            <button type="button" class="btn btn-primary btn-sm btn-load-archetype-action" data-id="${tmpl.id}">
              ✨ Load Archetype Preset
            </button>
          </div>
        `;

        card.addEventListener("click", (e) => {
          if (confirm(`Load the "${tmpl.name}" archetype preset?\n\nThis will clear current traits, race, and class selections, and populate stats (Body ${b}, Mind ${m}, Soul ${s}), attributes, weapons, skill groups, and defects for "${tmpl.name}".`)) {
            currentCharacter.loadTemplate(tmpl.id);
            saveCurrentCharacter(true);
            refreshAll();
            closeModal("modal-templates");
            showToast(`Loaded archetype "${tmpl.name}" (cleared previous traits, race, and class)`);
          }
        });
      }

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

    // Appearance, Background & Narrative Notes
    if (currentCharacter.appearance || currentCharacter.backstory || currentCharacter.alliesEnemies) {
      html += `
        <div class="sheet-section-title">Appearance, Background & Narrative</div>
        <div class="sheet-narrative-container" style="font-size: 12pt; line-height: 1.6; margin-bottom: 1.25rem;">
          ${currentCharacter.appearance ? `
            <div class="sheet-narrative-item" style="margin-bottom: 0.85rem; page-break-inside: avoid; break-inside: avoid;">
              <strong style="color: var(--text-main); font-size: 12pt;">Appearance:</strong>
              <div style="margin-top: 0.25rem; white-space: pre-wrap; color: var(--text-muted);">${escapeHtml(currentCharacter.appearance)}</div>
            </div>
          ` : ""}
          ${currentCharacter.backstory ? `
            <div class="sheet-narrative-item" style="margin-bottom: 0.85rem; page-break-inside: avoid; break-inside: avoid;">
              <strong style="color: var(--text-main); font-size: 12pt;">Background:</strong>
              <div style="margin-top: 0.25rem; white-space: pre-wrap; color: var(--text-muted);">${escapeHtml(currentCharacter.backstory)}</div>
            </div>
          ` : ""}
          ${currentCharacter.alliesEnemies ? `
            <div class="sheet-narrative-item" style="margin-bottom: 0.85rem; page-break-inside: avoid; break-inside: avoid;">
              <strong style="color: var(--text-main); font-size: 12pt;">Allies & Enemies:</strong>
              <div style="margin-top: 0.25rem; white-space: pre-wrap; color: var(--text-muted);">${escapeHtml(currentCharacter.alliesEnemies)}</div>
            </div>
          ` : ""}
        </div>
      `;
    }

    container.innerHTML = html;
  }

  const btnPrintSheetOld = document.getElementById("btn-print-sheet");
  if (btnPrintSheetOld) {
    btnPrintSheetOld.addEventListener("click", () => {
      renderPrintSheet();
      window.print();
    });
  }

  const btnCopyMarkdownOld = document.getElementById("btn-copy-markdown");
  if (btnCopyMarkdownOld) {
    btnCopyMarkdownOld.addEventListener("click", () => {
      const md = BESM4EStorage.generateMarkdown(currentCharacter);
      navigator.clipboard.writeText(md).then(() => {
        showToast("📋 Character sheet copied as Markdown!");
      }).catch(() => {
        alert("Failed to copy automatically. Please export via Backup/Share modal.");
      });
    });
  }

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
  let isAdvancementEditMode = false;

  function toggleAdvancementEditMode(forceState) {
    if (typeof forceState === "boolean") {
      isAdvancementEditMode = forceState;
    } else {
      isAdvancementEditMode = !isAdvancementEditMode;
    }

    const editPanel = document.getElementById("adv-edit-panel");
    const lockIcon = document.getElementById("adv-lock-icon");
    const lockText = document.getElementById("adv-lock-text");
    const toggleBtn = document.getElementById("btn-toggle-adv-edit");
    const thAction = document.getElementById("adv-log-th-action");

    if (isAdvancementEditMode) {
      if (editPanel) editPanel.style.display = "block";
      if (lockIcon) lockIcon.textContent = "🔒";
      if (lockText) lockText.textContent = "Lock Advancement";
      if (toggleBtn) {
        toggleBtn.classList.remove("btn-secondary");
        toggleBtn.classList.add("btn-warning");
      }
      if (thAction) thAction.style.display = "table-cell";
    } else {
      if (editPanel) editPanel.style.display = "none";
      if (lockIcon) lockIcon.textContent = "🔓";
      if (lockText) lockText.textContent = "Edit Advancement";
      if (toggleBtn) {
        toggleBtn.classList.remove("btn-warning");
        toggleBtn.classList.add("btn-secondary");
      }
      if (thAction) thAction.style.display = "none";
    }

    renderAdvancement();
  }

  function renderAdvancement() {
    if (!currentCharacter) return;
    const pt = currentCharacter.getPointBreakdown();

    document.getElementById("adv-base-budget").textContent = `${pt.baseBudget} CP`;
    document.getElementById("adv-earned-xp").textContent = `${currentCharacter.earnedXP} XP`;
    document.getElementById("adv-available-xp").textContent = `${pt.remaining} XP`;

    const setTotalInput = document.getElementById("adv-set-total-xp");
    if (setTotalInput) {
      setTotalInput.value = currentCharacter.earnedXP || 0;
    }

    const thAction = document.getElementById("adv-log-th-action");
    if (thAction) {
      thAction.style.display = isAdvancementEditMode ? "table-cell" : "none";
    }

    const tbody = document.getElementById("adv-log-tbody");
    tbody.innerHTML = "";

    const colSpan = isAdvancementEditMode ? 5 : 4;
    if (currentCharacter.advancementLog.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${colSpan}" style="color: var(--text-dim); text-align: center; padding: 1rem;">No history log yet.</td></tr>`;
      return;
    }

    currentCharacter.advancementLog.forEach((log, idx) => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";

      let actionColHtml = "";
      if (isAdvancementEditMode) {
        actionColHtml = `
          <td style="padding: 0.4rem 0.5rem; text-align: center;">
            <button class="btn btn-danger btn-sm btn-delete-adv-log" data-log-index="${idx}" title="Delete this entry${log.xpChange ? ' and adjust ' + Math.abs(log.xpChange) + ' XP' : ''}" style="font-size: 12pt; padding: 0.2rem 0.5rem;">
              🗑️ Delete
            </button>
          </td>
        `;
      }

      tr.innerHTML = `
        <td style="padding: 0.4rem 0.5rem; color: var(--text-muted); font-size: 12pt;">${escapeHtml(log.date)}</td>
        <td style="padding: 0.4rem 0.5rem; font-weight: 600;">${escapeHtml(log.action)}</td>
        <td style="padding: 0.4rem 0.5rem; color: ${log.xpChange > 0 ? "var(--color-warning)" : (log.xpChange < 0 ? "var(--color-danger)" : "var(--text-muted)")};">
          ${log.xpChange !== 0 ? (log.xpChange > 0 ? `+${log.xpChange}` : `${log.xpChange}`) : "--"}
        </td>
        <td style="padding: 0.4rem 0.5rem; color: var(--text-muted);">${escapeHtml(log.notes)}</td>
        ${actionColHtml}
      `;
      tbody.appendChild(tr);
    });

    if (isAdvancementEditMode) {
      tbody.querySelectorAll(".btn-delete-adv-log").forEach(btn => {
        btn.addEventListener("click", () => {
          const logIdx = parseInt(btn.getAttribute("data-log-index"), 10);
          if (isNaN(logIdx) || logIdx < 0 || logIdx >= currentCharacter.advancementLog.length) return;
          const entry = currentCharacter.advancementLog[logIdx];
          
          let confirmMsg = `Delete log entry "${entry.action}"?`;
          if (entry.xpChange > 0) {
            confirmMsg = `Delete "${entry.action}" and remove ${entry.xpChange} XP from Total Earned XP?`;
          } else if (entry.xpChange < 0) {
            confirmMsg = `Delete "${entry.action}" and restore ${Math.abs(entry.xpChange)} XP to Total Earned XP?`;
          }

          if (confirm(confirmMsg)) {
            currentCharacter.deleteAdvancementLog(logIdx, true);
            saveCurrentCharacter(true);
            renderAdvancement();
            renderPointBreakdown();
            showToast(`Deleted log entry and updated XP.`);
          }
        });
      });
    }
  }

  document.getElementById("btn-toggle-adv-edit").addEventListener("click", () => {
    toggleAdvancementEditMode();
  });

  document.getElementById("btn-deduct-xp").addEventListener("click", () => {
    if (!currentCharacter) return;
    const amount = parseInt(document.getElementById("adv-deduct-xp-amount").value, 10);
    const reason = document.getElementById("adv-deduct-xp-reason").value.trim() || "Correction";
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a positive XP amount to deduct.");
      return;
    }
    if ((currentCharacter.earnedXP || 0) <= 0) {
      alert("Character has no earned XP to deduct.");
      return;
    }
    const deducted = currentCharacter.removeXP(amount, reason);
    document.getElementById("adv-deduct-xp-reason").value = "";
    saveCurrentCharacter(true);
    renderAdvancement();
    renderPointBreakdown();
    showToast(`Deducted ${deducted} XP from ${currentCharacter.name || "character"}.`);
  });

  document.getElementById("btn-set-total-xp").addEventListener("click", () => {
    if (!currentCharacter) return;
    const val = parseInt(document.getElementById("adv-set-total-xp").value, 10);
    if (isNaN(val) || val < 0) {
      alert("Please enter a valid non-negative XP value.");
      return;
    }
    currentCharacter.setEarnedXP(val, "Manual adjustment");
    saveCurrentCharacter(true);
    renderAdvancement();
    renderPointBreakdown();
    showToast(`Updated Total Earned XP to ${val} XP.`);
  });

  document.getElementById("btn-reset-all-xp").addEventListener("click", () => {
    if (!currentCharacter) return;
    if ((currentCharacter.earnedXP || 0) === 0) {
      alert("Earned XP is already 0.");
      return;
    }
    if (confirm(`Reset Total Earned XP from ${currentCharacter.earnedXP} to 0?`)) {
      currentCharacter.setEarnedXP(0, "Reset all earned XP");
      saveCurrentCharacter(true);
      renderAdvancement();
      renderPointBreakdown();
      showToast(`Reset earned XP to 0.`);
    }
  });

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
  const legacyExportImport = document.getElementById("btn-export-import");
  if (legacyExportImport) {
    legacyExportImport.addEventListener("click", () => {
      openSaveLoadDialog("tab-save-char");
    });
  }

  const legacyDownloadJson = document.getElementById("btn-download-json");
  if (legacyDownloadJson) {
    legacyDownloadJson.addEventListener("click", () => {
      saveCurrentCharacter(true);
      BESM4EStorage.downloadBESM4E(currentCharacter);
      showToast("Downloaded character .besm4e file");
    });
  }

  const legacyImportFile = document.getElementById("import-json-file");
  if (legacyImportFile) {
    legacyImportFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        importCharacterFromJSON(evt.target.result, file.name);
      };
      reader.readAsText(file);
    });
  }

  // ========================================================================
  // Delegated Auto Combo-Stepper Handler (.combo-stepper-auto)
  // ========================================================================
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".combo-stepper-auto");
    if (!btn) return;
    const stepper = btn.closest(".combo-stepper");
    if (!stepper) return;
    const input = stepper.querySelector(".combo-stepper-input");
    if (!input) return;

    const isMinus = btn.classList.contains("combo-stepper-minus");
    const isPlus = btn.classList.contains("combo-stepper-plus");
    if (!isMinus && !isPlus) return;

    const step = parseFloat(input.getAttribute("step")) || 1;
    let val = parseFloat(input.value);
    if (isNaN(val)) val = 0;

    const minAttr = input.getAttribute("min");
    const maxAttr = input.getAttribute("max");
    const min = minAttr !== null ? parseFloat(minAttr) : -Infinity;
    const max = maxAttr !== null ? parseFloat(maxAttr) : Infinity;

    if (isMinus) {
      val = Math.max(min, val - step);
    } else if (isPlus) {
      val = Math.min(max, val + step);
    }

    input.value = val;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
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
