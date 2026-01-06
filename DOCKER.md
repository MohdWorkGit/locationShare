# Docker Deployment Guide

This guide explains how to run the Live Location Tracker application using Docker.

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)

## Quick Start

1. **Build and start the application:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Docker Commands

### Build and Start

```bash
# Build and start all services in detached mode
docker-compose up -d

# Build and start with logs visible
docker-compose up

# Rebuild containers (useful after code changes)
docker-compose up -d --build
```

### View Logs

```bash
# View logs from all services
docker-compose logs

# View logs from specific service
docker-compose logs server
docker-compose logs client

# Follow logs in real-time
docker-compose logs -f
```

### Stop and Remove

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers, networks, and volumes
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart server
```

## Architecture

The application consists of two Docker containers:

1. **Server Container** (`location-tracker-server`)
   - Node.js backend with Express and Socket.IO
   - Exposed on port 5000
   - Auto-restarts on failure

2. **Client Container** (`location-tracker-client`)
   - React frontend built with Vite
   - Served by Nginx on port 80
   - Proxies API and WebSocket requests to server
   - Auto-restarts on failure

## Production Deployment

For production deployment:

1. Update the ports in `docker-compose.yml` as needed
2. Configure SSL/TLS certificates in nginx
3. Set up environment variables for sensitive data
4. Use Docker secrets for credentials
5. Consider using a reverse proxy (Traefik, Nginx) for HTTPS

## Troubleshooting

### Container won't start
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]
```

### Port already in use
```bash
# Change ports in docker-compose.yml
# For example, change "80:80" to "8080:80"
```

### Rebuild after code changes
```bash
docker-compose down
docker-compose up -d --build
```

### Clear all data and start fresh
```bash
docker-compose down -v
docker-compose up -d --build
```

## Development with Docker

For development, you may want to mount source code as volumes:

```yaml
# Add to docker-compose.yml
volumes:
  - ./server/src:/app/src  # For server
  - ./client/src:/app/src  # For client
```

However, for hot-reloading during development, it's recommended to run the services locally without Docker using `npm run dev`.
