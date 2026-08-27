import assert from "node:assert/strict";
import test from "node:test";
import {
  computeStatistics,
  computeThresholdProbabilities,
  createDiceDistribution,
  createDieDistribution,
  normalizeDiceConfig,
  readDiceConfig,
} from "../js/dice-stats.js";

test("1d6 has six equiprobable results and a median of 3.5", () => {
  const distribution = createDiceDistribution(1, 6);
  const statistics = computeStatistics(distribution);

  assert.deepEqual(distribution.map(({ value, combinations }) => [value, combinations]), [
    [1, 1n], [2, 1n], [3, 1n], [4, 1n], [5, 1n], [6, 1n],
  ]);
  assert.equal(statistics.mean, 3.5);
  assert.equal(statistics.median, 3.5);
  assert.deepEqual(statistics.mode, [1, 2, 3, 4, 5, 6]);
});

test("2d6 uses exact convolution counts", () => {
  const distribution = createDiceDistribution(2, 6);
  const statistics = computeStatistics(distribution);

  assert.deepEqual(distribution.map(({ value, combinations }) => [value, combinations]), [
    [2, 1n], [3, 2n], [4, 3n], [5, 4n], [6, 5n], [7, 6n],
    [8, 5n], [9, 4n], [10, 3n], [11, 2n], [12, 1n],
  ]);
  assert.equal(statistics.totalCombinations, 36n);
  assert.equal(statistics.mean, 7);
  assert.equal(statistics.median, 7);
  assert.deepEqual(statistics.mode, [7]);
});

test("2d20 keeps exact totals and theoretical bounds", () => {
  const statistics = computeStatistics(createDiceDistribution(2, 20));
  assert.equal(statistics.totalCombinations, 400n);
  assert.equal(statistics.minimum, 2);
  assert.equal(statistics.maximum, 40);
  assert.equal(statistics.mean, 21);
});

test("threshold probabilities are derived from the same distribution", () => {
  const probabilities = computeThresholdProbabilities(createDiceDistribution(2, 6), 10);
  assert.equal(probabilities.atLeast.combinations, 6n);
  assert.equal(probabilities.greaterThan.combinations, 3n);
  assert.equal(probabilities.equal.combinations, 3n);
  assert.equal(probabilities.atMost.combinations, 33n);
  assert.equal(probabilities.lessThan.combinations, 30n);
});

test("a die distribution is exact and uses BigInt combinations", () => {
  const distribution = createDieDistribution(6);
  assert.equal(distribution.every(({ combinations }) => typeof combinations === "bigint"), true);
});

test("dice configuration defaults and URL state are validated", () => {
  assert.deepEqual(normalizeDiceConfig(), { count: 2, sides: 6, threshold: 7 });
  assert.deepEqual(readDiceConfig("?count=4&sides=8&threshold=20"), { count: 4, sides: 8, threshold: 20 });
  assert.deepEqual(readDiceConfig("?count=invalid&sides=7&threshold=999"), { count: 2, sides: 6, threshold: 12 });
});
