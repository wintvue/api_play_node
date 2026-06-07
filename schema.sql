CREATE SEQUENCE IF NOT EXISTS urls_id_seq;

CREATE TABLE IF NOT EXISTS urls (
    id BIGINT PRIMARY KEY DEFAULT nextval('urls_id_seq'::regclass),
    short_code VARCHAR(10) NOT NULL,
    original_url TEXT NOT NULL,
    clicks BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_original_url ON urls(original_url);
