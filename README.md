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
User Request
    │
    ▼
┌─────────────────────────────────────┐
│  Nginx Reverse Proxy (Port 80)     │
│  - Routes by path                   │
│  - / → Frontend                     │
│  - /api/* → Backend                 │
│  - Preserves Host header            │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌──────────┐  ┌──────────────────────┐
│ Frontend │  │  Backend (ERPNext)   │
│ Port 3000│  │  Port 8000           │
│          │  │  - Resolves tenant   │
│ Next.js  │  │    from Host header  │
│ React UI │  │  - Custom axon_erp   │
└──────────┘  └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  MariaDB (Port 3307) │
              │  - Multi-tenant DBs  │
              │  - Site isolation    │
              └──────────────────────┘
```

**Key Principles:**
- **Same-origin requests**: Frontend and backend share the same domain through nginx
- **No CORS**: All requests go through nginx on the same domain
- **No environment variables**: Configuration is fully dynamic
- **ERPNext multi-tenancy**: Backend resolves customer/site from Host header
- **Production parity**: Local development mirrors production exactly

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
- **Nginx** (reverse proxy)
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

3. **Set up Nginx (reverse proxy)**

Nginx routes traffic to frontend and backend services on the same domain, eliminating CORS issues and enabling ERPNext's multi-tenant functionality.

```bash
# Ubuntu/Debian
sudo apt install nginx
sudo cp nginx/dev.conf /etc/nginx/sites-available/axon-erp-dev
sudo ln -s /etc/nginx/sites-available/axon-erp-dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# macOS
brew install nginx
sudo cp nginx/dev.conf /usr/local/etc/nginx/servers/axon-erp-dev.conf
sudo nginx -t
sudo brew services restart nginx
```

See [nginx/README.md](nginx/README.md) for detailed setup instructions.

4. **Set up the frontend**

```bash
cd frontend
npm install
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

- **Application**: http://dev.axonerp.local/ (through nginx, port 80)
- **Backend Admin** (if needed): http://dev.axonerp.local:8000
- **Default Credentials**: `Administrator` / `admin`

**Important:** Always access via `http://dev.axonerp.local/` (port 80 through nginx), NOT `localhost:3000` or `dev.axonerp.local:3000`. The nginx reverse proxy routes requests to the appropriate service.

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
- Domain name (e.g., `customer1.erp.com`, `customer2.erp.com`)
- ERPNext site (isolated database)
- Automatic tenant resolution

### Key Features

1. **Wildcard DNS**: `*.erp.com` → Single server IP
2. **Wildcard Nginx**: One config handles all customer domains
3. **ERPNext Multi-tenancy**: Resolves tenant from Host header
4. **Zero Configuration**: Add customers without touching nginx

### Adding New Customers

No configuration changes needed! Simply create a new site:

```bash
cd /home/frappe/frappe-bench
bench new-site customer999.erp.com \
  --admin-password secure123 \
  --install-app erpnext \
  --install-app axon_erp
```

Site is immediately accessible at `https://customer999.erp.com` - the wildcard nginx config and ERPNext handle everything automatically.

### Production Nginx Configuration

Use the wildcard configuration from [nginx/production.conf](nginx/production.conf):

```nginx
server {
    listen 443 ssl http2;
    server_name *.erp.com;  # Wildcard - handles ALL customers
    
    ssl_certificate /etc/ssl/certs/wildcard.erp.com.crt;
    ssl_certificate_key /etc/ssl/private/wildcard.erp.com.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;  # ERPNext uses this!
    }
}
```

**One config. All customers. Forever.**

## Available Scripts

- `./start.sh` - Start both backend and frontend
- `./stop.sh` - Stop all services
- `./restart.sh` - Restart all services
- `./status.sh` - Check service status

## Troubleshooting

### Nginx Issues

**502 Bad Gateway**
- Check if frontend is running: `lsof -i :3000`
- Check if backend is running: `lsof -i :8000`
- Check nginx error log: `sudo tail -f /var/log/nginx/error.log`

**Cannot access dev.axonerp.local**
- Verify /etc/hosts: `cat /etc/hosts | grep axonerp`
- Ping the domain: `ping dev.axonerp.local` (should resolve to 127.0.0.1)
- Check nginx status: `sudo systemctl status nginx`

**Port 80 already in use**
- Check what's using it: `sudo lsof -i :80`
- Stop conflicting service or change nginx port

### API Errors

**CORS errors**
- Make sure you're accessing via `http://dev.axonerp.local/` (port 80)
- NOT via `localhost:3000` or `dev.axonerp.local:3000`
- Nginx eliminates CORS by serving everything on same domain

**Authentication failures**
- Clear browser cookies
- Restart backend: `cd backend/frappe-bench && bench restart`
- Check backend logs: `tail -f backend/frappe-bench/logs/bench.log`

## Documentation

- [Nginx Setup Guide](./nginx/README.md) - Reverse proxy configuration
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
