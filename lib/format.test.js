import { describe, it, expect } from "vitest";
import {
  formatINR,
  discountFor,
  mrpFor,
  averageRating,
  scorePassword,
} from "./format.js";

describe("formatINR", () => {
  it("formats whole rupees with Indian grouping", () => {
    expect(formatINR(1299)).toBe("₹1,299");
    expect(formatINR(100000)).toBe("₹1,00,000");
  });
  it("rounds and handles junk input", () => {
    expect(formatINR(99.6)).toBe("₹100");
    expect(formatINR(undefined)).toBe("₹0");
    expect(formatINR("abc")).toBe("₹0");
  });
});

describe("discountFor", () => {
  it("is deterministic for a given id", () => {
    expect(discountFor(5)).toBe(discountFor(5));
  });
  it("stays within 10–44%", () => {
    for (let id = 1; id <= 200; id++) {
      const d = discountFor(id);
      expect(d).toBeGreaterThanOrEqual(10);
      expect(d).toBeLessThanOrEqual(44);
    }
  });
});

describe("mrpFor", () => {
  it("is greater than the sale price", () => {
    expect(mrpFor(1000, 20)).toBeGreaterThan(1000);
  });
  it("rounds to the nearest 10", () => {
    expect(mrpFor(1000, 20) % 10).toBe(0);
  });
});

describe("averageRating", () => {
  it("returns null for no reviews", () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating(null)).toBeNull();
  });
  it("averages ratings", () => {
    expect(averageRating([{ rating: 4 }, { rating: 2 }])).toBe(3);
  });
});

describe("scorePassword", () => {
  it("scores empty as 0", () => {
    expect(scorePassword("")).toBe(0);
  });
  it("scores a weak password low", () => {
    expect(scorePassword("abc")).toBeLessThanOrEqual(1);
  });
  it("scores a strong password at the max", () => {
    expect(scorePassword("Abcdef1!xyz")).toBe(4);
  });
});
