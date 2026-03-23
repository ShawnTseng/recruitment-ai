# 10 — Development Environment Setup

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| VS Code | Latest | Primary IDE |
| GitHub Copilot subscription | Active | AI-assisted development |
| .NET SDK | 8.0+ | Backend ASP.NET Core development |
| Node.js | 20 LTS | Frontend React + Vite development |
| Azure CLI | Latest | Azure resource management and deployment |
| Git | Latest | Version control |

---

## VS Code Extension Installation

### Auto-install (Recommended)

After opening this project, VS Code will prompt you to install recommended extensions from `.vscode/extensions.json`. Click **Install All**.

### Key Extensions

| Extension Name | Extension ID | Purpose |
|---|---|---|
| **Markdown Preview Mermaid Support** | `bierner.markdown-mermaid` | **Preview Mermaid diagrams within VS Code** |
| GitHub Copilot | `GitHub.copilot` | AI code completion |
| GitHub Copilot Chat | `GitHub.copilot-chat` | AI conversational development assistant |
| C# Dev Kit | `ms-dotnettools.csdevkit` | C# / .NET development (IntelliSense, debug) |
| ESLint | `dbaeumer.vscode-eslint` | TypeScript / React code quality |
| Prettier | `esbenp.prettier-vscode` | Code formatting (TypeScript / CSS) |
| Azure Resources | `ms-azuretools.vscode-azureresourcegroups` | Azure resource management |
| Azure App Service | `ms-azuretools.vscode-azureappservice` | App Service deployment |
| REST Client | `humao.rest-client` | API testing (`.http` files) |
| GitLens | `eamodio.gitlens` | Git history, blame, PR integration |

---

## Previewing Mermaid Diagrams in VS Code

After installing `bierner.markdown-mermaid`:

1. Open any `.md` file containing Mermaid
2. Press **Ctrl+Shift+V** (or **Ctrl+K, V** for side-by-side preview)
3. ` ```mermaid ` blocks in the Markdown preview will automatically render as diagrams

**Supported diagram types**: `flowchart`, `sequenceDiagram`, `classDiagram`, `gantt`, `xychart-beta`, `erDiagram`, etc.

> **Note**: Newer diagram types like `funnel` may not be supported in VS Code native preview. Prefer `flowchart` or `graph`.

---

## Getting the Most Out of GitHub Copilot

### 1. Project-Level Instructions (.github/copilot-instructions.md)

This project has `.github/copilot-instructions.md` which gives Copilot context about:

- Business background and terminology
- Tech stack and architecture conventions
- Semantic Kernel Plugin naming and design principles
- Security requirements

When using Copilot Chat with `@workspace`, this file is automatically included as background knowledge.

### 2. Common Copilot Chat Syntax

| Syntax | Description |
|---|---|
| `@workspace` | Give Copilot context of the entire codebase |
| `#file:docs/03-stage1-screening.md` | Reference spec document as context |
| `#selection` | Operate on currently selected code |
| `/explain` | Explain the logic of selected code |
| `/fix` | Fix a bug or issue |
| `/tests` | Generate xUnit tests for selected method |
| `/doc` | Generate XML documentation comment for function |

### 3. Recommended Development Workflow

```
1. Design Phase
   → Open relevant spec document (e.g. 03-stage1-screening.md)
   → Use Copilot Chat: "@workspace based on #file:docs/03-stage1-screening.md
      spec, help me design the AnswerEvaluatorPlugin interface"

2. Implementation Phase
   → Copilot Edits (Ctrl+Shift+I) for synchronous changes across multiple files
   → Let Copilot modify Plugin class, interface, DI registration, and test files simultaneously

3. Testing Phase
   → Select Plugin class → /tests to generate xUnit tests
   → Include SK Kernel mock and happy path / edge case

4. Commit
   → VS Code Source Control panel → click Copilot button to auto-generate commit message
   → Format: Conventional Commits (feat: / fix: / docs: / test:)
```

### 4. Leveraging GitHub Ecosystem Integration

| Feature | Description |
|---|---|
| **GitHub Issues** | Use Copilot Chat `@github` to create, query, and link Issues |
| **Pull Request** | Copilot auto-generates PR description and provides code review suggestions |
| **GitHub Projects** | Pair with GitHub Projects for Sprint management; Copilot can query progress |
| **GitHub Actions** | CI/CD pipeline: Build → Test → Deploy to Azure (see below) |

---

## Azure Deployment Process

### Initial Azure Resource Creation (Using Bicep IaC)

Azure resources in this project are managed via Bicep in the `infra/` directory.

```bash
# 1. Login to Azure
az login

# 2. Create Resource Group (recommend East Asia)
az group create --name rg-recruitment-ai --location eastasia

# 3. Deploy all Azure resources (Bicep)
az deployment group create \
  --resource-group rg-recruitment-ai \
  --template-file infra/main.bicep \
  --parameters prefix=recai environment=dev \
               sqlAdminLogin=recaiadmin \
               sqlAdminPassword="<your-secure-password>"

# 4. Verify resources were created successfully
az resource list --resource-group rg-recruitment-ai --output table
```

> **Note**: Azure OpenAI is deployed to `japaneast` (supports GPT-4o); other resources deploy to `eastasia`.

### Manual Step: Key Vault Secrets

After Bicep deployment, the following secrets must be set manually (Bicep does not handle external service API keys):

```bash
# Get Key Vault name
KV_NAME=$(az keyvault list --resource-group rg-recruitment-ai --query "[0].name" -o tsv)

# Store Azure OpenAI API Key
az keyvault secret set \
  --vault-name $KV_NAME \
  --name "AzureOpenAI--ApiKey" \
  --value "<your-openai-api-key>"

# Get OpenAI Endpoint (for App Service settings)
az cognitiveservices account show \
  --name recai-oai \
  --resource-group rg-recruitment-ai \
  --query "properties.endpoint" -o tsv
```

### CI/CD with GitHub Actions

`.github/workflows/deploy.yml` handles (pending implementation):

1. `dotnet test` — run all xUnit tests
2. `dotnet publish` → Deploy to Azure App Service
3. `vite build` → Deploy React SPA to Azure Static Web Apps
4. EF Core migration on release branch merge

---

## Development Conventions

| Item | Convention |
|---|---|
| Branch naming | `feature/stage1-qa-generator`, `fix/report-pdf-export` |
| Commit messages | Conventional Commits: `feat:`, `fix:`, `docs:`, `test:` |
| PR rules | Each PR links to a corresponding GitHub Issue with a Copilot-generated description |
| Test requirements | Each SK Plugin must have a corresponding xUnit integration test |
| Secrets | All keys must only be in Key Vault or GitHub Actions Secrets; never hardcoded |
