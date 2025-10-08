import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Linking,
  Platform,
} from "react-native";
import { Surface, Title, Paragraph, Divider, Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import StatusBadge from "../components/StatusBadge";
import { formatPrice } from "../utils/i18n";

const StationDetailsScreen = ({ route, navigation }) => {
  const { station } = route.params;
  const { t } = useTranslation();

  // Set the header title to the station name
  useEffect(() => {
    navigation.setOptions({ title: station.name });
  }, [navigation, station]);

  // Determine if the station is open "right now"
  const isStationOpenNow = () => {
    const openingHours = station.opening_hours || station.open_hours;

    if (openingHours === "24/7") return true;
    if (openingHours === "closed") return false;
    if (!openingHours) return null;

    if (Array.isArray(openingHours)) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentMonth = now.getMonth() + 1;
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const todayCode = dayMap[currentDay];

      const relevantSchedules = openingHours.filter(schedule => {
        if (schedule.months && schedule.months.length > 0) {
          if (!schedule.months.includes(currentMonth)) return false;
        }
        return schedule.days.includes(todayCode);
      });

      for (const schedule of relevantSchedules) {
        for (const timeSlot of schedule.times) {
          const [fromHour, fromMin] = timeSlot.from.split(':').map(Number);
          const [toHour, toMin] = timeSlot.to.split(':').map(Number);
          const fromTime = fromHour * 60 + fromMin;
          const toTime = toHour * 60 + toMin;
          if (currentTime >= fromTime && currentTime <= toTime) {
            return true;
          }
        }
      }
      return false;
    }

    return null;
  };

  const openStatus = isStationOpenNow();
  const statusKey = openStatus === true ? "open" : openStatus === false ? "closed" : "unknown";
  const statusLabel = openStatus === true
    ? t("petrolStations.open")
    : openStatus === false
      ? t("petrolStations.closed")
      : t("petrolStations.unknown");

  useEffect(() => {
    try {
      const prices = station && station.prices ? station.prices : {};
      console.log('════════════════════════════════════════');
      console.log('STATION PRICES DEBUG');
      console.log('Name:', station?.name, '| pk:', station?.pk);
      console.log('Raw prices object:', JSON.stringify(prices, null, 2));
      const entries = Object.entries(prices || {});
      if (entries.length === 0) {
        console.log('No prices available for this station.');
      } else {
        console.log('Parsed price entries:');
        entries.forEach(([fuelKey, value]) => {
          console.log(`  ${fuelKey}: ${value}`);
        });
      }
      console.log('════════════════════════════════════════');
    } catch (e) {
      console.log('Error logging station prices:', e?.message || e);
    }
  }, [station]);

  const openMapsApp = () => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    // FIX: Use lat and lng instead of location.y and location.x
    const latLng = `${station.lat},${station.lng}`;
    const label = station.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url);
  };

  const formatOpeningHours = () => {
    const openingHoursData = station.opening_hours || station.open_hours;
    if (!openingHoursData) return null;

    try {
      // Handle special cases
      if (openingHoursData === "24/7") {
        return (
          <View style={styles.open24Container}>
            <MaterialIcons name="access-time" size={20} color="#2e7d32" />
            <Text style={styles.open24Text}>
              {t("petrolStations.open24Hours")}
            </Text>
          </View>
        );
      }

      if (openingHoursData === "closed") {
        return (
          <View style={styles.hoursContainer}>
            <Text style={styles.hourText}>{t("petrolStations.closed")}</Text>
          </View>
        );
      }

      // Handle structured array format
      if (Array.isArray(openingHoursData)) {
        const dayNames = {
          mon: t("days.monday"),
          tue: t("days.tuesday"),
          wed: t("days.wednesday"),
          thu: t("days.thursday"),
          fri: t("days.friday"),
          sat: t("days.saturday"),
          sun: t("days.sunday"),
          holiday: t("days.holiday"),
        };

        const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "holiday"];

        // Get current month (1-12)
        const currentMonth = new Date().getMonth() + 1;

        // Check if schedule has months (seasonal hours)
        const hasMonths = openingHoursData.some(schedule => schedule.months && schedule.months.length > 0);

        // Filter schedules to show only current month's data
        let relevantSchedules = openingHoursData;
        if (hasMonths) {
          relevantSchedules = openingHoursData.filter(schedule => {
            // If no months specified, it applies to all months
            if (!schedule.months || schedule.months.length === 0) return true;
            // Otherwise, check if current month is in the schedule
            return schedule.months.includes(currentMonth);
          });
        }

        // Deduplicate overlapping schedules with different times
        // If we have multiple schedules with all days but different times, 
        // we need to figure out which days actually belong to which times
        let processedSchedules = relevantSchedules;
        
        // Check if we have duplicate "all days" entries
        const allDaySchedules = relevantSchedules.filter(s => s.days.length === 7);
        if (allDaySchedules.length > 1) {
          // Sort by time (earlier times first)
          allDaySchedules.sort((a, b) => {
            const timeA = a.times[0].from;
            const timeB = b.times[0].from;
            return timeA.localeCompare(timeB);
          });
          
          // Assume first one is weekdays, second is weekends/holidays
          // This is a heuristic based on common patterns
          processedSchedules = relevantSchedules.filter(s => s.days.length !== 7).concat([
            { ...allDaySchedules[0], days: ["mon", "tue", "wed", "thu", "fri", "sat"] },
            { ...allDaySchedules[1], days: ["sun", "holiday"] }
          ]);
        }

        // Group schedules by identical times to consolidate display
        const groupedByTimes = {};
        processedSchedules.forEach(schedule => {
          const timesKey = schedule.times.map(t => `${t.from}-${t.to}`).join(',');
          if (!groupedByTimes[timesKey]) {
            groupedByTimes[timesKey] = {
              times: schedule.times,
              days: new Set()
            };
          }
          schedule.days.forEach(day => groupedByTimes[timesKey].days.add(day));
        });

        return (
          <View style={styles.hoursContainer}>
            {Object.values(groupedByTimes).map((group, index) => {
              const timesText = group.times
                .map((time) => `${time.from} - ${time.to}`)
                .join(", ");

              const daysArray = Array.from(group.days).sort((a, b) => 
                dayOrder.indexOf(a) - dayOrder.indexOf(b)
              );

              // If all 7 days (or 6 without holiday) have the same hours, show "Every day"
              if (daysArray.length === 7 || (daysArray.length === 6 && !daysArray.includes('holiday'))) {
                return (
                  <Text key={index} style={styles.hourText}>
                    {t("days.everyDay")}: {timesText}
                  </Text>
                );
              }

              // Check for weekdays pattern (mon-fri)
              const weekdays = ["mon", "tue", "wed", "thu", "fri"];
              const hasAllWeekdays = weekdays.every(day => daysArray.includes(day));
              const onlyWeekdays = daysArray.length === 5 && hasAllWeekdays;

              if (onlyWeekdays) {
                return (
                  <Text key={index} style={styles.hourText}>
                    {t("days.monFri")}: {timesText}
                  </Text>
                );
              }

              // Check for weekend pattern
              const hasWeekend = daysArray.includes('sat') && daysArray.includes('sun');
              const onlyWeekend = daysArray.length === 2 && hasWeekend;

              if (onlyWeekend) {
                return (
                  <Text key={index} style={styles.hourText}>
                    {t("days.satSun")}: {timesText}
                  </Text>
                );
              }

              // Otherwise show individual days
              const daysText = daysArray
                .map((day) => dayNames[day] || day)
                .join(", ");

              return (
                <Text key={index} style={styles.hourText}>
                  {daysText}: {timesText}
                </Text>
              );
            })}
          </View>
        );
      }

      // Handle legacy string format
      if (typeof openingHoursData === "string") {
        const lines = openingHoursData
          .replace(/\r/g, "")
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0);

        if (lines.length > 0) {
          return (
            <View style={styles.hoursContainer}>
              {lines.map((line, index) => {
                const isHeader =
                  line.toUpperCase() === line ||
                  line.trim().endsWith(":") ||
                  line.includes("OBRATOVALNI ČAS");
                return (
                  <Text
                    key={index}
                    style={[
                      styles.hourText,
                      isHeader ? styles.hourHeader : null,
                    ]}
                  >
                    {line.trim()}
                  </Text>
                );
              })}
            </View>
          );
        }
      }

      return null;
    } catch (error) {
      console.error("Error handling opening hours:", error);
      return null;
    }
  };

  const isOpen24Hours = station.open_24h || station.open_24_7;
  const hasOpeningHours = station.opening_hours || station.open_hours || isOpen24Hours;

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.mapContainer}>
        <MapView
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={{
            // FIX: Use lat and lng for map region
            latitude: station.lat,
            longitude: station.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              // FIX: Use lat and lng for marker coordinates
              latitude: station.lat,
              longitude: station.lng,
            }}
            title={station.name}
          />
        </MapView>
      </Surface>

      <Surface style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Title style={styles.title}>{station.name}</Title>
          <StatusBadge label={statusLabel} status={statusKey} />
        </View>
        <View style={styles.addressContainer}>
          <MaterialIcons name="location-on" size={20} color="#666" />
          <Paragraph style={styles.address}>
            {station.address}{station.zip_code && `, ${station.zip_code}`}
          </Paragraph>
        </View>

        <Divider style={styles.divider} />

        {hasOpeningHours ? (
          <>
            <Title style={styles.sectionTitle}>
              {t("petrolStations.openingHours")}
            </Title>
            {isOpen24Hours ? (
              <View style={styles.open24Container}>
                <MaterialIcons name="access-time" size={20} color="#2e7d32" />
                <Text style={styles.open24Text}>
                  {t("petrolStations.open24Hours")}
                </Text>
              </View>
            ) : (
              formatOpeningHours()
            )}
            <Divider style={styles.divider} />
          </>
        ) : (
          <>
            <Title style={styles.sectionTitle}>
              {t("petrolStations.openingHours")}
            </Title>
            <View style={styles.hoursContainer}>
              <Text style={styles.hourText}>
                {t("petrolStations.noOpeningHours")}
              </Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {station.prices && Object.keys(station.prices).length > 0 && (
          <>
            <Title style={styles.sectionTitle}>{t("petrolStations.prices")}</Title>
            <View style={styles.pricesContainer}>
              {(() => {
                const prices = station.prices || {};
                const entries = Object.entries(prices)
                  .filter(([_, val]) => val !== null && val !== undefined && val !== "")
                  .map(([key, val]) => [key.toString(), val]);

                if (entries.length === 0) {
                  return (
                    <Text style={styles.hourText}>{t("petrolStations.noOpeningHours")}</Text>
                  );
                }

                const labelMap = {
                  "95": "95",
                  "98": "98",
                  "100": "100",
                  "dizel": "diesel",
                  "dizel-premium": "dieselPremium",
                  "avtoplin-lpg": "lpg",
                  "lpg": "lpg",
                  "cng": "cng",
                  "lng": "lng",
                  "hvo": "hvo",
                  "koel": "heatingOil"
                };

                const order = [
                  "95","98","100","dizel","dizel-premium","avtoplin-lpg","lpg","cng","lng","hvo","koel"
                ];
                const orderIndex = (k) => {
                  const idx = order.indexOf(k.toLowerCase());
                  return idx === -1 ? 999 : idx;
                };
                const toLabel = (k) => {
                  const key = labelMap[k.toLowerCase()];
                  if (key) {
                    return t(`petrolStations.fuels.${key}`);
                  }
                  return k.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                };

                const sorted = entries.sort((a, b) => orderIndex(a[0]) - orderIndex(b[0]));

                return sorted.map(([fuelKey, value]) => (
                  <View key={fuelKey} style={styles.priceCard}>
                    <Text style={styles.fuelType}>{toLabel(fuelKey)}</Text>
                    <Text style={styles.priceValue}>{formatPrice(value)}</Text>
                  </View>
                ));
              })()}
            </View>
          </>
        )}

        <Button
          mode="contained"
          icon="directions"
          style={styles.directionsButton}
          onPress={openMapsApp}
        >
          {t("petrolStations.getDirections")}
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    flexShrink: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#e8f5e9',
  },
  statusClosed: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  address: {
    marginLeft: 8,
    color: "#666",
    fontSize: 16
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  pricesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  priceCard: {
    width: "48%",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  fuelType: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: 'center', // Added for centering
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  directionsButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 8,
  },
  hoursContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  hourText: {
    color: "#333",
    fontSize: 14,
    lineHeight: 22
  },
  open24Container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  open24Text: {
    marginLeft: 8,
    color: "#2e7d32",
    fontWeight: "bold",
  },
  hourHeader: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
});

export default StationDetailsScreen;
