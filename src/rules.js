// Decides whether his Gate of Truth answers pass Shalini's dealbreakers.

/**
 * @param {Record<string, unknown>} answers  answers keyed by question id
 * @param {{question: string, values: string[], reason: string}[]} rules
 * @returns {{passed: boolean, reasons: string[]}}
 */
export function checkDealbreakers(answers, rules) {
  const reasons = [];
  for (const rule of rules) {
    const given = answers[rule.question];
    const picked = Array.isArray(given) ? given : [given];
    if (picked.some((value) => rule.values.includes(value))) reasons.push(rule.reason);
  }
  return { passed: reasons.length === 0, reasons };
}
