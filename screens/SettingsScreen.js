import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const { t } = useTranslation();

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={() => openLink('https://www.slogas.si/privacy')}>
        <MaterialIcons name="shield" size={24} color="#333" />
        <Text style={styles.itemText}>{t('settings.privacyPolicy')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => openLink('https://www.slogas.si/terms')}>
        <MaterialIcons name="description" size={24} color="#333" />
        <Text style={styles.itemText}>{t('settings.termsOfUse')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => { /* Navigate to an 'About' screen or show a modal */ }}>
        <MaterialIcons name="info-outline" size={24} color="#333" />
        <Text style={styles.itemText}>{t('settings.about')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 18,
    marginLeft: 20,
  },
});

export default SettingsScreen;
