import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';

describe('LoginScreen', () => {
  test('Shows error when email and password are empty', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), '');
    fireEvent.changeText(getByPlaceholderText('Password'), '');
    fireEvent.press(getByText('Login'));
    
    expect(getByText('Both fields are required')).toBeTruthy();
  });

  test('Shows error when email format is invalid', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.press(getByText('Login'));
    
    expect(getByText('Email is not valid')).toBeTruthy();
  });

  test('Login button works with valid input (mock auth)', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');

    jest.mock('firebase/auth', () => ({
      signInWithEmailAndPassword: jest.fn().mockResolvedValue({}),
    }));

    fireEvent.press(getByText('Login'));
    
    expect(() => getByText('Both fields are required')).toThrow();
    expect(() => getByText('Email is not valid')).toThrow();
  });

  test('Google button renders', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Continue with Google')).toBeTruthy();
  });

  test('Register link renders', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Register now')).toBeTruthy();
  });
});
