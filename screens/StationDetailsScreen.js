import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StationDetailsScreen = ({ route }) => {
  const { station } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{station.name}</Text>
      <Text style={styles.address}>{station.address}</Text>
      {/* You can add more details here as needed */}
      <View style={styles.detailsContainer}>
        <Text>Latitude: {station.location.y}</Text>
        <Text>Longitude: {station.location.x}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  address: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 20,
  },
  detailsContainer: {
    marginTop: 20,
  }
});

export default StationDetailsScreen;
