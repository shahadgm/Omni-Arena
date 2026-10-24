import admin from 'firebase-admin';
import fs from 'fs';

// Read service account key from environment variable
const keyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyEnv) {
  console.error('Error: Service account key environment variable not set.');
  console.error('Please set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS to your service account key path or JSON string.');
  console.error('\nPowerShell Example:');
  console.error('  $env:FIREBASE_SERVICE_ACCOUNT_KEY = "C:\\path\\to\\serviceAccountKey.json"');
  console.error('  node scripts/create-admin.mjs <username> <password> [displayName]\n');
  process.exit(1);
}

let serviceAccount;
try {
  if (keyEnv.trim().startsWith('{')) {
    serviceAccount = JSON.parse(keyEnv);
  } else {
    serviceAccount = JSON.parse(fs.readFileSync(keyEnv, 'utf-8'));
  }
} catch (err) {
  console.error('Failed to parse service account key:', err.message);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createAdmin() {
  const [,, rawUsername, password, rawDisplayName] = process.argv;

  if (!rawUsername || !password) {
    console.error('Usage: node scripts/create-admin.mjs <username> <password> [displayName]');
    console.error('Example: node scripts/create-admin.mjs masteradmin MySecretPass123! "Master Admin"');
    process.exit(1);
  }

  const cleanUsername = rawUsername.toLowerCase().trim();
  const displayName = (rawDisplayName || rawUsername).trim();

  if (cleanUsername.length < 3) {
    console.error('Error: Username must be at least 3 characters.');
    process.exit(1);
  }

  if (password.length < 4) {
    console.error('Error: Password must be at least 4 characters.');
    process.exit(1);
  }

  try {
    console.log(`Generating PBKDF2 hash for admin "${cleanUsername}"...`);
    const passwordHash = await hashPassword(password, cleanUsername);

    const userDocRef = db.collection('users').doc(cleanUsername);
    await userDocRef.set({
      username: cleanUsername,
      displayName,
      passwordHash,
      salt: cleanUsername,
      role: 'admin',
      createdAt: new Date().toISOString()
    }, { merge: true });

    console.log(`\nSuccessfully created/updated admin account!`);
    console.log(`Username: ${cleanUsername}`);
    console.log(`Display Name: ${displayName}`);
    console.log(`Role: admin`);
    console.log(`\nYou can now log in at the Admin Login tab on the main page (/)`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin account:', err);
    process.exit(1);
  }
}

createAdmin();
