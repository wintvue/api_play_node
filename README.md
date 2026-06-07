# URL Shortener API

High-performance URL shortener built with Fastify and PostgreSQL.

## Setup

1. Use Node.js 22 (LTS):
```bash
nvm use
```

2. Install dependencies:
```bash
npm install
```

2. Create PostgreSQL database and run schema:
```bash
psql -U postgres -d url_shortener -f schema.sql
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Start server:
```bash
node server.js
```

## API Endpoints

### Shorten URL
```
POST /shorten
Content-Type: application/json

{
  "url": "https://example.com/very-long-url"
}

Response:
{
  "code": "abc123"
}
```

### Redirect
```
GET /:code

Redirects to original URL
```

## Performance

Optimized for high throughput with:
- Connection pooling (20 connections)
- Prepared statements
- Minimal middleware
- Direct database queries
