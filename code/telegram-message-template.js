/**
 * Telegram Message Template
 *
 * n8n Telegram node expression.
 * Uses HTML formatting to send job details and AI evaluation
 * results as a readable Telegram notification.
 *
 * Set Telegram Parse Mode to HTML.
 */

={{
(() => {
  // Escape dynamic values to prevent invalid Telegram HTML.
  const esc = (value) =>
    String(value ?? "Not specified")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // Keep the score within the 0-100 range.
  const score = Math.max(
    0,
    Math.min(100, Number($json.matchScore) || 0)
  );

  const recommendation = $json.recommendation || "Maybe";

  // Display a readable status for each recommendation.
  const status = {
    Apply: "🟢 STRONG MATCH",
    Maybe: "🟡 WORTH CONSIDERING",
    Skip: "🔴 NOT RECOMMENDED"
  }[recommendation] || "⚪ REVIEW";

  // Format skill arrays for Telegram.
  const skills = (value) =>
    Array.isArray(value) && value.length
      ? value.map(esc).join(" · ")
      : "Not specified";

  // Generate a visual score bar.
  const bar = "🟩".repeat(Math.floor(score / 10)) +
              "⬜".repeat(10 - Math.floor(score / 10));

  return (
    "🚀 <b>AI JOBMATCH ALERT</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "💼 <b>" + esc($json.title) + "</b>\n" +
    "🏢 " + esc($json.company) + "\n" +
    "📍 " + esc($json.location) + "\n" +
    "🌐 " + ($json.remote ? "Remote" : "On-site / Hybrid") + "\n\n" +

    "🎯 <b>MATCH SCORE</b>\n" +
    bar + "\n" +
    "⭐ <b>" + score + "/100</b>\n" +
    "📌 " + status + "\n\n" +

    "✅ <b>Matching Skills</b>\n" +
    skills($json.matchingSkills) + "\n\n" +

    "📚 <b>Skills to Improve</b>\n" +
    skills($json.missingSkills) + "\n\n" +

    "🧠 <b>WHY THIS MATCH?</b>\n" +
    esc($json.reasoning) + "\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🔗 <a href=\"" + esc($json.listingUrl) +
    "\">VIEW JOB &amp; APPLY</a>\n\n" +

    "<i>🤖 An opportunity discovered and evaluated by AI JobMatch</i>"
  );
})()
}}