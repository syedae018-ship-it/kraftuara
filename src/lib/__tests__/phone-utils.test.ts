import {
  normalizePhoneNumber,
  formatPhoneNumber,
  splitPhoneNumber,
  isValidPhoneNumber,
  getWhatsAppDestination,
} from "../phone-utils";

describe("Phone Utils & India +91 Defaults", () => {
  test("normalizes plain 10-digit Indian number by defaulting to +91", () => {
    expect(normalizePhoneNumber("9876543210")).toBe("+919876543210");
  });

  test("normalizes 10-digit number with spaces", () => {
    expect(normalizePhoneNumber("98765 43210")).toBe("+919876543210");
  });

  test("normalizes standard +91 number without duplicate +91", () => {
    expect(normalizePhoneNumber("+919876543210")).toBe("+919876543210");
    expect(normalizePhoneNumber("+91 98765 43210")).toBe("+919876543210");
  });

  test("normalizes 12-digit Indian number without +", () => {
    expect(normalizePhoneNumber("919876543210")).toBe("+919876543210");
  });

  test("normalizes Indian number with leading 0", () => {
    expect(normalizePhoneNumber("09876543210")).toBe("+919876543210");
  });

  test("prevents accidental duplicate country codes (+91+91)", () => {
    expect(normalizePhoneNumber("+91+919876543210")).toBe("+919876543210");
  });

  test("preserves international numbers properly without prepending +91", () => {
    expect(normalizePhoneNumber("+1 202 555 0123")).toBe("+12025550123");
    expect(normalizePhoneNumber("+44 7911 123456")).toBe("+447911123456");
    expect(normalizePhoneNumber("+971 50 123 4567")).toBe("+971501234567");
  });

  test("formats phone numbers cleanly for UI display", () => {
    expect(formatPhoneNumber("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhoneNumber("9876543210")).toBe("+91 98765 43210");
  });

  test("splits phone number into countryCode and nationalNumber", () => {
    expect(splitPhoneNumber("+919876543210")).toEqual({
      countryCode: "+91",
      nationalNumber: "9876543210",
    });
    expect(splitPhoneNumber("9876543210")).toEqual({
      countryCode: "+91",
      nationalNumber: "9876543210",
    });
    expect(splitPhoneNumber("+12025550123")).toEqual({
      countryCode: "+1",
      nationalNumber: "2025550123",
    });
  });

  test("extracts clean WhatsApp destination digits", () => {
    expect(getWhatsAppDestination("+91 98765 43210")).toBe("919876543210");
    expect(getWhatsAppDestination("9876543210")).toBe("919876543210");
    expect(getWhatsAppDestination("+1 (202) 555-0123")).toBe("12025550123");
  });

  test("validates Indian mobile numbers correctly", () => {
    expect(isValidPhoneNumber("+919876543210")).toBe(true);
    expect(isValidPhoneNumber("+918888888888")).toBe(true);
    expect(isValidPhoneNumber("+917777777777")).toBe(true);
    expect(isValidPhoneNumber("+916666666666")).toBe(true);
    
    // Invalid (starts with 0, 1, 2 or not 10 digits)
    expect(isValidPhoneNumber("+911234567890")).toBe(false);
    expect(isValidPhoneNumber("+9198765")).toBe(false);
  });
});
