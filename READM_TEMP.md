Implementing an iOS Home Screen Widget for SloGas
This guide outlines the process of creating a home screen widget for the SloGas app using React Native, Expo, and native Swift code.

Core Concept
Widgets are not built with React Native. They are small, separate applications written in native code (Swift with SwiftUI). The role of our main React Native app is to provide the data that the widget will display.

We will use the react-native-home-widget library to bridge the gap between our JavaScript code and the native widget.

Phase 1: Project Setup and Installation
1.1: Install the Widget Library

First, add the necessary library to your project.

Bash
npx expo install react-native-home-widget
1.2: Generate the Native Project

Before we can add a widget, we need the native ios folder. Run the prebuild command from your project's root directory.

Bash
npx expo prebuild --clean
Phase 2: Xcode Configuration (Native Setup)
This is the most critical phase, where we create the widget and enable communication with the main app.

2.1: Open the Xcode Project

Navigate to the newly created ios directory and open the .xcworkspace file.

Bash
cd ios
xed .
2.2: Add a Widget Extension Target

In Xcode:

With your project open, go to the menu bar and select File → New → Target....

In the search bar, type Widget and select the Widget Extension template. Click Next.

Name your widget (e.g., SloGasWidget). Uncheck "Include Configuration App Intent" for simplicity. Click Finish.

Xcode will ask if you want to activate the new scheme. Click Activate.

You will now see a new folder in your Xcode project navigator called SloGasWidget.

2.3: Configure App Groups

To allow your main app and your widget to share data, you must enable App Groups.

For the Main App Target:

In the project navigator, select the top-level project file (SloGas).

Select your main app target (SloGas) from the list.

Go to the Signing & Capabilities tab.

Click + Capability and add App Groups.

In the new App Groups section, click the + button.

Create a new App Group identifier. It must start with group. and is usually based on your bundle ID. For example: group.com.enejdev.SloGas. Press OK.

For the Widget Extension Target:

Select your widget target (SloGasWidget).

Go to the Signing & Capabilities tab.

Click + Capability and add App Groups.

Do not create a new group. Simply check the box next to the App Group you just created (group.com.enejdev.SloGas).

Both targets must have the exact same App Group enabled.

Phase 3: React Native Side (Sending Data)
Now, we'll write the JavaScript code to send data from your app to the widget.

3.1: Save Data to the Widget

In your StationsScreen.js (or wherever you fetch your data), use the react-native-home-widget library to save data to the shared container.

JavaScript
import HomeWidget from 'react-native-home-widget';

// ... inside a function, after you have the station data
const updateWidgetData = (station) => {
  const widgetData = {
    name: station.name,
    address: station.address,
    // Add any other simple data you want to display
  };

  HomeWidget.setItem(
    'station_data', // A unique key for your data
    JSON.stringify(widgetData),
    'group.com.enejdev.SloGas' // Your App Group ID
  );

  // This tells the native widget that new data is available
  HomeWidget.reloadAllTimelines(); 
};
Phase 4: SwiftUI Widget Side (Displaying Data)
This is where you'll write native Swift code to build the widget's UI.

4.1: Read the Shared Data

Open the main Swift file for your widget, located at SloGasWidget/SloGasWidget.swift.

You need to modify the TimelineProvider to read the data you saved from React Native.

Swift
import WidgetKit
import SwiftUI

// First, define a struct to hold your data
struct StationData: Codable {
    let name: String
    let address: String
}

// ... inside the getSnapshot and getTimeline functions of your Provider ...
func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    var entries: [SimpleEntry] = []

    // Access the shared data using UserDefaults and your App Group ID
    if let userDefaults = UserDefaults(suiteName: "group.com.enejdev.SloGas") {
        if let savedData = userDefaults.string(forKey: "station_data") {
            let decoder = JSONDecoder()
            if let station = try? decoder.decode(StationData.self, from: savedData.data(using: .utf8)!) {
                // Create an entry with the station data
                let entry = SimpleEntry(date: Date(), station: station)
                entries.append(entry)
            }
        }
    }

    // If no data is found, create a placeholder entry
    if entries.isEmpty {
        let placeholderStation = StationData(name: "No Station Data", address: "Open SloGas to update.")
        entries.append(SimpleEntry(date: Date(), station: placeholderStation))
    }

    let timeline = Timeline(entries: entries, policy: .atEnd)
    completion(timeline)
}

// You'll also need to update your SimpleEntry to hold the station data
struct SimpleEntry: TimelineEntry {
    let date: Date
    let station: StationData // Add your data struct here
}
4.2: Build the Widget UI

In the same file, modify the View struct to display your data.

Swift
struct SloGasWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Nearest Station")
                .font(.caption)
                .foregroundColor(.gray)
            Text(entry.station.name)
                .font(.headline)
                .foregroundColor(.primary)
            Text(entry.station.address)
                .font(.footnote)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}
Phase 5: Building and Testing
Run the Main App: In Xcode, make sure your main app target (SloGas) is selected, choose a simulator, and click the Run (▶️) button.

Trigger Data Save: In your running app, perform the action that calls the updateWidgetData function.

Add the Widget: Go to the simulator's home screen, long-press the background, tap the + icon in the top-left, search for "SloGas," and add your new widget. It should display the data you sent.

Build for Real Device: To get this on your actual iPhone, you will need to create a new development build with EAS, as you have added a new native target.

Bash
eas build --profile development --platform ios --clear-cache