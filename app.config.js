export default {
  "expo": {
    "name": "SloGas",
    "slug": "slogas",
    "version": "1.0.0", 
    "orientation": "portrait",
    "icon": "./assets/app-icon-ios.png",
    "splash": {
      "image": "./assets/splashscreen.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A1D33"
    },
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "scheme": "com.enejlicina.slogas",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.enejlicina.slogas",
      "deploymentTarget": "15.1",
      "associatedDomains": ["applinks:verify.enejlicina.com"],
      "buildNumber": "3",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      },
      "googleServicesFile": "./GoogleService-Info.plist",
      "config": {
        "googleMapsApiKey": "AIzaSyCB7pakhzxdYuzfvZbMrcHJ7jcuZmVFprA"
      }
    },
    "android": {
      "package": "com.enejlicina.slogas",
      "versionCode": 3,
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "foregroundImage": "./assets/app-icon-android.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyCB7pakhzxdYuzfvZbMrcHJ7jcuZmVFprA"
        }
      }
    },

    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "We need your location to show nearby petrol stations and calculate distances.",
          "locationAlwaysPermission": "We need your location to show nearby petrol stations and calculate distances.",
          "locationWhenInUsePermission": "We need your location to show nearby petrol stations and calculate distances."
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          "ios": {
            "reversedClientId": "com.googleusercontent.apps.130352948782-s3sa4o899noegmhnjh6sofe898ieqgaf"
          }
        }
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      "expo-apple-authentication",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.1"
          },
          "android": {
            "minSdkVersion": 24
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "17569bb2-a2e9-4fce-9fff-5ac600d12118"
      }
    }
  }
};