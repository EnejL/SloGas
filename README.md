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
cd SloGas
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

A collection of useful commands for building and running the application during development.

### Build commands
Builds the application for the specified platform and profile using EAS.

**Production iOS Build**
```bash
eas build --platform ios --profile production --clear-cache
```

**Development iOS Build**
```bash
eas build --profile development --platform ios --clear-cache
```

### Clean and regenerate native files
Cleans and regenerates the native `ios` and `android` directories. This is useful when native dependencies have been added or changed.

```bash
npx expo prebuild --platform ios --clean
```

### Submit to App Store Connect
Submits the latest successful build to the Apple App Store for review.

```bash
eas submit --platform ios --latest
```

### Start development server
Starts the local development server and launches the app in a simulator or on a connected device.

```bash
npx expo start --dev-client
```
