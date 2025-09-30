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

## Firebase Cloud Functions

The app uses Firebase Cloud Functions to fetch and parse petrol station data from an external API.

### Prerequisites

Before deploying Firebase Functions, ensure you have:

1. **Firebase CLI installed globally:**
```bash
npm install -g firebase-tools
```

2. **Authenticated with Firebase:**
```bash
firebase login
```

This will open a browser window to authenticate with your Google account that has access to the Firebase project.

### Testing the Parser

The `parseOpenHours` function converts inconsistent opening hours strings into structured JSON data. To test the parser locally:

```bash
cd functions
node testParser.js
```

This will run all 289 real-world test cases from the API and display:
- Each input string and its parsed output
- A summary showing success rate
- Any failed test cases (if any)

### Deploying Functions

To deploy the Cloud Functions to Firebase:

```bash
firebase deploy --only functions
```

**What this does:**
- Uploads your Cloud Functions code to Firebase
- Deploys only the functions (won't affect Firestore rules, hosting, etc.)
- Makes the scheduled function (`fetchFuelData`) and HTTP function (`testFetchFuelData`) available

**What happens after deployment:**
- `fetchFuelData` runs automatically every Tuesday at 4:00 AM (Europe/Ljubljana timezone)
- `testFetchFuelData` can be triggered manually via HTTP request

### Manually Triggering Data Update

There are two ways to update the petrol station data without waiting for the scheduled function:

**Option 1: Call the HTTP Test Function (Recommended)**

After deploying, Firebase will provide a URL for `testFetchFuelData`. Call it using:

```bash
curl -X POST https://[your-region]-[your-project-id].cloudfunctions.net/testFetchFuelData
```

Or simply open the URL in your browser.

**Option 2: Use Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Functions
3. Find `testFetchFuelData`
4. Click the URL to trigger it

The function will fetch all petrol station data, parse the opening hours, and update Firestore immediately.
