# 10 — Contracts, Pricing & Payment Controls

## 1. Purpose

This document defines the contract, pricing, package, payment, and business-gating rules for the Diginoces platform.

---

## 2. Contract model

The system should generate one contract for the whole wedding project, even when the project contains multiple events.

The contract should cover:

- couple information;
- project details;
- event list;
- selected package/add-ons per event;
- planned guest count;
- total price in USD;
- payment conditions;
- guest-count increase rules;
- responsibilities;
- approval terms.

---

## 3. In-app contract approval

The contract should be displayed inside the app.

The preferred approver is the groom, but only one person from the couple is required.

Approval requires:

1. contract display in app;
2. checkbox confirmation;
3. approval button click;
4. approval record with user, timestamp, version, and confirmation text.

No in-app contract negotiation workflow is required in version 1.

---

## 4. Contract gate

Guest-list access opens only after contract approval.

Before contract approval, bride/groom cannot start guest-list work.

---

## 5. Addendums

Contract addendums should be supported for major post-approval changes:

- planned guest count increase;
- added event;
- new paid service/add-on;
- major scope change;
- additional charges.

Price/scope changes require couple approval. Minor operational changes do not.

---

## 6. Pricing control

Pricing and packages are managed only by Diginoces/admin.

External partners do not manage pricing and cannot see revenue.

Version 1 uses:

- USD only;
- all-inclusive prices;
- no tax/VAT breakdown;
- manual payment recording;
- no in-app payment processing.

---

## 7. Package model

Packages are global, but each event inside a project can have its own selected package/add-ons.

The project total is the sum of event packages/add-ons and any global adjustment.

---

## 8. Planned guest count pricing

Pricing is based on planned guest count.

Rules:

- increase after contract approval triggers recalculation/addendum/additional payment;
- decrease after contract approval does not automatically reduce the price;
- Diginoces/admin can manually apply a commercial gesture or discount.

---

## 9. Payment recording

Payments remain outside the app, but Diginoces/admin can manually record:

- expected amount;
- paid amount;
- balance;
- method;
- payment date;
- reference/proof;
- recorded by;
- notes;
- status.

---

## 10. Payment gate

Full payment is required before:

- guest public pages are accessible;
- invitations can be sent.

Diginoces/admin may approve a payment exception override in rare cases.

The exception must record reason, approver, date/time, amount paid, balance, conditions, and optional expiry.

---

## 11. Acceptance criteria

- Contract can be generated from project/event/package data.
- Contract can be approved inside the app with checkbox confirmation.
- Guest-list access is blocked until contract approval.
- Payment can be manually recorded.
- Invitation sending and guest-page access are blocked until full payment or exception.
- Guest-count increase triggers addendum/extra payment workflow.

---

## 12. Summary

The contract and payment module protects the business while keeping the client workflow simple. It should gate guest work by contract approval and guest-facing operations by payment confirmation.
