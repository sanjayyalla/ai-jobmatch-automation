
# AI JobMatch – Automated Job Discovery & Resume Matching

An India-focused job discovery and resume-matching automation built using n8n, Apify, Google Gemini, Qdrant, Google Sheets and Telegram.

This project explores how workflow automation, Retrieval-Augmented Generation (RAG), vector search and AI agents can be combined to automate job discovery and evaluate opportunities against a candidate's resume.

## Overview

AI JobMatch automates the process of:

- Discovering job listings from multiple job platforms.
- Filtering opportunities based on role, location and experience suitability.
- Removing jobs that have already been processed.
- Retrieving relevant information from a candidate's resume.
- Evaluating job suitability using a Gemini-powered AI Agent.
- Storing evaluated opportunities in Google Sheets.
- Sending job recommendations through Telegram.

## Architecture

```text
             Schedule Trigger
                    |
                    v
             Apify Job Scraper
                    |
                    v
           Normalize Job Records
                    |
                    v
          Role & Location Filtering
                    |
                    v
             Google Sheets
             Existing Jobs
                    |
                    v
             Deduplication
                    |
                    v
           Gemini JobMatch Agent
                    |
             +------+------+
             |             |
             v             v
        Gemini Chat      Qdrant
          Model         Resume RAG
             |             |
             +------+------+
                    |
                    v
             Structured Output
                    |
                    v
            Google Sheets
              Job Storage
                    |
                    v
             Telegram Alerts
```

## Resume RAG Pipeline

The resume is processed separately and stored in Qdrant.

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
Qdrant Vector Database
```

During job evaluation, the AI Agent retrieves relevant resume information through the Qdrant vector search tool.

## Technology Stack

| Technology | Purpose |
|---|---|
| n8n | Workflow automation and orchestration |
| Apify | Job data collection |
| Google Gemini | AI-powered job evaluation |
| Gemini Embeddings | Resume text embeddings |
| Qdrant Cloud | Vector storage and semantic retrieval |
| Google Sheets | Job storage and deduplication |
| Telegram Bot API | Job notifications |
| Docker | n8n deployment |
| AWS EC2 | Hosting environment |

## Main Features

### 1. Automated Job Discovery
Collects job listings from selected job platforms using Apify.

### 2. Job Filtering
Filters listings based on:
- Target technical roles
- Indian locations
- Recent postings
- Experience suitability

### 3. Duplicate Detection
Checks previously stored job IDs in Google Sheets to avoid processing the same listing again.

### 4. Resume-Based Matching
Uses Qdrant retrieval and Gemini to evaluate jobs against information extracted from the candidate's resume.

### 5. Structured AI Evaluation
Produces structured results containing:
- Match score
- Recommendation
- Matching skills
- Missing skills
- Relevant projects
- Strengths and concerns
- Explanation of the match

### 6. Automated Notifications
Saves evaluated jobs in Google Sheets and sends selected recommendations through Telegram.

## Deployment

The n8n Community Edition instance is deployed using Docker on AWS EC2.

Qdrant is hosted separately using Qdrant Cloud to keep vector database workloads off the EC2 instance.

## Project Challenges & Learnings

Some of the challenges encountered during implementation included:

- Handling inconsistent JSON structures from different job sources.
- Improving role and location filtering.
- Connecting multiple execution branches correctly in n8n.
- Implementing deduplication using Google Sheets and Merge.
- Configuring Gemini embeddings and Qdrant retrieval.
- Integrating AI Agent output with downstream workflow nodes.
- Formatting dynamic Telegram notifications.

More details are available in [Troubleshooting](docs/troubleshooting.md).

## Repository Structure

```text
docs/          Architecture, setup and project documentation
workflows/     Sanitized n8n workflow exports
code/          JavaScript used in n8n Code nodes
examples/      Sample input and AI evaluation output
deployment/    Deployment examples and notes
```

## Limitations

- Job availability depends on the selected data sources and their scraping coverage.
- Some listings may have incomplete job descriptions or salary information.
- AI match scores are estimates and should not replace reviewing the original job listing.
- Job-source availability and scraping limits may change.

## Future Improvements

- Add more reliable job sources.
- Improve job-description retrieval.
- Introduce historical match analytics.
- Build a dashboard for tracking evaluated opportunities.
- Add conversational job search through Telegram.

## Disclaimer

This is an independent personal automation project created for technical exploration and experimentation.

Job listings belong to their respective platforms and employers. Always verify job details on the original listing before applying.
