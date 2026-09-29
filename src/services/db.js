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
      snapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'results', document.id));
      });
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
      const newRef = doc(collection(db, 'results'));
      const resultData = {
        ...result,
        competitionId,
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
  }
};

export const authService = {
  async loginAdmin(username, password) {
    // Artificial delay to simulate auth network request
    await new Promise(resolve => setTimeout(resolve, 500));
    if (username.toLowerCase() === 'sibaqadmin' && password === 'xrby2906') {
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    throw new Error('Invalid credentials');
  },
  
  logout() {
    localStorage.removeItem('isAdmin');
  },

  isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
  }
};
