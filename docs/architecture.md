
# Architecture

## A quick look at how everything fits together

I wanted to build something that could collect job listings, compare them with my resume and send me the relevant opportunities without having to manually go through multiple job websites every day.

I used n8n to connect the different services. Rather than building a separate backend application for every operation, the workflows handle the data collection, processing, AI evaluation and notifications.

The project has two main workflows:

1. Daily Job Discovery
2. Resume RAG Ingestion

They work together through Google Sheets and Qdrant.

---

## 1. Daily Job Discovery

This is the main workflow. It runs on a daily schedule and handles the complete job discovery process.

### Workflow

```text
Schedule Trigger (9 AM IST)
          |
          v
Apify - Run Actor and Get Dataset
          |
          v
Normalize & Filter Jobs
          |
          v
Fresher & Location Filter
          |
          +-----------------------------+
          |                             |
          v                             v
Get Existing Jobs                Filtered Job Records
(Google Sheets)                        |
          |                             |
          +-------------+---------------+
                        |
                        v
                  Merge (Append)
                        |
                        v
                Remove Duplicate Jobs
                        |
                        v
                Gemini JobMatch Agent
                        |
                        v
              Prepare JobMatch Results
                        |
                        v
               Google Sheets (Append)
                        |
                        v
                       IF
                        |
                        v
                Telegram Notification
```

### Job collection

I used the India Jobs Feed Actor on Apify to collect listings from multiple job platforms.

The selected sources include platforms such as Cutshort, Internshala, Instahyre, Wellfound and Hirist.

The actor returns structured job records containing information such as:

- Job title
- Company
- Location
- Source platform
- Skills
- Salary information, when available
- Posting date
- Job listing URL

One thing I noticed while working with different sources was that the returned data was not always consistent. Some listings had salary information, while others did not. Certain fields were also represented differently across sources.

That's why I added a normalization step before processing the jobs further.

### Filtering and processing

The workflow uses JavaScript Code nodes for job processing.

The filtering stage checks:

- Whether the listing is active.
- Whether the title matches the targeted technical roles.
- Whether the position is senior-level.
- Whether the location is in India.
- Whether the job was posted within the selected date range.

The aim is to reduce irrelevant listings before sending them to the AI Agent.

### Duplicate detection

I used Google Sheets as the existing job store.

The workflow reads previously stored job records and combines them with the newly collected jobs using an n8n Merge node in Append mode.

A Code node then compares job IDs and keeps only listings that have not already been processed.

This prevents the same job from being evaluated and notified repeatedly, provided the source supplies a consistent job ID.

### AI-powered job evaluation

New job records are passed to a Gemini-powered AI Agent.

The agent has two important connections:

- Google Gemini Chat Model for evaluating the job.
- Qdrant Vector Store as a tool for retrieving relevant resume information.

The agent evaluates the opportunity using the available job details and the information retrieved from the candidate's resume.

The evaluation includes:

- Match score
- Role category
- Experience suitability
- Matching skills
- Missing skills
- Relevant projects
- Strengths and concerns
- Recommendation (Apply, Maybe or Skip)

I also added a Structured Output Parser so that the evaluation follows a consistent JSON structure.

### Storage and notification

After evaluation, another Code node combines the original job information with the AI-generated result.

The final record is appended to Google Sheets.

An IF node checks the recommendation. Jobs marked Apply or Maybe are sent to Telegram.

The notification includes the job details, match score, relevant skills, missing skills, reasoning and original application link.

---

## 2. Resume RAG Ingestion

The second workflow prepares the resume so that the AI Agent can search it when evaluating a job.

Instead of passing the entire resume into every AI request, I used a vector database to retrieve relevant portions when needed.

### Workflow

```text
Resume PDF
    |
    v
Document Loader
    |
    v
Text Splitter
    |
    v
Google Gemini Embeddings
    |
    v
Qdrant Vector Store
    |
    v
resume_knowledge Collection
```

### How it works

**Document loading**

The resume PDF is loaded into the workflow and its text is extracted.

**Text splitting**

The extracted content is divided into smaller chunks. This makes it easier to retrieve relevant information instead of searching through the entire document.

**Embeddings**

I used Google's Gemini embedding model to convert the text chunks into numerical vectors.

**Vector storage**

The generated vectors are stored in a Qdrant Cloud collection named `resume_knowledge`.

The collection uses Cosine similarity for vector comparison.

### Retrieval during job evaluation

When the Gemini JobMatch Agent needs information about the candidate's skills or projects, it can use the Qdrant Vector Store tool.

Qdrant retrieves relevant resume information based on the search query, which the agent then uses during its evaluation.

---

## 3. Infrastructure and Deployment

I kept the infrastructure relatively simple because this was a personal project and I did not want to introduce unnecessary services.

| Component | Where it runs |
|---|---|
| n8n | Docker on AWS EC2 |
| Apify | Apify Cloud |
| Gemini API | Google AI services |
| Qdrant | Qdrant Cloud |
| Google Sheets | Google Workspace |
| Telegram | Telegram Bot API |

I used AWS EC2 to host the n8n instance and Docker to run it.

Qdrant was hosted separately on Qdrant Cloud rather than adding another database container to the EC2 instance.

Google Sheets handles the job records, while Qdrant is used specifically for resume vector search.

---

## 4. Design Decisions

A few choices were intentional:

- **n8n instead of a custom backend:** It made it easier to connect external services and inspect each stage of execution.
- **Google Sheets for storage:** It was sufficient for the size and scope of this project.
- **Qdrant Cloud:** It avoided adding more memory requirements to the EC2 instance.
- **Gemini for both embeddings and evaluation:** It allowed me to use the same provider for the resume retrieval pipeline and job evaluation.
- **Separate ingestion and discovery workflows:** The resume does not need to be reprocessed every time new jobs are collected.

The idea was to keep the system understandable and functional without overcomplicating the infrastructure.
