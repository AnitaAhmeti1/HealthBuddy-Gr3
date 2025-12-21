import React from 'react';
import { render } from '@testing-library/react-native';
import Home from '../app/(tabs)/home';

describe('Home Screen', () => {

  test('renders Home screen correctly (snapshot)', () => {
    const { toJSON } = render(<Home />);
    expect(toJSON()).toMatchSnapshot();
  });

<<<<<<< HEAD
});
=======
});
>>>>>>> d557b194a21811822a9496daca095dcf7ca0585d
