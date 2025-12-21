jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => {
  const signInWithEmailAndPassword = jest.fn(() =>
    Promise.resolve({ user: { uid: '123' } })
  );
  return {
    getAuth: jest.fn(() => ({ signInWithEmailAndPassword })),
    signInWithEmailAndPassword, 
  };
});

import { getAuth } from 'firebase/auth';

test('Firebase login mock works', async () => {
  const auth = getAuth();
  const user = await auth.signInWithEmailAndPassword('test@test.com', 'password');
  expect(user.user.uid).toBe('123');

  expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
    'test@test.com',
    'password'
  );
});
