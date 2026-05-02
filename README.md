# PremiumSupply

Inventory and order management system for **Premium Food Service**, a government food service contractor. Replaces a paper-based system for tracking inventory, logging usage, and managing purchase orders.

---

## Features

- **Microsoft Entra ID (Azure AD) SSO** — no local accounts, no email/password
- **Role-based access control** — Super Admin, Manager, Warehouse Staff, Viewer
- **Admin dashboard** — inventory CRUD, order management, reports, user management, audit log
- **Mobile PWA** — installable, warehouse-optimized UI for stock counts, receiving, and usage logging
- **PostgreSQL + Prisma ORM** — full audit trail, stock history, order lifecycle

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js v5 + Microsoft Entra ID |
| Database | PostgreSQL + Prisma ORM |
| Charts | Recharts |
| PWA | Web Manifest + Service Worker |

---

## Roles

| Role | Capabilities |
|---|---|
| `SUPER_ADMIN` | Full access including user management and deletion |
| `MANAGER` | Approve orders, all reports, inventory settings, vendor management |
| `WAREHOUSE_STAFF` | Stock counts, receive orders, log usage |
| `VIEWER` | Read-only access to inventory and reports |

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Azure AD app registration (see Auth Setup below)

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/premiumsupply"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
AZURE_AD_CLIENT_ID="<from Azure portal>"
AZURE_AD_CLIENT_SECRET="<from Azure portal>"
AZURE_AD_TENANT_ID="<your tenant ID>"
```

### 3. Database Setup

```bash
# Start PostgreSQL (Docker)
docker compose up db -d

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Azure AD App Registration

1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Name: `PremiumSupply`
3. Supported account types: **Accounts in this organizational directory only**
4. Redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. After creation, note the **Application (client) ID** and **Directory (tenant) ID**
6. Go to **Certificates & secrets** → **New client secret** — copy the value immediately

For production, add your production callback URL:
```
https://your-domain.com/api/auth/callback/microsoft-entra-id
```

---

## First User Setup

The first person to sign in via Microsoft will receive the **VIEWER** role. To grant Super Admin:

```bash
npm run db:studio
```

In Prisma Studio, find the User and change `role` to `SUPER_ADMIN`.

---

## Docker Deployment

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Build and start all services
docker compose up --build -d
```

The app will be available on port 3000. For production, place behind nginx/Caddy with TLS.

---

## Inventory CSV Import

Admins can import inventory via CSV. Required columns:

```
name,sku,category,unit,parLevel,reorderPoint,quantity,costPerUnit
```

Optional columns: `location`, `vendor`, `notes`

Existing SKUs are updated; new SKUs are created. Download a template from the Inventory page.

---

## Order Workflow

```
DRAFT → SUBMITTED → APPROVED → ORDERED → RECEIVED → CLOSED
```

| Status | Action |
|---|---|
| `DRAFT` | Manager creates; can edit line items |
| `SUBMITTED` | Manager submits for approval |
| `APPROVED` | Manager approves; can now place with vendor |
| `ORDERED` | Manager marks as sent to vendor |
| `RECEIVED` | Warehouse staff confirms quantities received |
| `CLOSED` | Manager closes after discrepancy review |

---

## Project Structure

```
app/
  (auth)/login/         # Microsoft sign-in page
  (admin)/              # Desktop admin dashboard (SUPER_ADMIN, MANAGER)
    dashboard/          # Overview with stats + alerts
    inventory/          # CRUD + CSV import
    orders/             # Purchase order lifecycle
    reports/            # Valuation, usage, spend charts
    users/              # User role management
    vendors/            # Vendor CRUD
    audit-log/          # Full audit trail
  (mobile)/m/           # Mobile PWA (all roles)
    count/              # Sequential stock counting
    receive/            # Receive incoming orders
    usage/              # Log consumption
    alerts/             # Low stock list
    inventory/          # Browse inventory
  api/auth/             # NextAuth handler
  offline/              # PWA offline fallback

actions/                # Server Actions (all mutations)
components/
  ui/                   # shadcn-style base components
  admin/                # Admin-specific components
  mobile/               # Mobile-specific components
  shared/               # Cross-cutting components
lib/
  auth.ts               # NextAuth config
  db.ts                 # Prisma singleton
  permissions.ts        # RBAC permission table
  audit.ts              # Audit log helper
  utils.ts              # Formatters + helpers
prisma/
  schema.prisma         # Data model
  seed.ts               # Sample data (35+ food service items)
```

---

## PWA Installation

On Android/Chrome: tap the **"Add to Home Screen"** prompt that appears after a few visits.

On iOS/Safari: tap **Share** → **Add to Home Screen**.

The app will launch in standalone mode without browser chrome, optimized for warehouse floor use.
