import { describe, expect, test } from "bun:test";
import { DEFAULT_REDIRECT, safeRedirect } from "./safe-redirect";

const hostilePayloads = [
	"https://evil.example",
	"http://evil.example/dashboard",
	"//evil.example",
	"///evil.example",
	"/\\evil.example",
	"\\\\evil.example",
	"/%2F%2Fevil.example",
	"%2F%2Fevil.example",
	"/%5Cevil.example",
	"/%252F%252Fevil.example",
	"javascript:alert(1)",
	"JaVaScRiPt:alert(1)",
	"/\tjavascript:alert(1)",
	"/\n/evil.example",
	"/%0a/evil.example",
	"/%09/evil.example",
	"/%E0%A4%A",
	"data:text/html,<script>alert(1)</script>",
	"dashboard",
	"  //evil.example",
	"/\u0000/evil.example",
];

const validPaths = ["/dashboard", "/account?tab=sessions", "/admin#users"];

describe("safeRedirect", () => {
	test.each(hostilePayloads)("rejects %p", (payload) => {
		expect(safeRedirect(payload)).toBe(DEFAULT_REDIRECT);
	});

	test.each(validPaths)("accepts %p", (path) => {
		expect(safeRedirect(path)).toBe(path);
	});

	test("uses the fallback for empty values", () => {
		expect(safeRedirect(undefined)).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect("")).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect(null, "/")).toBe("/");
	});

	test("takes the first value of a repeated query param", () => {
		expect(safeRedirect(["/account", "https://evil.example"])).toBe("/account");
	});
});
