export default {
  "expo": {
    "name": "SloGas",
    "slug": "slogas",
    "version": "0.5.0", 
    "orientation": "portrait",
    "icon": "./assets/app-icon-ios.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "scheme": "com.enejlicina.slogas",
    "ios": {
      "supportsTablet": true,
      "entitlements": {
        "com.apple.security.application-groups": ["group.com.enejlicina.slogas"]
      },
      "bundleIdentifier": "com.enejlicina.slogas",
      "appleTeamId": "433786BYGK",
      "deploymentTarget": "15.1",
      "associatedDomains": ["applinks:verify.enejlicina.com"],
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      },
      "googleServicesFile": "./GoogleService-Info.plist",
      "config": {
        "googleMapsApiKey": "AIzaSyCB7pakhzxdYuzfvZbMrcHJ7jcuZmVFprA"
      },
      "associatedAppGroup": "group.com.enejlicina.slogas"
    },
    "android": {
      "package": "com.enejlicina.slogas",
      "versionCode": 2,
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
      ],
      [
        "@bacons/apple-targets",
        {
          "appleTeamId": "433786BYGK",
          "targets": [
            {
              "type": "widget",
              "name": "SloGasWidget",
              "bundleIdentifier": "com.enejlicina.slogas.SloGasWidget",
              "deploymentTarget": "14.0",
              "icon": "./assets/app-icon-ios.png"
            }
          ]
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "9049abbc-1ba0-443b-aa02-c71be3a3d337"
      }
    }
  }
};