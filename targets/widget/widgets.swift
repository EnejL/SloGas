// targets/widget/widgets.swift
import WidgetKit
import SwiftUI

// 1. Define the structure for the data your React Native app will send.
struct StationData: Codable {
    let name: String
    let address: String
}

// 2. This struct defines a single "moment" in the widget's timeline.
struct Provider: TimelineProvider {
    // This provides a generic placeholder view while the widget loads.
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), station: StationData(name: "Petrol Station", address: "Ljubljana"))
    }

    // This provides a quick snapshot for the widget gallery.
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), station: readData())
        completion(entry)
    }

    // This is the main function that provides the data for the widget to display.
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Create an entry for the current time with the latest station data.
        let entry = SimpleEntry(date: Date(), station: readData())

        // Tell the widget to update again in 15 minutes.
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    // This helper function reads the data saved by your React Native app.
    func readData() -> StationData {
    print("--- WIDGET DEBUG (Swift): readData function called ---")
    // IMPORTANT: Make sure this App Group ID matches the one in your app.json
    if let userDefaults = UserDefaults(suiteName: "group.com.enejlicina.slogas") {
        print("WIDGET DEBUG (Swift): Successfully accessed UserDefaults with suite name.")
        if let savedData = userDefaults.string(forKey: "station_data") {
            print("WIDGET DEBUG (Swift): Found data string: \(savedData)")
            let decoder = JSONDecoder()
            // Try to decode the JSON string into our StationData struct.
            if let station = try? decoder.decode(StationData.self, from: savedData.data(using: .utf8)!) {
                print("WIDGET DEBUG (Swift): Successfully decoded station data for '\(station.name)'.")
                return station
            } else {
                print("WIDGET DEBUG (Swift): FAILED to decode JSON string.")
            }
        } else {
            print("WIDGET DEBUG (Swift): No data found for key 'station_data'.")
        }
    } else {
        print("WIDGET DEBUG (Swift): FAILED to access UserDefaults with suite name.")
    }
    // If no data is found, return a default placeholder message.
    print("WIDGET DEBUG (Swift): Returning placeholder data.")
    return StationData(name: "No Station Data", address: "Open SloGas to update.")
}
}

// 3. This struct holds the data for a single point in time.
//    We've replaced the original 'configuration' with our 'station' data.
struct SimpleEntry: TimelineEntry {
    let date: Date
    let station: StationData
}

// 4. This is the SwiftUI View that defines the widget's appearance.
struct SloGasWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Nearest Station")
                .font(.caption)
                .fontWeight(.bold)
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

// 5. This is the main widget configuration.
//    It was originally named 'widget', but a more descriptive name is better.
struct SloGasWidget: Widget {
    let kind: String = "SloGasWidget"

    var body: some WidgetConfiguration {
        // Use StaticConfiguration for simple, non-interactive widgets.
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SloGasWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("SloGas Nearby")
        .description("Shows the nearest petrol station.")
    }
}