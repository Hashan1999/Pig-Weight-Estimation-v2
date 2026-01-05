import React, { useState } from 'react';
import {
  Alert,
  Image,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { extractFocalLengthFromTags, readExifFromFile } from './exifUtils';

const requestReadMediaPermission = async () => {
  if (Platform.OS !== 'android') return true;
  const apiLevel = Platform.Version;
  const permissions = [];
  if (apiLevel >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
  } else {
    permissions.push(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
  }
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(result).every(
    (status) => status === PermissionsAndroid.RESULTS.GRANTED
  );
};

const HomeScreen = ({ onTakePig }) => {
  const [previewUri, setPreviewUri] = useState(null);
  const [focalLength, setFocalLength] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [timings, setTimings] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const API_URL = 'https://cynthia-trimetallic-bigly.ngrok-free.dev/predict';
  const processingMs = timings?.total_ms ?? timings?.inference_ms ?? null;
  const timingLabel =
    typeof processingMs === 'number' ? `${Math.round(processingMs)} ms` : processingMs || 'n/a';

  const sendImageForPrediction = async (asset) => {
    if (!asset?.uri) return null;

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || 'pig.jpg',
      type: asset.type || 'image/jpeg',
    });
    formData.append('return_mask', 'false');

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.detail || 'Prediction failed');
    }
    return result;
  };

  const handleUpload = async () => {
    const granted = await requestReadMediaPermission();
    if (!granted) {
      Alert.alert('Permission needed', 'Enable storage/photos to pick an image.');
      return;
    }

    setUploadError(null);
    setPrediction(null);
    setTimings(null);

    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeExtra: true,
      selectionLimit: 1,
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    let focal = asset.exif?.FocalLength ?? asset.exif?.['{Exif}FocalLength'] ?? null;
    if (!focal && asset.uri) {
      const tags = await readExifFromFile(asset.uri);
      focal = extractFocalLengthFromTags(tags);
    }
    setFocalLength(focal);
    if (!focal) {
      Alert.alert('Image loaded', 'No focal length found in EXIF metadata.');
    } else {
      Alert.alert('Image loaded', `Focal length: ${focal}`);
    }

    try {
      setIsUploading(true);
      const predictionResult = await sendImageForPrediction(asset);
      const weight = Number(predictionResult?.predicted_weight_kg);
      setPrediction(Number.isFinite(weight) ? weight : null);
      setTimings(predictionResult?.timings ?? null);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message);
      Alert.alert('Prediction failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>PigCam Studio</Text>
      <Text style={styles.subtitle}>Choose how to add your pig photo</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={onTakePig}>
          <Text style={styles.cardTitle}>Take pig picture</Text>
          <Text style={styles.cardText}>Launch the camera and capture in landscape.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardSecondary]} onPress={handleUpload}>
          <Text style={styles.cardTitle}>Upload pig picture</Text>
          <Text style={styles.cardText}>Pick from your gallery and inspect metadata.</Text>
        </TouchableOpacity>
      </View>

      {previewUri ? (
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>Selected preview</Text>
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
          <Text style={styles.previewMeta}>
            Focal length: {focalLength ? focalLength : 'Not found'}
          </Text>
          {isUploading ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#2ecc71" />
              <Text style={styles.uploadText}>Uploading for prediction...</Text>
            </View>
          ) : null}
          {prediction !== null ? (
            <View style={styles.predictionBox}>
              <Text style={styles.predictionLabel}>Predicted weight (kg)</Text>
              <Text style={styles.predictionValue}>{prediction.toFixed(2)}</Text>
              {timings ? (
                <Text style={styles.predictionMeta}>Processing time: {timingLabel}</Text>
              ) : null}
            </View>
          ) : null}
          {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#c8c8c8',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardContainer: {
    width: '100%',
    gap: 12,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#2ecc71',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSecondary: {
    backgroundColor: '#3498db',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#f3f3f3',
  },
  previewSection: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  previewLabel: {
    color: '#c8c8c8',
    marginBottom: 8,
    fontSize: 14,
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  previewMeta: {
    marginTop: 8,
    color: '#c8c8c8',
  },
  statusRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    color: '#c8c8c8',
  },
  predictionBox: {
    marginTop: 12,
    padding: 12,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#0f2218',
  },
  predictionLabel: {
    color: '#9be7c4',
    fontSize: 14,
  },
  predictionValue: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
  },
  predictionMeta: {
    color: '#a3a3a3',
    marginTop: 6,
  },
  errorText: {
    marginTop: 10,
    color: '#ff7070',
  },
});

export default HomeScreen;
