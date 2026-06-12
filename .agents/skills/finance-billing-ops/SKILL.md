---
name: finance-billing-ops
description: Evidence-first revenue, pricing, refunds, and billing-model truth workflow for Shokujii enterprise. Use when the user wants a sales snapshot, pricing comparison, duplicate-charge diagnosis, or code-backed billing reality instead of generic payments advice.
---

# Finance Billing Ops

Use this when the user wants to understand money, pricing, refunds, enterprise platform fees, meal billing, or whether the product actually behaves the way the website and sales copy imply.

This skill is for operator truth: revenue state, pricing decisions, enterprise billing, and code-backed billing behavior.

## Skill Stack

Pull these Shokujii project skills into the workflow when relevant:

- `/stripe-integration` — Stripe Checkout, webhooks, refund flows
- `/shokujii-firestore` — `billing_snapshots`, `monthly_usage`, enterprise store reads
- `/shokujii-functions-implementation` — Callable / Scheduled billing Functions
- `/shokujii-common-schemas` — `Enterprise`, `EnterpriseBillingSnapshot` 等
- `/vitest` — billing ロジックの単体テスト
- `documents/08_エンタープライズ/02_エンタープライズ_課金設計.md` — プラットフォーム利用料・スナップショット正本
- `documents/10_競合調査・営業資料/02_料金比較.md` — 競合比較・試算例

## When to Use

- user asks for Stripe sales, refunds, MRR, or recent customer activity
- user asks about enterprise platform fee (`platform_fee_amount`), meal billing (`meal_billing_amount` / `enterprise_billing_amount`), or billing snapshots
- user wants competitor pricing comparisons or pricing-model benchmarks（`10_競合調査・営業資料` 参照）
- the question mixes revenue facts with product implementation truth

## Guardrails

- distinguish live data from saved snapshots
- separate:
  - revenue fact
  - customer impact
  - code-backed product truth
  - recommendation
- do not say "per seat" unless the actual entitlement path enforces it（エンプラは **有効アカウント数 × unit_price** が正本）
- do not assume duplicate subscriptions imply duplicate value
- プラットフォーム利用料（①）と食事従量（②）を混同しない（`02_課金設計` §1）

## Workflow

### 1. Start from the freshest billing evidence

Prefer live billing data. If the data is not live, state the snapshot timestamp explicitly.

Normalize the picture:

- paid sales
- active subscriptions
- failed or incomplete checkouts
- refunds
- disputes
- duplicate subscriptions

### 2. Separate customer incidents from product truth

If the question is customer-specific, classify first:

- duplicate checkout
- real team intent
- broken self-serve controls
- unmet product value
- failed payment or incomplete setup

Then separate that from the broader product question:

- does enterprise billing snapshot capture match `02_課金設計` §5.4?
- is `billing_status` / `platform_fee_amount` calculated per spec?
- does guest free meal billing follow `04_請求` §2?
- does the site or sales copy overstate current behavior?

### 3. Inspect code-backed billing behavior

If the answer depends on implementation truth, inspect the code path:

- `functions/default/src/` — billing snapshot Scheduled Function, Stripe webhook
- `common/src/schemas/` — Enterprise, billing_snapshots
- checkout / confirmOrder / stripeWebhook（`04_割引・決済`）
- `getDashboardMonthlyData` — snapshot vs live aggregation
- billing portal or self-serve management support

### 4. End with a decision and product gap

Report:

- sales snapshot
- issue diagnosis
- product truth
- recommended operator action
- product or backlog gap

## Output Format

```text
SNAPSHOT
- timestamp
- revenue / subscriptions / anomalies

CUSTOMER IMPACT
- who is affected
- what happened

PRODUCT TRUTH
- what the code actually does
- what the website or sales copy claims

DECISION
- refund / preserve / convert / no-op

PRODUCT GAP
- exact follow-up item to build or fix
```

## Pitfalls

- do not conflate failed attempts with net revenue
- do not infer team billing from marketing language alone
- do not compare competitor pricing from memory when current evidence is available
- do not jump from diagnosis straight to refund without classifying the issue

## Verification

- the answer includes a live-data statement or snapshot timestamp
- product-truth claims are code-backed
- customer-impact and broader pricing/product conclusions are separated cleanly
