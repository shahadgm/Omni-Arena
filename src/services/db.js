import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

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

  async deleteTournament(_id) {
    alert("Disabled until secure sign-in is enabled.");
    throw new Error("Disabled until secure sign-in is enabled.");
  },

  async resetLeaderboard(_competitionId) {
    alert("Disabled until secure sign-in is enabled.");
    throw new Error("Disabled until secure sign-in is enabled.");
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

  async verifyManagePassword(tournamentId, inputPassword) {
    const t = await this.getTournament(tournamentId);
    if (!t) return false;
    if (!t.managePasswordHash) return true;
    const hash = await hashManagePassword(inputPassword);
    return hash === t.managePasswordHash;
  },

  async saveResult(competitionId, result) {
    try {
      const user = authService.getCurrentUser();
      const newRef = doc(collection(db, 'results'));
      const studentId = result.studentId || user?.username || localStorage.getItem('studentId') || 'unknown';
      const plainName = (result.displayName || user?.displayName || localStorage.getItem('displayName') || studentId).replace(/^guest:/, '');
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
      const plainName = (data.name || user?.displayName || localStorage.getItem('displayName') || studentId).replace(/^guest:/, '');
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

// SHA-256 hash for tournament management/editing password
export async function hashManagePassword(password) {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_omni_manage_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
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
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u) {
          u.displayName = (u.displayName || u.username || '').replace(/^guest:/, '');
          return u;
        }
      }
    } catch (e) {}

    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      const isGuest = studentId.startsWith('guest:');
      const plain = (localStorage.getItem('displayName') || studentId).replace(/^guest:/, '');
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

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    if (this.isGuest()) return false;
    const user = this.getCurrentUser();
    return (user && user.role === 'admin') || localStorage.getItem('isAdmin') === 'true';
  }
};
