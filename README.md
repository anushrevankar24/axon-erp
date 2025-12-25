# Axon ERP

A modern, full-stack ERP system built on **ERPNext** with a custom **Next.js** frontend. Designed for multi-tenant deployments where each customer gets their own domain and branded experience.

## Features

- **Modern UI**: Custom Next.js 16 frontend with shadcn/ui components and Tailwind CSS
- **ERPNext Backend**: Full ERPNext functionality with custom app integration
- **Authentication**: Username/password and Google OAuth support
- **Dynamic Views**: Generic list and form views for all 500+ DocTypes
- **Dashboard**: Real-time KPI cards and transaction monitoring
- **Multi-tenant Ready**: Dynamic routing - each customer has their own domain
- **Real-time Updates**: WebSocket support for live data
- **Advanced Search**: Full-text search across all modules
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Architecture

```
┌─────────────────────────────────────┐
│  Next.js Frontend (Port 3000)      │
│  - Modern React UI                  │
│  - shadcn/ui + Tailwind CSS        │
│  - Dynamic DocType Views            │
│  - Real-time Dashboard              │
└──────────────┬──────────────────────┘
               │ HTTP/REST API
               │ frappe-js-sdk
┌──────────────▼──────────────────────┐
│  ERPNext Backend (Port 8000)        │
│  - Frappe Framework                 │
│  - Custom axon_erp App              │
│  - RESTful APIs                     │
│  - Business Logic Layer             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  MariaDB Database (Port 3307)       │
│  - Multi-site Architecture          │
│  - Customer Data Isolation          │
└─────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with React 19 and TypeScript
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query)
- **Tables**: TanStack Table
- **Forms**: React Hook Form + Zod validation
- **API Client**: frappe-js-sdk
- **Charts**: Recharts

### Backend
- **Framework**: ERPNext (Frappe Framework)
- **Language**: Python 3.10+
- **Database**: MariaDB 10.6+
- **Cache**: Redis
- **Task Queue**: Redis Queue (RQ)
- **Real-time**: Socket.IO

## Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.10+
- **MariaDB** 10.6+
- **Redis** 6.0+
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone git@github.com:anushrevankar24/axon-erp.git
cd axon-erp
```

2. **Set up the backend (ERPNext)**

```bash
# Install Frappe Bench
pip install frappe-bench

# Create a new site for development
cd backend/frappe-bench
bench new-site dev.axonerp.local --admin-password admin --db-port 3307

# Install ERPNext
bench get-app erpnext
bench --site dev.axonerp.local install-app erpnext

# Install custom Axon ERP app
bench --site dev.axonerp.local install-app axon_erp

# Set up hosts file (Linux/Mac)
echo "127.0.0.1 dev.axonerp.local" | sudo tee -a /etc/hosts
```

3. **Set up the frontend**

```bash
cd frontend
npm install
```

4. **Configure environment variables**

For development, create `frontend/.env.local`:
```bash
NEXT_PUBLIC_ERPNEXT_URL=http://dev.axonerp.local:8000
NEXT_PUBLIC_SITE_NAME=dev.axonerp.local
NODE_ENV=development
```

5. **Start the services**

```bash
# From the project root
./start.sh
```

Or manually:

```bash
# Terminal 1 - Backend
cd backend/frappe-bench
bench start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the application**

- **Frontend**: http://localhost:3000
- **Backend Admin**: http://dev.axonerp.local:8000
- **Default Credentials**: `Administrator` / `admin`

## Development

### Project Structure

```
axon-erp/
├── frontend/                 # Next.js Frontend
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Main dashboard layout
│   │   ├── (list-view)/    # List view pages
│   │   └── (document-view)/ # Document/form pages
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layout/         # Layout components
│   │   ├── list/           # List view components
│   │   ├── forms/          # Form components
│   │   └── document/       # Document view components
│   └── lib/                # Utilities and API clients
│       └── api/            # Frappe API integration
├── backend/
│   └── frappe-bench/
│       └── apps/
│           └── axon_erp/   # Custom Frappe app
│               ├── axon_erp/
│               │   ├── api.py        # Custom API endpoints
│               │   ├── hooks.py      # Frappe hooks
│               │   └── config/       # Module configuration
│               └── pyproject.toml
├── start.sh                # Start both services
├── stop.sh                 # Stop both services
├── restart.sh              # Restart services
└── QUICK_START.md         # Detailed setup guide
```

### Adding shadcn/ui Components

```bash
cd frontend
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add calendar
npx shadcn@latest add date-picker
```

### Making Changes

**Frontend changes:**
- Edit files in `frontend/` directory
- Next.js auto-reloads with Turbopack
- Changes appear immediately

**Backend changes:**
- Edit files in `backend/frappe-bench/apps/axon_erp/`
- Bench auto-reloads Python code
- For DB schema changes, run migrations:
  ```bash
  bench --site dev.axonerp.local migrate
  ```

## Authentication

### Username/Password
- Default admin: `Administrator` / `admin`
- Create users via ERPNext User DocType

### Google OAuth (Optional)
1. Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Configure in ERPNext: Settings → Integrations → Social Login Key
3. Add Client ID and Secret
4. Enable "Sign ups: Allow" for Google signup

## Multi-tenant Deployment

This system is designed for multi-tenant deployments where each customer has their own:
- Domain name (e.g., `customer1.axonerp.com`, `customer2.axonerp.com`)
- ERPNext site (isolated data)
- Branded frontend experience

### Dynamic Routing
The frontend automatically detects the backend URL based on the current hostname:

- **Development**: `protocol://hostname:8000`
- **Production**: `protocol://hostname` (Nginx proxies to backend)

No hardcoded URLs - each customer's frontend connects to their own backend automatically.

### Production Deployment with Nginx

```nginx
# Example Nginx configuration for customer1.axonerp.com
server {
    listen 80;
    server_name customer1.axonerp.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API (ERPNext)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Frappe-Site-Name customer1.axonerp.com;
    }

    # Backend assets
    location /assets {
        proxy_pass http://localhost:8000;
    }
}
```

## Available Scripts

- `./start.sh` - Start both backend and frontend
- `./stop.sh` - Stop all services
- `./restart.sh` - Restart all services
- `./status.sh` - Check service status

## Documentation

- [Quick Start Guide](./QUICK_START.md) - Detailed setup and first steps
- [Frappe Framework Docs](https://frappeframework.com/docs)
- [ERPNext Documentation](https://docs.erpnext.com)
- [Next.js Documentation](https://nextjs.org/docs)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Copyright © 2024 Axon Intelligence. All rights reserved.

## Team

**Axon Intelligence**
- Email: anush@axonintel.tech
- GitHub: [@anushrevankar24](https://github.com/anushrevankar24)

## Issues & Support

For bugs, feature requests, or support:
- Open an issue on [GitHub](https://github.com/anushrevankar24/axon-erp/issues)
- Email: anush@axonintel.tech

## Acknowledgments

- Built on [ERPNext](https://erpnext.com) - Open source ERP
- [Frappe Framework](https://frappeframework.com) - Full-stack web framework
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Next.js](https://nextjs.org) - The React framework

---

Made with care by Axon Intelligence
