// utils/firebase.js - FINAL CORRECTED VERSION

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// @react-native-firebase initializes automatically from the native config files.
// There is no manual initialization step.

// Get the service instances by calling the imported modules as functions.
const authInstance = auth();
const dbInstance = firestore();

// Export them for use in your app.
export { authInstance as auth, dbInstance as db };