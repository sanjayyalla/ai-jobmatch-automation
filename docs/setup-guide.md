# Setup Guide

This guide covers the steps I followed to set up AI JobMatch. A few configuration details may vary depending on the versions of n8n and the Apify actor being used.

## 1. Prerequisites

Before starting, create or configure accounts for the following services:

| Service | Purpose |
|---|---|
| [n8n](https://n8n.io/) | Workflow automation |
| [Apify](https://apify.com/) | Collecting job listings |
| [Google AI Studio](https://aistudio.google.com/) | Gemini API access |
| [Qdrant Cloud](https://cloud.qdrant.io/) | Resume vector storage |
| [Google Sheets](https://sheets.google.com/) | Storing job results |
| [Telegram](https://telegram.org/) | Job notifications |

You will also need Docker if you plan to self-host n8n.

## 2. Set Up n8n

You can use n8n Cloud or self-host it using Docker.

For my setup, I used n8n Community Edition running in Docker on an AWS EC2 instance.

1. Install Docker and Docker Compose on your server.
2. Start n8n using your Docker Compose configuration.
3. Open the n8n editor.
4. Create an account and complete the initial setup.

Refer to the official [n8n Docker installation guide](https://docs.n8n.io/hosting/installation/docker/).

If you are using the workflow exports in this repository, import them into your n8n instance after setting up the required credentials.

## 3. Configure API Credentials

Create the required credentials inside n8n.

### Gemini API

1. Generate an API key from Google AI Studio.
2. Open Credentials in n8n.
3. Add the appropriate Google Gemini credential.
4. Use it for both the Gemini Chat Model and Gemini Embeddings nodes.

### Apify

1. Create an Apify account.
2. Generate an API token.
3. Configure the Apify credential in n8n.
4. Select the India Jobs Feed actor used by this project.

Check the actor's current input schema before configuring its input. Actor fields and supported job sources can change.

### Qdrant

1. Create a Qdrant Cloud cluster.
2. Generate an API key.
3. Copy the cluster URL.
4. Add the Qdrant credential in n8n.

The collection used by the project is:

`resume_knowledge`

The collection must use a vector size compatible with the selected embedding model. My collection was configured with 3072 dimensions and Cosine distance. If you select a different embedding model, verify its output dimensions before creating the collection.

### Google Sheets

1. Create a Google Cloud project if required.
2. Enable the Google Sheets API.
3. Configure Google Sheets OAuth credentials in n8n.
4. Authorize access to the spreadsheet you want to use.

### Telegram

1. Create a bot using BotFather.
2. Generate the bot token.
3. Add the Telegram credential in n8n.
4. Obtain the chat ID where notifications should be delivered.
5. Start a conversation with the bot before testing direct messages.

Keep all tokens and credentials inside n8n's credential manager. Do not put them directly into workflow code.

## 4. Prepare Google Sheets

Create a spreadsheet named:

`AI JobMatch Database`

Create two tabs:

- `Job_Applications`
- `Candidate_Profile`

The `Job_Applications` tab should contain the columns expected by the workflow, including:

`jobId`, `title`, `company`, `location`, `remote`, `source`, `postedAt`, `skills`, `salaryRaw`, `salaryCurrency`, `listingUrl`, `matchScore`, `recommendation`, `roleCategory`, `experienceSuitability`, `matchingSkills`, `missingSkills`, `relevantProjects`, `strengths`, `concerns`, `reasoning`, `informationCompleteness`.

Make sure the column names match the fields configured in your Google Sheets nodes.

## 5. Configure the Apify Actor

Open the India Jobs Feed actor in Apify and review its current input fields.

Configure the actor to collect relevant job listings from the supported sources.

A few things to keep in mind:

- Avoid restricting the search to only one job title if you want multiple role categories.
- Use the actor's supported source options rather than assuming every job platform is available.
- Keep the result limit reasonable while testing.
- Review the actor's output before connecting it to the filtering workflow.

The n8n filtering code is responsible for narrowing the collected listings to the target roles, experience level, location and posting date.

## 6. Configure Qdrant Resume Storage

The Resume RAG Ingestion workflow stores information extracted from the uploaded resume.

The basic configuration is:

- Collection: `resume_knowledge`
- Embedding model: the same Gemini embedding model used during ingestion and retrieval
- Distance metric: Cosine
- Chunk size: 1000
- Chunk overlap: 200

The embedding model and vector dimensions must be consistent between document insertion and retrieval.

After uploading a resume, verify that points have been added to the collection. Then test retrieval with a simple question about the candidate's skills or projects.

Do not upload or publish someone else's resume without permission.

## 7. Import and Configure the Workflows

There are two workflow exports in the `workflows/` directory:

1. `daily-job-discovery.json`
2. `resume-rag-ingestion.json`

In n8n:

1. Open the workflows menu.
2. Import the JSON workflow.
3. Open the imported workflow.
4. Reconnect the credentials to your own accounts.
5. Replace any spreadsheet, collection, actor or chat references with your own values.
6. Check the connections between nodes.
7. Save the workflow.

Workflow exports may contain instance-specific IDs or credential references. Review them before running.

## 8. Test the Resume RAG Workflow

I recommend testing resume ingestion before running job matching.

1. Open the Resume RAG Ingestion workflow.
2. Execute the form trigger.
3. Upload a sample PDF resume.
4. Check whether the document is processed by the loader and text splitter.
5. Verify that documents are inserted into Qdrant.
6. Test retrieval using a question such as:

   `What technical skills are mentioned in this resume?`

If relevant resume information is returned, the ingestion and retrieval flow is working.

## 9. Test the Daily Job Discovery Workflow

Once the resume data is available:

1. Execute the Daily Job Discovery workflow manually.
2. Check the Apify output.
3. Verify that the normalization and filtering nodes return relevant jobs.
4. Check the deduplication output.
5. Inspect the Gemini Agent's structured response.
6. Verify that evaluated jobs are appended to Google Sheets.
7. Check whether eligible recommendations trigger Telegram notifications.

Start with a small number of jobs. It makes debugging much easier.

## 10. Configure the Schedule

The intended schedule is daily at **9:00 AM IST**.

In the Schedule Trigger node, configure the workflow timezone as:

`Asia/Kolkata`

Set the trigger to run every day at 9:00 AM.

Save and activate the workflow. Confirm that it is active in your n8n instance before relying on automatic execution.

## 11. Security Notes

Before publishing or sharing the project:

- Never commit Gemini or Apify API keys.
- Never commit Qdrant credentials or Telegram bot tokens.
- Do not publish personal resumes or extracted resume content.
- Avoid exposing private Google Sheets IDs and chat IDs.
- Remove sensitive credential references from exported workflow JSON.
- Use placeholder values in `.env.example`.
- Keep your n8n instance protected with proper authentication.

## 12. Known Limitations

- Job availability depends on the actor's supported sources and collection coverage.
- Some job listings may not contain a full description or salary information.
- The matching score is an AI-generated assessment, not a guarantee of selection.
- Resume matching quality depends on the information available in the resume and job listing.
- External APIs and scraping services may have usage limits or costs.

Always review a job listing on its original source before applying.

---

That's it. Once the credentials, spreadsheet, Qdrant collection and workflows are configured, you should be able to test the complete job discovery and resume-matching flow.