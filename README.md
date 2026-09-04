# iT1DXpert (DiabetesCare) — Multi-Tenant Type 1 Diabetes Care Platform

**iT1DXpert** is a state-of-the-art, multi-tenant digital health platform designed specifically for the management of Type 1 Diabetes. Built with a robust backend API (Express + Prisma + PostgreSQL) and a polished, role-aware frontend SPA (React + Vite + Tailwind CSS), the application connects patients, endocrinologists, and healthcare administrators. 

The platform leverages advanced Generative AI capabilities (Gemini 3.5 Flash) to assist patients with daily logging, meal analysis, voice interactions, and clinical trends, while providing doctors with clinical tools to monitor patients and manage structured consultations.

---

## 🏗️ System Architecture

The project is structured as a monorepo containing two main directories:
1. **`/backend`**: Node.js & Express REST API using Prisma ORM with a PostgreSQL database. It handles authentication, role-based authorization (RBAC), multi-tenant scoping, and integrates with the Google Gemini API.
2. **`/frontend`**: React Single Page Application (SPA) built on Vite, styled using Tailwind CSS, and animated with Framer Motion. Data visualization is powered by Recharts.

```mermaid
graph TD
    User[Client Browser] -->|React / Vite / Tailwind| FE[Frontend SPA]
    FE -->|HTTP / Axios / JWT| BE[Express REST API]
    BE -->|Prisma ORM| DB[(PostgreSQL Database)]
    BE -->|SDK| Gemini[Gemini 3.5 Flash API]
```

---

## 👥 Role-Based Access Control (RBAC) & Tenancy

The system supports four distinct user roles, isolated at the database level by a strict hospital-scoping tenant layer:

*   **`SUPER_ADMIN`**: Global platform administrator. Manages hospital tenants, provisions roles, and triages support tickets.
*   **`HOSPITAL_ADMIN`**: Hospital-specific administrator. Oversees user accounts and system configuration for their assigned institution.
*   **`DOCTOR`**: Healthcare providers who monitor assigned patient list, review real-time alerts, check trends, view uploaded medical files, and conduct clinical appointments with structured checkup records.
*   **`PATIENT`**: Individuals managing Type 1 Diabetes. Logs glucose, insulin, meal carbs, and physical activity. Interacts with the AI assistant, uploads documents, and schedules appointments.

> [!IMPORTANT]
> **Tenancy Scoping Guarantee:** Every patient-owned row (glucose, insulin, meals, activity, notes, documents, alerts, appointments) carries both a `patientId` and a `hospitalId`. The backend's `scopeToHospital` middleware enforces multi-tenant scoping at the query level, ensuring users can never query or mutate data outside their assigned hospital.

---

## 🚀 Key Features

### 1. Patient Portal & Daily Management
*   **Unified Dashboard:** Displays visual summaries of daily logs, streak trackers, earned badges, weekly exercise goals, upcoming clinic visits, and a quick logging panel.
*   **Manual & custom-timed logging:** Log blood glucose (mg/dL), rapid/long-acting insulin doses (units + event contexts), carbohydrates (g), and physical activities. Supports custom timestamps for past logs.
*   **Insulin Dose Advisor:** Displays interactive combined glucose-insulin correlation charts using Recharts. Provides data-driven insulin advice generated via backend trend analysis.
*   **Medical Documents Vault:** Patients can upload, organize, and view PDF/image files (e.g., lab results, prescriptions) categorized by document type. Files can be linked to scheduled appointments and are automatically shared with the assigned doctor.
*   **Appointments Scheduler:** Book, view, and manage physical clinic or virtual video consultation appointments with care team members or external providers.

### 2. Generative AI Capabilities (CareAI Assistant)
Powered by the **Gemini 3.5 Flash** model, CareAI provides three integrated features:
*   **Multilingual Care AI Agent:** 
    *   Acts as an empathetic virtual assistant with access to the patient's profiles, assigned doctor/hospital, and the past 7 days of logs (glucose, insulin, meals, activity, appointments).
    *   Includes built-in **Speech-to-Text (Voice input)** and a **Language Selector**.
    *   **Dynamic Language Detection:** Automatically responds in the user's input language (fully supports Punjabi/Gurmukhi, Hindi, Spanish, English, etc.) using simple, jargon-free terminology.
    *   **Clinical Safety Guardrails:** Highlights dangerous hyper/hypoglycemia trends and appends a mandatory medical disclaimer referencing the patient's assigned doctor by name.
*   **AI Document Scan (Log OCR Extraction):**
    *   Allows patients to drag and drop handwritten diary logs, lab reports, or device screen photos.
    *   Intelligently understands regional scripts (like Gurmukhi/Punjabi terms: "ਸਵੇਰ" for morning fasting, "ਟੀਕਾ" for insulin, "ਰੋਟੀ" for meals) and extracts structured logs, resolving date formats and calculating compound doses (e.g., "8+3" units -> 11 units) before logging them directly.
*   **Carb & Calorie Finder (Meal Nutrient Analyzer):**
    *   Analyze meals from text descriptions or uploaded food photos.
    *   Estimates calories, portion sizes, carbohydrates, protein, fat, and glycemic impact.
    *   Allows patients to sync the analyzed carbohydrate values into their logs with a single click.

### 3. Doctor Portal & Clinical Oversight
*   **Patient List Directory:** Complete roster of assigned patients with summaries of their diabetes profiles, average glucose readings, and last active timestamps.
*   **Interactive Glucose Monitor:** A detailed dashboard showing glucose trends over a target-range band (70 - 180 mg/dL) alongside a chronological event timeline containing glucose logs, insulin doses, meal details, activity sessions, and patient notes.
*   **Clinical Vitals Sheets:** Log clinical parameters during patient appointments, including weight (kg), height (cm), blood pressure (mmHg), pulse (bpm), temperature (°C), blood glucose, clinician notes, and prescriptions.
*   **Rule-Based Alerts Queue:** Generates automated alerts (e.g., `HIGH_GLUCOSE`, `LOW_GLUCOSE`, `MISSED_LOG`) with configurable severe thresholds per doctor. Allows marking alerts as Read or Resolved.

### 4. Admin Management Dashboard
*   **Hospitals Directory:** Management of active clinics, hospitals, and specialty centers.
*   **User Provisioning:** Create new platform accounts, assign roles, and manage hospital affiliations.
*   **Support Ticket Center:** Monitor, update, and resolve support tickets submitted by doctors and patients.

---

## 🗃️ Database Schema (Prisma Models)

The data model is declared in `backend/prisma/schema.prisma`. Major tables and relations include:

*   **`Hospital`**: The tenant container. All tenant-scoped entities associate here.
*   **`User`**: Core login credentials and role tags. Holds one-to-one relations with `PatientProfile` or `DoctorProfile`.
*   **`PatientProfile`**: Holds demographic settings, visual preference settings, emergency contact info, assigned doctor, and links logs.
*   **`DoctorProfile`**: Practice details, alert threshold values (e.g. customized high/low glucose targets), and notification settings.
*   **`GlucoseLog` / `InsulinLog` / `MealLog` / `ActivityLog`**: Patient clinical logs.
*   **`PatientNote`**: Free-text health logs, merged into the doctor's monitoring timeline.
*   **`Medication` / `MedicationDose`**: Prescribed meds and logging compliance.
*   **`Alert`**: System-generated safety alerts.
*   **`Appointment` / `AppointmentRecord`**: Booked consultation events and corresponding checkup vital sheets.
*   **`StreakRecord` / `Badge` / `PatientBadge`**: Activity logging gamification assets.
*   **`PatientDocument`**: Uploaded file metadata pointing to server assets.
*   **`SupportTicket`**: Help desk entries.

---

## 📁 Repository Structure

```
It1dxpert/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma database schema definition
│   │   └── seed.js            # Mock seeding script (adds hospitals, users, clinical logs)
│   ├── src/
│   │   ├── config/            # Database and app configurations
│   │   ├── controllers/       # Express request controllers
│   │   ├── middleware/        # Authentication, authorization, file upload, & tenancy middleware
│   │   ├── routes/            # API routing modules (grouped by role/dashboard)
│   │   ├── services/          # Business logic layers (AI, records, alerts, streaks)
│   │   ├── utils/             # Helpers (async handlers, formatters)
│   │   ├── app.js             # Express app bootstrap
│   │   └── server.js          # Main server entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/               # Axios client and endpoint configurations
    │   ├── assets/            # Static assets and UI SVGs (e.g., GlucoseWave)
    │   ├── components/        # Shared components (layout AppShell, ProtectedRoute, UI primitives)
    │   ├── config/            # Nav configs and static details
    │   ├── context/           # React AuthState Provider
    │   ├── pages/             # Frontend pages (grouped under /auth, /patient, /doctor, /admin)
    │   ├── utils/             # Front-end date formatters and hooks
    │   ├── App.jsx            # React route router mapping
    │   ├── index.css          # Tailwind CSS global styles
    │   └── main.jsx           # Vite application mount
    ├── .env.example
    ├── tailwind.config.js
    └── package.json
```

---

## 🛠️ Local Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL Database instance
*   Google Gemini API Key (Optional; system falls back to mock clinical data diagnostics if omitted)

### Step 1: Backend Setup
1. Open a terminal and navigate to the `/backend` folder.
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your database credentials and API keys:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/it1dxpert?schema=public"
   JWT_SECRET="your_jwt_signing_secret_key"
   CORS_ORIGINS="http://localhost:3000"
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Apply database migrations and generate the Prisma client:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
6. Populate the database with test data:
   ```bash
   npm run seed
   ```
   > 💡 **Tip:** Save the printed Hospital ID and login details displayed in the console after seeding.
7. Start the backend development server:
   ```bash
   npm run dev
   ```

### Step 2: Frontend Setup
1. Open a separate terminal and navigate to the `/frontend` folder.
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your backend URL and default Hospital ID:
   ```env
   VITE_API_BASE_URL="http://localhost:5000/api"
   VITE_DEFAULT_HOSPITAL_ID="paste-the-seeded-hospital-uuid-here"
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the frontend development server:
   ```bash
   npm run dev
   ```
6. The client portal will run at `http://localhost:3000`.

---

## 🧪 Seeding & Testing Accounts

When running `npm run seed`, the database is populated with test users representing all roles:

| Role | Username / Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | `admin@it1dxpert.com` | `admin123` | Platform Administrator |
| **`DOCTOR`** | `doctor@it1dxpert.com` | `doctor123` | Assigned to clinical patients, configs targets |
| **`PATIENT`** | `patient@it1dxpert.com` | `patient123` | T1D profile, has active logs, appointments, docs |

You can also self-register as a **`PATIENT`** via `/register`. The default Hospital ID from your `.env` file will be auto-filled during sign-up.

---

## 🔒 Security & Safety Disclaimers
*   **Security boundary:** Role-based protection via `ProtectedRoute` on the frontend is a UI convenience. Strict authorization is enforced by the backend Express middleware (`authenticate` -> `authorize` -> `scopeToHospital`) on every REST request.
*   **Clinical Advisor Limitations:** CareAI and the Insulin Advisor are designed to highlight trends and extract records from documents. They do not formulate clinical prescriptions. Users are instructed to consult their endocrinologist prior to making adjustments to their clinical insulin regimen.


  
