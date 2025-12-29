# Phase 24: Ethical Store & Payments

## Overview
This phase establishes the ethical commerce layer for Jean. It introduces a store for plugins and services that operates under strict ethical constraints: no ads, no tracking, and no revenue-driven optimization.

## Core Principles
1.  **Advisory Only**: The store suggests tools that help the user, not products that pay to be seen.
2.  **Revenue Isolation**: Payment processing is architecturally detached from intelligence. Jean does not "know" which products make money.
3.  **Transparency**: Every suggestion explains *why* it appeared and *how* to turn it off.
4.  **Privacy First**: Products with invasive tracking are automatically blocked from suggestions.

## Data Structures (`StoreTypes.ts`)
- `StoreItem`: Defines a product with explicit `privacyImpact` declarations.
- `EthicalSuggestion`: A suggestion wrapper containing transparency notes and dismissal handles.
- `SuggestionContext`: Captures user intent and sensitivity flags to gate suggestions.

## Ethical Policy (`EthicalSuggestionPolicy.ts`)
The policy layer acts as a filter for all commercial recommendations:
- **Sensitive Context Block**: No suggestions during private or critical tasks.
- **Frequency Cap**: Limits suggestions to 3 per session.
- **Dismissal Respect**: Never suggests a dismissed item again (24h cooldown in code, effectively permanent in session memory).
- **Anti-Tracking**: Blocks items that declare 'tracking' data collection.

## Payment Boundary (`PaymentBoundary.ts`)
Implements the "diode" architecture:
- `getEthicalSuggestion()`: Generates suggestions based on utility, not margin.
- `processPaymentIsolated()`: Handles money without feeding data back to the intelligence layer.

## Usage
```typescript
// Check if an item should be suggested
const suggestion = PaymentBoundary.getEthicalSuggestion(
  product, 
  { 
    userIntent: 'edit_video', 
    isSensitiveContext: false,
    recentDismissals: [],
    sessionSuggestionCount: 0 
  }, 
  'video_editing_capability'
);

if (suggestion) {
  // Render suggestion with transparency note
  console.log(suggestion.transparencyNote); 
  // "Suggested because your intent 'video_editing_capability' matches..."
}
```

## Declarations
- Intelligence is never for sale.
- Payments do not influence Jean's decisions.
- Users can disable the store entirely.
