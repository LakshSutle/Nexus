# NEXUS — The Autonomous Execution Operating System
### Vibe2Ship Hackathon Submission Document
*Theme: The Last-Minute Life Saver*

---

## 1. Executive Summary

### The Problem
Traditional project management tools (Jira, Trello, Notion) are static and reactive. They rely entirely on human input to update progress, and when a user falls behind, the tool remains unchanged while tasks pile up, leading to cognitive overload and failure. Existing AI assistants (chatbots) can help you plan, but they do not monitor execution. There is a missing link between **AI planning** and **actual progress tracking**.

### The Solution: NEXUS
NEXUS is an **Autonomous Execution Operating System** that actively bridges this gap. It does not just build plans; it monitors execution, predicts deadline failure risks using pace metrics, and autonomously restructures study/work schedules with **One-Tap Rescue Plans**. Built for students and professionals cramming for exams or MVPs, it operates as the ultimate last-minute lifesaver.

---

## 2. Key Capabilities & User Experience

*   **Voice Goal Intake**: Instead of filling out lengthy forms, users speak their goals (e.g., "I need to prepare for my Data Structures final exam in two weeks, and I can commit 3 hours a day"). NEXUS processes the transcript using **Gemini 2.0 Flash** to automatically calculate the target deadline date, daily hour commitment, and extract relevant syllabus contexts.
*   **"Will I Make It?" Burn Rate Forecast Engine**: Plotted directly on the dashboard, this comparative chart displays target progress vs. actual progress. It extrapolates current velocity forward to project a real completion date, alerting the user visually if they are on track (green), close to the margin (amber), or projected to miss their deadline (red).
*   **Interactive Agent Neural Network HUD**: Placed at the top of the dashboard, this interactive SVG visualization represents the real-time activity and telemetry of the 9-agent backend pipeline. It features pulsing data streams and an inspector console detailing what each agent is thinking as the user completes tasks.
*   **Live SSE Thought Stream Terminal**: Streams raw agent reasoning logs letter-by-letter to the UI. This provides full transparency into the AI's calculations (such as risk levels and rescheduling variables).
*   **One-Tap Rescue Plans**: When the Failure Prediction Agent calculates that the user's velocity has dropped below a critical threshold (e.g. failure probability > 65%), the system surfaces a prominent alert proposing an optimized recovery schedule. The user can accept with a single click, instantly reorganizing their calendar and updating their execution health.
*   **Google Calendar Sync with Safety Kill-Switch**: Synchronizes tasks to your personal calendar. A settings toggle allows users to disable calendar integration to prevent expired OAuth credentials from interrupting their workflows.
*   **Twilio WhatsApp Outreach**: Integrated with Twilio to send critical risk alerts and request plan confirmations via WhatsApp, ensuring the user is notified even when offline.

---

## 3. Tech Stack & Multi-Agent Architecture

NEXUS uses a **9-Agent Orchestrated Pipeline** powered by **Gemini 2.0 Flash** (for fast, real-time reasoning) and **Gemini 1.5 Pro** (for heavy PRD and syllabus document parsing):

1.  **Master Orchestrator**: Coordinates event routing, logs execution flows, and triggers appropriate agent cycles.
2.  **Goal Ingestion Agent**: Processes goal inputs and parses syllabus/PRD documents to capture scope and constraints.
3.  **Task Decomposition Agent**: Breaks down raw goals and syllabi into atomic, actionable tasks organized by milestones.
4.  **Scheduling Agent**: Builds day-by-day task lists considering deadlines, available hours, and cognitive-load distribution.
5.  **Progress Tracking Agent**: Captures velocity on task completions, updating overall execution metrics.
6.  **Failure Prediction Engine**: Analyzes completion trends to compute failure probability percentages.
7.  **Replanning Agent**: Generates optimized recovery schedules (re-allocating pending tasks) when risk levels trigger alerts.
8.  **Intervention Agent**: Decides *when* and *how* to alert the user (with suppression rules to prevent notification fatigue).
9.  **Insight Agent**: Synthesizes daily performance trends into high-value cognitive feedback.

### Technology Blueprint:
- **Frontend**: Next.js 16 (App Router), React 19, Recharts, Framer Motion, TailwindCSS.
- **Backend**: FastAPI (Python 3.11), Uvicorn, Server-Sent Events (SSE).
- **Database & Authentication**: Supabase (PostgreSQL).
- **Integrations**: Google Calendar API (OAuth-based), Twilio WhatsApp API.
- **Deployment**: Containerized via Docker and Docker Compose; deployed using Google Cloud Build and Google Cloud Run.

---

## 4. Google Technologies Integrated
*   **Gemini 2.0 Flash**: Powers real-time voice goal parsing, rapid progress tracking updates, and live SSE stream logging.
*   **Gemini 1.5 Pro**: Handles complex multi-page document parsing (PDF syllabi, PRDs) during onboarding.
*   **Google Calendar API**: Synchronizes dynamically generated roadmaps into the user's primary Google Calendar.
*   **Google Cloud Build**: Manages CI/CD pipelines to build production Docker containers.
*   **Google Cloud Run**: Hosts the containerized Next.js and FastAPI services.
