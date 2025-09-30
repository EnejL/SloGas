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

const StationDetailsScreen = ({ route, navigation }) => {
  const { station } = route.params;
  const { t } = useTranslation();

  // Set the header title to the station name
  useEffect(() => {
    navigation.setOptions({ title: station.name });
  }, [navigation, station]);

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

        return (
          <View style={styles.hoursContainer}>
            {openingHoursData.map((schedule, index) => {
              const daysText = schedule.days
                .map((day) => dayNames[day] || day)
                .join(", ");
              const timesText = schedule.times
                .map((time) => `${time.from} - ${time.to}`)
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
          .replace(/\\r/g, "")
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
        <Title style={styles.title}>{station.name}</Title>
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
              {station.prices["95"] && (
                <View style={styles.priceCard}>
                  <Text style={styles.fuelType}>95</Text>
                  <Text style={styles.priceValue}>{station.prices["95"]} €</Text>
                </View>
              )}
              {station.prices["dizel"] && (
                <View style={styles.priceCard}>
                  <Text style={styles.fuelType}>Dizel</Text>
                  <Text style={styles.priceValue}>{station.prices["dizel"]} €</Text>
                </View>
              )}
               {station.prices["98"] && (
                <View style={styles.priceCard}>
                  <Text style={styles.fuelType}>98</Text>
                  <Text style={styles.priceValue}>{station.prices["98"]} €</Text>
                </View>
              )}
              {station.prices["100"] && (
                <View style={styles.priceCard}>
                  <Text style={styles.fuelType}>100</Text>
                  <Text style={styles.priceValue}>{station.prices["100"]} €</Text>
                </View>
              )}
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
  title: {
    fontSize: 22,
    marginBottom: 8,
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
