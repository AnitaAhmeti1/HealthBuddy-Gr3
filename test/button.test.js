import React from 'react';
import { Button } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

test('button calls handler on press', () => {
  const onPress = jest.fn();
  const { getByText } = render(<Button title="Press me" onPress={onPress} />);

  fireEvent.press(getByText('Press me'));

  expect(onPress).toHaveBeenCalled();
});
