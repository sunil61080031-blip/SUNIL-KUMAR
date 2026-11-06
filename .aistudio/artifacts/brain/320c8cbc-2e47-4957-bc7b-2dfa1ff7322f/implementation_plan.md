# Shiksha Niketan Tuition Centre — Web Hub & Notice Board

A high-fidelity, responsive institutional web portal and notice board for **Shiksha Niketan Tuition Centre** (Gadhiya, Bhaptiyahi, Supaul, Bihar), led by **Sunil Kumar**. The application delivers a high-impact brochure, active notice board with print capabilities, batch schedules for Classes 6th to 10th, an instant fee calculator, direct WhatsApp enrollment, and a password-protected Director Admin Portal for publishing notices and managing student inquiries.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been aligned based on your specifications:
>
> - **Primary Focus**: Brochure presentation emphasizing the dynamic **Notice Board**, **Batch Timetable**, **Fee Calculator**, and **Direct WhatsApp Enrollment**.
> - **Localization & Language**: Predominantly clean English typography paired with authentic Hindi (Devanagari) titles, slogans, and official notice headings for optimal community readability in Supaul.
> - **Director Admin Portal**: Simple, secure password/passcode authentication (`sunil2026` or quick Director demo login) allowing Sunil Sir to post, edit, pin, and delete notices as well as review and export student inquiries with persistent local storage.

---

### 1. Overview & Core Concept

- **What It Does**: Serves as the official digital presence and operational notice board for Shiksha Niketan Tuition Centre. Parents and students can browse course offerings for Classes 6 through 10 (covering BSEB Bihar Board and CBSE syllabi), calculate transparent monthly and session fees, download or print official notices, and instantly send admission inquiries via WhatsApp or phone call.
- **Target Audience / Persona**: Students of Classes 6th–10th and their parents in Bhaptiyahi and nearby villages across Supaul district looking for disciplined, concept-first coaching in Mathematics, Science, and Social Studies; and the Director (Sunil Kumar) who needs to post urgent notices (holidays, test schedules, exam result declarations).
- **Key Value**: Replaces paper circulars with an instantaneous, printable digital notice board; eliminates fee ambiguity through a real-time calculator; and provides friction-free 1-tap WhatsApp admission inquiries.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Visitor & Student Flow**:
   - Lands on the Hero section with live urgent notice ticker and key academic pillars (100% Matric pass record, NCERT line-by-line coverage, weekly OMR tests).
   - Explores the **Notice Board & Circulars** filterable by tag (*All*, *Urgent*, *Exams*, *Holidays*, *Admissions*), expands notice details, or prints/downloads a formatted printable slip.
   - Inspects **Courses & Batches (Class 6 to 10)** with subject breakdowns, morning/evening batch timings, and seat availability.
   - Experiments with the **Interactive Fee Calculator** (class selection + payment interval + sibling discount) with transparent pricing breakdown.
   - Submits a **Direct WhatsApp Enrollment** form that compiles student details and opens a pre-composed WhatsApp chat to Sunil Sir (+91 9650952919).
2. **Director Admin Flow**:
   - Accesses the Admin Portal via header button or quick trigger using the password.
   - Posts a new notice with title (English & Hindi), description, category, urgent tag, and optional PDF/link indicator.
   - Manages notices (pin, delete, edit) and reviews submitted inquiry leads with 1-click status updates and CSV export.

#### Visual Identity & Theme
- **Aesthetic Direction**: Trustworthy, academic, and community-centered. Clean scholastic aesthetic free of generic AI tech clutter.
- **Color Palette (60-30-10 Rule)**:
  - *60% Neutral Canvas*: Crisp off-white (`#F8FAFC` slate-50) and white backgrounds for maximum legibility and contrast.
  - *30% Structural Surfaces*: Deep emerald slate (`#064E3B`, `#047857`) for header and hero badges, soft borders (`#E2E8F0`), and warm card backdrops.
  - *10% High-Intent Accent*: Warm marigold / saffron (`#F59E0B` amber-500) and crimson for urgent circulars and primary CTAs.
- **Typography & Font Pairing**:
  - *Headings & Brand Display*: `Plus Jakarta Sans` with tight tracking paired with `Noto Sans Devanagari` for Hindi titles (*शिक्षा निकेतन ट्यूशन सेंटर*).
  - *Body Text*: High-legibility `Plus Jakarta Sans` (15–16px, balanced line height).
  - *Metadata & Numbers*: Clean unboxed text with subtle typographic separators (`·`) and tabular figures (`tabular-nums`) for fee and date rendering.
- **Anti-Slop Discipline**:
  - No fake AI scores or mechanical code comments.
  - Top navigation strictly follows the 3-zone contract: Brand wordmark — Navigation links — 1 primary Action button ("Enroll Now").
  - Notice board features genuine print-formatted stylesheets (`@media print`) so parents can print official circulars directly.

---

### 3. Key Product Decisions & Trade-Offs

- **State Persistence & Offline Readiness**:
  - *Chosen Approach*: Client-side `localStorage` synchronized state initialized with authentic pre-seeded notices, batches, and fee structures.
  - *Why*: Allows instant zero-latency loading, works offline for students with intermittent rural mobile data, and allows the Director to add notices immediately without requiring complex backend credentials.
  - *Alternatives Considered*: Remote cloud database requires account setup and API keys; client-side storage provides immediate full functionality with zero friction.
- **Direct WhatsApp Lead Conversion**:
  - *Chosen Approach*: WhatsApp Click-to-Chat deep link (`wa.me/919650952919?text=...`) combined with an in-app inquiry logger.
  - *Why*: In rural and semi-urban Bihar, WhatsApp is the universal communication channel. Parents get direct, instant access to Sunil Sir while the app maintains an archive for the Director.
- **Printable Notice Slips**:
  - *Chosen Approach*: Dedicated modal print preview with CSS print media queries that renders an official institute header, stamp watermark, and signature block.
  - *Why*: Local tuition centres frequently need physical notice printouts to pin on the physical gate or hand to parents.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Top Navigation & Urgent Ticker                     │
│    (Brand Wordmark  ·  Notice Board · Batches · Fees · Location  · CTA)│
└────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
┌─────────────────────────────────────┐         ┌───────────────────────────────┐
│           Public Views              │         │     Director Admin Portal     │
│ ├─ Hero with Academic Pillars       │         │ ├─ Passcode Gate (sunil2026)  │
│ ├─ Notice Board (Filters & Print)   │ ◄───────┤ ├─ Notice Composer & Manager  │
│ ├─ Batch Timetable (Classes 6-10)   │ (Syncs) │ ├─ Lead / Inquiry Dashboard   │
│ ├─ Fee Estimator & Sibling Discount │         │ └─ Reset Seed Data            │
│ ├─ Why Choose Us (NCERT / OMR)      │         └───────────────────────────────┘
│ ├─ Direct WhatsApp Enrollment Form  │                         │
│ └─ Contact, Map & Timing Footer     │                         │
└─────────────────────────────────────┘                         ▼
                   │                           ┌────────────────────────────────┐
                   └──────────────────────────►│ LocalStorage Data Store        │
                                               │  - notices: NoticeItem[]       │
                                               │  - inquiries: InquiryLead[]    │
                                               │  - batches: BatchSchedule[]    │
                                               └────────────────────────────────┘
```

#### Core Data Entities
- **NoticeItem**: `id`, `title`, `hindiTitle`, `content`, `hindiContent`, `category` (*Exam*, *Holiday*, *Admission*, *General*), `isUrgent`, `date`, `refNo`, `pdfDownloadUrl?`.
- **BatchSchedule**: `classNum` (6 to 10), `timing`, `subjects`, `batchName`, `seatsLeft`, `medium` (*Hindi / English*).
- **FeeStructure**: Base monthly tuition per class, registration fee, discount rules (e.g. 10% sibling discount, quarterly advance discount).
- **InquiryLead**: `id`, `studentName`, `parentName`, `phone`, `classLevel`, `message`, `timestamp`, `status` (*New*, *Contacted*, *Enrolled*).

---
