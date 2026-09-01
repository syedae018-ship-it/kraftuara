import { DEFAULT_POINT_RULES, GrowthQuestService } from "../services/growth-quest-service";

describe("Growth Quest Rebuilt Gamification System", () => {
  test("loads default point rules with verified values", () => {
    expect(DEFAULT_POINT_RULES.pointsPerOrder).toBe(10);
    expect(DEFAULT_POINT_RULES.revenueUnit).toBe(100);
    expect(DEFAULT_POINT_RULES.pointsPerRevenueUnit).toBe(1);
    expect(DEFAULT_POINT_RULES.pointsPerProductSold).toBe(2);
    expect(DEFAULT_POINT_RULES.milestone25Points).toBe(25);
    expect(DEFAULT_POINT_RULES.milestone50Points).toBe(50);
    expect(DEFAULT_POINT_RULES.milestone75Points).toBe(75);
    expect(DEFAULT_POINT_RULES.milestone100Points).toBe(150);
    expect(DEFAULT_POINT_RULES.craftauraQuestDefaultPoints).toBe(500);
  });

  test("contains default fallback templates (Easy, Moderate, Difficult)", async () => {
    const mockSupabase: any = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => ({ data: null }),
          }),
        }),
      }),
    };

    const templates = await GrowthQuestService.getTemplates(mockSupabase);
    expect(templates.length).toBe(3);

    const easy = templates.find((t) => t.difficulty === "easy");
    expect(easy).toBeDefined();
    expect(easy?.revenueTarget).toBe(3000);
    expect(easy?.ordersTarget).toBe(5);

    const mod = templates.find((t) => t.difficulty === "moderate");
    expect(mod).toBeDefined();
    expect(mod?.revenueTarget).toBe(10000);

    const diff = templates.find((t) => t.difficulty === "difficult");
    expect(diff).toBeDefined();
    expect(diff?.revenueTarget).toBe(25000);
  });
});
