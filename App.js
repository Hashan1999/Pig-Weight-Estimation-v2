import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import CameraScreen from './CameraScreen';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar hidden />
      <CameraScreen />
    </SafeAreaView>
  );
};

export default App;
