/**
 * Filter Jobs
 *
 * Filters normalized job records based on:
 * - Active listing status
 * - Target job roles
 * - Seniority level
 * - Indian locations
 * - Posting date (last five days)
 */

const items = $input.all();

// Exclude senior and leadership positions.
const excludedTitles =
  /\b(senior|sr\.?|lead|principal|staff engineer|engineering manager|director|architect|head of)\b/i;

// Target roles
const targetRolePattern =
  /\b(ai engineer|ai\/ml engineer|artificial intelligence engineer|generative ai|genai|agentic ai|agentic engineer|llm engineer|llm|machine learning engineer|machine learning|ml engineer|python developer|python engineer|backend developer|backend engineer|software engineer|software developer|associate software engineer|graduate engineer trainee|nlp engineer|deep learning engineer)\b/i;

// Locations accepted by the workflow.
const indianLocations = [
  "india", "bengaluru", "bangalore", "hyderabad",
  "chennai", "pune", "mumbai", "delhi", "noida",
  "gurugram", "gurgaon", "ahmedabad", "kolkata",
  "jaipur", "kochi", "coimbatore", "indore",
  "thiruvananthapuram", "visakhapatnam", "mysore"
];

const now = Date.now();
const maxAgeMs = 5 * 24 * 60 * 60 * 1000;

return items.filter(item => {
  const job = item.json;

  // 1. Exclude inactive listings
  if (job.isActive === false) return false;

  const title = job.title || "";

  // 2. Exclude senior-level positions
  if (excludedTitles.test(title)) return false;

  // 3. Include only target job roles
  if (!targetRolePattern.test(title)) return false;

  // 4. India-only location check
  const location = (job.location || "").toLowerCase();

  const isIndia = indianLocations.some(place =>
    location.includes(place)
  );

  if (!isIndia) return false;

  // 5. Exclude jobs older than five days.
  // Keep jobs with missing dates for later review.
  if (job.postedAt) {
    const postedTime = new Date(job.postedAt).getTime();

    if (
      !Number.isNaN(postedTime) &&
      now - postedTime > maxAgeMs
    ) {
      return false;
    }
  }

  return true;
});