# 07 — Azure Cost Estimation & Control

## Azure Service Monthly Fees (Fixed Costs)

| Service | SKU | Monthly Estimate |
|---|---|---|
| Azure Static Web Apps | Standard | ~$9 |
| Azure App Service | B1 (MVP) | ~$13 |
| Azure App Service | B2 (Production) | ~$75 |
| Azure SQL Database | Basic 5 DTU | ~$5 |
| Azure Blob Storage | 50 GB LRS | ~$1 |
| Azure Key Vault | Standard | ~$1 |
| Application Insights | Free tier | $0 |
| Azure Entra ID | Free tier | $0 |
| **Subtotal (MVP B1)** | | **~$29 / month** |
| **Subtotal (Production B2)** | | **~$91 / month** |

---

## Azure OpenAI Fees (Usage-Based)

GPT-4o reference pricing (refer to Azure actual pricing page; pricing subject to change):

- Input tokens: **$2.50 / 1M tokens**
- Output tokens: **$10.00 / 1M tokens**

### AI Cost Estimate Per Candidate

| Step | Input tokens | Output tokens | Estimated Cost |
|---|---|---|---|
| JD parsing | ~2,000 | ~500 | ~$0.010 |
| QA generation (10 questions) | ~3,000 | ~1,500 | ~$0.023 |
| Answer evaluation (3 questions) | ~3,600 | ~1,500 | ~$0.024 |
| Stage 1 report generation | ~5,000 | ~1,500 | ~$0.028 |
| **Stage 1 Total** | | | **~$0.085 / person** |
| Stage 2 guidance report (additional) | ~6,000 | ~1,500 | ~$0.030 |
| **Stage 1 + Stage 2** | | | **~$0.115 / person** |

> Above are conservative estimates; actual usage varies by number of questions, answer length, and Prompt complexity.

---

## Monthly Cost Scenarios

| Scenario | Monthly Candidates | AI Cost Estimate | Fixed Infrastructure | **Monthly Total** |
|---|---|---|---|---|
| **Small scale (MVP)** | 50 | ~$4 | ~$29 | **~$33** |
| **Small scale (Production)** | 50 | ~$4 | ~$91 | **~$95** |
| **Medium scale** | 200 | ~$17 | ~$91 | **~$108** |
| **Large scale** | 500 | ~$43 | ~$91 | **~$134** |
| **Large scale+** | 2,000 | ~$170 | ~$150+ | **~$320** |

> **Conclusion**: Infrastructure accounts for the major fixed cost. AI costs are extremely low at small scale (<$20/month) and grow linearly with scale but remain manageable.

---

## Cost Control Strategies

| Strategy | Description | Savings Potential |
|---|---|---|
| **JD parsing result caching** | Parse each JD only once; store results in DB for reuse without re-calling AI | Medium |
| **Token limit settings** | Set maximum input/output token counts for each Prompt to prevent accidental overuse | Medium |
| **Prompt optimization** | Regularly review Plugin Prompts, remove redundant instructions to reduce token consumption | Medium |
| **Azure Cost Budget Alert** | Set monthly spending budget (e.g. $150), notify Manager at 80% / 100% | High (risk control) |
| **Application Insights monitoring** | Track token usage per Plugin, identify abnormally high-cost requests | Medium |
| **Tiered memory caching** | Cache frequently used questionnaire templates in memory to reduce DB queries | Low |
| **Azure Reserved Instances** | If App Service usage is stable, purchase 1-year reserved instance to save ~40% | High (long-term) |

---

## Monitoring Setup Recommendations

### Azure Cost Management

```
Azure Portal → Cost Management + Billing → Budgets
→ Set monthly budget (recommend $150 for initial phase)
→ 80% alert: Email notification to Manager
→ 100% alert: Email + optional auto-suspend non-critical resources
```

### Application Insights Custom Metrics

Record the following custom metrics in the Backend for use in the Manager Dashboard:

```csharp
// Example: record token usage per Plugin call
telemetryClient.TrackMetric("tokens.input.JdParserPlugin", inputTokens);
telemetryClient.TrackMetric("tokens.output.QaGeneratorPlugin", outputTokens);
telemetryClient.TrackMetric("cost.per.candidate", estimatedCost);
```
