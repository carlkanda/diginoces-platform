# 02 — User Roles, Permissions & Access Control

## 1. Document purpose

This document defines the user roles, access model, permission logic, and security rules for the future Diginoces platform.

It is the second To-Be document in the Diginoces SaaS transformation work.

The goal is to make sure every user has the right level of access: enough to perform their responsibilities, but not enough to create operational, financial, or privacy risks.

---

## 2. Core access philosophy

The Diginoces platform will involve many different user types: internal Diginoces users, partners, couples, staff, ushers, guests, and printing-related users.

The permission model must therefore be flexible, secure, and project-aware.

The core principle is:

> Users should only access the projects, events, guests, files, reports, and actions that are necessary for their role.

The system should prevent uncontrolled access to sensitive areas such as pricing, payments, contracts, audit logs, internal notes, and platform settings.

---

## 3. Role structure

The platform should use a layered role model:

1. **Global role** — defines who the user is in the Diginoces ecosystem.
2. **Project-level role** — defines what the user can do on a specific wedding project.
3. **Event-level role** — defines what the user can do for a specific celebration/event inside a wedding project.
4. **Custom role** — allows Diginoces/admin to create specific permission sets when default roles are not enough.

This structure makes it possible for one person to have different responsibilities depending on the wedding or event.

Example:

| User | Global role | Project A | Project B |
|---|---|---|---|
| Staff member A | Diginoces staff | Invitation manager | No access |
| Staff member B | Diginoces staff | Project coordinator | Check-in supervisor |
| Partner X | External partner | Project operator | No access |
| Usher Y | Check-in user | Reception check-in only | No access |

---

## 4. Global roles

Global roles define a user's general identity inside the platform.

### 4.1 Diginoces admin

Diginoces admin is the highest internal role.

This role should have full control over:

- platform settings;
- users and roles;
- permissions;
- pricing and packages;
- contracts and addendums;
- payment records and payment exceptions;
- project approval;
- partner management;
- dashboards and reports;
- audit logs;
- storage and archive settings;
- templates and message settings.

Diginoces admin should be a sensitive role and must use two-factor authentication.

### 4.2 Diginoces staff

Diginoces staff are internal operational users.

Their access should depend on project/event assignment and assigned permissions.

Possible responsibilities include:

- project coordination;
- guest-list review;
- guest import approval;
- invitation template setup;
- invitation generation;
- RSVP follow-up;
- change request handling;
- table/seating review;
- check-in preparation;
- guest-book preparation;
- internal notes;
- operational reports.

Diginoces staff should not automatically have access to pricing, payment exceptions, role management, or platform settings unless explicitly authorized.

### 4.3 External planner/provider / partner

External planners/providers are partners who bring weddings to Diginoces and may help manage projects.

They operate under Diginoces branding, pricing, and rules.

They can:

- create wedding projects;
- submit projects for Diginoces/admin approval;
- manage assigned projects operationally;
- communicate with the couple through project comments;
- view project progress for assigned projects.

They cannot:

- manage Diginoces pricing;
- see revenue amounts;
- manage commissions;
- approve payment exceptions;
- control contract templates;
- access internal Diginoces reports;
- access projects they are not assigned to.

Partner revenue visibility must remain restricted to Diginoces/admin.

### 4.4 Bride

The bride is a client-side user linked to one wedding project.

The bride should be able to:

- manage bride-side guests while the list is unlocked;
- view groom-side guests;
- import CSV/Excel files into the bride-side list;
- create tags;
- create simple title/types;
- assign her guests to events;
- assign her guests to tables/seats when unlocked;
- review RSVP progress;
- participate in post-deadline RSVP review;
- submit post-lock change requests;
- review guest wishes before guest-book generation;
- export selected reports;
- view contract and project dashboard as permitted.

The bride should not be able to:

- modify groom-side guests directly;
- edit pricing;
- approve payment exceptions;
- view internal notes;
- view internal audit logs;
- access other wedding projects.

### 4.5 Groom

The groom is a client-side user linked to one wedding project.

The groom should be able to:

- manage groom-side guests while the list is unlocked;
- view bride-side guests;
- import CSV/Excel files into the groom-side list;
- create tags;
- create simple title/types;
- assign his guests to events;
- assign his guests to tables/seats when unlocked;
- review RSVP progress;
- participate in post-deadline RSVP review;
- submit post-lock change requests;
- review guest wishes before guest-book generation;
- export selected reports;
- approve the contract if designated as approver.

The groom is the preferred contract approver.

The groom should not be able to:

- modify bride-side guests directly;
- edit pricing;
- approve payment exceptions;
- view internal notes;
- view audit logs;
- access other wedding projects.

### 4.6 Wedding planner

A wedding planner may be assigned to a wedding project by Diginoces/admin or by project configuration.

The wedding planner can coordinate event planning tasks depending on granted permissions.

Possible access:

- view guest lists;
- assist with table planning;
- view RSVP progress;
- communicate in project comments;
- view event deadlines;
- export selected operational reports.

The wedding planner should not access pricing, payment exceptions, internal notes, or audit logs unless Diginoces/admin explicitly grants access.

### 4.7 Usher / check-in staff

Ushers and check-in staff must have full user accounts with passwords.

They should be assigned only to specific events.

Their access should be limited to check-in operations for assigned events.

They can:

- access check-in mode;
- scan QR codes;
- search guests manually;
- check guests in;
- update arrival count for Couple invitations;
- record manual search check-ins;
- create unexpected guest requests;
- view table/seat information for checked-in guests;
- see VIP/protocol highlights.

They cannot:

- edit guest lists generally;
- change pricing;
- see contracts;
- see payments;
- export full reports;
- view internal notes unless specifically allowed;
- access events they are not assigned to.

### 4.8 Check-in supervisor

A check-in supervisor is a sensitive operational role.

The supervisor can:

- oversee check-in dashboard;
- approve or reject unexpected guest requests;
- view arrivals by table;
- view arrivals by device/staff;
- monitor duplicate scans;
- manage check-in staff assignments;
- view VIP/protocol information.

This role should require two-factor authentication if it includes approval of unexpected guests.

### 4.9 Printing partner

A printing partner should have very limited access.

They may only access approved print-related files or orders if Diginoces decides to include them in the platform.

Possible access:

- print-ready table-card PDFs;
- print-ready invitation files;
- print-order instructions;
- print status update.

They should not see:

- full guest database;
- payments;
- contracts;
- internal notes;
- audit logs;
- partner/revenue reports.

### 4.10 Guest

Guests should not create full accounts in version 1.

Guests access their personal public page through a secure unique link.

Guests can:

- view their guest public page;
- choose preferred language;
- RSVP if eligible;
- download their invitation PDF;
- view event information;
- view table assignment when released;
- submit one text wish with emojis;
- edit allowed information before the relevant deadline.

Guests cannot:

- access the admin app;
- see other guests;
- see the full event list;
- view internal notes;
- view pricing;
- edit table assignments;
- edit event assignments.

---

## 5. Custom roles

Diginoces/admin should be able to create custom roles.

Custom roles are useful when the team grows and responsibilities become more specialized.

Examples:

- Invitation manager;
- RSVP manager;
- Check-in supervisor;
- Table assignment manager;
- Guest-book reviewer;
- Finance/payment recorder;
- Print coordinator;
- Partner assistant;
- Protocol/VIP manager;
- Import reviewer.

Each custom role should be built from granular permissions.

---

## 6. Permission areas

Permissions should be grouped by functional area.

### 6.1 Wedding projects

Possible permissions:

- view project;
- create project;
- edit project;
- submit project for approval;
- approve project;
- archive project;
- delete project;
- assign staff;
- view project dashboard.

### 6.2 Leads and sales pipeline

Only Diginoces/admin and authorized internal staff should manage leads.

Possible permissions:

- view leads;
- create leads;
- edit leads;
- change lead status;
- convert lead to project;
- assign lead owner;
- archive lead.

External partners should not create leads in version 1.

### 6.3 Guests

Possible permissions:

- view guests;
- add guests;
- edit guests;
- delete guests;
- import guests;
- approve imported guests;
- reject imported guests;
- bulk edit guests;
- create tags;
- create title/types;
- resolve duplicates;
- submit change requests;
- approve change requests.

### 6.4 Events

Possible permissions:

- create event;
- edit event;
- assign guests to event;
- configure RSVP deadline;
- configure event package/add-ons;
- configure check-in settings;
- lock event setup;
- archive event.

### 6.5 Tables and seating

Possible permissions:

- create tables;
- edit tables;
- set table capacities;
- create table descriptions;
- assign guests to tables;
- assign guests to seats;
- use visual seating map;
- lock seating plan;
- export seating reports.

### 6.6 Invitations

Possible permissions:

- upload Canva-exported PDF template;
- configure dynamic fields;
- generate preview samples;
- approve technical preview;
- generate invitations;
- regenerate selected invitations;
- view invitation files;
- download invitation files;
- send invitations;
- mark design approval manually;
- manage modification messages.

### 6.7 RSVP

Possible permissions:

- view RSVP dashboard;
- manually update RSVP;
- override RSVP;
- run post-deadline review;
- configure Maybe reminders;
- export RSVP reports.

### 6.8 Communication

Possible permissions:

- view project comment thread;
- post public project comments;
- post internal-only notes;
- send/prepare WhatsApp messages;
- view message status;
- manage message templates.

### 6.9 Contracts and addendums

Possible permissions:

- view contract;
- generate contract;
- approve contract template;
- send contract for approval;
- mark contract approved;
- generate addendum;
- approve addendum;
- export contract PDF;
- view contract history.

### 6.10 Payments and pricing

Sensitive area.

Possible permissions:

- view pricing;
- manage packages;
- apply discounts/gestures;
- record payments;
- approve payment exception;
- view payment summary;
- export payment report.

Pricing and revenue should remain visible only to Diginoces/admin and authorized internal roles.

### 6.11 Check-in

Possible permissions:

- access check-in mode;
- scan QR code;
- manual guest search;
- check guest in;
- update partial arrivals;
- create unexpected guest request;
- approve unexpected guest request;
- view check-in dashboard;
- view arrivals by table;
- view arrivals by staff/device;
- assign check-in devices/stations.

### 6.12 Wishes and guest book

Possible permissions:

- view submitted wishes;
- edit/moderate wishes;
- approve wishes;
- exclude wishes;
- allow couple review;
- export wishes CSV for Canva;
- mark guest-book workflow complete.

### 6.13 Reports and dashboards

Possible permissions:

- view global dashboard;
- view project dashboard;
- view couple dashboard;
- export reports;
- view partner dashboard;
- view revenue reports;
- view operational reports.

### 6.14 Files and storage

Possible permissions:

- upload files;
- view project files;
- download files;
- delete files;
- archive files;
- view version history;
- manage retention.

### 6.15 Audit logs

Audit logs should be visible only to Diginoces/admin and selected sensitive roles.

Possible permissions:

- view audit logs;
- export audit logs;
- filter audit logs.

Audit logs should not be editable.

---

## 7. Bride and groom permission rules

Bride and groom users have symmetrical but separated permissions.

| Area | Bride | Groom |
|---|---|---|
| Own guest list | Edit while unlocked | Edit while unlocked |
| Partner list | View only | View only |
| Guest import | Own side only | Own side only |
| Table assignment | Own guests while unlocked | Own guests while unlocked |
| Post-lock edits | Change requests only | Change requests only |
| RSVP review | Yes | Yes |
| Wishes review | Yes | Yes |
| Contract approval | Optional | Preferred approver |
| Pricing edit | No | No |
| Internal notes | No | No |
| Audit logs | No | No |

After invitations are sent, bride/groom users should no longer directly edit guest data. They must submit structured change requests.

---

## 8. Guest public page access

Guests do not need accounts.

They access the public guest page through a secure unique link.

The guest page should be locked until full payment is confirmed, unless Diginoces/admin creates a payment exception override.

Guests can access only their own page.

They can:

- view couple photo;
- view couple/event details;
- RSVP if eligible;
- download their invitation PDF;
- view table assignment when released;
- submit one text wish;
- choose preferred language.

They cannot access other guests or internal project information.

---

## 9. Check-in staff account rules

Check-in staff and ushers must create full accounts with passwords.

They should not use temporary anonymous links.

Reasons:

- check-in is a sensitive operation;
- every arrival must be traceable;
- unexpected guest approvals must be controlled;
- duplicate scans and manual check-ins need accountability.

Each check-in action should record:

- staff user;
- event;
- device/station;
- check-in method;
- time;
- guest;
- arrival count;
- sync status if offline.

---

## 10. Two-factor authentication

Two-factor authentication should be required for sensitive roles.

Sensitive roles include:

- Diginoces admin;
- payment recorder / finance role;
- contract manager;
- check-in supervisor;
- role/permission manager;
- package/pricing manager;
- external planner/provider admin.

2FA can be optional for lower-risk roles such as bride, groom, basic staff, and ushers unless Diginoces/admin decides otherwise later.

---

## 11. Internal notes visibility

The system should support internal-only notes.

Internal notes should be visible only to Diginoces/admin and authorized Diginoces staff.

They should be attachable to:

- project;
- event;
- guest;
- payment;
- contract/addendum;
- check-in issue;
- invitation;
- RSVP;
- table/seating;
- partner/provider.

Internal notes should be editable only within the first 15 minutes after posting. After 15 minutes, they become locked and users must add follow-up notes.

---

## 12. Project comments and communication

Version 1 should support a simple project comment/message thread, not a full chat system.

Authorized users can communicate inside the project thread.

Possible participants:

- Diginoces/admin;
- assigned Diginoces staff;
- external planner/provider;
- bride/groom;
- assigned wedding planner.

The thread should support:

- project-level comments;
- event-level comments;
- mentions;
- optional attachments;
- notifications;
- visibility control.

Pricing, payment, contract, and sensitive business discussions should remain restricted to authorized Diginoces users.

---

## 13. Partner access model

Partners are business partners who bring weddings to Diginoces.

They can create wedding projects, but projects must be approved by Diginoces/admin before becoming active for the couple.

Partners can communicate with the couple through the project comment thread.

Partners should not see:

- revenue;
- payment details;
- discounts;
- payment exceptions;
- Diginoces internal notes;
- Diginoces audit logs;
- global business dashboards.

Diginoces/admin should track which projects were brought by each partner, but commissions are not managed in version 1.

---

## 14. Printing partner access model

Printing partners should only access print-related information if Diginoces chooses to involve them in the platform.

They should access only approved print outputs.

They should not access the full guest database, payments, contracts, internal notes, or reports.

---

## 15. AI assistance access

AI assistance should be available to:

- Diginoces/admin;
- Diginoces staff;
- external planners/providers;
- bride/groom.

AI assistance should not directly change sensitive data without user approval.

Bride/groom users can apply AI suggestions directly while the list is unlocked and within their own permissions.

After list lock, AI suggestions should become change requests or staff-controlled actions.

Guests do not need AI assistance in version 1.

---

## 16. Audit logging requirements

The system should record audit logs for important actions.

Audit logs should capture:

- who performed the action;
- role of the user;
- date/time;
- object affected;
- old value;
- new value;
- method/source;
- optional reason/comment.

Audit logs should track changes to:

- guest data;
- event assignment;
- RSVP;
- table/seat assignment;
- invitation generation;
- message status;
- payments;
- contracts/addendums;
- check-in;
- unexpected guest approvals;
- wishes moderation;
- workflow tasks;
- permissions and roles.

Audit logs are internal and should not be visible to couples, guests, or partners.

---

## 17. Recommended default roles summary

| Role | Access level |
|---|---|
| Diginoces admin | Full platform control |
| Diginoces staff | Operational access based on assignment |
| External planner/provider | Project creation and assigned project operations under Diginoces rules |
| Bride | Bride-side management and selected project visibility |
| Groom | Groom-side management and preferred contract approval |
| Wedding planner | Coordination access if assigned |
| Usher/check-in staff | Check-in only for assigned event |
| Check-in supervisor | Check-in oversight and unexpected guest approvals |
| Printing partner | Approved print files only |
| Guest | Secure public page only |

---

## 18. Summary

The Diginoces platform requires a strong role-based permission system because it will manage sensitive client, guest, financial, contractual, and event operations.

The recommended model is:

- global roles for identity;
- project-level roles for wedding-specific access;
- event-level roles for operational duties;
- custom roles for flexibility;
- secure guest public links for guests;
- full accounts for check-in staff;
- two-factor authentication for sensitive roles;
- audit logs for traceability;
- internal notes for private Diginoces coordination.

This structure will allow Diginoces to scale operations while protecting data, business rules, and service quality.
