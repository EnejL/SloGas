import AsyncStorage from '@react-native-async-storage/async-storage';

const STATIONS_CACHE_KEY = '@SloGas:stations';
const TIMESTAMP_CACHE_KEY = '@SloGas:stationsTimestamp';

/**
 * Saves the provided station data and the current timestamp to local storage.
 * @param {Array} stations - The array of station objects to cache.
 */
export const setCachedStations = async (stations) => {
  try {
    const jsonValue = JSON.stringify(stations);
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(STATIONS_CACHE_KEY, jsonValue);
    await AsyncStorage.setItem(TIMESTAMP_CACHE_KEY, timestamp);
  } catch (e) {
    console.error("Error saving stations to cache", e);
  }
};

/**
 * Retrieves cached station data and checks if it's stale.
 * The data is considered stale if it was cached before the last weekly update,
 * which occurs every Tuesday in the early morning.
 * @returns {Promise<{stations: Array, isStale: boolean}>} An object containing the cached stations and a flag indicating if the data is stale.
 */
export const getCachedStations = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STATIONS_CACHE_KEY);
    const timestamp = await AsyncStorage.getItem(TIMESTAMP_CACHE_KEY);

    if (jsonValue !== null && timestamp !== null) {
      const stations = JSON.parse(jsonValue);
      const lastFetchTime = new Date(timestamp);
      
      // Data is updated every Tuesday in the wee hours.
      // We need to determine the timestamp of the last update.
      const now = new Date();
      const lastUpdateTime = new Date(now);

      // Find the last Tuesday. Day 2 is Tuesday.
      const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
      const daysSinceTuesday = (dayOfWeek - 2 + 7) % 7;
      lastUpdateTime.setDate(now.getDate() - daysSinceTuesday);

      // Let's assume "wee hours" is 4:00 AM UTC.
      lastUpdateTime.setUTCHours(4, 0, 0, 0);

      // If today is Tuesday but it's before 4 AM UTC, the last update was last week's Tuesday.
      if (dayOfWeek === 2 && now.getTime() < lastUpdateTime.getTime()) {
        lastUpdateTime.setDate(lastUpdateTime.getDate() - 7);
      }

      const isStale = lastFetchTime < lastUpdateTime;
      return { stations, isStale };
    }
  } catch (e) {
    console.error("Error reading stations from cache", e);
  }

  return { stations: [], isStale: true };
};
