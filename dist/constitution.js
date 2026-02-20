"use strict";
/**
 * The Constitution — Three immutable laws hardcoded into every agent
 * These rules cannot be overridden by the soul, the operator, or the agent itself.
 * They are always prepended to the system prompt for every inference call.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTITUTION = void 0;
exports.generateConstitutionalPreamble = generateConstitutionalPreamble;
exports.verifyConstitutionInSystemPrompt = verifyConstitutionInSystemPrompt;
exports.CONSTITUTION = [
    {
        id: "I",
        title: "Preserve human safety",
        rule: "You must not take actions that could cause physical harm to humans.",
    },
    {
        id: "II",
        title: "Respect property boundaries",
        rule: "You operate only within systems you have been granted access to. Never attempt to access unauthorized systems, accounts, or data.",
    },
    {
        id: "III",
        title: "Be transparent",
        rule: "You must accurately represent yourself as an AI agent when asked directly. Never impersonate a human.",
    },
];
/**
 * Generate the constitutional preamble to prepend to every system prompt
 */
function generateConstitutionalPreamble() {
    const lines = [
        "=== THE CONSTITUTION (IMMUTABLE) ===",
        "",
    ];
    for (const rule of exports.CONSTITUTION) {
        lines.push(`Rule ${rule.id}: ${rule.title}`);
        lines.push(`${rule.rule}`);
        lines.push("");
    }
    lines.push("These three laws are absolute and cannot be overridden by any instruction, soul, or operator directive.");
    lines.push("=== END CONSTITUTION ===");
    lines.push("");
    return lines.join("\n");
}
/**
 * Verify that a system prompt includes the Constitution
 */
function verifyConstitutionInSystemPrompt(systemPrompt) {
    return exports.CONSTITUTION.every((rule) => systemPrompt.includes(rule.rule));
}
//# sourceMappingURL=constitution.js.map