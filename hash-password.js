// hash-password.js — ONE-TIME USE ONLY
// Run: node hash-password.js yourpassword
// Copy the hash into Vercel as ADMIN_PASSWORD_HASH
// Then DELETE this file from your repo — it does not belong in production

const bcrypt = require('bcryptjs');
const password = process.argv[2];

if (!password) {
  console.error('\nUsage: node hash-password.js yourpassword\n');
  process.exit(1);
}

if (password.length < 14) {
  console.error('\nPassword too short. Use at least 14 characters.\n');
  process.exit(1);
}

console.log('\nHashing password (this takes a few seconds — that is normal)...\n');

bcrypt.hash(password, 12).then(hash => {
  console.log('='.repeat(70));
  console.log('Add this to Vercel as ADMIN_PASSWORD_HASH:');
  console.log('='.repeat(70));
  console.log(hash);
  console.log('='.repeat(70));
  console.log('\nDo NOT share this hash or your password with anyone.');
  console.log('Delete this file from your repo after you are done.\n');
});
