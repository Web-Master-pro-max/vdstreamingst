# Implementation Plan - Fix Notch Adaptive Issue (Edge-to-Edge Video)

The goal is to allow the application (specifically the video content in the WebView) to cover the entire screen, including the area behind the camera cutout (notch) in both portrait and landscape modes.

## Proposed Changes

### Android Native Configuration

#### [MODIFY] [styles.xml](file:///D:/Dev/mobile/android/app/src/main/res/values/styles.xml)
- Update `AppTheme` to set `android:windowLayoutInDisplayCutoutMode` to `shortEdges`. This allows the window to extend into the cutout area.
- Set `android:statusBarColor` and `android:navigationBarColor` to transparent.
- Enable `android:windowTranslucentStatus` and `android:windowTranslucentNavigation` to allow content to flow behind system bars.

### React Native App Logic

#### [MODIFY] [App.js](file:///D:/Dev/mobile/App.js)
- Replace `SafeAreaView` with a standard `View`. `SafeAreaView` automatically adds paddings to avoid the notch, which prevents the video from being truly fullscreen.
- Update `StatusBar` component to be `translucent` and have a `transparent` background.

## Verification Plan

### Manual Verification
- Deploy the app to an Android device with a notch/cutout.
- Verify that the splash screen and WebView content extend to the edges of the screen.
- Rotate the device to landscape and verify that the black bar near the notch is gone and the video/UI covers that area.
