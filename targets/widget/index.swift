import WidgetKit
import SwiftUI

// Define the data model for a station
struct StationData: Codable, Identifiable {
    let id: String
    let name: String
    let address: String?
    let isOpen: Bool?
    let prices: [String: Double]?
}

extension StationData {
    var sortedPriceKeys: [String] {
        guard let prices = prices else { return [] }
        let priorityKeys = ["95", "dizel", "98", "100", "lpg"]
        return prices.keys.sorted {
            let index1 = priorityKeys.firstIndex(of: $0) ?? 999
            let index2 = priorityKeys.firstIndex(of: $1) ?? 999
            return index1 < index2
        }
    }
    
    var topPriceKeys: [String] {
        let keys = sortedPriceKeys
        let count = min(keys.count, 3)
        return Array(keys[0..<count])
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), stations: [], debugMessage: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), stations: [
            StationData(id: "1", name: "Petrol Example", address: "Ljubljana", isOpen: true, prices: ["95": 1.5, "dizel": 1.6])
        ], debugMessage: nil)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        
        // Fetch data from App Group
        let userDefaults = UserDefaults(suiteName: "group.com.enejlicina.slogas")
        var stations: [StationData] = []
        var debugMessage: String? = nil
        
        if let userDefaults = userDefaults {
            if let jsonString = userDefaults.string(forKey: "widgetData") {
                if let jsonData = jsonString.data(using: .utf8) {
                    do {
                        stations = try JSONDecoder().decode([StationData].self, from: jsonData)
                        if stations.isEmpty {
                             debugMessage = "Data is empty array"
                        }
                    } catch {
                        print("Error decoding widget data: \(error)")
                        debugMessage = "Decode error: \(error.localizedDescription)"
                    }
                }
            } else {
                debugMessage = "No 'widgetData' key in App Group"
            }
        } else {
            debugMessage = "Could not access App Group"
        }

        let entry = SimpleEntry(date: currentDate, stations: stations, debugMessage: debugMessage)
        entries.append(entry)

        // Refresh every hour
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
        let timeline = Timeline(entries: entries, policy: .after(refreshDate))
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let stations: [StationData]
    let debugMessage: String?
}

struct WidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Image(systemName: "fuelpump.fill")
                    .foregroundColor(.white)
                Text("Favorites")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }
            .padding(.bottom, 8)
            
            if entry.stations.isEmpty {
                VStack {
                    Spacer()
                    Text("No favorites added yet.")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
                .frame(maxWidth: .infinity)
            } else {
                // Determine how many items to show based on widget size
                let maxItems = family == .systemMedium ? 2 : 5
                
                VStack(spacing: 8) {
                    ForEach(entry.stations.prefix(maxItems)) { station in
                        StationRow(station: station)
                        if station.id != entry.stations.prefix(maxItems).last?.id {
                            Divider().background(Color.gray)
                        }
                    }
                }
            }
            Spacer()
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(red: 2/255, green: 29/255, blue: 52/255)
        }
    }
}

struct StationRow: View {
    let station: StationData
    
    var body: some View {
        HStack(alignment: .center) {
            // Open/Closed Indicator
            Circle()
                .fill(station.isOpen == true ? Color.green : (station.isOpen == false ? Color.red : Color.gray))
                .frame(width: 8, height: 8)
            
            // Name
            Text(station.name)
                .font(.subheadline)
                .fontWeight(.medium)
                .lineLimit(1)
                .layoutPriority(1)
                .foregroundColor(.white)
            
            Spacer()
            
            // Prices
            if let prices = station.prices {
                HStack(spacing: 8) {
                    ForEach(station.topPriceKeys, id: \.self) { key in
                        if let price = prices[key] {
                            PriceView(label: key.capitalized, price: price)
                        }
                    }
                }
            }
        }
    }
}

struct PriceView: View {
    let label: String
    let price: Double
    
    var body: some View {
        VStack(alignment: .trailing, spacing: 0) {
            Text(label)
                .font(.system(size: 8, weight: .bold))
                .foregroundColor(.gray)
            Text(String(format: "%.3f", price))
                .font(.caption2)
                .monospacedDigit()
                .foregroundColor(.white)
        }
    }
}

@main
struct SloGasWidget: Widget {
    let kind: String = "SloGasWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WidgetEntryView(entry: entry)
        }
        .configurationDisplayName("SloGas Favorites")
        .description("View your favorite petrol stations.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
