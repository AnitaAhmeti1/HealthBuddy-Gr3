import React from 'react';
import { render } from '@testing-library/react-native';
import Home from '../app/(tabs)/home';

describe('Home Screen', () => {

  test('renders Home screen correctly (snapshot)', () => {
    const { toJSON } = render(<Home />);
    expect(toJSON()).toMatchSnapshot();
  });

});