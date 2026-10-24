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
      const docRef = doc(db, 'tournaments', id);
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.error("Error updating tournament:", error);
      throw error;
    }
  },

  async deleteTournament(id) {
    try {
      const docRef = doc(db, 'tournaments', id);
      await deleteDoc(docRef);
      // Delete associated leaderboard results
      const q = query(collection(db, 'results'), where('competitionId', '==', id));
      const snapshot = await getDocs(q);
      const deletePromises = [];
      snapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, 'results', document.id)));
      });
      await Promise.all(deletePromises);
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
      // 1. Delete any existing results for this student in this tournament
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
      const resultData = {
        ...result,
        competitionId,
        displayName: result.displayName || user?.displayName || result.studentId,
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
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      const userDocRef = doc(db, 'users', cleanUsername);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        throw new Error('Username already exists. Please pick a different one.');
      }

      const passwordHash = await hashPassword(password, cleanUsername);
      const userData = {
        username: cleanUsername,
        displayName: cleanDisplayName,
        passwordHash,
        role: 'user', // Default role. Admin roles must be assigned in database
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, userData);

      const sessionUser = {
        username: cleanUsername,
        displayName: cleanDisplayName,
        role: userData.role
      };

      // F-01 fix: Key studentId on unique cleanUsername, NOT displayName
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
      
      // Check legacy hash fallback if modern hash didn't match
      if (!isMatch && data.passwordHash === legacyHash) {
        isMatch = true;
        // Upgrade legacy hash to modern PBKDF2 in background
        updateDoc(userDocRef, { passwordHash: modernHash }).catch(() => {});
      }

      if (!isMatch) {
        throw new Error('Invalid username or password.');
      }

      const sessionUser = {
        username: data.username || cleanUsername,
        displayName: data.displayName || data.username || cleanUsername,
        role: data.role || 'user'
      };

      // F-01 fix: Key studentId on unique cleanUsername, NOT displayName
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
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      return {
        username: studentId,
        displayName: localStorage.getItem('displayName') || studentId,
        role: localStorage.getItem('isAdmin') === 'true' ? 'admin' : 'user'
      };
    }
    return null;
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return (user && user.role === 'admin') || localStorage.getItem('isAdmin') === 'true';
  }
};
