/**
 * Prepare JobMatch Results
 *
 * Combines original job details with the structured
 * evaluation returned by the Gemini AI Agent.
 */

// Get AI Agent results.
const agentItems = $input.all();

// Get the original jobs passed to the AI Agent.
const originalJobs = $("Remove Duplicate Jobs")
  .all()
  .map(item => item.json);

// Combine each AI evaluation with its original job.
return agentItems.map((item, index) => {
  const job = originalJobs[index] || {};
  const data = item.json;

  // Handle structured output or JSON returned as text.
  let evaluation = data.output ?? data;

  if (typeof evaluation === "string") {
    try {
      evaluation = JSON.parse(evaluation);
    } catch {
      evaluation = {};
    }
  }

  // Handle an additional nested output object if present.
  if (evaluation && typeof evaluation.output === "object") {
    evaluation = evaluation.output;
  }

  return {
    json: {
      ...job,
      matchScore: evaluation.matchScore ?? 0,
      recommendation: evaluation.recommendation ?? "Maybe",
      roleCategory: evaluation.roleCategory ?? "",
      experienceSuitability: evaluation.experienceSuitability ?? "",
      matchingSkills: evaluation.matchingSkills ?? [],
      missingSkills: evaluation.missingSkills ?? [],
      relevantProjects: evaluation.relevantProjects ?? [],
      strengths: evaluation.strengths ?? [],
      concerns: evaluation.concerns ?? [],
      reasoning: evaluation.reasoning ?? "",
      informationCompleteness:
        evaluation.informationCompleteness ?? "Limited"
    }
  };
});