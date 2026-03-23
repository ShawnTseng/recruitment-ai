# 11 — Open Decisions

> Once a decision is confirmed, update the corresponding spec document and mark it in the "Confirmed Decisions Log" below.

---

## Technical

| # | Question | Affected Docs | Priority |
|---|---|---|---|
| T1 | ~~Frontend framework~~ → **Decided: React + Vite (TypeScript)** | 06 | ✅ |
| T2 | ~~Database choice~~ → **Decided: Azure SQL (EF Core)** | 06 | ✅ |
| T3 | Candidate answer interface: how long should token-link no-login tokens be valid? | 03 | Medium |
| T4 | Should resumes be PII-anonymized after upload? (varies by regional regulations) | 06 | Medium |
| T5 | PDF report export: server-side generation or client-side? Recommended library? | 03, 04 | Low |

## Process

| # | Question | Affected Docs | Priority |
|---|---|---|---|
| P1 | Timeline for cross-Recruiter questionnaire template sharing (initially isolated, confirmed) | 02 | Medium |
| P2 | Is there a third stage (client-side interview) requiring system support? | 04 | Medium |
| P3 | Should candidates be able to view their own evaluation results? | 03 | Low |
| P4 | Can rejected candidates reapply for the same position? After how long? | 03 | Low |

## Data & Compliance

| # | Question | Affected Docs | Priority |
|---|---|---|---|
| D1 | **Candidate data retention period and deletion policy** — must comply with personal data law / GDPR | 09 | High |
| D2 | Does the informed consent statement text need legal review before going live? | 03 | High |
| D3 | Do differences between Taiwan Personal Data Protection Act and India PDPB affect data storage location? | 06, 09 | Medium |

## Business

| # | Question | Affected Docs | Priority |
|---|---|---|---|
| B1 | Who sets and maintains the Recruiter hourly rate baseline in the Business Value Dashboard? | 08 | Low |
| B2 | Does Premium Talent Pool cross-client sharing require adjustments to client contract terms? | 09 | Low |

---

## Confirmed Decisions Log

| Question | Decision | Date Confirmed |
|---|---|---|
| Questionnaire language | All English (focused on India market) | 2026-03-20 |
| Answer timeline restrictions | No system-enforced deadline; Recruiter self-coordinates | 2026-03-20 |
| Recruitment management tool integration | Company has no existing tools; this system is the primary platform | 2026-03-20 |
| Business value calculation basis | Time cost as primary metric, not dependent on matching revenue figures | 2026-03-20 |
| Client feedback collection | Collected by Recruiter from clients and manually logged | 2026-03-20 |
| Multi-Recruiter initial mode | Each isolated independently; architecture must support future shared expansion | 2026-03-20 |
| Development tools | GitHub Copilot + VS Code | 2026-03-20 |
| Deployment platform | Azure | 2026-03-20 |
| Frontend framework (T1) | React + Vite (TypeScript) | 2026-03-20 |
| Database (T2) | Azure SQL (EF Core) | 2026-03-20 |
| IaC tool | Bicep (modular) | 2026-03-20 |
| Azure Region | East Asia (OpenAI: East US) | 2026-03-20 |
| Git platform | GitHub + GitHub Actions | 2026-03-20 |
