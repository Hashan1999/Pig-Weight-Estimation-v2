import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, useCameraDevice, useCameraDevices } from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import PigFramingOverlay from './PigFramingOverlay';

const requestStoragePermissionsIfNeeded = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const apiLevel = Platform.Version;
  // Modern Android uses READ_MEDIA_IMAGES (API 33+) while older versions rely on WRITE_EXTERNAL_STORAGE.
  const permissions = [];
  if (apiLevel >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
  } else {
    permissions.push(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
  }

  const result = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(result).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
};

const CameraScreen = () => {
  const camera = useRef(null);
  const wideDevices = useCameraDevices('wide-angle-camera');
  const defaultDevice = useCameraDevice('back');
  const device = wideDevices?.back || defaultDevice;

  const [cameraPermission, setCameraPermission] = useState('not-determined');
  const [isRequestingPermission, setIsRequestingPermission] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const neutralZoom = device?.neutralZoom ?? device?.minZoom ?? 1;

  const format = useMemo(() => {
    if (!device || !device.formats || device.formats.length === 0) return undefined;
    const targetRatio = 4 / 3;
    return device.formats.reduce((best, current) => {
      const bestRatio = best ? best.photoWidth / best.photoHeight : 0;
      const currentRatio = current.photoWidth / current.photoHeight;
      const bestDiff = Math.abs(bestRatio - targetRatio);
      const currentDiff = Math.abs(currentRatio - targetRatio);
      return currentDiff < bestDiff ? current : best;
    }, device.formats[0]);
  }, [device]);

  useEffect(() => {
    const checkPermissions = async () => {
      const status = await Camera.getCameraPermissionStatus();
      setCameraPermission(status);
      setIsRequestingPermission(false);
    };
    checkPermissions();
  }, []);

  const requestPermissions = useCallback(async () => {
    setIsRequestingPermission(true);
    const cameraStatus = await Camera.requestCameraPermission();
    setCameraPermission(cameraStatus);

    const storageGranted = await requestStoragePermissionsIfNeeded();
    if (!storageGranted) {
      Alert.alert(
        'Storage permission required',
        'Allow storage access so pig photos can be saved to your gallery.',
      );
    }
    setIsRequestingPermission(false);
  }, []);

  const logMetadata = useCallback((photo) => {
    if (!photo) return;
    const { path, width, height, metadata } = photo;
    const uri = Platform.OS === 'android' ? `file://${path}` : path;
    // Log capture details for ML calibration.
    // Metadata may include EXIF values such as focalLength, iso, shutterSpeed, etc. depending on platform support.
    console.log('Photo saved:', uri);
    console.log('Dimensions:', width, height);
    console.log('Metadata:', metadata);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!camera.current) return;
    try {
      setIsSaving(true);
      const photo = await camera.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'speed',
        enableShutterSound: true,
      });
      const uri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
      await requestStoragePermissionsIfNeeded();
      const savedUri = await CameraRoll.save(uri, { type: 'photo' });
      logMetadata(photo);
      Alert.alert('Pig photo saved', savedUri);
    } catch (error) {
      console.error('Failed to capture photo', error);
      Alert.alert('Capture failed', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [logMetadata]);

  if (isRequestingPermission) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.infoText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (cameraPermission !== 'authorized') {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.infoText}>
          Camera permission is required to take pig photos. Please grant access.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.infoText}>Looking for the rear wide camera...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          photo
          zoom={neutralZoom}
          enableZoomGesture={false}
          format={format}
        />
        <PigFramingOverlay />
      </View>
      <View style={styles.captureContainer}>
        <Text style={styles.infoText}>Hold steady at ~2m distance, ~0.75m height</Text>
        <TouchableOpacity style={styles.captureButton} onPress={capturePhoto} disabled={isSaving}>
          <Text style={styles.captureButtonText}>{isSaving ? 'Saving...' : 'Capture'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    flexDirection: 'row',
  },
  cameraContainer: {
    flex: 3,
    backgroundColor: 'black',
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0b0b0b',
  },
  captureButton: {
    marginTop: 16,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    padding: 16,
  },
});

export default CameraScreen;
