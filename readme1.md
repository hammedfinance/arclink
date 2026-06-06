# Arclink

> Send and receive USDC using only an email address.

Arclink is a modern payment network built on Arc, Circle, Dynamic, and Supabase that enables users to send and receive USDC without needing to understand wallets, blockchain addresses, gas fees, or crypto infrastructure.

Our mission is to make digital dollar payments as simple as sending an email.

---

# Overview

Traditional crypto payments require users to:

- Create wallets
- Manage private keys
- Copy wallet addresses
- Select networks
- Understand blockchain concepts

Arclink removes this complexity.

Users can:

- Sign up with email
- Automatically receive a wallet
- Send USDC using email addresses
- Receive USDC without sharing wallet addresses
- Track payment history through a familiar fintech interface

The blockchain operates behind the scenes.

---

# Key Features

### Email-Based USDC Transfers

Send USDC using:

```
recipient@email.com
```

instead of:

```
0x8f2c4d6f...
```

---

### Automated Wallet Creation

Wallets are automatically provisioned during onboarding using Dynamic and Circle Wallet infrastructure.

Users never need to manually create wallets.

---

### Consumer-Friendly UX

Inspired by:

- Venmo
- Cash App
- Revolut
- Apple Pay

instead of traditional crypto wallets.

---

### Transaction History

Track:

- Sent payments
- Received payments
- Pending transfers
- Completed settlements

---

### Secure Identity Mapping

Each email address is linked to a wallet identity through Supabase.

This enables email-first payment routing.

---

# Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion

## Authentication

- Dynamic

## Payments

- USDC
- Circle Developer Platform

## Database

- Supabase

## Deployment

- Vercel

---

# Architecture

```text
User
 │
 ▼
Dynamic Authentication
 │
 ▼
User Email Identity
 │
 ▼
Supabase User Record
 │
 ├── Wallet ID
 │
 └── Wallet Address
 │
 ▼
Circle Wallet
 │
 ▼
USDC Transfer
 │
 ▼
Transaction History
```

---

# Core Payment Flow

## Sending Money

1. User enters recipient email
2. Arclink validates recipient
3. Recipient wallet is resolved
4. Circle executes USDC transfer
5. Transaction is recorded
6. Balances update

---

## Receiving Money

1. User shares email address
2. Sender initiates payment
3. USDC arrives in linked wallet
4. Transaction appears in dashboard

---

# Reusable Arc Primitives

Arclink exposes reusable infrastructure for builders:

### Email-to-Wallet Resolution

Maps:

```
user@email.com
```

to

```
wallet_address
```

behind the scenes.

---

### Wallet Provisioning Flow

Automatic wallet creation tied to user identity.

---

### Identity-Based Payments

Send USDC through verified identities instead of wallet addresses.

---

### Transaction Infrastructure

Reusable payment tracking system.

---

# Circle Integration

Arclink uses Circle infrastructure for:

- Wallet management
- USDC transfers
- Settlement
- Payment execution

Current integrations include:

- Circle Wallets
- USDC

Planned future integrations:

- CCTP
- Circle Gas Station
- Additional Circle Developer Services

---

# Dynamic Integration

Dynamic handles:

- User authentication
- Wallet onboarding
- Identity management

Benefits:

- Email login
- Simplified onboarding
- Reduced wallet friction

---

# Supabase Integration

Supabase stores:

## Users

```sql
id
email
wallet_id
wallet_address
created_at
```

## Transactions

```sql
id
sender_email
recipient_email
amount
status
transaction_id
timestamp
```

Supabase powers:

- User identity mapping
- Payment lookup
- Transaction history

---

# Local Development

## Clone Repository

```bash
git clone https://github.com/hammedfinance/arclink.git
```

## Enter Project

```bash
cd arclink
```

## Install Dependencies

```bash
npm install
```

## Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Environment Variables

Create:

```text
.env.local
```

Required variables:

```env
NEXT_PUBLIC_DYNAMIC_ENV_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=

SUPABASE_SERVICE_ROLE_KEY=

ARC_TESTNET_RPC_URL=
```

Do not commit secrets.

---

# Deployment

Arclink is deployed on Vercel.

## Production Deployment

Push changes:

```bash
git add .
git commit -m "Update Arclink"
git push origin main
```

Vercel automatically deploys the latest version.

---

# Security

Arclink validates:

- Email addresses
- Transfer amounts
- Recipient existence
- Duplicate submissions
- Self-transfers

All sensitive operations occur server-side.

---

# Roadmap

### Phase 1

- Email authentication
- Wallet creation
- USDC transfers

### Phase 2

- Enhanced payment analytics
- Improved transaction monitoring
- Better onboarding

### Phase 3

- CCTP integration
- Cross-chain USDC transfers
- Global payments

---

# Vision

Arclink aims to become the easiest way for anyone to send and receive USDC.

Our goal is simple:

**Make digital dollar payments as easy as sending an email.**

---

# Links

Website:
https://your-vercel-url.vercel.app

Repository:
https://github.com/hammedfinance/arclink

Arc Ecosystem:
https://arc.build

Circle:
https://circle.com
