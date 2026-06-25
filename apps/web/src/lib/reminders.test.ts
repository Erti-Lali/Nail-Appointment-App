import { describe, it, expect } from "vitest";
import { formatWall, reminderSms, reminderPush } from "./reminders";

describe("formatWall", () => {
  it("reads a naive timestamp as wall-clock UTC", () => {
    expect(formatWall("2026-06-25T09:30:00")).toEqual({ date: "25 Haziran 2026", time: "09:30" });
  });

  it("handles an explicit Z the same way", () => {
    expect(formatWall("2026-01-05T08:05:00Z")).toEqual({ date: "5 Ocak 2026", time: "08:05" });
  });

  it("does not shift the day for an offset-tagged time", () => {
    // 23:00+00:00 must stay the 25th, not roll into the 26th
    expect(formatWall("2026-12-25T23:00:00+00:00")).toEqual({ date: "25 Aralık 2026", time: "23:00" });
  });
});

describe("reminderSms", () => {
  it("includes name, date, time and studio", () => {
    const msg = reminderSms("Ayşe", "2026-06-25T14:00:00", "Glamour Nails");
    expect(msg).toContain("Ayşe");
    expect(msg).toContain("25 Haziran 2026");
    expect(msg).toContain("14:00");
    expect(msg).toContain("Glamour Nails");
  });

  it("falls back gracefully when the name is empty", () => {
    expect(reminderSms("", "2026-06-25T14:00:00", "Studio")).toContain("değerli müşterimiz");
  });
});

describe("reminderPush", () => {
  it("puts the studio in the title and details in the body", () => {
    const { title, body } = reminderPush("Zeynep", "2026-06-25T16:30:00", "Nails By Sevde");
    expect(title).toContain("Nails By Sevde");
    expect(body).toContain("Zeynep");
    expect(body).toContain("16:30");
  });
});
