const DEFAULT_COUNT = 2;
const DEFAULT_SIDES = 6;
const DEFAULT_THRESHOLD = 7;
const MAX_DICE = 50;
const DIE_SIDES = Object.freeze([4, 6, 8, 10, 12, 20, 100]);

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 2,
});
const SVG_NS = "http://www.w3.org/2000/svg";

function integerOrThrow(value, label) {
    const number = Number(value);
    if (!Number.isInteger(number)) throw new TypeError(`${label} doit être un entier.`);
    return number;
}

function combinationOrThrow(value) {
    const combination = typeof value === "bigint" ? value : BigInt(value);
    if (combination < 0n) throw new RangeError("Une combinaison ne peut pas être négative.");
    return combination;
}

function totalFor(distribution) {
    return distribution.reduce((total, entry) => total + combinationOrThrow(entry.combinations), 0n);
}

function probability(combinations, total) {
    return Number(combinations) / Number(total);
}

function cleanFloatingPoint(value) {
    const nearestInteger = Math.round(value);
    return Math.abs(value - nearestInteger) < 1e-12 ? nearestInteger : value;
}

export function createDieDistribution(sides) {
    const dieSides = integerOrThrow(sides, "Le nombre de faces");
    if (dieSides < 2 || dieSides > 100) throw new RangeError("Le dé doit avoir entre 2 et 100 faces.");
    return Array.from({ length: dieSides }, (_, index) => ({
        value: index + 1,
        combinations: 1n,
    }));
}

export function convolveDistributions(left, right) {
    const combinationsByValue = new Map();
    for (const leftEntry of left) {
        for (const rightEntry of right) {
            const value = leftEntry.value + rightEntry.value;
            const combinations = combinationOrThrow(leftEntry.combinations)
                * combinationOrThrow(rightEntry.combinations);
            combinationsByValue.set(value, (combinationsByValue.get(value) || 0n) + combinations);
        }
    }
    return Array.from(combinationsByValue, ([value, combinations]) => ({ value, combinations }));
}

export function createDiceDistribution(count, sides) {
    const diceCount = integerOrThrow(count, "Le nombre de dés");
    if (diceCount < 1 || diceCount > MAX_DICE) {
        throw new RangeError(`Le nombre de dés doit être compris entre 1 et ${MAX_DICE}.`);
    }

    const die = createDieDistribution(sides);
    let distribution = [{ value: 0, combinations: 1n }];
    for (let index = 0; index < diceCount; index += 1) {
        distribution = convolveDistributions(distribution, die);
    }
    return distribution;
}

function valueAtRank(distribution, rank) {
    let cumulative = 0n;
    for (const entry of distribution) {
        cumulative += combinationOrThrow(entry.combinations);
        if (cumulative >= rank) return entry.value;
    }
    throw new RangeError("Rang absent de la distribution.");
}

export function computeStatistics(distribution) {
    if (!distribution.length) throw new RangeError("La distribution ne peut pas être vide.");
    const totalCombinations = totalFor(distribution);
    if (totalCombinations <= 0n) throw new RangeError("La distribution doit contenir une combinaison.");

    const minimum = distribution[0].value;
    const maximum = distribution[distribution.length - 1].value;
    const mean = cleanFloatingPoint(distribution.reduce(
        (sum, entry) => sum + entry.value * probability(combinationOrThrow(entry.combinations), totalCombinations),
        0,
    ));
    const variance = distribution.reduce(
        (sum, entry) => sum + ((entry.value - mean) ** 2)
            * probability(combinationOrThrow(entry.combinations), totalCombinations),
        0,
    );
    const median = totalCombinations % 2n === 0n
        ? (valueAtRank(distribution, totalCombinations / 2n)
            + valueAtRank(distribution, totalCombinations / 2n + 1n)) / 2
        : valueAtRank(distribution, (totalCombinations + 1n) / 2n);
    const highestCount = distribution.reduce(
        (highest, entry) => Math.max(highest, Number(entry.combinations)),
        0,
    );
    const mode = distribution
        .filter((entry) => Number(entry.combinations) === highestCount)
        .map((entry) => entry.value);

    return {
        minimum,
        maximum,
        range: maximum - minimum,
        mean,
        median,
        mode,
        variance,
        standardDeviation: Math.sqrt(variance),
        totalCombinations,
    };
}

function thresholdMetric(combinations, totalCombinations) {
    return {
        combinations,
        probability: probability(combinations, totalCombinations),
    };
}

export function computeThresholdProbabilities(distribution, threshold) {
    const value = integerOrThrow(threshold, "Le seuil");
    const totalCombinations = totalFor(distribution);
    let atLeast = 0n;
    let greaterThan = 0n;
    let atMost = 0n;
    let lessThan = 0n;
    let equal = 0n;

    for (const entry of distribution) {
        const combinations = combinationOrThrow(entry.combinations);
        if (entry.value >= value) atLeast += combinations;
        if (entry.value > value) greaterThan += combinations;
        if (entry.value <= value) atMost += combinations;
        if (entry.value < value) lessThan += combinations;
        if (entry.value === value) equal += combinations;
    }

    return {
        threshold: value,
        totalCombinations,
        atLeast: thresholdMetric(atLeast, totalCombinations),
        greaterThan: thresholdMetric(greaterThan, totalCombinations),
        atMost: thresholdMetric(atMost, totalCombinations),
        lessThan: thresholdMetric(lessThan, totalCombinations),
        equal: thresholdMetric(equal, totalCombinations),
    };
}

function clampInteger(value, minimum, maximum, fallback) {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return fallback;
    const number = Number(value);
    if (!Number.isInteger(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, number));
}

export function normalizeDiceConfig({ count, sides, threshold } = {}) {
    const safeCount = clampInteger(count, 1, MAX_DICE, DEFAULT_COUNT);
    const safeSides = DIE_SIDES.includes(Number(sides)) ? Number(sides) : DEFAULT_SIDES;
    const minimum = safeCount;
    const maximum = safeCount * safeSides;
    const defaultThreshold = Math.min(maximum, Math.max(minimum, DEFAULT_THRESHOLD));
    return {
        count: safeCount,
        sides: safeSides,
        threshold: clampInteger(threshold, minimum, maximum, defaultThreshold),
    };
}

export function readDiceConfig(search = "") {
    const params = new URLSearchParams(search);
    return normalizeDiceConfig({
        count: params.get("count"),
        sides: params.get("sides"),
        threshold: params.get("threshold"),
    });
}

function formatNumber(value) {
    return numberFormat.format(value);
}

function formatPercent(value) {
    return percentFormat.format(value);
}

function formatCombinations(value) {
    return value.toLocaleString("fr-FR");
}

function formatModes(mode) {
    if (mode.length < 2) return mode.join("");
    if (mode.length === 2) return `${mode[0]} et ${mode[1]}`;
    return `${mode.slice(0, -1).join(", ")} et ${mode[mode.length - 1]}`;
}

function createSvgElement(ownerDocument, name, attributes = {}) {
    const element = ownerDocument.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([attribute, value]) => element.setAttribute(attribute, String(value)));
    return element;
}

function niceAxisMaximum(value) {
    const exponent = 10 ** Math.floor(Math.log10(value));
    const normalized = value / exponent;
    const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return step * exponent;
}

function chartWidthFor(resultCount) {
    const slotWidth = resultCount <= 24 ? 56 : resultCount <= 100 ? 13 : 8;
    return Math.max(760, 78 + resultCount * slotWidth);
}

function appendText(ownerDocument, parent, text, attributes = {}) {
    const node = createSvgElement(ownerDocument, "text", attributes);
    node.textContent = text;
    parent.appendChild(node);
    return node;
}

export function renderHistogram(svg, distribution, statistics, notation) {
    const ownerDocument = svg.ownerDocument || document;
    const resultCount = distribution.length;
    const intrinsicWidth = chartWidthFor(resultCount);
    const availableWidth = svg.parentElement?.clientWidth || intrinsicWidth;
    const width = resultCount <= 24
        ? Math.max(280, Math.min(intrinsicWidth, availableWidth - 16))
        : intrinsicWidth;
    const height = 380;
    const margin = { top: 38, right: 20, bottom: 68, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const step = plotWidth / resultCount;
    const totalCombinations = statistics.totalCombinations;
    const probabilities = distribution.map((entry) => probability(entry.combinations, totalCombinations));
    const maximumProbability = Math.max(...probabilities);
    const axisMaximum = niceAxisMaximum(maximumProbability * 1.1);
    const minimum = statistics.minimum;
    const maximum = statistics.maximum;

    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", "diceHistogramTitle diceHistogramDescription");

    const title = createSvgElement(ownerDocument, "title", { id: "diceHistogramTitle" });
    title.textContent = `Distribution exacte de ${notation}`;
    const description = createSvgElement(ownerDocument, "desc", { id: "diceHistogramDescription" });
    description.textContent = `Histogramme des ${resultCount} résultats possibles de ${notation}.`;
    svg.append(title, description);

    const grid = createSvgElement(ownerDocument, "g", { class: "dice-chart__grid" });
    for (let tick = 0; tick <= 4; tick += 1) {
        const ratio = tick / 4;
        const y = margin.top + plotHeight * (1 - ratio);
        grid.appendChild(createSvgElement(ownerDocument, "line", {
            x1: margin.left,
            x2: width - margin.right,
            y1: y,
            y2: y,
        }));
        appendText(ownerDocument, grid, formatPercent(axisMaximum * ratio), {
            x: margin.left - 10,
            y: y + 4,
            "text-anchor": "end",
        });
    }
    svg.appendChild(grid);
    appendText(ownerDocument, svg, "Probabilité", {
        class: "dice-chart__axis-title dice-chart__axis-title--y",
        x: 16,
        y: margin.top + plotHeight / 2,
        transform: `rotate(-90 16 ${margin.top + plotHeight / 2})`,
        "text-anchor": "middle",
    });
    appendText(ownerDocument, svg, "Résultat total", {
        class: "dice-chart__axis-title",
        x: margin.left + plotWidth / 2,
        y: height - 10,
        "text-anchor": "middle",
    });

    const bars = createSvgElement(ownerDocument, "g", { class: "dice-chart__bars" });
    distribution.forEach((entry, index) => {
        const entryProbability = probabilities[index];
        const barHeight = (entryProbability / axisMaximum) * plotHeight;
        const x = margin.left + index * step + step * 0.12;
        const y = margin.top + plotHeight - barHeight;
        const group = createSvgElement(ownerDocument, "g", {
            class: "dice-chart__bar-hit",
            tabindex: 0,
            focusable: "true",
            role: "img",
            "aria-label": `Résultat ${entry.value} : ${formatPercent(entryProbability)}, ${formatCombinations(entry.combinations)} combinaisons sur ${formatCombinations(totalCombinations)}`,
            "data-result": entry.value,
            "data-probability": entryProbability,
            "data-combinations": entry.combinations,
            "data-total": totalCombinations,
        });
        group.appendChild(createSvgElement(ownerDocument, "rect", {
            class: "dice-chart__bar",
            x,
            y,
            width: Math.max(2, step * 0.76),
            height: Math.max(1, barHeight),
            rx: 2,
        }));
        bars.appendChild(group);
    });
    svg.appendChild(bars);

    const references = createSvgElement(ownerDocument, "g", { class: "dice-chart__references" });
    const xForValue = (value) => margin.left + ((value - minimum) + 0.5) * step;
    const reference = (value, className, label) => {
        const x = xForValue(value);
        references.append(
            createSvgElement(ownerDocument, "line", {
                class: `dice-reference-line ${className}`,
                x1: x,
                x2: x,
                y1: margin.top - 5,
                y2: margin.top + plotHeight,
            }),
            appendText(ownerDocument, references, label, {
                class: `dice-reference-label ${className}`,
                x: x + 4,
                y: margin.top - 12,
            }),
        );
    };
    reference(statistics.mean, "dice-reference-line--mean", "Moy.");
    reference(statistics.median, "dice-reference-line--median", "Méd.");
    statistics.mode.forEach((value) => reference(value, "dice-reference-line--mode", "Mode"));
    svg.appendChild(references);

    svg.appendChild(createSvgElement(ownerDocument, "line", {
        class: "dice-chart__axis",
        x1: margin.left,
        x2: width - margin.right,
        y1: margin.top + plotHeight,
        y2: margin.top + plotHeight,
    }));
    const labelStep = Math.max(1, Math.ceil(resultCount / 12));
    distribution.forEach((entry, index) => {
        if (index % labelStep !== 0 && index !== resultCount - 1) return;
        appendText(ownerDocument, svg, String(entry.value), {
            class: "dice-chart__x-label",
            x: margin.left + (index + 0.5) * step,
            y: margin.top + plotHeight + 22,
            "text-anchor": "middle",
        });
    });
}

export function renderStatistics(elements, statistics) {
    const values = {
        statMin: statistics.minimum,
        statMax: statistics.maximum,
        statRange: statistics.range,
        statMean: statistics.mean,
        statMedian: statistics.median,
        statMode: formatModes(statistics.mode),
        statVariance: statistics.variance,
        statStandardDeviation: statistics.standardDeviation,
        statCombinations: formatCombinations(statistics.totalCombinations),
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = elements[id] || document.getElementById(id);
        if (element) element.textContent = typeof value === "number" ? formatNumber(value) : String(value);
    });
}

export function renderThresholdStatistics(elements, statistics) {
    const metrics = {
        thresholdAtLeast: statistics.atLeast,
        thresholdGreaterThan: statistics.greaterThan,
        thresholdAtMost: statistics.atMost,
        thresholdLessThan: statistics.lessThan,
        thresholdEqual: statistics.equal,
    };
    Object.entries(metrics).forEach(([id, metric]) => {
        const element = elements[id] || document.getElementById(id);
        if (!element) return;
        element.textContent = `${formatPercent(metric.probability)} (${formatCombinations(metric.combinations)} / ${formatCombinations(statistics.totalCombinations)})`;
    });
}

function updateUrl(config) {
    if (typeof window === "undefined" || !window.history?.replaceState) return;
    const url = new URL(window.location.href);
    url.searchParams.set("count", String(config.count));
    url.searchParams.set("sides", String(config.sides));
    url.searchParams.set("threshold", String(config.threshold));
    window.history.replaceState({ diceStats: config }, "", url.href);
}

function barFromEvent(event) {
    const target = event.target;
    return target && typeof target.closest === "function" ? target.closest(".dice-chart__bar-hit") : null;
}

function connectTooltip(svg, tooltip) {
    if (!svg || !tooltip || svg.dataset.tooltipBound) return;
    svg.dataset.tooltipBound = "true";
    tooltip.id = tooltip.id || "diceHistogramTooltip";

    function show(event) {
        const bar = barFromEvent(event);
        if (!bar) return;
        const result = bar.dataset.result;
        const entryProbability = Number(bar.dataset.probability);
        const combinations = BigInt(bar.dataset.combinations);
        const total = BigInt(bar.dataset.total || "0");
        tooltip.textContent = `Résultat : ${result} · Probabilité : ${formatPercent(entryProbability)} · Combinaisons : ${formatCombinations(combinations)}${total ? ` / ${formatCombinations(total)}` : ""}`;
        tooltip.hidden = false;
        tooltip.dataset.visible = "true";
        bar.setAttribute("aria-describedby", tooltip.id);
    }

    function hide(event) {
        const bar = barFromEvent(event);
        const related = event.relatedTarget;
        if (bar && related && bar.contains(related)) return;
        tooltip.hidden = true;
        delete tooltip.dataset.visible;
    }

    svg.addEventListener("pointerover", show);
    svg.addEventListener("pointerout", hide);
    svg.addEventListener("focusin", show);
    svg.addEventListener("focusout", hide);
    svg.addEventListener("click", show);
}

function render(config, elements, announce) {
    const notation = `${config.count}d${config.sides}`;
    const distribution = createDiceDistribution(config.count, config.sides);
    const statistics = computeStatistics(distribution);
    const thresholds = computeThresholdProbabilities(distribution, config.threshold);

    elements.count.value = String(config.count);
    elements.sides.value = String(config.sides);
    elements.threshold.min = String(statistics.minimum);
    elements.threshold.max = String(statistics.maximum);
    elements.threshold.value = String(config.threshold);
    elements.notation.textContent = notation;
    elements.thresholdBounds.textContent = `Résultats possibles : ${statistics.minimum} à ${statistics.maximum}`;
    elements.thresholdAtLeastLabel.textContent = `P(total ≥ ${config.threshold})`;
    elements.thresholdGreaterThanLabel.textContent = `P(total > ${config.threshold})`;
    elements.thresholdAtMostLabel.textContent = `P(total ≤ ${config.threshold})`;
    elements.thresholdLessThanLabel.textContent = `P(total < ${config.threshold})`;
    elements.thresholdEqualLabel.textContent = `P(total = ${config.threshold})`;
    elements.histogramSummary.textContent = `Distribution exacte de ${notation} : résultats de ${statistics.minimum} à ${statistics.maximum}. Le résultat le plus probable est ${formatModes(statistics.mode)} avec ${formatPercent(Math.max(...distribution.map((entry) => probability(entry.combinations, statistics.totalCombinations))))}.`;
    elements.status.textContent = `Analyse mise à jour : ${notation}.`;
    renderStatistics(elements, statistics);
    renderThresholdStatistics(elements, thresholds);
    renderHistogram(elements.histogram, distribution, statistics, notation);
    connectTooltip(elements.histogram, elements.tooltip);
    if (announce) updateUrl(config);
}

function start() {
    const elements = {
        count: document.getElementById("diceCount"),
        sides: document.getElementById("diceSides"),
        threshold: document.getElementById("diceThreshold"),
        notation: document.getElementById("diceNotation"),
        thresholdBounds: document.getElementById("thresholdBounds"),
        thresholdAtLeastLabel: document.getElementById("thresholdAtLeastLabel"),
        thresholdGreaterThanLabel: document.getElementById("thresholdGreaterThanLabel"),
        thresholdAtMostLabel: document.getElementById("thresholdAtMostLabel"),
        thresholdLessThanLabel: document.getElementById("thresholdLessThanLabel"),
        thresholdEqualLabel: document.getElementById("thresholdEqualLabel"),
        histogram: document.getElementById("diceHistogram"),
        histogramSummary: document.getElementById("histogramSummary"),
        tooltip: document.getElementById("diceHistogramTooltip"),
        status: document.getElementById("diceStatus"),
    };
    if (Object.values(elements).some((element) => !element)) return;

    let config = readDiceConfig(window.location.search);
    const update = (partial) => {
        config = normalizeDiceConfig({ ...config, ...partial });
        render(config, elements, true);
    };

    elements.count.addEventListener("input", () => {
        if (elements.count.value === "") return;
        update({ count: elements.count.value });
    });
    elements.sides.addEventListener("change", () => update({ sides: elements.sides.value }));
    elements.threshold.addEventListener("input", () => {
        if (elements.threshold.value === "") return;
        update({ threshold: elements.threshold.value });
    });
    window.addEventListener("popstate", () => {
        config = readDiceConfig(window.location.search);
        render(config, elements, false);
    });
    render(config, elements, false);
    if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => render(config, elements, false));
    }
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
}
