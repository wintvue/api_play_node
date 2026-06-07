const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const rateLimit = require('@fastify/rate-limit');
const cors = require('@fastify/cors');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const VALID_URL_REGEX = /^https?:\/\/.+/i;

async function start() {
    await fastify.register(cors, { origin: true });

    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        keyGenerator: (request) => request.ip,
    });

    fastify.get('/health', async (request, reply) => {
        const health = { status: 'healthy', database: 'connected' };
        try {
            await pool.query('SELECT 1');
        } catch (err) {
            health.database = `disconnected: ${err.message}`;
            health.status = 'unhealthy';
        }
        return reply.send(health);
    });

    fastify.post('/shorten', {
        schema: {
            body: {
                type: 'object',
                required: ['url'],
                properties: {
                    url: { type: 'string', minLength: 1, maxLength: 2048 },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { url } = request.body;

            if (!VALID_URL_REGEX.test(url)) {
                return reply.code(400).send({ error: 'Invalid URL format. URL must start with http:// or https://' });
            }

            const existing = await pool.query('SELECT short_code FROM urls WHERE original_url = $1', [url]);

            if (existing.rows.length > 0) {
                const short_code = existing.rows[0].short_code;
                return reply.send({
                    short_code,
                    short_url: `${BASE_URL}/${short_code}`,
                    original_url: url,
                });
            }

            const code = nanoid(8);
            await pool.query(
                'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) ON CONFLICT (short_code) DO NOTHING',
                [code, url]
            );

            const result = await pool.query('SELECT short_code FROM urls WHERE original_url = $1', [url]);
            return reply.send({
                short_code: result.rows[0].short_code,
                short_url: `${BASE_URL}/${result.rows[0].short_code}`,
                original_url: url,
            });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    fastify.get('/:code/stats', async (request, reply) => {
        try {
            const { code } = request.params;
            const result = await pool.query(
                'SELECT short_code, original_url, clicks, created_at FROM urls WHERE short_code = $1',
                [code]
            );

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'URL not found' });
            }

            const row = result.rows[0];
            return reply.send({
                short_code: row.short_code,
                original_url: row.original_url,
                clicks: Number(row.clicks),
                created_at: row.created_at,
            });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    fastify.get('/:code', async (request, reply) => {
        try {
            const { code } = request.params;
            const result = await pool.query(
                'UPDATE urls SET clicks = clicks + 1, updated_at = now() WHERE short_code = $1 RETURNING original_url',
                [code]
            );

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'URL not found' });
            }

            return reply.redirect(result.rows[0].original_url);
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    try {
        const port = process.env.PORT || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server running on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
