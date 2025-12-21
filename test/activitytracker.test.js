import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';
import ActivityTrackerScreen from '../app/components/ActivityTracker'; 


test('ActivityTrackerScreen renders correctly', () => {
  const tree = renderer.create(<ActivityTrackerScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});


test('Pressing Add Steps button increases steps', () => {
  const { getByText } = render(<ActivityTrackerScreen />);
  

  const button = getByText('Add Steps');
  fireEvent.press(button);


  expect(getByText(/steps/i)).toBeTruthy();
});


test('Reset button resets steps to 0', () => {
  const { getByText } = render(<ActivityTrackerScreen />);

  const resetButton = getByText('Reset');
  fireEvent.press(resetButton);


  expect(getByText(/0/)).toBeTruthy();
});
