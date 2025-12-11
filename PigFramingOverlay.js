import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PigFramingOverlay = () => {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.verticalGuideLeft} />
      <View style={styles.verticalGuideRight} />
      <View style={styles.horizontalGuide} />
      <View style={styles.textContainer}>
        <Text style={styles.text}>Stand ~2.0 m from the pig</Text>
        <Text style={styles.text}>Hold phone at ~0.75 m height</Text>
        <Text style={styles.text}>Capture pig side view only</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalGuideLeft: {
    position: 'absolute',
    left: '25%',
    top: '10%',
    bottom: '10%',
    width: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.6)',
  },
  verticalGuideRight: {
    position: 'absolute',
    right: '25%',
    top: '10%',
    bottom: '10%',
    width: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.6)',
  },
  horizontalGuide: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.6)',
  },
  textContainer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 12,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 2,
  },
});

export default PigFramingOverlay;
