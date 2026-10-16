/**
 * Big Eyes, Small Mouth (BESM) 4th Edition - Interactive Dice Roller
 * Features:
 * - 2d6 Roll-Over Resolution (Stat/CV + 2d6 vs Target Number)
 * - Minor Edge (3d6 keep 2 highest) & Major Edge (4d6 keep 2 highest)
 * - Minor Obstacle (3d6 keep 2 lowest) & Major Obstacle (4d6 keep 2 lowest)
 * - Table 16 Target Numbers (Routine 6 to Mythical 20)
 * - Critical Triumph (Natural 12) & Critical Fumble (Natural 2)
 * - Dramatic Feats (spend 10 EP per +1 bonus, max = Soul Stat)
 * - Web Audio API procedural sound effects
 */

class BESM4EDiceRoller {
  constructor() {
    this.history = [];
    this.maxHistory = 25;
    this.audioCtx = null;
    this.soundEnabled = true;
  }

  /**
   * Initialize Web Audio API on first user interaction
   */
  initAudio() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  /**
   * Procedural dice roll sound effect
   */
  playDiceSound() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      // Generate brief clicking rattle
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const start = this.audioCtx.currentTime + (i * 0.04);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(300 + Math.random() * 400, start);
        osc.frequency.exponentialRampToValueAtTime(100, start + 0.03);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.03);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(start);
        osc.stop(start + 0.03);
      }
    } catch (e) {
      // Audio not permitted or failed; ignore quietly
    }
  }

  /**
   * Roll a single d6 (1-6)
   */
  rollD6() {
    return Math.floor(Math.random() * 6) + 1;
  }

  /**
   * Execute a roll
   * @param {Object} options
   * - label: description (e.g. "Body Check", "Firearms Attack", "Acrobatics")
   * - mode: "standard" (2d6), "minor_edge" (3d6 keep 2 high), "major_edge" (4d6 keep 2 high),
   *         "minor_obstacle" (3d6 keep 2 low), "major_obstacle" (4d6 keep 2 low)
   * - modifier: integer bonus/penalty (Stat, CV, or situational)
   * - targetNumber: DC to test against (from BESM 4E Table 16: 6, 8, 10, 12, 14, 16, 18, 20)
   * - dramaticFeatBonus: integer bonus from burning EP (+1 per 10 EP)
   */
  roll(options = {}) {
    this.playDiceSound();

    const label = options.label || "Action Check";
    let mode = options.mode || "standard";
    // Normalize legacy mode names
    if (mode === "edge") mode = "minor_edge";
    if (mode === "obstacle") mode = "minor_obstacle";
    if (mode === "double_edge") mode = "major_edge";
    if (mode === "double_obstacle") mode = "major_obstacle";

    const baseModifier = parseInt(options.modifier, 10) || 0;
    const dramaticFeatBonus = Math.max(0, parseInt(options.dramaticFeatBonus, 10) || 0);
    const epCost = dramaticFeatBonus * 10;
    const modifier = baseModifier + dramaticFeatBonus;
    const isInitiative = Boolean(options.isInitiative || (label && label.toLowerCase().includes("initiative")));
    const targetNumber = (isInitiative || options.noTarget || options.targetNumber === null) ? null : (options.targetNumber ? parseInt(options.targetNumber, 10) : null);

    let numDice = 2;
    if (mode === "minor_edge" || mode === "minor_obstacle") {
      numDice = 3;
    } else if (mode === "major_edge" || mode === "major_obstacle") {
      numDice = 4;
    }

    // Roll raw dice
    const diceRolls = [];
    for (let i = 0; i < numDice; i++) {
      diceRolls.push(this.rollD6());
    }

    // Sort to determine kept dice
    const indexed = diceRolls.map((val, idx) => ({ val, idx }));
    let keptIndices = [];

    if (mode === "minor_edge" || mode === "major_edge") {
      // Keep 2 highest
      indexed.sort((a, b) => b.val - a.val);
      keptIndices = [indexed[0].idx, indexed[1].idx];
    } else if (mode === "minor_obstacle" || mode === "major_obstacle") {
      // Keep 2 lowest
      indexed.sort((a, b) => a.val - b.val);
      keptIndices = [indexed[0].idx, indexed[1].idx];
    } else {
      // Standard 2d6
      keptIndices = [0, 1];
    }

    const keptRolls = diceRolls.filter((_, idx) => keptIndices.includes(idx));
    const diceSum = keptRolls.reduce((sum, v) => sum + v, 0);
    const total = diceSum + modifier;

    // Check critical outcomes on the kept pair (only applicable when rolling against a Target Number)
    const isCriticalSuccess = targetNumber !== null && keptRolls[0] === 6 && keptRolls[1] === 6;
    const isCriticalFumble = targetNumber !== null && keptRolls[0] === 1 && keptRolls[1] === 1;

    // Evaluate success against target number
    let success = null;
    let margin = null;
    let difficultyLabel = "";

    if (targetNumber !== null) {
      if (isCriticalSuccess) {
        success = true;
      } else if (isCriticalFumble) {
        success = false;
      } else {
        success = total >= targetNumber;
      }
      margin = total - targetNumber;

      const rulesRef = typeof BESM4E_RULES !== "undefined" ? BESM4E_RULES : null;
      if (rulesRef && rulesRef.targetNumbers) {
        const diffObj = rulesRef.targetNumbers.find(d => d.target === targetNumber);
        difficultyLabel = diffObj ? diffObj.label : `TN ${targetNumber}`;
      } else {
        difficultyLabel = `TN ${targetNumber}`;
      }
    }

    const result = {
      id: "roll_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString(),
      label,
      mode,
      numDice,
      diceRolls: diceRolls.map((val, idx) => ({
        val,
        isKept: keptIndices.includes(idx)
      })),
      keptDice: keptRolls,
      diceSum,
      baseModifier,
      dramaticFeatBonus,
      epCost,
      modifier,
      total,
      isCriticalSuccess,
      isCriticalFumble,
      targetNumber,
      difficultyLabel,
      success,
      margin,
      breakdown: options.breakdown || ""
    };

    this.history.unshift(result);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    return result;
  }

  /**
   * Validate a Discord Webhook URL
   * @param {string} url
   * @returns {boolean}
   */
  isValidWebhookUrl(url) {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    return /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+/i.test(trimmed);
  }

  /**
   * Format a BESM 4E roll result as a rich Discord Webhook JSON payload
   * @param {Object} result - Roll result returned by roll()
   * @param {Object} context - Optional character/campaign context
   * @returns {Object} Discord webhook payload
   */
  formatDiscordPayload(result, context = {}) {
    const charName = (context.characterName || "").trim();
    const customBotName = (context.botName || "").trim();
    const username = (customBotName || (charName ? `${charName} (BESM 4E)` : "BESM 4E Dice Roller")).slice(0, 80);

    const modeLabels = {
      standard: "Standard (2d6)",
      minor_edge: "Minor Edge (3d6 keep 2 highest)",
      major_edge: "Major Edge (4d6 keep 2 highest)",
      minor_obstacle: "Minor Obstacle (3d6 keep 2 lowest)",
      major_obstacle: "Major Obstacle (4d6 keep 2 lowest)"
    };
    const modeText = modeLabels[result.mode] || "Standard (2d6)";

    // Format individual dice (bold kept dice, strikethrough dropped dice)
    const diceVisual = (result.diceRolls || [])
      .map(d => (d.isKept ? `**[${d.val}]**` : `~~[${d.val}]~~`))
      .join(" ");

    const modSign = result.modifier >= 0 ? `+ ${result.modifier}` : `- ${Math.abs(result.modifier)}`;
    const mathLine = result.modifier !== 0
      ? `**${result.total}**  *(2d6 = ${result.diceSum} ${modSign})*`
      : `**${result.total}**  *(2d6 = ${result.diceSum})*`;

    const hasTarget = result.targetNumber !== null && result.targetNumber !== undefined;
    let color = 0x06b6d4; // Cyan default for untargeted / Initiative rolls
    let outcomeBanner = "";

    if (hasTarget) {
      if (result.isCriticalSuccess) {
        color = 0xf59e0b; // Gold
        outcomeBanner = `🌟 **CRITICAL TRIUMPH! (Natural 12)** vs ${result.difficultyLabel}`;
      } else if (result.isCriticalFumble) {
        color = 0xef4444; // Crimson
        outcomeBanner = `💀 **CRITICAL FUMBLE! (Natural 2)** vs ${result.difficultyLabel}`;
      } else if (result.success) {
        color = 0x10b981; // Emerald Green
        const marginStr = result.margin >= 0 ? `+${result.margin}` : `${result.margin}`;
        outcomeBanner = `✅ **SUCCESS** vs ${result.difficultyLabel} *(Margin: ${marginStr})*`;
      } else {
        color = 0xef4444; // Red
        outcomeBanner = `❌ **FAILED** vs ${result.difficultyLabel} *(Margin: ${result.margin})*`;
      }
    }

    const fields = [
      {
        name: "🎯 Total Result",
        value: mathLine,
        inline: true
      }
    ];

    if (outcomeBanner) {
      fields.push({
        name: "🏆 Outcome",
        value: outcomeBanner,
        inline: true
      });
    }

    const embed = {
      title: `🎲 ${result.label || "Action Check"}`,
      color,
      fields
    };

    const campaignName = (context.campaign || "").trim();
    if (campaignName) {
      embed.footer = {
        text: campaignName
      };
    }

    return {
      username,
      embeds: [embed]
    };
  }

  /**
   * Broadcast a roll result (or test payload) to a Discord channel via Webhook
   * @param {string} webhookUrl
   * @param {Object} result
   * @param {Object} context
   * @returns {Promise<{ok: boolean, status?: number, error?: string}>}
   */
  async sendToDiscord(webhookUrl, result, context = {}) {
    if (!this.isValidWebhookUrl(webhookUrl)) {
      return { ok: false, error: "Invalid Discord Webhook URL format." };
    }
    const fetchFn = (typeof fetch === "function")
      ? fetch
      : (typeof window !== "undefined" && typeof window.fetch === "function" ? window.fetch.bind(window) : null);
    if (!fetchFn) {
      return { ok: false, error: "Fetch API is not available in this environment." };
    }

    const payload = this.formatDiscordPayload(result, context);
    try {
      const response = await fetchFn(webhookUrl.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (response.ok || response.status === 204) {
        return { ok: true, status: response.status };
      }
      return { ok: false, status: response.status, error: `Discord returned HTTP ${response.status}` };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "Network error while contacting Discord." };
    }
  }

  /**
   * Clear roll history
   */
  clearHistory() {
    this.history = [];
  }
}

// Aliases for compatibility
const TriStatDiceRoller = BESM4EDiceRoller;

if (typeof module !== "undefined" && module.exports) {
  module.exports = BESM4EDiceRoller;
  global.BESM4EDiceRoller = BESM4EDiceRoller;
  global.TriStatDiceRoller = BESM4EDiceRoller;
}
