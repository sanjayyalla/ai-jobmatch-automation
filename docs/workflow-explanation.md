
# Workflow Explanation

This document walks through the n8n workflows used in AI JobMatch and explains what each part does.

I have kept the workflows separate so that job discovery and resume processing don't depend on each other running at the same time.

# 1. Daily Job Discovery

This is the main workflow. It collects job listings, filters them, checks for duplicates and uses an AI Agent to evaluate new opportunities.

## 1. Schedule Trigger

The workflow starts with an n8n Schedule Trigger.

It is configured to run daily at 9:00 AM using the Asia/Kolkata timezone.

This removes the need to manually start the job collection process every day.

## 2. Run an Actor and Get Dataset

I used the native Apify node in n8n instead of making a separate HTTP Request to start the scraper.

The node runs the India Jobs Feed Actor and retrieves its dataset.

The actor collects listings from the selected job platforms. The returned records contain fields such as:

- Job title
- Company name
- Location
- Skills
- Source platform
- Posting date
- Job URL
- Salary information, when available

Using the native Apify integration also made the workflow easier to configure and maintain.

## 3. Normalize & Filter Jobs

Different job platforms don't always return information in the same format.

This Code node handles the initial normalization of the collected records and prepares them for the next stages.

It helps maintain a consistent structure for the fields used later in the workflow.

## 4. Fresher & Location Filter

This Code node applies the initial eligibility checks.

The filters are intended to keep relevant opportunities based on:

- Target technical job titles.
- Indian locations.
- Recent posting dates.
- Active listings.
- Exclusion of senior-level roles.

The purpose is to avoid sending obviously irrelevant jobs to the AI Agent.

These checks are rule-based. They are not intended to replace the more detailed evaluation performed by Gemini.

## 5. Get Existing Jobs

This Google Sheets node reads the jobs that have already been stored.

I use Google Sheets as a lightweight database for this project.

The existing records are needed for duplicate detection.

## 6. Merge

The Merge node uses Append mode to combine the newly filtered job records with the records retrieved from Google Sheets.

This allows the next Code node to compare the two sets of records.

One implementation detail worth noting: both input branches need to execute. Otherwise, the Merge node may not receive the data required for comparison.

## 7. Remove Duplicate Jobs

This Code node compares incoming job records against the existing records.

The goal is to identify jobs that have already been processed and keep only new listings.

This helps avoid repeatedly evaluating and notifying the same opportunity.

The duplicate check depends on the job identifier being available and consistent in the source data.

## 8. Gemini JobMatch Agent

This is the main AI evaluation stage.

The Gemini JobMatch Agent receives the new job information and evaluates its relevance to the candidate's resume.

It has connections to:

- Google Gemini Chat Model
- Qdrant Vector Store
- Structured Output Parser

The Qdrant connection allows the agent to retrieve relevant resume information while evaluating a job.

The agent considers the candidate's skills, experience and projects alongside the available job information.

## 9. Google Gemini Chat Model

This model provides the language-model capability used by the AI Agent.

It is responsible for understanding the job information, considering retrieved resume context and producing the evaluation.

## 10. Qdrant Vector Store

Qdrant is connected to the AI Agent as a retrieval tool.

The collection used in this project is:

`resume_knowledge`

When the agent needs relevant resume information, it can search this collection instead of relying only on the job title or a fixed list of skills.

## 11. Embeddings Google Gemini

The Gemini Embeddings node is connected to Qdrant.

It converts the search query into a vector representation so that Qdrant can retrieve semantically relevant resume chunks.

The same embedding model and compatible vector dimensions must be used during ingestion and retrieval.

## 12. Structured Output Parser

I added a Structured Output Parser to keep the AI Agent's response in a predictable structure.

This is important because the next nodes need to access individual fields rather than process a long unstructured response.

The output includes fields such as:

- Match score
- Recommendation
- Matching skills
- Missing skills
- Explanation of the match

## 13. Prepare JobMatch Results

This Code node prepares the final job record by combining the original job details with the AI evaluation.

It makes the result suitable for storage in Google Sheets and for generating the Telegram notification.

## 14. Append Row in Sheet

The evaluated job is saved in the Google Sheets database.

This keeps a record of processed opportunities, including their evaluation results.

It also provides the existing-job data used by future executions.

## 15. IF Node

The IF node checks the AI Agent's recommendation.

It separates the jobs according to the configured recommendation conditions.

The positive branch is connected to the Telegram notification node.

## 16. Send a Text Message

The Telegram node sends the selected job recommendations to the configured Telegram chat.

I customized the message using HTML formatting to make the notifications easier to read.

The message includes:

- Job title and company
- Location and work arrangement
- Match score
- Matching skills
- Skills to improve
- Explanation of why the role matches
- Original job application link

---

# 2. Resume RAG Ingestion Workflow

This workflow prepares the resume for semantic retrieval.

It is separate from the daily discovery workflow because the resume does not need to be processed again every time the scraper runs.

## 1. Resume PDF

The resume is provided as a PDF input to the ingestion workflow.

## 2. Document Loader

The Document Loader extracts the document content so that it can be processed by the following nodes.

## 3. Text Splitter

The extracted text is divided into smaller chunks.

This makes retrieval more useful because a search can return the relevant portions of the resume rather than requiring the entire document.

## 4. Google Gemini Embeddings

The Gemini Embeddings model converts each text chunk into a numerical vector.

These vectors capture semantic information from the text and are used for similarity-based retrieval.

## 5. Qdrant Vector Store

The generated vectors and their associated document content are stored in Qdrant Cloud.

The collection created for this project is:

`resume_knowledge`

The collection was verified in Qdrant Cloud and showed a GREEN status, with approximately five points at the time of verification.

The collection uses 3072-dimensional vectors and Cosine distance.

---

# 3. How the two workflows work together

The ingestion workflow prepares the resume and stores its vector representations in Qdrant.

The daily discovery workflow uses that stored information when evaluating new job listings.

The overall flow is:

```text
Resume PDF
    |
    v
RAG Ingestion Workflow
    |
    v
Gemini Embeddings
    |
    v
Qdrant Cloud
    |
    |  Retrieved when needed
    v
Daily Job Discovery Workflow
    |
    v
Gemini JobMatch Agent
    |
    v
Job Evaluation
    |
    +----------+
    |          |
    v          v
Google      Telegram
Sheets      Notification
```

This separation keeps resume processing independent from daily job collection and allows the stored resume information to be reused across multiple job evaluations.
