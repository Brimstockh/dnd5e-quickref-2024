(function () {
    "use strict";

    /** @typedef {"LOW" | "MODERATE" | "HIGH"} Difficulty */

    /** @type {Record<number, Record<Difficulty, number>>} */
    const XP_BUDGET = {
        1: { LOW: 50, MODERATE: 75, HIGH: 100 },
        2: { LOW: 100, MODERATE: 150, HIGH: 200 },
        3: { LOW: 150, MODERATE: 225, HIGH: 400 },
        4: { LOW: 250, MODERATE: 375, HIGH: 500 },
        5: { LOW: 500, MODERATE: 750, HIGH: 1100 },
        6: { LOW: 600, MODERATE: 1000, HIGH: 1400 },
        7: { LOW: 750, MODERATE: 1300, HIGH: 1700 },
        8: { LOW: 1000, MODERATE: 1700, HIGH: 2100 },
        9: { LOW: 1300, MODERATE: 2000, HIGH: 2600 },
        10: { LOW: 1600, MODERATE: 2300, HIGH: 3100 },
        11: { LOW: 1900, MODERATE: 2900, HIGH: 4100 },
        12: { LOW: 2200, MODERATE: 3700, HIGH: 4700 },
        13: { LOW: 2600, MODERATE: 4200, HIGH: 5400 },
        14: { LOW: 2900, MODERATE: 4900, HIGH: 6200 },
        15: { LOW: 3300, MODERATE: 5400, HIGH: 7800 },
        16: { LOW: 3800, MODERATE: 6100, HIGH: 9800 },
        17: { LOW: 4500, MODERATE: 7200, HIGH: 11700 },
        18: { LOW: 5000, MODERATE: 8700, HIGH: 14200 },
        19: { LOW: 5500, MODERATE: 10700, HIGH: 17200 },
        20: { LOW: 6400, MODERATE: 13200, HIGH: 22000 },
    };

    /**
     * @param {number[]} playerLevels
     * @param {Difficulty} difficulty
     * @returns {number}
     */
    const encounterBudget = (playerLevels, difficulty) =>
        playerLevels.reduce((total, level) => total + XP_BUDGET[level][difficulty], 0);

    const calculator = document.querySelector("[data-encounter-calculator]");
    if (!calculator) return;

    const playerCount = calculator.querySelector("[data-player-count]");
    const difficulty = calculator.querySelector("[data-difficulty]");
    const levelList = calculator.querySelector("[data-player-levels]");
    const output = calculator.querySelector("[data-encounter-output]");
    const breakdown = calculator.querySelector("[data-encounter-breakdown]");
    const formatXp = new Intl.NumberFormat("fr-FR");

    function clampPlayerCount() {
        const count = Number(playerCount.value);
        const safeCount = Number.isFinite(count) ? Math.min(20, Math.max(1, Math.floor(count))) : 1;
        playerCount.value = safeCount;
        return safeCount;
    }

    function levelField(index, selectedLevel) {
        const label = document.createElement("label");
        const labelText = document.createElement("span");
        const select = document.createElement("select");

        labelText.textContent = "PJ " + (index + 1) + " — niveau";
        select.dataset.playerLevel = "";
        select.setAttribute("aria-label", "Niveau du PJ " + (index + 1));
        for (let level = 1; level <= 20; level += 1) {
            const option = document.createElement("option");
            option.value = level;
            option.textContent = "Niveau " + level;
            option.selected = level === selectedLevel;
            select.append(option);
        }
        label.append(labelText, select);
        return label;
    }

    function renderLevelFields() {
        const previousLevels = Array.from(levelList.querySelectorAll("[data-player-level]"), (select) => Number(select.value));
        const count = clampPlayerCount();
        levelList.replaceChildren();
        for (let index = 0; index < count; index += 1) {
            levelList.append(levelField(index, previousLevels[index] || 3));
        }
        updateResult();
    }

    function updateResult() {
        const levels = Array.from(levelList.querySelectorAll("[data-player-level]"), (select) => Number(select.value));
        const selectedDifficulty = difficulty.value;
        const total = encounterBudget(levels, selectedDifficulty);
        output.textContent = formatXp.format(total) + " PX";
        breakdown.textContent = levels.length + " PJ · " + levels.map((level) => "N" + level).join(" + ") + " · " + selectedDifficulty;
    }

    playerCount.addEventListener("input", renderLevelFields);
    difficulty.addEventListener("change", updateResult);
    levelList.addEventListener("change", updateResult);
    renderLevelFields();

    window.XP_BUDGET = XP_BUDGET;
    window.encounterBudget = encounterBudget;
}());
