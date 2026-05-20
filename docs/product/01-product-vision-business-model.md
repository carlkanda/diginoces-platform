# 01 — Product Vision & Business Model

## 1. Document purpose

This document defines the product vision and business model for the future Diginoces web platform.

It is the first To-Be document in the Diginoces SaaS transformation work. It focuses on what the product should become, who it serves, how it creates value, and how the business should operate at a high level.

Detailed subjects such as roles, permissions, guest management, RSVP, check-in, contracts, pricing, technical architecture, and implementation roadmap will be documented separately.

---

## 2. Product vision

Diginoces should evolve from a service powered by Google Sheets, Google Forms, Canva, WhatsApp, and Python scripts into a professional web platform for wedding guest management and event operations.

The platform should first serve the internal Diginoces team, but it must be designed from the beginning as a scalable SaaS-style system that can later support external wedding planners and service providers operating under the Diginoces brand.

The product vision is:

> To become the operational platform that helps Diginoces and its partners manage wedding guests from onboarding to invitation, RSVP, seating, check-in, welcome, wishes, and post-event guest-book delivery.

---

## 3. Core product positioning

Diginoces should not be positioned as a simple invitation generator.

It should be positioned as a complete wedding guest operations platform.

The platform should cover:

- client onboarding;
- contract and project approval;
- guest-list creation;
- bride/groom separate guest management;
- master guest database;
- event assignment;
- RSVP;
- table and seating planning;
- Canva-based invitation design import;
- personalized invitation generation;
- WhatsApp-first communication;
- invitation sending control;
- payment gate before guest-facing access;
- check-in and attendance tracking;
- guest welcome workflow;
- guest wishes collection;
- guest-book data export for Canva;
- reports, dashboards, audit logs, and project archive.

The platform should help Diginoces deliver a service that is faster, more reliable, more professional, and easier to scale.

---

## 4. Product type

The future product should be both:

1. **An internal operating system for Diginoces**  
   Used by Diginoces/admin and staff to manage real wedding projects professionally.

2. **A SaaS-style partner platform**  
   Used by selected external planners/providers who bring weddings to Diginoces and operate under Diginoces pricing, branding, and standards.

The recommended product strategy is:

> Internal operating system first, SaaS-ready architecture from day one.

This means the first version should solve Diginoces’ own operational problems, but its data model, permissions, project structure, and partner model should be designed so the platform can scale later.

---

## 5. Business model direction

The business should remain Diginoces-controlled.

External planners/providers can use the platform and bring projects to Diginoces, but they should not control pricing, branding, contracts, or revenue visibility.

### 5.1 Diginoces-controlled areas

Diginoces/admin should control:

- service packages;
- pricing;
- contract templates;
- project approval;
- payment confirmation;
- payment exceptions;
- public brand experience;
- partner access;
- operational standards;
- final business reporting.

### 5.2 Partner role

External planners/providers should be treated as partners who bring weddings to Diginoces.

They should be able to:

- create wedding projects;
- submit projects for Diginoces/admin approval;
- manage assigned projects operationally;
- communicate with the couple through the project comment thread;
- use the platform under Diginoces branding and pricing.

They should not be able to:

- manage Diginoces pricing;
- see revenue amounts;
- manage commissions;
- approve payment exceptions;
- control Diginoces contracts;
- access internal business reports.

---

## 6. Target users

The product should serve several user groups.

| User type | Main purpose |
|---|---|
| Diginoces admin | Full platform, pricing, projects, users, contracts, payments, reports |
| Diginoces staff | Operational execution: guests, invitations, RSVP, check-in, guest book |
| External planner/provider | Brings and manages wedding projects under Diginoces rules |
| Bride | Manages bride-side guests, views groom-side list, participates in RSVP and wishes review |
| Groom | Manages groom-side guests, preferably approves contract, views bride-side list |
| Wedding planner | Coordinates assigned wedding operations |
| Usher/check-in staff | Handles guest check-in for assigned event only |
| Printing partner | Accesses approved print-related outputs where needed |
| Guest | Uses public guest page for RSVP, invitation download, wishes, and event information |

---

## 7. Core value proposition

### 7.1 For Diginoces

The platform should reduce manual work, reduce mistakes, centralize data, and allow the team to handle more weddings with better control.

It should replace scattered workflows such as:

- manual Google Sheet copying;
- manual Google Drive folder management;
- manual guest-list merging;
- manual CSV creation;
- manual WhatsApp tracking;
- manual invitation resend tracking;
- manual check-in tracking;
- manual guest-book preparation.

### 7.2 For couples

The platform should make the wedding guest-management experience more organized and transparent.

Couples should be able to:

- manage separate bride/groom lists;
- see each other’s lists;
- import CSV/Excel files;
- assign guests to events;
- assign guests to tables/seats;
- track RSVP progress;
- request corrections after list lock;
- review wishes before the guest book;
- export selected reports.

### 7.3 For guests

Guests should have a simple and elegant experience.

They should be able to:

- access a personal public guest page without creating an account;
- see the couple photo and event details;
- RSVP when eligible;
- download their invitation PDF;
- view table assignment when released;
- submit one text wish with emojis;
- use their invitation/check-in information at the event.

### 7.4 For partners

Partners should be able to bring weddings to Diginoces and collaborate on projects without controlling sensitive business data.

They should benefit from the Diginoces system while still operating inside a controlled framework.

---

## 8. Revenue and pricing model

Pricing should be managed only by Diginoces/admin.

The platform should support service packages and add-ons, but payment processing remains outside the app in version 1.

Payments can be manually recorded inside the app.

### 8.1 Currency and pricing rules

- Version 1 uses USD only.
- Prices are all-inclusive.
- No tax/VAT breakdown is required in version 1.
- Pricing is based on planned guest count.
- If planned guest count increases after contract signing, the system recalculates additional charges.
- If planned guest count decreases after contract signing, the original price remains the same.
- Diginoces/admin can manually apply a commercial gesture or discount in exceptional cases.

### 8.2 Payment gates

The system should enforce two business gates:

| Gate | Requirement | What it unlocks |
|---|---|---|
| Guest-list access | Contract approved | Bride/groom can start guest work |
| Guest-facing access and invitation sending | Full payment confirmed | Guest public pages and invitation sending unlock |

Diginoces/admin can create a payment exception override in rare cases.

---

## 9. Contract and project activation model

The contract should be generated as one contract for the whole wedding project, even if the project contains multiple events.

The contract should be displayed inside the app rather than relying on PDF upload/signature in version 1.

The preferred approver is the groom, but only one person from the couple is required.

Approval should require:

1. viewing the contract in the app;
2. checking a confirmation box;
3. clicking the approval button.

Once approved, the project becomes operational and guest-list access opens.

Contract addendums should be supported for major changes such as:

- additional guests;
- additional events;
- added services;
- major scope changes;
- additional charges.

Price/scope changes should require couple approval, while minor operational changes should not require an addendum.

---

## 10. Lead and sales model

The public website should create leads, not automatic wedding projects.

Recommended flow:

1. Visitor submits public request form.
2. System creates a lead.
3. Diginoces/admin reviews the lead.
4. If serious, the lead is converted into a wedding project.
5. Project approval, contract, pricing, and onboarding begin.

A lightweight sales pipeline should be included.

Suggested statuses:

- New;
- Contacted;
- Qualified;
- Proposal / Package Sent;
- Waiting for Decision;
- Won;
- Converted to Project;
- Lost;
- Archived.

Only Diginoces/admin should manage leads in version 1.

---

## 11. Public website and app relationship

The public Diginoces website and the operational app should be connected but structurally separate.

| Space | Purpose |
|---|---|
| Public Diginoces website | Marketing, testimonials, services, request form, login link |
| Diginoces app/SaaS portal | Wedding operations, guest management, contracts, RSVP, check-in, reports |

The website is the commercial front door.  
The app is the operational system.

---

## 12. Design philosophy

The internal app should be:

- simple;
- professional;
- dashboard-like;
- responsive;
- fast to use;
- compatible with light and dark mode.

The guest public page should be more elegant and wedding-style, with:

- couple photo;
- couple names;
- event details;
- RSVP;
- invitation download;
- wishes section;
- table assignment when available.

Diginoces should provide one elegant default guest-page theme in version 1.

---

## 13. Product boundaries

The app should not try to replace every external tool in version 1.

### 13.1 Canva remains the creative design tool

Canva should remain the tool for:

- invitation design;
- guest-book design;
- table-card design;
- print-ready export.

The app should import Canva-exported PDFs for invitation personalization and generate CSV files for Canva Bulk Create when needed.

### 13.2 WhatsApp remains the primary communication channel

All guest/client communication should be WhatsApp-first in version 1.

The app should support:

- WhatsApp API mode if available;
- guided manual WhatsApp mode if API access is unavailable.

### 13.3 Google Drive should not be the future storage system

The future app should use its own internal file storage, not Google Drive as the main operational storage.

---

## 14. Key business constraints

The product should respect these business rules:

- guest-list access opens only after contract approval;
- guest public page access is locked until full payment;
- invitation sending requires full payment unless admin override is granted;
- pricing is based on planned guest count;
- Diginoces controls pricing and branding;
- partners operate under Diginoces rules;
- revenue is visible only to Diginoces/admin;
- guest data and operational changes must be traceable;
- check-in must support at least 400 guests with 2–3 devices;
- target check-in time should be at most 10 seconds per guest/unit.

---

## 15. Success indicators

The product should be considered successful if it helps Diginoces achieve the following:

- less manual copying and pasting;
- fewer invitation sending mistakes;
- clearer guest-list progress;
- faster invitation generation;
- reliable RSVP tracking;
- better seating/table planning;
- real-time check-in visibility;
- accurate attendance reporting;
- easier guest-book preparation;
- better control over contracts, payments, and project status;
- ability to manage more weddings without losing quality;
- ability to onboard partners under Diginoces branding.

---

## 16. Summary

The future Diginoces platform should be a professional wedding guest operations system.

It should start as an internal tool for the Diginoces team, but be designed as a SaaS-ready platform that can later support partners and external planners operating under the Diginoces brand.

The product should not replace Canva or WhatsApp in version 1. Instead, it should organize, automate, and control the operational workflows around them.

The first business priority is operational reliability. The long-term opportunity is a scalable Diginoces-branded partner platform for wedding guest management.
