# Leasing Management System

**English** | [Русский](README.ru.md)

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-1.11-008ECF)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-GORM-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/auth-JWT-black)

A web application for a leasing company: clients, equipment catalogue, leasing contracts, a payment calculator and a statistics dashboard. Built as a university coursework project.

**Live demo:** <https://dariaef675.github.io/leasing/> — the frontend running in the browser on sample data, without a server. You can sign in as any role from the bar at the bottom.

The backend is a REST API written in Go (Gin + GORM + PostgreSQL). The frontend is a single-page application in plain JavaScript, served by the same binary.

## Features

- **Authentication** — registration and login, JWT in the `Authorization: Bearer` header, passwords hashed with bcrypt.
- **Three roles** — Administrator, Manager and Client, with access checks on every endpoint.
- **Clients** — customer records with company details (INN, address, contacts).
- **Equipment** — catalogue of leased assets with cost, status and the client it is assigned to.
- **Contracts** — a client submits an application, a manager processes it; statuses go `pending → in_processing → active → completed`. Monthly payment and total amount are calculated automatically.
- **Leasing calculator** — public endpoint, annuity or decreasing payments, interest rate depends on the equipment category.
- **Statistics** — dashboard for managers and administrators (charts are drawn with Chart.js).
- **User management** — administrators create, edit, approve and delete accounts.
- **Soft delete** for all entities.

## Roles

| Action | Client | Manager | Administrator |
|---|:---:|:---:|:---:|
| Use the calculator, edit own profile | ✅ | ✅ | ✅ |
| Apply for a contract, view own contracts and equipment | ✅ | ✅ | ✅ |
| Manage clients and equipment | — | ✅ | ✅ |
| Process contracts, change their status | — | ✅ | ✅ |
| View statistics | — | ✅ | ✅ |
| Manage users | — | — | ✅ |

Self-registration always creates a Client. Manager and Administrator accounts are created by the seed script or by an administrator.

## Tech stack

| Layer | Technology |
|---|---|
| Language | Go 1.25 |
| HTTP | [Gin](https://github.com/gin-gonic/gin) |
| ORM | [GORM](https://gorm.io) with the PostgreSQL driver, auto-migrations |
| Auth | [golang-jwt](https://github.com/golang-jwt/jwt), bcrypt |
| Frontend | HTML, CSS, vanilla JavaScript, Chart.js |

## Project structure

```
.
├── main.go          # entry point, routing
├── config/          # configuration from environment / .env
├── database/        # connection and auto-migration
├── models/          # User, Client, Equipment, Contract
├── handlers/        # HTTP handlers
├── middleware/      # JWT authentication, role check
├── utils/           # JWT, password hashing, leasing calculator
├── scripts/         # database setup and seed scripts
└── static/          # frontend (index.html, css, js)
```

## Getting started

Requirements: Go 1.25+ and PostgreSQL.

```bash
git clone https://github.com/dariaef675/leasing.git
cd leasing

# 1. Configuration
cp .env.example .env        # then set your own DB_PASSWORD and JWT_SECRET

# 2. Database
createdb -U postgres leasing_db

# 3. Run (tables are created automatically on startup)
go run main.go

# 4. Optional: create administrator and manager accounts
go run scripts/seed_users.go
```

The application is available at <http://localhost:8082>.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | — | Database password |
| `DB_NAME` | `leasing_db` | Database name |
| `DB_SSLMODE` | `disable` | SSL mode |
| `SERVER_HOST` | `0.0.0.0` | Address to listen on |
| `SERVER_PORT` | `8082` | Port to listen on |
| `JWT_SECRET` | — | Key used to sign tokens |

### Seed accounts

`scripts/seed_users.go` creates demo accounts for local use:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@leasing.local` | `Admin123!` |
| Manager | `manager@leasing.local` | `Manager123!` |

## API

Base path: `/api/v1`. All endpoints except the public ones require the `Authorization: Bearer <token>` header.

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/register` | public | Register a client account |
| `POST` | `/login` | public | Log in, returns a JWT |
| `POST` | `/calculate-lease` | public | Calculate a monthly payment |
| `GET` `PUT` | `/profile` | any role | View and edit own profile |
| `GET` | `/stats` | Manager, Administrator | Dashboard statistics |
| `GET` `POST` | `/clients` | Manager, Administrator | List and create clients |
| `GET` `PUT` `DELETE` | `/clients/:id` | Manager, Administrator | Read, update, delete a client |
| `GET` | `/equipment`, `/equipment/:id` | any role | Clients see only their own equipment |
| `POST` `PUT` `DELETE` | `/equipment`, `/equipment/:id` | Manager, Administrator | Manage equipment |
| `GET` `POST` | `/contracts`, `/contracts/:id` | any role | Clients see and create only their own |
| `PUT` `DELETE` | `/contracts/:id` | Manager, Administrator | Process and delete contracts |
| `GET` `POST` `PUT` `DELETE` | `/users`, `/users/:id` | Administrator | User management |

There is also `GET /health` for a liveness check.

### Calculator example

```bash
curl -X POST http://localhost:8082/api/v1/calculate-lease \
  -H "Content-Type: application/json" \
  -d '{"asset_value": 3000000, "contract_term": 36, "category": "грузовой", "payment_type": "even"}'
```

```json
{ "monthly_payment": 102532.89 }
```

`payment_type` is `even` (annuity) or `decreasing`. The annual rate is chosen by category:

| Category | Rate |
|---|---|
| `легковой` (passenger car) | 12% |
| `коммерческий` (commercial vehicle) | 13% |
| `грузовой` (truck) | 14% |
| `спецтехника` (special machinery) | 15% |
| `сельхозтехника` (agricultural machinery) | 16% |
| `оборудование` (equipment) | 17% |

The annuity payment is calculated as

```
A = P · r · (1 + r)^n / ((1 + r)^n − 1)
```

where `P` is the asset value, `r` is the monthly rate and `n` is the term in months.

## Author

Daria Efimova — [@dariaef675](https://github.com/dariaef675)
