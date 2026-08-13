const test = require('node:test');
const assert = require('node:assert/strict');
const { ensureDemoUsers } = require('../db');

test('ensureDemoUsers creates demo accounts when the users collection is empty', async () => {
  const result = await ensureDemoUsers();
  assert.ok(Array.isArray(result));
  assert.ok(result.length > 0);
  assert.ok(result.some((user) => user.email === 'admin@wms.com'));
});
