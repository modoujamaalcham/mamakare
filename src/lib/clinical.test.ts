import { describe, it, expect } from "vitest";
import { eddFromLmp, gestationalAge, evaluateFlags, recommendedInvestigations } from "./clinical";

describe("clinical rules", () => {
  it("EDD is LMP + 280 days", () => {
    expect(eddFromLmp("2026-01-01")).toBe("2026-10-08");
  });
  it("gestational age in weeks and days", () => {
    expect(gestationalAge("2026-01-01", new Date("2026-03-05T12:00:00"))).toMatchObject({
      weeks: 9,
      days: 0,
    });
  });
  it("BP 160/110 is urgent", () => {
    expect(evaluateFlags({ systolic: 160, diastolic: 100 })[0]?.level).toBe("urgent");
  });
  it("BP 140/90 is a warning", () => {
    expect(evaluateFlags({ systolic: 142, diastolic: 85 })[0]?.level).toBe("warning");
  });
  it("normal BP raises no flag", () => {
    expect(evaluateFlags({ systolic: 120, diastolic: 80 })).toHaveLength(0);
  });
  it("FHR outside 110-160 is urgent", () => {
    expect(evaluateFlags({ fetal_heart_rate: 100 })[0]?.level).toBe("urgent");
  });
  it("Hb under 7 is severe anaemia", () => {
    expect(evaluateFlags({ hemoglobin: 6.5 })[0]?.message).toMatch(/Severe anaemia/);
  });
  it("recommends glucose screen at 24 weeks only if missing", () => {
    expect(recommendedInvestigations(24, []).map((r) => r.name)).toContain("Glucose screening");
    expect(recommendedInvestigations(24, ["Glucose screening"]).map((r) => r.name)).not.toContain(
      "Glucose screening",
    );
    expect(recommendedInvestigations(10, []).map((r) => r.name)).not.toContain("Glucose screening");
  });
});
