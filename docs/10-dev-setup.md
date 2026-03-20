# 10 — 開發環境設定

## 前置條件

| 工具 | 版本 | 用途 |
|---|---|---|
| VS Code | Latest | 主要 IDE |
| GitHub Copilot 訂閱 | Active | AI 輔助開發 |
| .NET SDK | 8.0+ | 後端 ASP.NET Core 開發 |
| Node.js | 20 LTS | 前端 Angular 開發 |
| Azure CLI | Latest | Azure 資源管理與部署 |
| Git | Latest | 版本控管 |

---

## VS Code 套件安裝

### 自動安裝（推薦）

開啟本專案後，VS Code 會提示安裝 `.vscode/extensions.json` 中推薦的套件，點擊 **Install All** 即可。

### 重要套件說明

| 套件名稱 | Extension ID | 用途 |
|---|---|---|
| **Markdown Preview Mermaid Support** | `bierner.markdown-mermaid` | **在 VS Code 內預覽 Mermaid 圖表** |
| GitHub Copilot | `GitHub.copilot` | AI 程式碼補全 |
| GitHub Copilot Chat | `GitHub.copilot-chat` | AI 對話式開發助理 |
| C# Dev Kit | `ms-dotnettools.csdevkit` | C# / .NET 開發（含 IntelliSense、debug） |
| Angular Language Service | `Angular.ng-template` | Angular 模版支援 |
| Azure Resources | `ms-azuretools.vscode-azureresourcegroups` | Azure 資源管理 |
| Azure App Service | `ms-azuretools.vscode-azureappservice` | App Service 部署 |
| REST Client | `humao.rest-client` | API 測試（`.http` 檔案） |
| GitLens | `eamodio.gitlens` | Git 歷史、blame、PR 整合 |

---

## 在 VS Code 中預覽 Mermaid 圖

安裝 `bierner.markdown-mermaid` 後：

1. 開啟任何含 Mermaid 的 `.md` 檔案
2. 按 **Ctrl+Shift+V**（或 **Ctrl+K, V** 開啟側邊預覽）
3. Markdown 預覽視窗中的 ` ```mermaid ` 區塊會自動渲染為圖表

**支援的圖表類型**：`flowchart`、`sequenceDiagram`、`classDiagram`、`gantt`、`xychart-beta`、`erDiagram` 等

> **注意**：`funnel` 等較新的圖表類型在 VS Code 原生預覽中可能不支援，請優先使用 `flowchart` 或 `graph`。

---

## GitHub Copilot 充分利用指南

### 1. 專案層級指引（.github/copilot-instructions.md）

本專案已建立 `.github/copilot-instructions.md`，提供 Copilot 了解：

- 專案業務背景與術語
- 技術棧與架構慣例
- Semantic Kernel Plugin 命名與設計原則
- 安全性要求

Copilot Chat 使用 `@workspace` 時，此檔案內容會自動納入背景知識。

### 2. 常用 Copilot Chat 語法

| 語法 | 說明 |
|---|---|
| `@workspace` | 讓 Copilot 理解整個 codebase 上下文 |
| `#file:docs/03-stage1-screening.md` | 引用規格文件作為上下文 |
| `#selection` | 針對當前選取的程式碼操作 |
| `/explain` | 解釋選取的程式碼邏輯 |
| `/fix` | 修正 bug 或問題 |
| `/tests` | 為選取的方法生成 xUnit 測試 |
| `/doc` | 為函式生成 XML 文件註解 |

### 3. 推薦開發工作流程

```
1. 設計階段
   → 開啟對應規格文件（如 03-stage1-screening.md）
   → 使用 Copilot Chat: "@workspace 依照 #file:docs/03-stage1-screening.md
      的規格，幫我設計 AnswerEvaluatorPlugin 的介面"

2. 實作階段
   → Copilot Edits（Ctrl+Shift+I）進行跨多個檔案的同步修改
   → 讓 Copilot 同時修改 Plugin 類別、介面、DI 註冊、測試檔案

3. 測試階段
   → 選取 Plugin 類別 → /tests 生成 xUnit 測試
   → 包含 SK Kernel mock 與 happy path / edge case

4. Commit
   → VS Code Source Control 面板 → 點擊 Copilot 按鈕自動生成 Commit message
   → 格式：Conventional Commits（feat: / fix: / docs: / test:）
```

### 4. 善用 GitHub 生態整合

| 功能 | 說明 |
|---|---|
| **GitHub Issues** | 用 Copilot Chat `@github` 建立、查詢和連結 Issue |
| **Pull Request** | Copilot 自動生成 PR description，並提供 code review 建議 |
| **GitHub Projects** | 搭配 GitHub Projects 做 Sprint 管理，Copilot 可查詢進度 |
| **GitHub Actions** | CI/CD 流程：Build → Test → Deploy to Azure（見下方） |

---

## Azure 部署流程

### 初次建立 Azure 資源

```bash
# 1. 登入 Azure
az login

# 2. 建立 Resource Group（建議放在 East Asia）
az group create --name rg-recruitment-ai --location eastasia

# 3. 建立 Azure OpenAI（需在 eastus 或其他支援區域）
az cognitiveservices account create \
  --name oai-recruitment-ai \
  --resource-group rg-recruitment-ai \
  --kind OpenAI --sku S0 --location eastus

# 4. 部署 GPT-4o 模型
az cognitiveservices account deployment create \
  --name oai-recruitment-ai \
  --resource-group rg-recruitment-ai \
  --deployment-name gpt-4o \
  --model-name gpt-4o \
  --model-version "2024-11-20" \
  --model-format OpenAI \
  --capacity 10

# 5. 建立 Azure Key Vault
az keyvault create \
  --name kv-recruitment-ai \
  --resource-group rg-recruitment-ai \
  --location eastasia

# 6. 儲存 OpenAI API Key 至 Key Vault
az keyvault secret set \
  --vault-name kv-recruitment-ai \
  --name "AzureOpenAI--ApiKey" \
  --value "<your-key>"
```

### CI/CD with GitHub Actions

`.github/workflows/deploy.yml` 負責（待實作）：

1. `dotnet test` — 執行所有 xUnit 測試
2. `dotnet publish` → Deploy to Azure App Service
3. `ng build` → Deploy Angular SPA to Azure Static Web Apps
4. EF Core migration on release branch merge

---

## 開發慣例

| 項目 | 規範 |
|---|---|
| Branch 命名 | `feature/stage1-qa-generator`、`fix/report-pdf-export` |
| Commit 訊息 | Conventional Commits：`feat:`、`fix:`、`docs:`、`test:` |
| PR 規範 | 每個 PR 連結對應 GitHub Issue，附 Copilot 生成的 description |
| 測試要求 | 每個 SK Plugin 需有對應的 xUnit integration test |
| Secrets | 所有金鑰只能存在 Key Vault 或 GitHub Actions Secrets，不得 hardcode |
