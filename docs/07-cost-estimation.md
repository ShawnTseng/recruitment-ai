# 07 — Azure 成本估算與控管

## Azure 服務月費（固定費用）

| 服務 | SKU | 月費估算 |
|---|---|---|
| Azure Static Web Apps | Standard | ~$9 |
| Azure App Service | B1（MVP） | ~$13 |
| Azure App Service | B2（正式） | ~$75 |
| Azure SQL Database | Basic 5 DTU | ~$5 |
| Azure Blob Storage | 50 GB LRS | ~$1 |
| Azure Key Vault | Standard | ~$1 |
| Application Insights | Free tier | $0 |
| Azure Entra ID | Free tier | $0 |
| **小計（MVP B1）** | | **~$29 / 月** |
| **小計（正式 B2）** | | **~$91 / 月** |

---

## Azure OpenAI 費用（依用量計費）

GPT-4o 參考定價（以 Azure 實際定價頁面為準，定價可能隨時調整）：

- Input tokens：**$2.50 / 1M tokens**
- Output tokens：**$10.00 / 1M tokens**

### 每位候選人 AI 費用估算

| 步驟 | Input tokens | Output tokens | 估算費用 |
|---|---|---|---|
| JD 解析 | ~2,000 | ~500 | ~$0.010 |
| QA 生成（10 題） | ~3,000 | ~1,500 | ~$0.023 |
| 回答評估（3 題） | ~3,600 | ~1,500 | ~$0.024 |
| Stage 1 報告生成 | ~5,000 | ~1,500 | ~$0.028 |
| **Stage 1 合計** | | | **~$0.085 / 人** |
| Stage 2 引導報告（額外） | ~6,000 | ~1,500 | ~$0.030 |
| **Stage 1 + Stage 2** | | | **~$0.115 / 人** |

> 以上為保守估算；實際用量依問卷題數、回答長度與 Prompt 複雜度而異。

---

## 月費場景試算

| 場景 | 月候選人數 | AI 費用估算 | 固定基礎架構 | **月費合計** |
|---|---|---|---|---|
| **小規模（MVP）** | 50 | ~$4 | ~$29 | **~$33** |
| **小規模（正式）** | 50 | ~$4 | ~$91 | **~$95** |
| **中規模** | 200 | ~$17 | ~$91 | **~$108** |
| **大規模** | 500 | ~$43 | ~$91 | **~$134** |
| **大規模+** | 2,000 | ~$170 | ~$150+ | **~$320** |

> **結論**：基礎架構佔主要固定成本。AI 費用在小規模時極低（<$20/月），隨規模線性增長但佔比仍可控。

---

## 成本控管策略

| 策略 | 說明 | 節省潛力 |
|---|---|---|
| **JD 解析結果快取** | 同一份 JD 僅解析一次，結果存入 DB，重複使用不重新呼叫 AI | 中 |
| **Token 上限設定** | 每個 Prompt 設定最大輸入 / 輸出 token 數，防止意外超用 | 中 |
| **Prompt 最佳化** | 定期審查各 Plugin Prompt，去除冗餘指令以降低 token 消耗 | 中 |
| **Azure Cost Budget Alert** | 設定每月消費預算上限（如 $150），80% / 100% 時通知 Manager | 高（風控） |
| **Application Insights 監控** | 追蹤每個 Plugin 的 token 使用量，識別異常高消費請求 | 中 |
| **分層記憶體快取** | 常用問卷範本快取於記憶體，減少資料庫查詢 | 低 |
| **Azure Reserved Instances** | 若 App Service 使用穩定，購買 1 年保留實例省 ~40% | 高（長期） |

---

## 監控設定建議

### Azure Cost Management

```
Azure Portal → Cost Management + Billing → Budgets
→ 設定月度預算（建議初期 $150）
→ 80% 警示：Email 通知 Manager
→ 100% 警示：Email + 可選自動暫停非核心資源
```

### Application Insights 自訂指標

在 Backend 記錄以下 custom metrics，供 Manager Dashboard 使用：

```csharp
// 範例：記錄每次 Plugin 呼叫的 token 用量
telemetryClient.TrackMetric("tokens.input.JdParserPlugin", inputTokens);
telemetryClient.TrackMetric("tokens.output.QaGeneratorPlugin", outputTokens);
telemetryClient.TrackMetric("cost.per.candidate", estimatedCost);
```
