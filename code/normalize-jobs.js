/**
 * Normalize Jobs
 *
 * Converts Apify job records into a consistent structure
 * used by the AI JobMatch workflow.
 *
 * Supports:
 * - Individual job records
 * - An array of jobs
 * - An object containing a jobs array
 * - An object containing a data array
 */

const inputItems = $input.all();

// Support either individual job records or a returned jobs array.
const jobs = inputItems.flatMap(item => {
  const data = item.json;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.jobs)) return data.jobs;
  if (Array.isArray(data.data)) return data.data;

  return [data];
});

// Normalize the job fields.
return jobs
  .filter(job => job && job.listingKey)
  .map(job => ({
    json: {
      jobId: job.listingKey,
      title: job.title || "",
      company: job.employer || job.company || "",
      location: job.location || "",
      remote: job.isRemote ?? false,

      source: job.sourcePlatform || "",
      postedAt: job.postedAt || null,

      skills: Array.isArray(job.skills)
        ? job.skills.join(", ")
        : "",

      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      salaryCurrency: job.salaryCurrency || null,
      salaryRaw: job.salaryRaw || "",

      listingUrl: job.listingUrl || "",
      isActive: job.isActive ?? true,
      lifecycleStatus: job.lifecycleStatus || "",

      contentFingerprint: job.contentFingerprint || "",
      sourceComplete: job.sourceComplete ?? false,
      sourceCapped: job.sourceCapped ?? false
    }
  }));