import SharedGroupPreferences from 'react-native-shared-group-preferences';
import WidgetCenter from 'react-native-widget-center';
import { isStationOpen } from './stationUtils';

const APP_GROUP_ID = 'group.com.enejlicina.slogas';

export const updateWidgetData = async (stations) => {
  try {
    // If no stations (or empty), we still want to update the widget to show "No Favorites"
    const dataToSave = (stations || []).map(station => {
      // Calculate open status
      const isOpen = isStationOpen(station);
      
      // Format prices to be numbers for Swift decoding
      const formattedPrices = {};
      if (station.prices) {
        Object.entries(station.prices).forEach(([key, value]) => {
           const num = parseFloat(value);
           if (!isNaN(num)) {
             formattedPrices[key] = num;
           }
        });
      }
      
      return {
        id: String(station.pk),
        name: station.name,
        address: station.address,
        isOpen: isOpen,
        prices: formattedPrices
      };
    });

    console.log('Saving widget data:', JSON.stringify(dataToSave).substring(0, 100) + '...');
    // Save data to shared preferences as JSON string
    await SharedGroupPreferences.setItem('widgetData', JSON.stringify(dataToSave), APP_GROUP_ID);
    
    // Verify save
    try {
        const savedData = await SharedGroupPreferences.getItem('widgetData', APP_GROUP_ID);
        console.log('Successfully verified widget data save. Length:', savedData ? savedData.length : 0);
    } catch (verifyError) {
        console.warn('Could not verify widget data save:', verifyError);
    }
    
    // Reload the widget timeline
    WidgetCenter.reloadAllTimelines();
    console.log('Widget updated successfully with', dataToSave.length, 'stations');
  } catch (error) {
    console.error('Error updating widget:', error);
    if (error.code === 0) {
        console.error('App Group might not be configured correctly. Check entitlements.');
    }
  }
};
