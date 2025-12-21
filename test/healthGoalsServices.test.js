jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

import { loadHealthGoals } from '../services/healthGoalsServices';

describe('loadHealthGoals', () => {
  test('calls setGoals with mapped documents from snapshot', () => {
    const { onSnapshot } = require('firebase/firestore');
    const user = { uid: 'user1' };
    const setGoals = jest.fn();

    const docs = [
      { id: 'g1', data: () => ({ title: 'T1', category: 'c1', target: 5, completed: false }) },
      { id: 'g2', data: () => ({ title: 'T2', category: 'c2', target: 10, completed: true }) },
    ];

    onSnapshot.mockImplementation((q, callback) => {
      callback({ docs });
      return jest.fn();
    });

    loadHealthGoals(user, setGoals);

    expect(setGoals).toHaveBeenCalledWith([
      { id: 'g1', title: 'T1', category: 'c1', target: 5, completed: false },
      { id: 'g2', title: 'T2', category: 'c2', target: 10, completed: true },
    ]);
  });
});
