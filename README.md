# Healthcare Platform

Assignment-style layout (aligned with `smart-healthcare-platform` structure):

```
healthcare-platform/
├── frontend/                 # React (Vite + Tailwind) — dashboards, Find a Doctor, booking, payment return URLs
├── backend/
│   ├── auth-service/         # NestJS — JWT auth (/auth/*)
│   ├── doctor-service/       # NestJS — doctor search + profile by id
│   ├── appointment-service/  # NestJS — bookings + RabbitMQ (notifications + payment_success consumer)
│   ├── patient-service/      # NestJS — medical records per patient (JWT)
│   ├── telemedicine-service/ # NestJS — Agora RTC token (JWT)
│   ├── payment-service/      # NestJS — Stripe checkout + webhook → RabbitMQ
│   ├── ai-service/           # NestJS — symptom analysis (JWT PATIENT)
│   ├── notification-service/ # NestJS — RMQ consumer: email + SMS
│   └── common/               # Reserved: shared DTOs / utils (optional future use)
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml    # Full stack (Mongo, RabbitMQ, all APIs, frontend)
│   │   └── services/             # Optional per-service overrides
│   └── kubernetes/               # Manifests + Ingress (nginx)
├── database/
│   ├── mongo-init/           # Optional init/seed scripts
│   └── backups/
├── docs/                     # Architecture diagrams, deployment notes (add as needed)
├── docker-compose.yml        # Includes infrastructure/docker/docker-compose.yml (run from repo root)
└── README.md
```

## Environment files (`.env`) and how to run

### Where to put `.env`

| Location | Purpose |
|----------|---------|
| **`backend/<service>/.env`** | Local Nest dev for that service. Loaded by **`ConfigModule.forRoot()`** when you run `npm run start:dev` from that service folder (current working directory must be the service root). |
| **`frontend/.env`** | Vite dev / build. Only variables starting with **`VITE_`** are exposed to the browser. |
| **Repo root `.env`** | Optional. Docker Compose reads this file for substitutions like `${JWT_SECRET}` when you run `docker compose` from the repo root. |

**Templates:** copy each **`backend/*/.env.example`** and **`frontend/.env.example`** to **`.env`** in the same folder. Copy **`.env.example`** at the repo root to **`.env`** if you use Compose secrets from a file.

**Git:** real `.env` files must not be committed. `frontend/.gitignore` ignores `.env`; add the same for backend if you use a repo-level gitignore.

### Run everything with Docker (simplest)

From the **repository root**:

```bash
docker compose up --build
```

Browser SPA: **http://localhost:8080**. Set secrets via root `.env` or your shell (`JWT_SECRET`, `INTERNAL_SERVICE_KEY`, optional `STRIPE_*`, `SMTP_*`, `GROQ_API_KEY` for ai-service, etc.).

### Run locally (Nest + Vite, Mongo/Rabbit in Docker)

1. Start only infrastructure:

   ```bash
   docker compose up -d mongodb rabbitmq
   ```

2. In **separate terminals**, for each backend service you need:

   ```bash
   cd backend/<service>
   copy .env.example .env   # Windows — or: cp .env.example .env
   npm install
   npm run start:dev
   ```

   Suggested order (ports): **doctor-service** (3000) → **auth-service** (3002) → **appointment-service** (3003) → **patient-service** (3004) → **telemedicine-service** (3005) → **ai-service** (3006) → **payment-service** (3007) → **notification-service** (3008 + RabbitMQ).

3. Frontend:

   ```bash
   cd frontend
   copy .env.example .env
   npm install
   npm run dev
   ```

   Open **http://localhost:5173** (or the URL Vite prints).

Use the **same `JWT_SECRET` and `INTERNAL_SERVICE_KEY`** in every service that validates JWT or calls internal APIs.

## Architecture (high level)

| App            | Role        | Default port | MongoDB        |
|----------------|-------------|--------------|----------------|
| **doctor-service** | `GET /doctors/search`, `GET /doctors/:id` | `3000` | `doctors` collection |
| **appointment-service** | `POST /appointments/book`, `GET /appointments?patientEmail=`, `GET /appointments/patient/:id` (JWT) | `3003` | `appointments` + RabbitMQ |
| **patient-service** | `GET /patients/:id/records` (JWT) | `3004` | `medical_records` |
| **telemedicine-service** | `GET /telecom/token/:channelName` — Agora RTC token (JWT) | `3005` | reads `appointments` for access |
| **auth-service**   | `POST /auth/register`, `/auth/login` | `3002` * | `users` collection |
| **notification-service** | RabbitMQ consumer (`notifications_queue`) + manual SMS API — **Nodemailer** (SMTP) + **Twilio** or mock SMS | `3008` | — |
| **payment-service** | `POST /payments/create-checkout-session`, Stripe **webhook** → `payment_success_queue` | `3007` | — |
| **frontend**       | Landing, Find a Doctor, booking, Stripe redirect, **Patient dashboard**, **Agora video** (`/consultation/:id`) | Vite `5173` | — |

\*If you run **only** the doctor API for the assignment, keep `PORT=3000` so `http://localhost:3000/doctors/search` matches the brief. Run **auth-service** on another port (e.g. `3002`) to avoid clashing.

### Doctor search (backend)

- **Availability schema:** `availability[]` with `{ day, startTime, endTime, maxPatients, isAvailable }` (wall-clock times in **Asia/Colombo**; each slot includes `timeZone: 'Asia/Colombo'` in JSON). Uses **moment-timezone** for time-order helpers.
- **Indexes:** `name`, `specialty`, compound `{ specialty: 1, name: 1 }`, compound `{ 'availability.day': 1, 'availability.isAvailable': 1 }`.
- **Query `day`:** e.g. `?day=Monday` or `Mon` — only doctors with a matching `availability` entry (`isAvailable: true`) are returned.
- **DTO:** `DoctorSearchQueryDto` (`class-validator`) for query params.
- **Layers:** `DoctorsController` → `DoctorsService` → `DoctorRepository` (Mongo query + regex escape).
- **Legacy migration:** If existing documents lack `availability` (old `availabilitySlots` string array), the collection is **cleared** on startup so the new schema can seed (dev-friendly).

### Find a Doctor (frontend)

- Route: **`/find-doctor`**
- **Debounce:** 500ms on name + location before calling the API.
- **UI:** Search + location, specialty chips, **weekday chips** (Asia/Colombo), glass doctor cards, **clickable availability slots**, confirmation modal (name, email, date), **react-hot-toast** on success, redirect to **`/my-appointments`** (guests) or **`/patient/appointments`** (logged-in patients).

### Appointment booking (backend)

- **Concurrency:** unique compound index on `doctorId + appointmentDateKey + slotKey` so two patients cannot persist the same slot; duplicate insert → `409 Conflict`.
- **Doctor check:** HTTP `GET` to **doctor-service** `GET /doctors/:id` and validates the slot (`day`, `startTime`, `endTime`, `isAvailable`). Calendar `appointmentDate` must match the weekday in **Asia/Colombo**.
- **Status:** `PENDING_PAYMENT` on create until Stripe webhook confirms payment → `CONFIRMED`; legacy `PENDING` may exist on old rows. **`paymentStatus`** tracks paid vs pending.
- **RabbitMQ:** publishes Nest-shaped messages to **`notifications_queue`**: `{ pattern: 'appointment_created' \| 'video_call_reminder' \| 'prescription_ready', data: { … } }` for **notification-service** (`@nestjs/microservices` / `@EventPattern`). Booking confirmation on create; **cron** (every minute) emits **video reminders** ~10 minutes before today’s slot (Asia/Colombo); **prescription** events when a doctor issues an Rx.
- **JWT:** `Authorization: Bearer <token>` on **`POST /appointments/book`** links the booking to `patientId` when the token email matches `patientEmail` (PATIENT role). **`GET /appointments/patient/:patientId`** requires JWT; `sub` must equal `:patientId` and role `PATIENT`. Returns appointments by `patientId` or legacy `patientEmail` match.
- **`JWT_SECRET`** must match **auth-service** for verification.

### Patient dashboard (frontend)

- **`/login`** — patient or doctor sign-in (`PATIENT` / `DOCTOR`); other roles are rejected.
- **Protected routes** — `PATIENT` for `/patient/*`; **`/consultation/:appointmentId`** allows **`PATIENT` and `DOCTOR`** (Agora video).
- **`/patient/dashboard`** — welcome header, stat cards (bookings, pending payments, new prescriptions), next appointment, upcoming table with **Join session** → **`/consultation/:appointmentId`** (Agora `agora-rtc-sdk-ng`: remote main + local PiP, mute / camera / end call), recent prescriptions, reports table, AI symptom checker card.
- **`/patient/appointments`**, **`/patient/reports`**, **`/patient/profile`** — sidebar layout with Lucide icons, light blue / white UI, `rounded-[12px]` cards.

### Patient service (medical records)

```bash
cd backend/patient-service
npm install
npm run start:dev
```

```
PORT=3004
MONGO_URI=mongodb://localhost:27017/healthcare-platform
JWT_SECRET=change-me-secret
```

First fetch for a patient seeds demo prescriptions/reports in Mongo (dev-friendly).

### Telemedicine (Agora)

**Security (report note):** Real-time calls use **dynamic tokens** from your backend (`RtcTokenBuilder`, ~1h expiry). The Agora **App ID alone is not enough** — anyone could join without a token + server-side check.

**Backend (telemedicine-service, port `3005`):**

- `GET /telecom/token/:channelName` — `channelName` = **appointment Mongo `_id`** (same string used as the Agora channel).
- **`Authorization: Bearer <JWT>`** required. **`PATIENT`**: `patientId` or `patientEmail` must match the appointment. **`DOCTOR`**: `doctorId` must equal JWT `sub` (for demos, register a doctor user whose auth `id` matches the seeded `doctors._id` in Mongo).
- Response: `{ token, appId, channelName, uid, expiresIn, expiresAt }`.
- Env: `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE` (from Agora Console), `JWT_SECRET`, `MONGO_URI` (same DB as appointments).

Uses npm package **`agora-access-token`** (`RtcTokenBuilder.buildTokenWithUid`). Agora recommends migrating to **`agora-token`** when you upgrade.

```bash
cd backend/telemedicine-service
npm install
npm run start:dev
```

```
PORT=3005
MONGO_URI=mongodb://localhost:27017/healthcare-platform
JWT_SECRET=change-me-secret
AGORA_APP_ID=your-app-id
AGORA_APP_CERTIFICATE=your-app-certificate
```

**Frontend:** `VITE_TELEMEDICINE_API_URL=http://localhost:3005`

## MongoDB & RabbitMQ

```bash
docker compose up -d
# or: docker compose -f infrastructure/docker/docker-compose.yml up -d
```

RabbitMQ management UI: `http://localhost:15672` (default user/pass `guest`/`guest` unless you change the image config).

## Doctor service

```bash
cd backend/doctor-service
npm install
npm run start:dev
```

Environment:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/healthcare-platform
```

On first boot, sample doctors are seeded if the collection is empty (or after legacy migration).

## Appointment service

```bash
cd backend/appointment-service
npm install
npm run start:dev
```

Environment:

```
PORT=3003
MONGO_URI=mongodb://localhost:27017/healthcare-platform
DOCTOR_SERVICE_URL=http://localhost:3000
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=change-me-secret
INTERNAL_SERVICE_KEY=dev-internal-key
```

## Payment service (Stripe)

```bash
cd backend/payment-service
npm install
npm run start:dev
```

```
PORT=3007
RABBITMQ_URL=amqp://localhost:5672
APPOINTMENT_SERVICE_URL=http://localhost:3003
INTERNAL_SERVICE_KEY=dev-internal-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Use Stripe CLI or a public URL to forward webhooks to `POST /payments/webhook`.

## Notification service

Consumes **`notifications_queue`** (same durable queue as appointment-service) and exposes HTTP **`POST /sms/send`** for manual/testing sends.

```bash
cd backend/notification-service
npm install
npm run start:dev
```

Environment:

```
RABBITMQ_URL=amqp://localhost:5672
# Email (optional — without these, HTML is logged to console)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
SMTP_FROM=MediSmart <you@gmail.com>
# SMS (optional — without Twilio, logs: SMS sent to [number]: …)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

Event handlers: **`appointment_created`**, **`video_call_reminder`**, **`prescription_ready`**.

## Auth service (optional)

```bash
cd backend/auth-service
npm install
npm run start:dev
```

Use `PORT=3002` when doctor-service uses `3000`:

```
PORT=3002
MONGO_URI=mongodb://localhost:27017/healthcare-platform
JWT_SECRET=change-me-secret
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Environment (`.env`):

```
# Auth demo (register/login) — if auth runs on 3002
VITE_API_URL=http://localhost:3002

# Doctor search — assignment URL
VITE_DOCTOR_API_URL=http://localhost:3000

# Appointment booking
VITE_APPOINTMENT_API_URL=http://localhost:3003

# Patient records API
VITE_PATIENT_API_URL=http://localhost:3004

# Agora token API
VITE_TELEMEDICINE_API_URL=http://localhost:3005

# AI symptom service
VITE_AI_API_URL=http://localhost:3006

# Payment / Stripe checkout API
VITE_PAYMENT_API_URL=http://localhost:3007
```

## Docker & Kubernetes

**Docker Compose (from repo root):** `docker compose up --build` (root file **includes** `infrastructure/docker/docker-compose.yml`). If `include` is unsupported on your Docker version, run **`docker compose -f infrastructure/docker/docker-compose.yml up --build`** from the repo root.

Published ports: MongoDB `27017`, RabbitMQ `5672` / management `15672`, APIs `3000`–`3008` (including **payment-service** and **notification-service**), SPA **http://localhost:8080**. Set `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, and optional `STRIPE_*`, `SMTP_*`, `TWILIO_*` in `.env` at the repo root (or your shell).

Each Nest app has a **multi-stage `Dockerfile`**. The frontend image builds static assets and serves them with **nginx** (`/health` for probes).

**Kubernetes (`infrastructure/kubernetes/`):** Edit `02-secret.yaml`, then run **`kubectl apply -k infrastructure/kubernetes/`** (or apply the YAMLs in numeric order). Tag images as `healthcare/<service>:latest` (or adjust YAML) and load them into your cluster.

Install **ingress-nginx**, then apply `ingress.yaml`. Map **`healthcare.local`** to your ingress IP. API routes include `/api/payments` → payment-service. Rebuild the frontend with **build-args** documented in `infrastructure/kubernetes/frontend.yaml` so `VITE_*` values use `/api/...` prefixes (same host as the Ingress).
