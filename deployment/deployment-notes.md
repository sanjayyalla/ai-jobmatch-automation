# Deployment Notes

## 1. Deployment Overview

I hosted the n8n Community Edition instance on an AWS EC2 server using Docker.

Rather than running every component on the same server, I used managed external services for the database, AI models and job collection.

This kept the infrastructure relatively simple and avoided putting too much load on the EC2 instance.

## 2. Infrastructure

| Component | Where it runs | Purpose |
|---|---|---|
| n8n Community Edition | AWS EC2 | Workflow orchestration |
| Docker | AWS EC2 | Running n8n |
| Apify | Apify Cloud | Collecting job listings |
| Gemini API | Google Cloud | AI evaluation and embeddings |
| Qdrant | Qdrant Cloud | Resume vector storage |
| Google Sheets | Google Cloud | Storing job results |
| Telegram Bot API | Telegram | Sending notifications |

The EC2 instance used for this setup had limited RAM (approximately 1 GB), so I kept Qdrant outside the server.

## 3. n8n Deployment

n8n runs inside a Docker container on the EC2 instance.

The deployment uses a persistent Docker volume to retain n8n data across container restarts.

Important configuration:

- Docker Compose for container management
- Persistent storage for n8n data
- Asia/Kolkata timezone
- Encryption key for protecting stored credentials
- HTTPS through an appropriate public-facing endpoint

Refer to the `docker-compose.example.yml` file for a basic configuration example.

## 4. Why Qdrant Cloud?

I used Qdrant Cloud instead of installing Qdrant on the EC2 instance.

The server had limited memory, and running both n8n and a vector database locally would add unnecessary resource pressure.

Qdrant Cloud handles the vector storage and retrieval, while n8n connects to it through its configured credentials.

The collection used by the project is:

`resume_knowledge`

The collection stores resume chunks and their embeddings for semantic retrieval.

## 5. AI Model Configuration

Gemini is used for two purposes:

1. **Gemini Chat Model:** Evaluates job listings against the candidate's resume.
2. **Gemini Embeddings:** Converts resume content into vectors for semantic search.

The same compatible embedding model must be used when inserting resume documents and retrieving them.

The Gemini API is accessed through n8n credentials rather than running a model locally.

## 6. Job Collection

Apify runs the India Jobs Feed actor to collect job listings.

The collected records are passed to n8n, where they are normalized, filtered and deduplicated before being sent to the AI Agent.

This separates job collection from the matching logic and makes it easier to adjust the filtering rules.

## 7. Data Storage and Notifications

Google Sheets is used to store the evaluated job listings.

Telegram is used to send notifications for jobs that meet the configured recommendation conditions.

The workflow stores evaluated jobs separately from the notification decision, so a job can remain in the spreadsheet even when it does not trigger a Telegram notification.

## 8. Webhook and Public Access

During setup, ngrok was used to expose the local n8n instance for testing a Telegram Trigger.

However, the current scheduled job-discovery workflow sends messages through Telegram's outbound API. It does not require an inbound Telegram webhook just to send notifications.

For a long-running deployment, use a stable HTTPS endpoint if your workflows need inbound webhooks. Avoid relying on a temporary tunnel URL for production use.

## 9. Operational Considerations

- Monitor EC2 memory usage because the instance has limited RAM.
- Keep n8n and Docker updated carefully.
- Back up the n8n data volume and protect the encryption key.
- Monitor Apify usage and Gemini API consumption.
- Check Qdrant storage and usage limits.
- Test workflows manually after changing credentials or node configurations.
- Verify that the scheduled workflow is active before relying on automatic execution.

## 10. Current Scope

This deployment is designed as a small personal automation project.

It is not intended to be a large-scale job aggregation platform. The focus is on connecting job discovery, resume-based retrieval, AI evaluation, storage and notifications into one working automation flow.

The setup can be extended later with better monitoring, more job sources, improved matching evaluation and more robust deployment practices.