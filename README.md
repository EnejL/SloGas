# MojAvto

MojAvto is a React Native application for managing and tracking your vehicle-related activities.

## Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd mojAvto
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies:
```bash
cd ios && pod install && cd ..
```

## Development

### Running the App

#### iOS
```bash
# Using npm script
npm run ios

# Using React Native CLI directly (this is the preffered method)
npx react-native run-ios
```

#### Android
```bash
# Using npm script
npm run android

# Using React Native CLI directly
npx react-native run-android
```

### Development Workflow

1. Start Metro bundler (in one terminal):
```bash
npx react-native start
```

2. Run the app (in another terminal):
```bash
# For iOS
npm run ios
# or
npx react-native run-ios

# For Android
npm run android
# or
npx react-native run-android
```

### Common Development Commands

```bash
# Clear Metro bundler cache
npx react-native start --reset-cache

# Clean build (if you encounter build issues)
# For iOS
cd ios && rm -rf build/ && pod install && cd .. && npx react-native run-ios

# For Android
cd android && ./gradlew clean && cd .. && npx react-native run-android
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Debugging

```bash
# Open React Native Debugger
npx react-native-debugger

# Enable remote debugging in the app
# Shake your device or press Cmd+D (iOS) / Cmd+M (Android) in the simulator
```

### Troubleshooting

```bash
# Clear watchman watches
watchman watch-del-all

# Clear npm cache
npm cache clean --force

# Reinstall node modules
rm -rf node_modules
npm install
```

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Update specific package
npm update package-name

# Check for outdated packages
npm outdated
```

## Project Structure

```
mojAvto/
├── android/          # Android native code
├── ios/             # iOS native code
├── components/      # Reusable components
├── screens/         # Screen components
├── utils/           # Utility functions and services
│   ├── translations/ # Internationalization files
│   ├── auth.js      # Authentication utilities
│   ├── firebase.js  # Firebase configuration
│   └── ...          # Other utility files
├── assets/          # Images, fonts, etc.
├── App.js           # Main application component
└── package.json     # Project dependencies
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
