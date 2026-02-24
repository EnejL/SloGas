# SloGas Widget

This directory contains the source code for the iOS Home Screen Widget.

## Setup

The widget target is managed by `@bacons/apple-targets`.
To generate the native target, run:

```bash
npx expo prebuild -p ios
```

Then open the project in Xcode:

```bash
xed ios
```

Select the `SloGasWidget` scheme and run it on a simulator or device.

## Data Sharing

The widget shares data with the main app using App Groups.
The App Group ID is `group.com.enejlicina.slogas`.

Data is written from React Native using `react-native-shared-group-preferences` and read in Swift using `UserDefaults(suiteName: ...)`.

## Updates

The widget timeline is reloaded from React Native using `react-native-widget-center`.
This happens whenever petrol stations are fetched successfully in the app.
