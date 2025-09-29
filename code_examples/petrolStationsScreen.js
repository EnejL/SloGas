// petrolStationsScreen.js - Using react-native-tab-view
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { Card, Title, Paragraph, Divider, Surface, Searchbar } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { TabView, TabBar } from "react-native-tab-view";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { db } from "../../utils/firebase";
import { getPetrolStations } from "../../utils/firestore";
import { getCurrentUser } from "../../utils/auth";
import { Swipeable } from "react-native-gesture-handler";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { addToFavorites, removeFromFavorites, isStationFavorited } from "../../utils/favorites";

// Get screen width
const initialLayout = { width: Dimensions.get("window").width };

// Update cache duration to 24 hours
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

// Add this utility function at the top of the file, outside any component
const isStationOpen = (station) => {
  // If no opening hours data is available
  if (!station.open_hours) return null;

  // Handle 24/7 stations
  if (
    station.open_24h ||
    station.open_24_7 ||
    station.open_hours.toLowerCase().includes("24/7") ||
    station.open_hours.toLowerCase().includes("00:00-24:00") ||
    station.open_hours.toLowerCase().includes("0-24") ||
    station.open_hours.toLowerCase().includes("non stop")
  ) {
    return true;
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Convert current time to minutes for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Handle multi-line format with days of the week
  const openingHoursText = station.open_hours.toLowerCase();

  // Check for specific day patterns
  const dayPatterns = {
    0: ["nedelj", "ned"], // Sunday
    1: ["ponedelj", "pon"], // Monday
    2: ["torek", "tor"], // Tuesday
    3: ["sreda", "sre"], // Wednesday
    4: ["četrtek", "čet"], // Thursday
    5: ["petek", "pet"], // Friday
    6: ["sobota", "sob"], // Saturday
  };

  // Check for "delavnik" (workday) which is Monday-Friday
  const isWorkday = currentDay >= 1 && currentDay <= 5;

  // Split by lines to handle multi-line formats
  const lines = openingHoursText.split(/\n|\\n/);

  for (const line of lines) {
    // Check if this line applies to the current day
    let isRelevantLine = false;

    // Check for workday
    if (line.includes("delavnik") && isWorkday) {
      isRelevantLine = true;
    }
    // Check for weekend
    else if (
      (line.includes("vikend") || line.includes("konec tedna")) &&
      (currentDay === 0 || currentDay === 6)
    ) {
      isRelevantLine = true;
    }
    // Check for specific day
    else {
      const dayPatternKeys = Object.keys(dayPatterns);
      for (const dayKey of dayPatternKeys) {
        const patterns = dayPatterns[dayKey];
        if (
          patterns.some((pattern) => line.includes(pattern)) &&
          parseInt(dayKey) === currentDay
        ) {
          isRelevantLine = true;
          break;
        }
      }
    }

    // If this line is relevant for today, check the hours
    if (isRelevantLine) {
      // Extract time ranges using regex
      const timeRanges = line.match(/(\d{1,2}):?(\d{2})?-(\d{1,2}):?(\d{2})?/g);

      if (timeRanges && timeRanges.length > 0) {
        for (const timeRange of timeRanges) {
          const [startTime, endTime] = timeRange.split("-");

          // Parse start time
          let startHour = 0;
          let startMinute = 0;
          if (startTime.includes(":")) {
            [startHour, startMinute] = startTime.split(":").map(Number);
          } else {
            startHour = parseInt(startTime);
          }

          // Parse end time
          let endHour = 0;
          let endMinute = 0;
          if (endTime.includes(":")) {
            [endHour, endMinute] = endTime.split(":").map(Number);
          } else {
            endHour = parseInt(endTime);
          }

          // Convert to minutes for comparison
          const startTimeInMinutes = startHour * 60 + startMinute;
          const endTimeInMinutes = endHour * 60 + endMinute;

          // Check if current time is within range
          if (
            currentTimeInMinutes >= startTimeInMinutes &&
            currentTimeInMinutes <= endTimeInMinutes
          ) {
            return true;
          }
        }
      }
    }
  }

  // If no matching time range was found, assume closed
  return false;
};

// Create a reusable OpenStatusBadge component
const OpenStatusBadge = ({ isOpen }) => {
  if (isOpen === null) return null; // Don't show anything if status is unknown

  return (
    <View
      style={[
        styles.statusBadge,
        isOpen ? styles.openBadge : styles.closedBadge,
      ]}
    >
      <Text style={styles.statusText}>{isOpen ? "Odprto" : "Zaprto"}</Text>
    </View>
  );
};

// Modify the fetchPetrolStations function
const fetchPetrolStations = async (forceRefresh = false) => {
  try {
    // Use the native SDK syntax
    const petrolStationsRef = db.collection('data').doc('petrolStations');
    const petrolStationsDoc = await petrolStationsRef.get();

    if (petrolStationsDoc.exists) {
      const petrolStationsData = petrolStationsDoc.data();
      const lastUpdated = petrolStationsData.lastUpdated?.toDate() || new Date(0);
      const now = new Date();
      const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
      const shouldRefresh = forceRefresh || (now - lastUpdated) > CACHE_DURATION;

      if (shouldRefresh) {
        console.log("Data is stale, but using cached data for now");
      }

      return petrolStationsData.data;
    } else {
      console.log("No petrol stations data found in Firestore");
      return null;
    }
  } catch (error) {
    console.error("Error fetching petrol stations from Firestore:", error);
    throw error;
  }
};

const PetrolStationsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [activeTab, setActiveTab] = useState("map");
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStations, setFilteredStations] = useState([]);
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [favoriteStationIds, setFavoriteStationIds] = useState(new Set());
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'map', title: t('petrolStations.map') },
    { key: 'list', title: t('petrolStations.list') },
    { key: 'favorites', title: t('petrolStations.favorites') },
  ]);

  const fetchFavoriteIds = useCallback(async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        
        const favoritesSnapshot = await db.collection('users').doc(currentUser.uid).collection('favorites').get();
        const ids = favoritesSnapshot.docs.map(doc => doc.id);
        
        // Store the IDs in a Set for O(1) lookup performance
        setFavoriteStationIds(new Set(ids)); 
      } catch (error) {
        console.error("Error fetching favorite IDs:", error);
      }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
        await fetchFavoriteIds();
    };
    initialLoad();
  }, [fetchFavoriteIds]);

  useEffect(() => {
    const loadPetrolStations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get user location first
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setError(t("petrolStations.locationPermissionDenied"));
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Fetch petrol stations from Firestore
        const data = await fetchPetrolStations();

        if (data && data.results) {
          setStations(data.results);
          setFilteredStations(data.results);
          setLastRefresh(new Date());
        } else {
          setError(t("petrolStations.fetchError"));
        }
      } catch (error) {
        console.error("Error loading petrol stations:", error);
        setError(t("petrolStations.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    loadPetrolStations();
  }, []);

  // Modify the loadStations function
  const loadStations = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await fetchPetrolStations(forceRefresh);
      if (data && data.results) {
        setStations(data.results);
        setFilteredStations(data.results);
        await fetchFavoriteStations();
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Error loading stations:", error);
      Alert.alert(t("common.error"), t("common.error.load"));
    } finally {
      setLoading(false);
    }
  }, [fetchFavoriteStations, t]);

  // Modify the useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if data is stale or doesn't exist
      const now = new Date();
      const shouldRefresh = !lastRefresh || (now - lastRefresh) > CACHE_DURATION;
      
      if (shouldRefresh) {
        loadStations();
      }
    }, [lastRefresh])
  );

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = stations.filter(station =>
        station.name.toLowerCase().includes(query.toLowerCase()) ||
        station.address.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStations(filtered);
    } else {
      setFilteredStations(stations);
    }
  }, [stations]);

  const handleDeleteStation = (stationId) => {
    Alert.alert(
      t("common.delete"),
      t("stations.deleteConfirmMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteStation(stationId);
              loadStations();
            } catch (error) {
              console.error("Error deleting station:", error);
              Alert.alert(t("common.error"), t("common.error.delete"));
            }
          },
        },
      ]
    );
  };

  // Add new function to fetch favorite stations
  const fetchFavoriteStations = useCallback(async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // Use the native SDK syntax
      const favoritesRef = db.collection('users').doc(currentUser.uid).collection('favorites');
      const favoritesSnapshot = await favoritesRef.get();
      
      const favoriteIds = favoritesSnapshot.docs.map(doc => doc.id);

      // We assume 'stations' is available in the component's state
      const localStations = stations; // or pass stations as an argument
      const favoriteStationsList = localStations.filter(station => 
        favoriteIds.includes(station.pk.toString())
      );
      
      setFavoriteStations(favoriteStationsList);
      return favoriteStationsList; 
    } catch (error) {
      console.error("Error fetching favorite stations:", error);
      return []; 
    }
  }, [stations]);

  useEffect(() => {
    fetchFavoriteStations();
  }, [stations]);

  const renderScene = useCallback(({ route }) => {
    switch (route.key) {
      case 'map':
        return (
          <StationMapScreen
            stations={stations}
            loading={loading}
            error={error}
            navigation={navigation}
          />
        );
      case 'list':
        return (
          <StationListScreen
            stations={stations}
            filteredStations={filteredStations}
            loading={loading}
            error={error}
            navigation={navigation}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onRefresh={loadStations}
            favoriteStationIds={favoriteStationIds}
            onFavoritesChange={fetchFavoriteIds}
            fetchFavorites={fetchFavoriteStations}
          />
        );
      case 'favorites':
        return (
          <StationListScreen
            stations={favoriteStations}
            filteredStations={favoriteStations}
            loading={loading}
            error={error}
            navigation={navigation}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            isFavorites={true}
            onRefresh={loadStations}
            favoriteStationIds={favoriteStationIds}
            onFavoritesChange={fetchFavoriteIds}
            fetchFavorites={fetchFavoriteStations}
          />
        );
      default:
        return null;
    }
  }, [
    // Add all variables and functions that renderScene depends on
    stations,
    loading,
    error,
    navigation,
    filteredStations,
    searchQuery,
    handleSearch,
    loadStations,
    favoriteStationIds,
    fetchFavoriteIds,
    fetchFavoriteStations,
    favoriteStations
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      renderTabBar={props => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: 'black' }}
          style={{ backgroundColor: 'white' }}
          labelStyle={{ color: 'black', fontWeight: 'bold' }}
          activeColor={'#000000'}
          inactiveColor={'#777777'}
        />
      )}
    />
  );
};

// List view component
const StationListScreen = ({ 
  filteredStations,
  loading, 
  error, 
  navigation,
  searchQuery,
  onSearch,
  isFavorites = false,
  onRefresh,  
  fetchFavorites,
  favoriteStationIds,
  onFavoritesChange,
}) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);


  const handleRefresh = React.useCallback(async () => {
    if (!isFavorites) return;
    
    setRefreshing(true);
    try {
      await fetchFavorites();
    } catch (error) {
      console.error("Error refreshing favorites:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFavorites, isFavorites]);

  const handleStationPress = (station) => {
    navigation.navigate("PetrolStationDetails", { station });
  };

const toggleFavorite = useCallback(async (stationId) => {
  try {
    const isFavorited = favoriteStationIds.has(stationId.toString());

    if (isFavorited) {
      await removeFromFavorites(stationId.toString());
    } else {
      await addToFavorites(stationId.toString());
    }
    
    if (onFavoritesChange) {
      await onFavoritesChange();
    }

  } catch (error) {
    console.error("Error toggling favorite:", error);
    Alert.alert(t("common.error"), t("common.error.favorite"));
  }
}, [favoriteStationIds, onFavoritesChange, t]);

  const renderItem = useCallback(({ item }) => {
    const isFavorited = favoriteStationIds.has(item.pk.toString());

    return (
      <TouchableOpacity
        style={styles.stationItem}
        onPress={() => handleStationPress(item)}
      >
        <View style={styles.stationContent}>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{item.name}</Text>
            <Text style={styles.stationAddress}>{item.address}</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.pk)}
          >
            <MaterialCommunityIcons
              name={isFavorited ? "heart" : "heart-outline"}
              size={24}
              color={isFavorited ? "#ff4081" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [favoriteStationIds, navigation, toggleFavorite]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isFavorites && (
        <Surface style={styles.searchContainer}>
          <Searchbar
            placeholder={t("petrolStations.searchPlaceholder")}
            onChangeText={onSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
        </Surface>
      )}

      {filteredStations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isFavorites 
              ? t("petrolStations.noFavorites")
              : searchQuery
                ? t("petrolStations.noSearchResults")
                : t("petrolStations.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStations}
          keyExtractor={(item) => item.pk.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            isFavorites ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#000"]}
                tintColor="#000"
              />
            ) : null
          }
        />
      )}
    </View>
  );
};

// Map view component
const StationMapScreen = ({ stations, loading, error, navigation }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 46.056946, // Center of Slovenia
    longitude: 14.505751,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      // Use high accuracy and timeout options
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      console.log("User location:", location.coords);

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoords);

      // Only update region if we got a valid location
      if (
        location.coords.latitude !== 0 &&
        location.coords.longitude !== 0 &&
        !(
          location.coords.latitude.toFixed(2) === "37.78" &&
          location.coords.longitude.toFixed(2) === "-122.43"
        )
      ) {
        setRegion({
          ...userCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    } else {
      // Try to get location again if we don't have it
      getUserLocation();
    }
  };

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...region,
          latitudeDelta: region.latitudeDelta / 2,
          longitudeDelta: region.longitudeDelta / 2,
        },
        200
      );
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...region,
          latitudeDelta: region.latitudeDelta * 2,
          longitudeDelta: region.longitudeDelta * 2,
        },
        200
      );
    }
  };

  const navigateToStationDetails = (station) => {
    navigation.navigate("PetrolStationDetails", { station });
  };

  const renderMarkers = () => {
    return stations.map((station) => {
      const isOpen = isStationOpen(station);

      return (
        <Marker
          key={station.pk}
          coordinate={{
            latitude: station.lat,
            longitude: station.lng,
          }}
          title={station.name}
          description={station.address}
          pinColor="green" // Always green pins
        >
          <Callout
            tooltip
            onPress={() =>
              navigation.navigate("PetrolStationDetails", { station })
            }
          >
            <View style={styles.calloutContainer}>
              <View style={styles.calloutHeader}>
                <Text style={styles.calloutTitle}>{station.name}</Text>
                {/* <OpenStatusBadge isOpen={isOpen} /> */}
              </View>
              <Text style={styles.calloutAddress}>{station.address}</Text>
              <View style={styles.calloutPrices}>
                {station.prices["95"] && (
                  <Text style={styles.calloutPrice}>
                    95: {station.prices["95"]} €
                  </Text>
                )}
                {station.prices["dizel"] && (
                  <Text style={styles.calloutPrice}>
                    Dizel: {station.prices["dizel"]} €
                  </Text>
                )}
              </View>
              <View style={styles.calloutButton}>
                <MaterialIcons name="info-outline" size={20} color="#2e7d32" />
                <Text style={styles.calloutButtonText}>
                  {t("petrolStations.viewDetails")}
                </Text>
              </View>
            </View>
          </Callout>
        </Marker>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // In StationMapScreen, replace the entire return block with this:

return (
  <View style={styles.container}>
    <MapView
      ref={mapRef}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      style={styles.map}
      initialRegion={region}
      onRegionChangeComplete={setRegion}
      showsUserLocation={true}
    >
      {/*
        THIS IS THE FIX: We loop over the 'stations' array, and for each
        'station' object in the array, we render a unique Marker.
      */}
      {stations.map((station) => (
        <Marker
          key={station.pk}
          coordinate={{ latitude: station.lat, longitude: station.lng }}
          // This prop enables built-in clustering for each marker
          clustering={{
            enabled: true,
            clusterColor: '#2e7d32', // Optional: customize cluster color
          }}
        >
          {/* Your existing Callout code goes here */}
          <Callout
            tooltip
            onPress={() =>
              navigation.navigate("PetrolStationDetails", { station })
            }
          >
            <View style={styles.calloutContainer}>
              <View style={styles.calloutHeader}>
                <Text style={styles.calloutTitle}>{station.name}</Text>
              </View>
              <Text style={styles.calloutAddress}>{station.address}</Text>
              <View style={styles.calloutPrices}>
                {station.prices["95"] && (
                  <Text style={styles.calloutPrice}>
                    95: {station.prices["95"]} €
                  </Text>
                )}
                {station.prices["dizel"] && (
                  <Text style={styles.calloutPrice}>
                    Dizel: {station.prices["dizel"]} €
                  </Text>
                )}
              </View>
              <View style={styles.calloutButton}>
                <MaterialIcons name="info-outline" size={20} color="#2e7d32" />
                <Text style={styles.calloutButtonText}>
                  {t("petrolStations.viewDetails")}
                </Text>
              </View>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>

    {/* Your map control buttons remain the same */}
    <TouchableOpacity style={styles.myLocationButton} onPress={centerOnUser}>
      <MaterialIcons name="my-location" size={24} color="#000" />
    </TouchableOpacity>

    <View style={styles.zoomControlsContainer}>
      <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
        <MaterialIcons name="add" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
        <MaterialIcons name="remove" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  stationCard: {
    marginBottom: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 8,
  },
  pricesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  priceItem: {
    width: "25%",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomControlsContainer: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "transparent",
  },
  zoomButton: {
    backgroundColor: "white",
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  calloutAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  calloutPrices: {
    marginBottom: 8,
  },
  calloutPrice: {
    fontSize: 12,
  },
  calloutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
  },
  calloutButtonText: {
    color: "#2e7d32",
    marginLeft: 4,
    fontWeight: "500",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  activeTabText: {
    color: "#000",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  openBadge: {
    backgroundColor: "#2e7d32",
  },
  closedBadge: {
    backgroundColor: "#d32f2f",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  stationTitle: {
    flex: 1,
    marginRight: 8,
  },
  searchContainer: {
    padding: 16,
    elevation: 2,
    backgroundColor: "#fff",
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#f8f9fa",
  },
  stationItem: {
    marginVertical: 5,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  stationContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: "#666",
  },
  favoriteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default PetrolStationsScreen;
