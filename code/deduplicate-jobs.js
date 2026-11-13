/**
 * Deduplicate Jobs
 *
 * Compares today's filtered jobs with previously stored
 * jobs in Google Sheets and keeps only new listings.
 */

// Get today's filtered jobs.
const todayJobs = $("Fresher & Location Filter")
  .all()
  .map(item => item.json);

// Get previously stored jobs from Google Sheets.
const existingRows = $("Get Existing Jobs")
  .all()
  .map(item => item.json);

// Create a set of existing job IDs.
const existingJobIds = new Set(
  existingRows
    .map(row => String(row.jobId || "").trim())
    .filter(Boolean)
);

// Keep only genuinely new jobs.
const newJobs = todayJobs.filter(job => {
  const id = String(job.jobId || "").trim();

  return id && !existingJobIds.has(id);
});

// Return only new jobs to the next node.
return newJobs.map(job => ({
  json: job
}));