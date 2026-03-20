# AI-Powered Recruitment Screening System

> 協助企業找到合適工程師的 AI 招募篩選平台

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite (TypeScript) |
| **Backend** | ASP.NET Core Web API (.NET 8), Semantic Kernel |
| **AI** | Azure OpenAI (GPT-4o) |
| **Database** | Azure SQL (Entity Framework Core) |
| **File Storage** | Azure Blob Storage |
| **Auth** | Azure Entra ID (internal), Token links (candidates) |
| **IaC** | Bicep (modular) |
| **CI/CD** | GitHub Actions |
| **Hosting** | Azure App Service (API), Azure Static Web Apps (frontend) |

## Project Structure

```
├── docs/           # Specification documents (read-only reference)
├── infra/          # Bicep IaC modules
├── src/
│   ├── api/        # .NET 8 backend solution
│   └── web/        # React + Vite frontend
└── .github/        # Copilot instructions & CI/CD workflows
```

## Specification Documents

| # | Document | Summary |
|---|---|---|
| 01 | [Business Context](docs/01-business-context.md) | Company background, user roles, terminology |
| 02 | [Core Design](docs/02-core-design.md) | Questionnaire philosophy, anti-AI-cheating |
| 03 | [Stage 1 Screening](docs/03-stage1-screening.md) | Async questionnaire flow, AI Agent, reports |
| 04 | [Stage 2 Interview](docs/04-stage2-interview.md) | Tech interview guide, calibration loop |
| 05 | [Manager Dashboard](docs/05-manager-dashboard.md) | Analytics, feedback, system parameters |
| 06 | [System Architecture](docs/06-system-architecture.md) | Architecture, Azure services, DB schema |
| 07 | [Cost Estimation](docs/07-cost-estimation.md) | Azure costs, per-candidate cost breakdown |
| 08 | [Business Value](docs/08-business-value.md) | Time savings, quality metrics, ROI |
| 09 | [Talent Pool](docs/09-talent-pool.md) | Long-term candidate database design |
| 10 | [Dev Setup](docs/10-dev-setup.md) | VS Code, Copilot workflow, Azure deploy |
| 11 | [Open Decisions](docs/11-open-decisions.md) | Pending design decisions |

### Recommended Reading Paths

- **New team members**: 01 → 02 → 03 → 04 → 05
- **Dev startup**: 10 → 06 → 07
- **Business evaluation**: 01 → 08 → 09

## Quick Start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20 LTS](https://nodejs.org/)
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
- [VS Code](https://code.visualstudio.com/) with GitHub Copilot

### Infrastructure

```bash
az login
az group create --name rg-recruitment-ai --location eastasia
az deployment group create \
  --resource-group rg-recruitment-ai \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

### Backend

```bash
cd src/api
dotnet restore
dotnet build
dotnet run --project RecruitmentAI.Api
```

### Frontend

```bash
cd src/web
npm install
npm run dev
```
