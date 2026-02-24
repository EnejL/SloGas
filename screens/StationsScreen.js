import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
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
  SafeAreaView,
  Animated,
} from "react-native";
import { Surface, Searchbar } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { TabView, TabBar } from "react-native-tab-view";
import MapView from "react-native-map-clustering";
import { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { db } from "../utils/firebase";
import { useFocusEffect } from "@react-navigation/native";
import { addToFavorites, removeFromFavorites, getFavoriteIds } from "../utils/favorites";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import StatusBadge from "../components/StatusBadge";

const initialLayout = { width: Dimensions.get("window").width };

// Calculate distance between two coordinates using Haversine formula
// Returns distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isStationOpen = (station) => {
  const openingHours = station.opening_hours || station.open_hours;
  
  // Handle special cases
  if (openingHours === "24/7") return true;
  if (openingHours === "closed") return false;
  if (!openingHours) return null; // Unknown
  
  // Handle structured array format
  if (Array.isArray(openingHours)) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    // Map JS day numbers to our day codes
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayCode = dayMap[currentDay];
    
    // Filter schedules relevant to today
    const relevantSchedules = openingHours.filter(schedule => {
      // Check if this schedule applies to current month (if months specified)
      if (schedule.months && schedule.months.length > 0) {
        if (!schedule.months.includes(currentMonth)) return false;
      }
      
      // Check if this schedule applies to today
      return schedule.days.includes(todayCode);
    });
    
    // Check if any relevant schedule covers the current time
    for (const schedule of relevantSchedules) {
      for (const timeSlot of schedule.times) {
        const [fromHour, fromMin] = timeSlot.from.split(':').map(Number);
        const [toHour, toMin] = timeSlot.to.split(':').map(Number);
        const fromTime = fromHour * 60 + fromMin;
        // "00:00" as end time means midnight (end of day) → treat as 24:00
        const toTime = (toHour === 0 && toMin === 0) ? 24 * 60 : toHour * 60 + toMin;
        if (currentTime >= fromTime && currentTime <= toTime) {
          return true;
        }
      }
    }
    
    return false; // No matching schedule found
  }
  
  return null; // Unknown format
};

const fetchPetrolStations = async () => {
  try {
    const petrolStationsRef = db.collection('data').doc('petrolStations');
    const petrolStationsDoc = await petrolStationsRef.get();

    if (petrolStationsDoc.exists) {
      const petrolStationsData = petrolStationsDoc.data();
      
      if (petrolStationsData && petrolStationsData.data && Array.isArray(petrolStationsData.data.results)) {
        const results = petrolStationsData.data.results;
        
        const validStations = results.filter(
          station => typeof station.lat === 'number' && typeof station.lng === 'number'
        );
        return validStations;

      } else {
        return [];
      }

    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching petrol stations from Firestore:", error);
    throw error;
  }
};

const StationsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteStationIds, setFavoriteStationIds] = useState(new Set());
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'map', title: t('petrolStations.map') },
    { key: 'list', title: t('petrolStations.list') },
    { key: 'favorites', title: t('petrolStations.favorites') },
  ]);

  useEffect(() => {
    setRoutes([
      { key: 'map', title: t('petrolStations.map') },
      { key: 'list', title: t('petrolStations.list') },
      { key: 'favorites', title: t('petrolStations.favorites') },
    ]);
  }, [t]);

  // Add a settings icon to the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={{ padding: 8 }}
        >
          <MaterialIcons name="settings" size={22} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchFavoriteIds = useCallback(async () => {
      try {
        const ids = await getFavoriteIds();
        setFavoriteStationIds(ids);
      } catch (error) {
        console.error("Error fetching favorite IDs:", error);
      }
  }, []);
  
  // Initial load of favorites
  useEffect(() => {
    fetchFavoriteIds();
  }, [fetchFavoriteIds]);

  const loadStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPetrolStations();
      setStations(data);
      
      // Log open/closed statistics
      const now = new Date();
      const openStations = [];
      const closedStations = [];
      const unknownStations = [];
      
      data.forEach(station => {
        const isOpen = isStationOpen(station);
        if (isOpen === true) {
          openStations.push(station);
        } else if (isOpen === false) {
          closedStations.push(station);
        } else {
          unknownStations.push(station);
        }
      });
      
    } catch (error) {
      console.error("Error loading petrol stations:", error);
      setError(t("petrolStations.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  useFocusEffect(
    React.useCallback(() => {
      fetchFavoriteIds(); // Re-fetch favorites when screen is focused
    }, [fetchFavoriteIds])
  );
  
  const favoriteStations = React.useMemo(() => 
    stations.filter(station => favoriteStationIds.has(station.pk)),
    [stations, favoriteStationIds]
  );

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
            loading={loading}
            error={error}
            navigation={navigation}
            onRefresh={loadStations}
            favoriteStationIds={favoriteStationIds}
            onFavoritesChange={fetchFavoriteIds}
          />
        );
      case 'favorites':
        return (
          <StationListScreen
            stations={favoriteStations}
            loading={loading}
            error={error}
            navigation={navigation}
            isFavorites={true}
            onRefresh={() => { loadStations(); fetchFavoriteIds(); }}
            favoriteStationIds={favoriteStationIds}
            onFavoritesChange={fetchFavoriteIds}
          />
        );
      default:
        return null;
    }
  }, [
    stations,
    loading,
    error,
    navigation,
    loadStations,
    favoriteStationIds,
    fetchFavoriteIds,
    favoriteStations
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
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
            renderLabel={({ route }) => (
              <Text style={{ color: 'black', fontWeight: 'bold' }}>
                {route.key === 'map' ? t('petrolStations.map') : route.key === 'list' ? t('petrolStations.list') : t('petrolStations.favorites')}
              </Text>
            )}
          />
        )}
      />
    </SafeAreaView>
  );
};

const StationListScreen = ({ 
  stations,
  loading, 
  error, 
  navigation,
  isFavorites = false,
  onRefresh,  
  favoriteStationIds,
  onFavoritesChange,
}) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(null); // null = all, true = open only, false = closed only
  const [userLocation, setUserLocation] = useState(null);

  // Get user location for distance-based sorting
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        // Location permission denied or error - keep userLocation as null
        // This will use default sorting
      }
    };
    
    // Only fetch location for main list view, not favorites
    if (!isFavorites) {
      getUserLocation();
    }
  }, [isFavorites]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const filteredStations = React.useMemo(() => {
    let filtered = stations;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply open/closed filter
    if (filterOpen !== null) {
      filtered = filtered.filter(station => {
        const isOpen = isStationOpen(station);
        return isOpen === filterOpen;
      });
    }
    
    // Sort by distance if user location is available and not in favorites view
    if (userLocation && !isFavorites) {
      filtered = [...filtered].sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.lat,
          a.lng
        );
        const distanceB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.lat,
          b.lng
        );
        return distanceA - distanceB;
      });
    }
    
    return filtered;
  }, [stations, searchQuery, filterOpen, userLocation, isFavorites]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Error refreshing stations:", error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleStationPress = (station) => {
    navigation.navigate("StationDetails", { station });
  };

  const toggleFavorite = useCallback(async (stationId) => {
    try {
      const isFavorited = favoriteStationIds.has(stationId);
      if (isFavorited) {
        await removeFromFavorites(stationId);
      } else {
        await addToFavorites(stationId);
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
    // FIX: Use item.pk to check if the station is favorited
    const isFavorited = favoriteStationIds.has(item.pk);
    const openState = isStationOpen(item);
    const statusKey = openState === true ? "open" : openState === false ? "closed" : "unknown";
    const statusLabel = openState === true
      ? t("petrolStations.open")
      : openState === false
        ? t("petrolStations.closed")
        : t("petrolStations.unknown");
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
          <StatusBadge label={statusLabel} status={statusKey} style={{ marginHorizontal: 8, alignSelf: 'center' }} />
          <TouchableOpacity
            style={styles.favoriteButton}
            // FIX: Pass item.pk to the toggle function
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

  if (loading && stations.length === 0) {
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
        {/* Filter Buttons */}
        <Surface style={styles.filterContainer}>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterOpen === null && styles.filterButtonActive
              ]}
              onPress={() => setFilterOpen(null)}
            >
              <Text style={[
                styles.filterButtonText,
                filterOpen === null && styles.filterButtonTextActive
              ]}>
                {t("petrolStations.all")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterOpen === true && styles.filterButtonActive
              ]}
              onPress={() => setFilterOpen(true)}
            >
              <Text style={[
                styles.filterButtonText,
                filterOpen === true && styles.filterButtonTextActive
              ]}>
                {t("petrolStations.open")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterOpen === false && styles.filterButtonActive
              ]}
              onPress={() => setFilterOpen(false)}
            >
              <Text style={[
                styles.filterButtonText,
                filterOpen === false && styles.filterButtonTextActive
              ]}>
                {t("petrolStations.closed")}
              </Text>
            </TouchableOpacity>
          </View>
        </Surface>

        <Surface style={styles.searchContainer}>
          <Searchbar
            placeholder={t("petrolStations.searchPlaceholder")}
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
        </Surface>

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
          // FIX: Use item.pk for the key, as it's the unique identifier
          keyExtractor={(item) => item.pk.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#000"]}
              tintColor="#000"
            />
          }
        />
      )}
    </View>
  );
};

const StationMapScreen = ({ stations, loading, error, navigation }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 46.119944, // Center of Slovenia
    longitude: 14.815333,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [filterOpen, setFilterOpen] = useState(null); // null = all, true = open only, false = closed only
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterPanelAnimation = useRef(new Animated.Value(0)).current;

  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userCoords);
      // Animate to user's location only on first load
      if (mapRef.current) {
         mapRef.current.animateToRegion({
            ...userCoords,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        1000
      );
    } else {
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

  const onMarkerPress = (station) => {
      navigation.navigate("StationDetails", { station });
  };

  // Filter stations based on open/closed status
  const filteredStations = React.useMemo(() => {
    if (filterOpen === null) {
      return stations;
    }
    return stations.filter(station => {
      const isOpen = isStationOpen(station);
      return isOpen === filterOpen;
    });
  }, [stations, filterOpen]);

  // Animation functions
  const showFilterPanel = useCallback(() => {
    setShowFilterModal(true);
    Animated.timing(filterPanelAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [filterPanelAnimation]);

  const hideFilterPanel = useCallback(() => {
    Animated.timing(filterPanelAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterModal(false);
    });
  }, [filterPanelAnimation]);

  // Handle filter panel visibility changes
  useEffect(() => {
    if (showFilterModal) {
      showFilterPanel();
    }
  }, [showFilterModal, showFilterPanel]);

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
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        onPress={() => { if (showFilterModal) { hideFilterPanel(); } }}
        showsUserLocation={true}
        // clusterColor="#2e7d32"
        clusterColor="blue"
        clusterTextColor="#fff"
      >
        {filteredStations.map((station) => (
          <Marker
            key={station.pk}
            coordinate={{ latitude: station.lat, longitude: station.lng }}
            tracksViewChanges={false}
            // onPress={() => onMarkerPress(station)}
          >
            {(() => {
              const isOpen = isStationOpen(station);
              const color = isOpen === true ? '#2e7d32' : isOpen === false ? '#d32f2f' : '#9e9e9e';
              return (
                <View style={styles.markerWrapper}>
                  <MaterialIcons name="place" size={40} color={color} />
                </View>
              );
            })()}
            <Callout tooltip onPress={() => onMarkerPress(station)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{station.name}</Text>
                <Text style={styles.calloutAddress}>{station.address}</Text>
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

      {/* Filter Button */}
      <TouchableOpacity 
        style={styles.filterButtonMap} 
        onPress={() => { showFilterModal ? hideFilterPanel() : setShowFilterModal(true); }}
      >
        <MaterialIcons name="filter-list" size={24} color="#000" />
      </TouchableOpacity>

      {/* Filter Panel */}
      {showFilterModal && (
        <Animated.View 
          style={[
            styles.filterPanel,
            {
              opacity: filterPanelAnimation,
              transform: [{
                translateY: filterPanelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.filterPanelContent}>
            <View style={styles.filterPanelHeader}>
              <Text style={styles.filterPanelTitle}>{t("petrolStations.filter")}</Text>
              <TouchableOpacity onPress={hideFilterPanel}>
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterPanelButtons}>
              <TouchableOpacity
                style={[
                  styles.filterPanelButton,
                  filterOpen === null && styles.filterPanelButtonActive
                ]}
                onPress={() => {
                  setFilterOpen(null);
                  hideFilterPanel();
                }}
              >
                <Text style={[
                  styles.filterPanelButtonText,
                  filterOpen === null && styles.filterPanelButtonTextActive
                ]}>
                  {t("petrolStations.all")}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterPanelButton,
                  filterOpen === true && styles.filterPanelButtonActive
                ]}
                onPress={() => {
                  setFilterOpen(true);
                  hideFilterPanel();
                }}
              >
                <Text style={[
                  styles.filterPanelButtonText,
                  filterOpen === true && styles.filterPanelButtonTextActive
                ]}>
                  {t("petrolStations.open")}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterPanelButton,
                  filterOpen === false && styles.filterPanelButtonActive
                ]}
                onPress={() => {
                  setFilterOpen(false);
                  hideFilterPanel();
                }}
              >
                <Text style={[
                  styles.filterPanelButtonText,
                  filterOpen === false && styles.filterPanelButtonTextActive
                ]}>
                  {t("petrolStations.closed")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
    padding: 8,
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
    elevation: 5,
  },
  zoomControlsContainer: {
    position: "absolute",
    left: 16,
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
    elevation: 5,
  },
  filterButtonMap: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "white",
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  filterPanel: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    maxWidth: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterPanelContent: {
    padding: 16,
  },
  filterPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterPanelTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  filterPanelButtons: {
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 8,
  },
  filterPanelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  filterPanelButtonActive: {
    backgroundColor: "#2e7d32",
  },
  filterPanelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterPanelButtonTextActive: {
    color: "#fff",
  },
  calloutContainer: {
    width: 220,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
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
  filterContainer: {
    padding: 8,
    backgroundColor: "#fff",
    elevation: 1,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#2e7d32",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  searchContainer: {
    padding: 8,
    backgroundColor: "#fff",
  },
  searchBar: {
    elevation: 1,
    backgroundColor: "#f8f9fa",
  },
  stationItem: {
    marginVertical: 4,
    marginHorizontal: 8,
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
    marginLeft: 8
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
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 3,
  },
});

export default StationsScreen;
