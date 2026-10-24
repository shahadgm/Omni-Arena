import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA-LCfXc-65kxzcO0Bz3sDL4qFSBVbtlQc',
  authDomain: 'mr-typist.firebaseapp.com',
  projectId: 'mr-typist',
  storageBucket: 'mr-typist.firebasestorage.app',
  messagingSenderId: '940929482305',
  appId: '1:940929482305:web:ce75770ebafc86e69510c0'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters.');
    process.exit(1);
  }

  try {
    console.log(`Generating PBKDF2 hash for admin "${cleanUsername}"...`);
    const passwordHash = await hashPassword(password, cleanUsername);

    const userDocRef = doc(db, 'users', cleanUsername);
    await setDoc(userDocRef, {
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
    console.log(`\nYou can now log in at: /admin/login`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin account:', err);
    process.exit(1);
  }
}

createAdmin();
