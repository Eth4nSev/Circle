## How to run Circle

Circle is an Expo React Native app that supports iOS and Android.

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the development server

   ```bash
   npx expo start
   ```

3. Run on Android

   ```bash
   npm run android
   ```

   You can use a physical Android device with USB debugging or an Android Studio emulator. For a native Android build, use an Expo development build rather than relying on Expo Go when a native module requires it.

You can also run `npm run ios` for iOS or `npm run web` for the web build.

### Android testing checklist

- Test the system back button and predictive-back gesture on every modal and detail screen.
- Test edge-to-edge layouts on Android  Android 15 and devices with gesture navigation.
- Test image picking, keyboard resize behavior, dark mode, and long captions on a small device.
- Verify Supabase redirect/deep links use the `circle://` scheme.
