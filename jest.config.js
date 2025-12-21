module.exports = {
  preset: "react-native",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|expo|@expo|expo-router|@react-navigation|react-native-reanimated)/)"
  ],
  setupFiles: ["<rootDir>/jest.setup.js"],
};
