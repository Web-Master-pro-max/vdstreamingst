package com.infinxanime.app;

import android.app.Activity;
import android.content.Context;
import android.media.AudioManager;
import android.provider.Settings;
import android.view.Window;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DeviceControlsModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "DeviceControls";
    private final ReactApplicationContext reactContext;

    public DeviceControlsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void setBrightness(double brightness, Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                if (promise != null) promise.reject("NO_ACTIVITY", "Current activity is null");
                return;
            }

            final float b = (float) Math.max(0.01, Math.min(1.0, brightness));
            activity.runOnUiThread(() -> {
                try {
                    Window window = activity.getWindow();
                    WindowManager.LayoutParams layoutParams = window.getAttributes();
                    layoutParams.screenBrightness = b;
                    window.setAttributes(layoutParams);
                    if (promise != null) promise.resolve(b);
                } catch (Exception ex) {
                    if (promise != null) promise.reject("ERROR", ex.getMessage());
                }
            });
        } catch (Exception e) {
            if (promise != null) promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void restoreBrightness(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                if (promise != null) promise.resolve(null);
                return;
            }

            activity.runOnUiThread(() -> {
                try {
                    Window window = activity.getWindow();
                    WindowManager.LayoutParams layoutParams = window.getAttributes();
                    layoutParams.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
                    window.setAttributes(layoutParams);
                    if (promise != null) promise.resolve(true);
                } catch (Exception ex) {
                    if (promise != null) promise.reject("ERROR", ex.getMessage());
                }
            });
        } catch (Exception e) {
            if (promise != null) promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getBrightness(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                Window window = activity.getWindow();
                float override = window.getAttributes().screenBrightness;
                if (override >= 0.0f) {
                    promise.resolve((double) override);
                    return;
                }
            }
            int systemBrightness = Settings.System.getInt(
                reactContext.getContentResolver(),
                Settings.System.SCREEN_BRIGHTNESS,
                128
            );
            promise.resolve((double) systemBrightness / 255.0);
        } catch (Exception e) {
            promise.resolve(0.8);
        }
    }

    @ReactMethod
    public void setVolume(double volume, Promise promise) {
        try {
            AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) {
                if (promise != null) promise.reject("NO_AUDIO_SERVICE", "AudioManager is null");
                return;
            }

            int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int targetVol = (int) Math.round(Math.max(0.0, Math.min(1.0, volume)) * maxVol);
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVol, 0);

            if (promise != null) {
                float resultingRatio = (float) targetVol / (float) Math.max(1, maxVol);
                promise.resolve((double) resultingRatio);
            }
        } catch (Exception e) {
            if (promise != null) promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getVolume(Promise promise) {
        try {
            AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) {
                promise.resolve(1.0);
                return;
            }

            int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int currentVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
            double ratio = (double) currentVol / (double) Math.max(1, maxVol);
            promise.resolve(ratio);
        } catch (Exception e) {
            promise.resolve(1.0);
        }
    }
}
