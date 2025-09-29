import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { db } from '../utils/firebase';

const StationsScreen = ({ navigation }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredStations, setFilteredStations] = useState([]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const docSnap = await db.collection("data").doc("petrolStations").get();

        if (docSnap.exists) {
          const stationData = docSnap.data().data.results.filter(
            station => station.location && typeof station.location.y === 'number' && typeof station.location.x === 'number'
          );
          setStations(stationData);
          setFilteredStations(stationData);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching stations: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  useEffect(() => {
    if (search === '') {
      setFilteredStations(stations);
    } else {
      const filtered = stations.filter(station =>
        station.name.toLowerCase().includes(search.toLowerCase()) ||
        station.address.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredStations(filtered);
    }
  }, [search, stations]);

  const handleMarkerPress = (station) => {
    navigation.navigate('StationDetails', { station });
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 46.119944,
          longitude: 14.815333,
          latitudeDelta: 2,
          longitudeDelta: 2,
        }}
      >
        {stations.map(station => (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.location.y,
              longitude: station.location.x,
            }}
            title={station.name}
            description={station.address}
            onPress={() => handleMarkerPress(station)}
          />
        ))}
      </MapView>
      <View style={styles.listContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stations..."
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filteredStations}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleMarkerPress(item)} style={styles.stationItem}>
              <Text style={styles.stationName}>{item.name}</Text>
              <Text style={styles.stationAddress}>{item.address}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    padding: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  stationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  stationName: {
    fontWeight: 'bold',
  },
  stationAddress: {
    color: 'gray',
  },
});

export default StationsScreen;
