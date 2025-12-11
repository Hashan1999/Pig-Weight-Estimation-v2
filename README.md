# Pig Weight Camera App

Minimal React Native (0.74.3) app to capture consistent, landscape pig side-view photos with the main rear wide camera. Includes overlay guides, locked 1× zoom, and saves shots to the gallery while logging metadata for ML calibration.

## Project layout
- `App.js`: Entry point wiring the camera screen.
- `CameraScreen.js`: Camera logic, permission handling, capture/save flow, and metadata logging.
- `PigFramingOverlay.js`: Overlay with guide lines and instructional text for framing pigs.
- `package.json`: Dependencies for React Native, `react-native-vision-camera`, and `@react-native-camera-roll/camera-roll`.

## Running the app
1. Install dependencies with your preferred package manager (Node 18.20.8 recommended):
   ```sh
   npm install
   # or
   yarn install
   ```
2. Install native pods (iOS):
   ```sh
   cd ios && pod install
   ```
3. Start Metro and run on device/emulator:
   ```sh
   npm run start
   npm run android
   # or
   npm run ios
   ```

## Key behaviours
- Requests camera (and Android storage) permissions on launch; shows a retry button if denied.
- Uses only the rear **wide/main 1×** camera via `useCameraDevices('wide-angle-camera')`; disables camera switching.
- Locks zoom to the device’s neutral zoom (1×) and disables zoom gestures.
- Chooses a 4:3 photo format when available.
- Landscape-friendly layout with full-screen preview, right-side capture button, and overlay guides.
- Captures photos with `takePhoto`, saves to the gallery via `CameraRoll.save`, then logs URI, dimensions, and any available EXIF metadata.

## Android configuration
Add required permissions and lock orientation in `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest ...>
  <uses-permission android:name="android.permission.CAMERA" />
  <!-- For saving to gallery on Android 13+ -->
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  <!-- For Android 12 and below -->
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

  <application ...>
    <activity
      android:name=".MainActivity"
      android:label="Pig Weight Camera"
      android:screenOrientation="landscape"
      android:exported="true"
      ...>
      <!-- other config -->
    </activity>
  </application>
</manifest>
```

## iOS configuration
Add camera and photo library usage descriptions plus landscape-only orientation in `ios/YourApp/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Capture side-view pig photos for weight estimation.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save pig photos to your photo library for the ML dataset.</string>
<key>UIRequiresPersistentWiFi</key>
<false/>
<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

## Notes
- The overlay uses absolute positioning and `pointerEvents="none"` so the capture button stays tappable.
- Metadata availability depends on the device/OS; logs may include focal length, ISO, shutter speed, etc. when provided by the native camera APIs.
- Keep devices roughly 2m away and 0.75m high as guided by on-screen text for consistent ML-ready captures.
