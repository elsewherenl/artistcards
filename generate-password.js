#!/usr/bin/env node

/**
 * Password Hash Generator for auth.js
 *
 * Usage:
 *   node generate-password.js yourNewPassword
 *
 * This will output the SHA-256 hash that you need to paste into auth.js
 */

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
    console.error('❌ Error: Please provide a password');
    console.log('\nUsage:');
    console.log('  node generate-password.js yourNewPassword\n');
    process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\n✅ Password hash generated!\n');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nTo use this password:');
console.log('1. Open auth.js');
console.log('2. Find the line: const PASSWORD_HASH = \'...\';');
console.log('3. Replace the hash with:', hash);
console.log('\n');
