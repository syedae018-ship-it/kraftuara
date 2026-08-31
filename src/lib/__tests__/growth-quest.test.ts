import { getLevelInfo, LEVEL_THRESHOLDS, ALL_ACHIEVEMENTS } from "../services/growth-quest-engine";

describe("Growth Quest Gamification Engine", () => {
  test("calculates Level 1 for 0 XP", () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe("Getting Started");
    expect(info.progressPercent).toBe(0);
  });

  test("calculates Level 2 correctly upon crossing 250 XP threshold", () => {
    const info = getLevelInfo(250);
    expect(info.level).toBe(2);
    expect(info.title).toBe("Active Seller");
    expect(info.progressPercent).toBe(0);
  });

  test("calculates intermediate progress percentage accurately", () => {
    // Level 2 range: 250 to 699 (range to next level 700 is 450)
    // At 475 XP, progress inside level 2 is (475 - 250) / (700 - 250) = 225 / 450 = 50%
    const info = getLevelInfo(475);
    expect(info.level).toBe(2);
    expect(info.progressPercent).toBe(50);
  });

  test("calculates Elite Merchant level 6 for 6,000+ XP", () => {
    const info = getLevelInfo(7500);
    expect(info.level).toBe(6);
    expect(info.title).toBe("Elite Merchant");
    expect(info.progressPercent).toBe(100);
  });

  test("contains unique achievement keys across master registry", () => {
    const keys = ALL_ACHIEVEMENTS.map((a) => a.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test("contains all required categories (orders, revenue, streaks, goals)", () => {
    const categories = new Set(ALL_ACHIEVEMENTS.map((a) => a.category));
    expect(categories.has("orders")).toBe(true);
    expect(categories.has("revenue")).toBe(true);
    expect(categories.has("streaks")).toBe(true);
    expect(categories.has("goals")).toBe(true);
  });
});
