import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Divider } from 'react-native-paper';
import { saveLanguage } from '../utils/i18n';

const SettingsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    saveLanguage(langCode);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('settings.language')}</Text>
      {languages.map(lang => (
        <TouchableOpacity key={lang.code} style={styles.item} onPress={() => changeLanguage(lang.code)}>
            <Text style={styles.itemText}>{lang.flag} {lang.name}</Text>
            {i18n.language === lang.code && <MaterialIcons name="check" size={24} color="green" />}
        </TouchableOpacity>
      ))}
      
      <Divider style={styles.divider} />

      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('PrivacyPolicy')}>
        <MaterialIcons name="shield" size={24} color="#333" />
        <Text style={styles.itemText}>{t('settings.privacyPolicy')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('TermsOfUse')}>
        <MaterialIcons name="description" size={24} color="#333" />
        <Text style={styles.itemText}>{t('settings.termsOfUse')}</Text>
      </TouchableOpacity>

      {/* <View style={styles.footer}>
        <Text style={styles.footerText}>Made by Enej</Text>
      </View> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    color: '#666'
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 18,
  },
  divider: {
    marginVertical: 20,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  }
});

export default SettingsScreen;
