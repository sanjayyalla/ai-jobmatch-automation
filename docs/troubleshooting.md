
# Troubleshooting & Implementation Notes

This project wasn't built in one straight line. A few things didn't work as expected, especially when connecting external services and handling data from different sources.

I'm keeping the issues and fixes here because they were an important part of getting the complete workflow running.

## 1. Job sources were returning irrelevant listings

**What happened**

Initially, I experimented with job sources such as Arbeitnow and Remotive.

Although the APIs were returning job records, a large portion of the results were international listings and didn't match the India-focused requirement.

The location and role filters consequently removed most of the records.

**What I changed**

I moved to an India-focused Apify job inventory feed that collects listings from multiple job platforms.

This gave me a more suitable starting point for the project.

**Takeaway**

Getting data from an API doesn't necessarily mean the data is useful. Source selection matters just as much as the processing logic.

---

## 2. HTTP Request node configuration issue

**What happened**

I initially tried to start the Apify scraper using an HTTP Request node.

The workflow couldn't execute because the required URL parameter wasn't configured correctly.

**What I changed**

Instead of continuing with a manually configured request, I switched to the native Apify n8n integration.

I used the `Run an Actor and Get Dataset` operation.

This made the integration simpler and allowed me to retrieve the Actor's dataset directly.

---

## 3. Inconsistent job data structures

**What happened**

Job records from different platforms did not always have the same structure.

Some records had salary details, some did not. Certain fields were also represented differently.

This made it difficult to use the returned data directly in later nodes.

**What I changed**

I added a JavaScript Code node called `Normalize & Filter Jobs`.

It converts the source records into a consistent structure containing fields such as:

- jobId
- title
- company
- location
- remote
- source
- postedAt
- skills
- salary information
- listingUrl

Missing optional values are handled without assuming that every source provides the same information.

---

## 4. Job filtering was too restrictive

**What happened**

The initial filtering logic removed too many jobs.

Some sources returned locations in different formats, and the job-title matching logic was also limited.

**What I changed**

I refined the filtering logic to support multiple technical roles, including:

- AI Engineer
- Generative AI Engineer
- Agentic AI Engineer
- Machine Learning Engineer
- Python Developer
- Backend Developer
- Software Engineer
- Associate Software Engineer
- NLP Engineer

I also maintained India-only location checks, recent-posting checks and exclusions for senior-level titles.

**Takeaway**

Filtering needs to be strict enough to remove irrelevant records but flexible enough not to discard useful opportunities.

---

## 5. Google Sheets deduplication was not executing correctly

**What happened**

The `Remove Duplicate Jobs` Code node was not receiving the existing records from Google Sheets.

The problem was in the workflow execution path. The Google Sheets branch was not properly connected to the Merge operation.

**What I changed**

I created two branches:

1. Newly filtered jobs.
2. Existing jobs retrieved from Google Sheets.

Both branches were connected to a Merge node configured in Append mode.

The following Code node compares the incoming job IDs against the existing job IDs and keeps only new records.

**Takeaway**

In n8n, having the correct nodes is not enough. The execution connections between nodes are equally important.

---

## 6. JavaScript regular expression error

**What happened**

While expanding the supported job titles, I initially used an invalid regular expression flag.

JavaScript does not support the extended `x` regular expression flag used in that version of the code.

The node returned:

`Invalid regular expression: missing /`

**What I changed**

I replaced the expression with a standard JavaScript regular expression using the supported `i` flag for case-insensitive matching.

The filtering node executed successfully after the correction.

---

## 7. Resume ingestion and vector storage

**What happened**

I needed a way to make the candidate's resume searchable by the AI Agent.

Passing the complete resume into every job evaluation would not be a suitable approach for the intended workflow.

**What I implemented**

I created a separate resume ingestion workflow:

- PDF document loading
- Text splitting
- Gemini embeddings
- Qdrant vector storage

I created a Qdrant collection named `resume_knowledge`.

During verification, the collection showed:

- GREEN status
- Approximately 5 points
- 3072 vector dimensions
- Cosine distance

I also tested retrieval using a question about the skills mentioned in the resume.

---

## 8. Telegram notifications needed better formatting

**What happened**

The initial Telegram notifications were functional, but the output was difficult to scan quickly.

The job information and AI evaluation were displayed as plain-looking text.

**What I changed**

I updated the Telegram message template using HTML formatting.

The improved notification includes:

- Job title and company
- Location and work arrangement
- Match score with a visual indicator
- Recommendation
- Matching skills
- Skills to improve
- AI-generated reasoning
- Original job application link

This made the notifications easier to read on mobile.

---

## 9. Deployment and infrastructure considerations

The n8n instance was deployed using Docker on AWS EC2.

Since the EC2 instance has limited memory, I decided not to host Qdrant or additional databases locally.

Instead, Qdrant Cloud handles vector storage separately.

This kept the local deployment relatively lightweight.

For Telegram webhook-based integrations, a publicly accessible endpoint is required. I experimented with ngrok to expose the local n8n instance during setup.

---

## Final note

Most of the issues were not related to the AI model itself.

A significant part of the work involved getting data from different services into a consistent format, managing workflow execution correctly, handling missing fields and making sure the output reached the next stage.

That was probably the most useful part of this exploration.
