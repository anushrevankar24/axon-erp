# Nginx Setup for Axon ERP

This directory contains nginx configuration files for both local development and production deployment.

## Why Nginx?

Nginx acts as a reverse proxy to:
- Serve frontend and backend on the same domain (no CORS issues)
- Enable ERPNext's built-in multi-tenant functionality
- Mirror production architecture in local development
- Eliminate the need for environment variables

## Architecture

```
User Request → Nginx (Port 80/443) → Routes by path:
  /           → Frontend (Next.js on port 3000)
  /api/*      → Backend (ERPNext on port 8000)
  /assets/*   → Backend
  /files/*    → Backend
```

## Local Development Setup

### Ubuntu / Debian

#### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 2. Copy Configuration

```bash
# Copy the development config
sudo cp nginx/dev.conf /etc/nginx/sites-available/axon-erp-dev

# Create symbolic link to enable it
sudo ln -s /etc/nginx/sites-available/axon-erp-dev /etc/nginx/sites-enabled/

# Remove default config (optional)
sudo rm /etc/nginx/sites-enabled/default
```

#### 3. Test and Reload

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

#### 4. Verify /etc/hosts

Make sure you have this entry:

```bash
echo "127.0.0.1 dev.axonerp.local" | sudo tee -a /etc/hosts
```

### macOS (Homebrew)

#### 1. Install Nginx

```bash
brew install nginx
```

#### 2. Copy Configuration

```bash
# Copy the development config to nginx servers directory
sudo cp nginx/dev.conf /usr/local/etc/nginx/servers/axon-erp-dev.conf
```

#### 3. Test and Restart

```bash
# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo brew services restart nginx

# Or manually:
sudo nginx -s reload
```

#### 4. Verify /etc/hosts

```bash
echo "127.0.0.1 dev.axonerp.local" | sudo tee -a /etc/hosts
```

## Starting Development

Once nginx is configured:

```bash
# 1. Start backend (ERPNext)
cd backend/frappe-bench
bench start

# 2. Start frontend (Next.js) in another terminal
cd frontend
npm run dev

# 3. Access application through nginx
open http://dev.axonerp.local/
```

**Important:** Always access via `http://dev.axonerp.local/` (port 80), NOT `localhost:3000` or `dev.axonerp.local:3000`.

## Verification

### Check Nginx Status

```bash
# Ubuntu/Debian
sudo systemctl status nginx

# macOS
sudo brew services list | grep nginx
```

### Check Port 80 is Listening

```bash
sudo lsof -i :80
# Should show nginx
```

### Test API Routing

```bash
# Should return pong from ERPNext
curl http://dev.axonerp.local/api/method/ping

# Should return Next.js HTML
curl http://dev.axonerp.local/
```

## Troubleshooting

### Port 80 Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# If another service is using it, stop it or change nginx port
```

### Permission Denied

```bash
# On some systems, port 80 requires sudo
# Make sure nginx is running as root/system service
```

### Nginx Not Starting

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration syntax
sudo nginx -t
```

### 502 Bad Gateway

This means nginx is running but can't reach frontend or backend:

```bash
# Check if frontend is running on port 3000
lsof -i :3000

# Check if backend is running on port 8000
lsof -i :8000

# Make sure both services are started
```

### Cannot Access dev.axonerp.local

```bash
# Verify /etc/hosts
cat /etc/hosts | grep axonerp

# Should show:
# 127.0.0.1 dev.axonerp.local

# Ping the domain
ping dev.axonerp.local
# Should resolve to 127.0.0.1
```

## Production Deployment

For production, use `production.conf`:

### 1. Update Domain

Edit `production.conf` and replace `*.erp.com` with your actual wildcard domain.

### 2. SSL Certificate

Obtain a wildcard SSL certificate for your domain:

```bash
# Using Let's Encrypt (certbot)
sudo certbot certonly --dns-cloudflare \
  -d "*.erp.com" \
  -d "erp.com"
```

Update certificate paths in `production.conf`:

```nginx
ssl_certificate /etc/letsencrypt/live/erp.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/erp.com/privkey.pem;
```

### 3. Deploy

```bash
# Copy production config
sudo cp nginx/production.conf /etc/nginx/sites-available/axon-erp-prod

# Enable it
sudo ln -s /etc/nginx/sites-available/axon-erp-prod /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 4. DNS Configuration

Set up wildcard DNS:

```
*.erp.com  A  YOUR_SERVER_IP
```

This allows all subdomains (customer1.erp.com, customer2.erp.com, etc.) to resolve to your server.

## Adding New Customer Sites

With this nginx setup, adding new customers requires NO nginx changes:

```bash
# Simply create a new site in ERPNext
cd /home/frappe/frappe-bench
bench new-site customer999.erp.com \
  --admin-password secure123 \
  --install-app erpnext \
  --install-app your_custom_app

# Site is immediately accessible at https://customer999.erp.com
# No nginx restart needed!
```

The wildcard configuration (`*.erp.com`) automatically routes all subdomains.

## Key Benefits

1. **Zero Environment Variables** - No .env files needed
2. **Production Parity** - Local dev mirrors production exactly
3. **Same-Origin Requests** - No CORS issues
4. **ERPNext Multi-tenancy** - Works as designed with Host header
5. **Scalable** - One config handles unlimited customers
6. **Simple** - Add customers without touching nginx

## Further Reading

- [Nginx Documentation](https://nginx.org/en/docs/)
- [ERPNext Multi-tenant Guide](https://frappeframework.com/docs/user/en/guides/deployment/multi-tenant-guide)
- [Frappe Deployment Best Practices](https://frappeframework.com/docs/user/en/guides/deployment)

