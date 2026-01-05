import React, { useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import CameraScreen from './CameraScreen';
import HomeScreen from './HomeScreen';

const App = () => {
  const [mode, setMode] = useState('home');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050505' }}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      {mode === 'home' ? (
        <HomeScreen
          onTakePig={() => setMode('camera')}
        />
      ) : (
        <CameraScreen onClose={() => setMode('home')} />
      )}
    </SafeAreaView>
  );
};

export default App;
