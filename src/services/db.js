import { db, auth, googleProvider, getSafeAuth, getSafeGoogleProvider } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';

export const dbService = {
  async getTournaments() {
    try {
      const q = query(collection(db, 'tournaments'));
      const snapshot = await getDocs(q);
      const tournaments = [];
      snapshot.forEach(doc => {
        tournaments.push({ id: doc.id, ...doc.data() });
      });
      return tournaments;
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      return [];
    }
  },

  async createTournament(tournament) {
    try {
      const newRef = doc(collection(db, 'tournaments'));
      await setDoc(newRef, tournament);
      return { id: newRef.id, ...tournament };
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  },

  async updateTournament(id, updatedData) {
    try {
      // Security: Never allow updating or overwriting createdBy, creatorName, or createdAt
      const { createdBy: _createdBy, creatorName: _creatorName, createdAt: _createdAt, ...safeData } = updatedData;
      const docRef = doc(db, 'tournaments', id);
      await updateDoc(docRef, safeData);
    } catch (error) {
      console.error("Error updating tournament:", error);
      throw error;
    }
  },

  async deleteTournament(id) {
    try {
      const docRef = doc(db, 'tournaments', id);
      await deleteDoc(docRef);
      // Delete associated leaderboard results if any
      try {
        const q = query(collection(db, 'results'), where('competitionId', '==', id));
        const snapshot = await getDocs(q);
        const deletePromises = [];
        snapshot.forEach((document) => {
          deletePromises.push(deleteDoc(doc(db, 'results', document.id)));
        });
        await Promise.all(deletePromises);
      } catch (err) {
        console.warn("Could not delete associated results:", err);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      throw error;
    }
  },

  async resetLeaderboard(competitionId) {
    try {
      const q = query(collection(db, 'results'), where('competitionId', '==', competitionId));
      const snapshot = await getDocs(q);
      const deletePromises = [];
      snapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, 'results', document.id)));
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error resetting leaderboard:", error);
      throw error;
    }
  },

  async allowStudentRetake(competitionId, studentId) {
    try {
      // 1. Attempt to delete existing results if allowed; ignore error if blocked by firestore rules
      try {
        const q = query(
          collection(db, 'results'),
          where('competitionId', '==', competitionId),
          where('studentId', '==', studentId)
        );
        const snapshot = await getDocs(q);
        const deletePromises = [];
        snapshot.forEach((document) => {
          deletePromises.push(deleteDoc(doc(db, 'results', document.id)));
        });
        await Promise.all(deletePromises);
      } catch (_delErr) {
        // Result deletion is blocked by security rules; continue with retake authorization
      }

      // 2. Authorize retake in tournament document
      const tournamentRef = doc(db, 'tournaments', competitionId);
      const tSnap = await getDoc(tournamentRef);
      if (tSnap.exists()) {
        const currentAllowed = tSnap.data().allowedRetakes || [];
        if (!currentAllowed.includes(studentId)) {
          await updateDoc(tournamentRef, {
            allowedRetakes: [...currentAllowed, studentId]
          });
        }
      }
      return true;
    } catch (error) {
      console.error("Error allowing student retake:", error);
      throw error;
    }
  },

  async consumeRetake(competitionId, studentId) {
    try {
      const tournamentRef = doc(db, 'tournaments', competitionId);
      const tSnap = await getDoc(tournamentRef);
      if (tSnap.exists()) {
        const currentAllowed = tSnap.data().allowedRetakes || [];
        await updateDoc(tournamentRef, {
          allowedRetakes: currentAllowed.filter(s => s !== studentId)
        });
      }
    } catch (error) {
      console.error("Error consuming retake:", error);
    }
  },

  async getTournament(id) {
    try {
      const docRef = doc(db, 'tournaments', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting tournament:", error);
      return null;
    }
  },

  async saveResult(competitionId, result) {
    try {
      const user = authService.getCurrentUser();
      const newRef = doc(collection(db, 'results'));
      const studentId = result.studentId || user?.username || localStorage.getItem('studentId') || 'unknown';
      const plainName = (result.displayName || user?.displayName || localStorage.getItem('displayName') || studentId)
        .replace(/^guest:/, '')
        .replace(/_[a-z0-9]{5,8}$/, '');
      const resultData = {
        ...result,
        studentId,
        competitionId,
        displayName: plainName,
        date: new Date().toISOString()
      };
      await setDoc(newRef, resultData);
      return { id: newRef.id, ...resultData };
    } catch (error) {
      console.error("Error saving result:", error);
      throw error;
    }
  },

  async updateResult(id, updatedData) {
    try {
      const docRef = doc(db, 'results', id);
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.error("Error updating result:", error);
      throw error;
    }
  },

  async hasParticipated(competitionId, studentId) {
    try {
      const q = query(
        collection(db, 'results'),
        where('competitionId', '==', competitionId),
        where('studentId', '==', studentId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking participation:", error);
      return false;
    }
  },

  async getLeaderboard(competitionId) {
    try {
      const q = query(collection(db, 'results'), where('competitionId', '==', competitionId));
      const snapshot = await getDocs(q);
      const data = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      return data.sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if ((b.progress || 0) !== (a.progress || 0)) return (b.progress || 0) - (a.progress || 0);
        if ((b.charsTyped || 0) !== (a.charsTyped || 0)) return (b.charsTyped || 0) - (a.charsTyped || 0);
        return b.wpm - a.wpm;
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  },

  async getStudentHistory(studentId) {
    if (!studentId || studentId.startsWith('guest:') || authService.isGuest()) {
      return [];
    }
    try {
      const q = query(collection(db, 'results'), where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      const history = [];
      snapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });
      return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Error fetching student history:", error);
      return [];
    }
  },

  async getTournamentByCode(code) {
    if (!code) return null;
    try {
      const cleanCode = code.trim().toUpperCase();
      const all = await this.getTournaments();
      return all.find(t => t.accessCode && t.accessCode.trim().toUpperCase() === cleanCode) || null;
    } catch (error) {
      console.error("Error finding tournament by code:", error);
      return null;
    }
  },

  async getUserTournaments(username) {
    if (!username) return [];
    try {
      const all = await this.getTournaments();
      const cleanUser = username.trim().toLowerCase();
      return all.filter(t => t.createdBy && t.createdBy.trim().toLowerCase() === cleanUser);
    } catch (error) {
      console.error("Error fetching user tournaments:", error);
      return [];
    }
  },

  async submitFeedback(data) {
    try {
      const user = authService.getCurrentUser();
      const newRef = doc(collection(db, 'feedback'));
      const studentId = user?.username || localStorage.getItem('studentId') || 'anonymous';
      const plainName = (data.name || user?.displayName || localStorage.getItem('displayName') || studentId)
        .replace(/^guest:/, '')
        .replace(/_[a-z0-9]{5,8}$/, '');
      const payload = {
        type: data.type || 'suggestion',
        category: data.category || 'general',
        title: data.title ? data.title.trim() : '',
        message: data.message.trim(),
        rating: data.rating ? parseInt(data.rating, 10) : null,
        submittedBy: studentId,
        displayName: plainName || 'Anonymous',
        status: 'new',
        createdAt: new Date().toISOString(),
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 140) : ''
      };
      await setDoc(newRef, payload);
      return { id: newRef.id, ...payload };
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  },

  async getFeedbackList() {
    try {
      const q = query(collection(db, 'feedback'));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error("Error fetching feedback list:", error);
      return [];
    }
  },

  async getUsers() {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        list.push({
          username: docSnap.id,
          displayName: d.displayName || docSnap.id,
          role: d.role || 'student',
          status: d.status || 'active',
          suspendedUntil: d.suspendedUntil || null,
          bannedAt: d.bannedAt || null,
          banReason: d.banReason || '',
          createdAt: d.createdAt || null
        });
      });
      return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (err) {
      console.error("Error fetching users:", err);
      return [];
    }
  },

  async suspendUser(username, durationHours, reason) {
    const clean = (username || '').trim().toLowerCase();
    if (clean === 'admin') throw new Error("Cannot suspend Master Admin account.");
    const suspendedUntil = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    const ref = doc(db, 'users', clean);
    await updateDoc(ref, {
      status: 'suspended',
      suspendedUntil,
      banReason: reason?.trim() || 'Suspended by admin',
      updatedAt: new Date().toISOString()
    });
    return { username: clean, status: 'suspended', suspendedUntil };
  },

  async banUser(username, reason) {
    const clean = (username || '').trim().toLowerCase();
    if (clean === 'admin') throw new Error("Cannot ban Master Admin account.");
    const ref = doc(db, 'users', clean);
    await updateDoc(ref, {
      status: 'banned',
      bannedAt: new Date().toISOString(),
      banReason: reason?.trim() || 'Permanently banned by admin',
      updatedAt: new Date().toISOString()
    });
    return { username: clean, status: 'banned' };
  },

  async reactivateUser(username) {
    const clean = (username || '').trim().toLowerCase();
    if (clean === 'admin') throw new Error("Cannot modify Master Admin account.");
    const ref = doc(db, 'users', clean);
    await updateDoc(ref, {
      status: 'active',
      suspendedUntil: null,
      bannedAt: null,
      banReason: null,
      updatedAt: new Date().toISOString()
    });
    return { username: clean, status: 'active' };
  },

  async deleteUser(username) {
    const clean = (username || '').trim().toLowerCase();
    if (clean === 'admin') throw new Error("Cannot delete Master Admin account.");
    const ref = doc(db, 'users', clean);
    await deleteDoc(ref);
    return { username: clean, deleted: true };
  }
};

export async function hashPassword(password, salt = 'omni_arena_default_salt') {
  if (!password) return '';
  const encoder = new TextEncoder();
  const saltBuffer = encoder.encode(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Legacy SHA-256 hash for backward compatibility
async function legacySha256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_omni_arena_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  async register(username, password, displayName) {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanDisplayName = (displayName || '').trim() || cleanUsername;
    
    // Strict username validation: alphanumeric + underscores/hyphens, min 3 chars
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUsername)) {
      throw new Error('Username must be 3-30 characters long and can only contain letters, numbers, hyphens, and underscores.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    try {
      const userDocRef = doc(db, 'users', cleanUsername);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        throw new Error('Username already exists. Please pick a different one.');
      }

      const passwordHash = await hashPassword(password, cleanUsername);
      const role = 'student';

      const userData = {
        username: cleanUsername,
        displayName: cleanDisplayName,
        passwordHash,
        salt: cleanUsername,
        role,
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, userData);

      const sessionUser = {
        username: cleanUsername,
        displayName: cleanDisplayName,
        role
      };

      // Key studentId on unique cleanUsername, NOT displayName
      localStorage.setItem('studentId', cleanUsername);
      localStorage.setItem('displayName', cleanDisplayName);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      localStorage.setItem('isAdmin', 'false');

      return sessionUser;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  },

  async login(username, password) {
    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername || !password) {
      throw new Error('Please enter both username and password.');
    }

    try {
      const userDocRef = doc(db, 'users', cleanUsername);
      const userSnap = await getDoc(userDocRef);

      // S-10 fix: Generic error message to prevent username enumeration
      if (!userSnap.exists()) {
        throw new Error('Invalid username or password.');
      }

      const data = userSnap.data();

      // Check if user is permanently banned or temporarily suspended
      if (data.status === 'banned') {
        throw new Error(`This account has been permanently banned: ${data.banReason || 'Violation of platform policies.'}`);
      }
      if (data.status === 'suspended') {
        if (data.suspendedUntil && new Date(data.suspendedUntil) > new Date()) {
          const untilStr = new Date(data.suspendedUntil).toLocaleString();
          throw new Error(`This account is suspended until ${untilStr}: ${data.banReason || 'Temporary restriction.'}`);
        } else {
          // Suspension duration has elapsed; auto-reactivate
          dbService.reactivateUser(cleanUsername).catch(() => {});
        }
      }

      const modernHash = await hashPassword(password, cleanUsername);
      const legacyHash = await legacySha256(password);

      let isMatch = (data.passwordHash === modernHash);
      
      // Check legacy hash fallback if modern hash didn't match (user updates now blocked)
      if (!isMatch && data.passwordHash === legacyHash) {
        isMatch = true;
      }

      if (!isMatch) {
        throw new Error('Invalid username or password.');
      }

      const sessionUser = {
        username: data.username || cleanUsername,
        displayName: data.displayName || data.username || cleanUsername,
        role: data.role || 'student'
      };

      localStorage.setItem('studentId', sessionUser.username);
      localStorage.setItem('displayName', sessionUser.displayName);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      localStorage.setItem('isAdmin', sessionUser.role === 'admin' ? 'true' : 'false');

      return sessionUser;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  },

  async checkUsernameExists(username) {
    const clean = (username || '').trim().toLowerCase();
    if (!clean) return false;
    try {
      const userDocRef = doc(db, 'users', clean);
      const snap = await getDoc(userDocRef);
      return snap.exists();
    } catch (error) {
      console.error("Error checking username existence:", error);
      return false;
    }
  },

  async checkUserBanStatus(username) {
    const clean = (username || '').trim().toLowerCase();
    if (!clean) return { isBanned: false, isSuspended: false };
    try {
      const userDocRef = doc(db, 'users', clean);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) return { isBanned: false, isSuspended: false };
      const data = snap.data();
      if (data.status === 'banned') {
        return { isBanned: true, reason: data.banReason || 'Banned by administrator.' };
      }
      if (data.status === 'suspended' && data.suspendedUntil && new Date(data.suspendedUntil) > new Date()) {
        return { isSuspended: true, suspendedUntil: data.suspendedUntil, reason: data.banReason || 'Temporarily suspended.' };
      }
      return { isBanned: false, isSuspended: false };
    } catch (_err) {
      return { isBanned: false, isSuspended: false };
    }
  },

  async loginWithGoogle() {
    try {
      const activeAuth = getSafeAuth() || auth;
      const activeProvider = getSafeGoogleProvider() || googleProvider;

      if (!activeAuth || !activeProvider) {
        throw new Error('Google Sign-In is unavailable. Please check if an ad-blocker or browser shield is blocking authentication.');
      }

      const result = await signInWithPopup(activeAuth, activeProvider);
      const user = result.user;
      if (!user) throw new Error("Google Sign-In failed.");

      let matchedUsername = null;
      let matchedData = null;

      // 1. Check if a user with this googleUid exists
      if (user.uid) {
        const qUid = query(collection(db, 'users'), where('googleUid', '==', user.uid));
        const snapUid = await getDocs(qUid);
        if (!snapUid.empty) {
          matchedUsername = snapUid.docs[0].id;
          matchedData = snapUid.docs[0].data();
        }
      }

      // 2. If not found by uid, check by email
      if (!matchedUsername && user.email) {
        const qEmail = query(collection(db, 'users'), where('email', '==', user.email.toLowerCase()));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          matchedUsername = snapEmail.docs[0].id;
          matchedData = snapEmail.docs[0].data();
        }
      }

      // If user exists: check ban & suspension status
      if (matchedUsername && matchedData) {
        if (matchedData.status === 'banned') {
          if (activeAuth && typeof activeAuth.signOut === 'function') {
            await activeAuth.signOut().catch(() => {});
          }
          throw new Error(`This account has been permanently banned: ${matchedData.banReason || 'Policy violation.'}`);
        }
        if (matchedData.status === 'suspended') {
          if (matchedData.suspendedUntil && new Date(matchedData.suspendedUntil) > new Date()) {
            if (activeAuth && typeof activeAuth.signOut === 'function') {
              await activeAuth.signOut().catch(() => {});
            }
            const untilStr = new Date(matchedData.suspendedUntil).toLocaleString();
            throw new Error(`This account is suspended until ${untilStr}: ${matchedData.banReason || 'Temporary restriction.'}`);
          } else {
            // Suspension duration elapsed: auto-reactivate
            dbService.reactivateUser(matchedUsername).catch(() => {});
          }
        }

        const sessionUser = {
          username: matchedData.username || matchedUsername,
          displayName: matchedData.displayName || user.displayName || matchedUsername,
          role: matchedData.role || 'student',
          email: user.email,
          authProvider: 'google'
        };

        localStorage.setItem('studentId', sessionUser.username);
        localStorage.setItem('displayName', sessionUser.displayName);
        localStorage.setItem('user', JSON.stringify(sessionUser));
        localStorage.setItem('isAdmin', sessionUser.role === 'admin' ? 'true' : 'false');
        try { sessionStorage.clear(); } catch (_e) {}

        return sessionUser;
      }

      // If user does NOT exist, register a new organizer profile!
      const emailPrefix = (user.email ? user.email.split('@')[0] : 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 20);
      
      let baseUsername = emailPrefix.length >= 3 ? emailPrefix : `user_${user.uid.slice(0, 6).toLowerCase()}`;
      let finalUsername = baseUsername;

      // Ensure username uniqueness
      const existingDoc = await getDoc(doc(db, 'users', finalUsername));
      if (existingDoc.exists()) {
        const randSuffix = Math.random().toString(36).substring(2, 6);
        finalUsername = `${baseUsername.slice(0, 24)}_${randSuffix}`;
      }

      const cleanDisplayName = (user.displayName || finalUsername).trim().slice(0, 50);
      const role = 'student';

      const newUserData = {
        username: finalUsername,
        displayName: cleanDisplayName,
        email: (user.email || '').toLowerCase(),
        googleUid: user.uid,
        authProvider: 'google',
        passwordHash: 'google_oauth_auth',
        role,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', finalUsername), newUserData);

      const sessionUser = {
        username: finalUsername,
        displayName: cleanDisplayName,
        role,
        email: user.email,
        authProvider: 'google'
      };

      localStorage.setItem('studentId', sessionUser.username);
      localStorage.setItem('displayName', sessionUser.displayName);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      localStorage.setItem('isAdmin', 'false');
      try { sessionStorage.clear(); } catch (_e) {}

      return sessionUser;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed before completing.');
      }
      if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in popup was cancelled.');
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      }
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google Sign-In is not enabled yet in Firebase Console. Please enable Google under Authentication -> Sign-in method.');
      }
      throw error;
    }
  },

  async loginAdmin(username, password) {
    const user = await this.login(username, password);
    if (user.role !== 'admin') {
      this.logout();
      throw new Error('Administrator privileges required.');
    }
    return user;
  },
  
  logout() {
    localStorage.removeItem('studentId');
    localStorage.removeItem('displayName');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    try {
      sessionStorage.clear();
      const activeAuth = getSafeAuth() || auth;
      if (activeAuth && typeof activeAuth.signOut === 'function') {
        activeAuth.signOut().catch(() => {});
      }
    } catch (_e) {}
  },

  getOrCreateDeviceToken() {
    let token = localStorage.getItem('omni_device_token');
    if (!token) {
      token = Math.random().toString(36).substring(2, 8);
      localStorage.setItem('omni_device_token', token);
    }
    return token;
  },

  setGuestContestant(name) {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;
    const token = this.getOrCreateDeviceToken();
    const guestId = `guest:${cleanName.toLowerCase()}_${token}`;
    localStorage.setItem('studentId', guestId);
    localStorage.setItem('displayName', cleanName);
    const sessionUser = {
      username: guestId,
      displayName: cleanName,
      role: 'guest'
    };
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.setItem('isAdmin', 'false');
    try {
      sessionStorage.clear();
    } catch (_e) {}
    return sessionUser;
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u) {
          u.displayName = (u.displayName || u.username || '')
            .replace(/^guest:/, '')
            .replace(/_[a-z0-9]{5,8}$/, '');
          return u;
        }
      }
    } catch (e) {}

    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      const isGuest = studentId.startsWith('guest:');
      const plain = (localStorage.getItem('displayName') || studentId)
        .replace(/^guest:/, '')
        .replace(/_[a-z0-9]{5,8}$/, '');
      return {
        username: studentId,
        displayName: plain,
        role: localStorage.getItem('isAdmin') === 'true' ? 'admin' : (isGuest ? 'guest' : 'student')
      };
    }
    return null;
  },

  isGuest() {
    const user = this.getCurrentUser();
    if (!user) return false;
    const studentId = localStorage.getItem('studentId') || '';
    return user.role === 'guest' || (user.username && user.username.startsWith('guest:')) || studentId.startsWith('guest:');
  },

  canHost() {
    return !this.isGuest() && this.isAuthenticated();
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    if (this.isGuest()) return false;
    const user = this.getCurrentUser();
    return (user && user.role === 'admin') || localStorage.getItem('isAdmin') === 'true';
  }
};
