import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@SloGas:favorites';

// Function to get all favorite station IDs
export const getFavoriteIds = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    // Return an array of IDs
    const ids = jsonValue != null ? JSON.parse(jsonValue) : [];
    return new Set(ids); // Return a Set for O(1) lookups
  } catch (e) {
    console.error("Error reading favorite IDs from storage", e);
    return new Set(); // Return empty Set on error
  }
};

// Function to add a station to favorites
export const addToFavorites = async (stationId) => {
  try {
    const currentFavoritesSet = await getFavoriteIds();
    currentFavoritesSet.add(stationId);
    const newFavoritesArray = Array.from(currentFavoritesSet);
    const jsonValue = JSON.stringify(newFavoritesArray);
    await AsyncStorage.setItem(FAVORITES_KEY, jsonValue);
  } catch (e) {
    console.error("Error adding station to favorites", e);
  }
};

// Function to remove a station from favorites
export const removeFromFavorites = async (stationId) => {
  try {
    const currentFavoritesSet = await getFavoriteIds();
    currentFavoritesSet.delete(stationId);
    const newFavoritesArray = Array.from(currentFavoritesSet);
    const jsonValue = JSON.stringify(newFavoritesArray);
    await AsyncStorage.setItem(FAVORITES_KEY, jsonValue);
  } catch (e) {
    console.error("Error removing station from favorites", e);
  }
};
