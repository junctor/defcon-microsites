import { describe, expect, it } from "vitest";
import { CONFERENCE_CODE, CONFERENCE_NAME, CONFERENCE_THEME } from "./conference";

describe("conference constants", () => {
  it("targets the DEF CON 34 microsites", () => {
    expect(CONFERENCE_CODE).toBe("DEFCON34");
    expect(CONFERENCE_NAME).toBe("DEF CON 34");
    expect(CONFERENCE_THEME).toBe("Agency");
  });
});
