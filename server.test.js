const { test } = require('node:test');
const assert = require('node:assert');

test('URL validation regex matches valid URLs', () => {
    const VALID_URL_REGEX = /^https?:\/\/.+/i;
    assert.ok(VALID_URL_REGEX.test('https://example.com'));
    assert.ok(VALID_URL_REGEX.test('http://example.com/path'));
    assert.ok(VALID_URL_REGEX.test('HTTP://EXAMPLE.COM'));
});

test('URL validation regex rejects invalid URLs', () => {
    const VALID_URL_REGEX = /^https?:\/\/.+/i;
    assert.ok(!VALID_URL_REGEX.test('example.com'));
    assert.ok(!VALID_URL_REGEX.test('ftp://example.com'));
    assert.ok(!VALID_URL_REGEX.test(''));
    assert.ok(!VALID_URL_REGEX.test('not-a-url'));
});
