import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyScreen = () => {
  const { t } = useTranslation();
  const sections = t('privacyPolicy.sections', { returnObjects: true }) || [];

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>{t('privacyPolicy.title')}</Text>
      <Text style={styles.date}>{t('privacyPolicy.lastUpdated')}</Text>
      {sections.map((s, i) => (
        <React.Fragment key={i}>
          {s.title ? (
            <Text variant="titleMedium" style={styles.subheading}>{s.title}</Text>
          ) : null}
          {s.content ? (<Text>{s.content}</Text>) : null}
          {Array.isArray(s.bulletPoints) && s.bulletPoints.map((bp, j) => (
            <Text key={j}>• {bp}</Text>
          ))}
          {Array.isArray(s.subsections) && s.subsections.map((sub, k) => (
            <React.Fragment key={k}>
              {sub.title ? (
                <Text variant="titleSmall" style={{ marginTop: 8 }}>{sub.title}</Text>
              ) : null}
              {sub.content ? (<Text>{sub.content}</Text>) : null}
              {Array.isArray(sub.bulletPoints) && sub.bulletPoints.map((bp2, m) => (
                <Text key={m}>• {bp2}</Text>
              ))}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  date: {
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  subheading: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
});

export default PrivacyPolicyScreen;
