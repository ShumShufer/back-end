import { describe, it } from "node:test";
import assert from "node:assert/strict";

function computePriceDistribution(prices: number[]) {
  if (prices.length === 0) {
    return {
      recommendedPrice: 500,
      marketAverage: null,
      lowerBound: null,
      upperBound: null,
      confidence: "low",
      sampleSize: 0,
    };
  }

  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance =
    prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const recommendedPrice = Math.round(mean * 1.05);

  return {
    recommendedPrice,
    marketAverage: Math.round(mean),
    lowerBound: Math.round(Math.max(0, mean - stdDev)),
    upperBound: Math.round(mean + stdDev),
    confidence: prices.length >= 5 ? "high" : "medium",
    sampleSize: prices.length,
  };
}

describe("Price Recommendation Algorithm Unit Tests", () => {
  it("should return fallback defaults when no comparable courses exist", () => {
    const res = computePriceDistribution([]);
    assert.equal(res.recommendedPrice, 500);
    assert.equal(res.confidence, "low");
    assert.equal(res.sampleSize, 0);
  });

  it("should calculate mean, standard deviation, and 5% premium correctly", () => {
    const prices = [1000, 1200, 1100, 1300, 1400];
    const res = computePriceDistribution(prices);

    // Mean = 1200
    assert.equal(res.marketAverage, 1200);
    // Recommended price = 1200 * 1.05 = 1260
    assert.equal(res.recommendedPrice, 1260);
    // Since sampleSize >= 5, confidence should be high
    assert.equal(res.confidence, "high");
    assert.equal(res.sampleSize, 5);
    // Bounds should envelop the mean
    assert.ok(res.lowerBound! <= res.marketAverage);
    assert.ok(res.upperBound! >= res.marketAverage);
  });

  it("should assign medium confidence when sample size is less than 5", () => {
    const prices = [1000, 2000];
    const res = computePriceDistribution(prices);
    assert.equal(res.marketAverage, 1500);
    assert.equal(res.recommendedPrice, 1575);
    assert.equal(res.confidence, "medium");
  });
});
