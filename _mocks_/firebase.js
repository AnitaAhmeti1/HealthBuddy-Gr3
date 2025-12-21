// Mock për Firebase modular (v9+)
export const auth = {
  onAuthStateChanged: jest.fn((callback) => {
    callback({ uid: "test-uid", displayName: "John Doe", email: "john@example.com" });
    return jest.fn(); // unsubscribe
  }),
  signOut: jest.fn(),
};

export class GoogleAuthProvider {
  constructor() {
    // mock constructor
  }
}

export const getAuth = jest.fn(() => auth);

export const db = {}; // mock Firestore object

export const getFirestore = jest.fn(() => db);

export const collection = jest.fn();
export const doc = jest.fn();
export const setDoc = jest.fn();
export const getDoc = jest.fn();
