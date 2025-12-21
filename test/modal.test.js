import React from 'react';
import { Modal, View, Text, Button } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

const TestModal = () => {
  const [visible, setVisible] = React.useState(false);
  return (
    <View>
      <Button title="Open Modal" onPress={() => setVisible(true)} />
      <Modal visible={visible} transparent>
        <View>
          <Text>Modal content</Text>
          <Button title="Close Modal" onPress={() => setVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

test('modal visibility toggles on open/close', () => {
  const { queryByText, getByText } = render(<TestModal />);

  expect(queryByText('Modal content')).toBeNull();

  fireEvent.press(getByText('Open Modal'));
  expect(getByText('Modal content')).toBeTruthy();

  fireEvent.press(getByText('Close Modal'));
  expect(queryByText('Modal content')).toBeNull();
});
