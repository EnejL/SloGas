import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Title, Paragraph, Subheading } from 'react-native-paper';

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Privacy Policy for SloGas</Title>
      <Paragraph style={styles.date}>Last Updated: September 29, 2025</Paragraph>
      <Paragraph>
        Your privacy is important to us. This Privacy Policy explains how SloGas collects, uses, and protects your information.
      </Paragraph>

      <Subheading style={styles.subheading}>1. Information We Collect</Subheading>
      <Paragraph>
        SloGas is a simple, no-login application. We collect a minimal amount of information to provide and improve our service.
      </Paragraph>
      <Paragraph>
        Location Data (Optional): If you grant permission, the app may access your device's location to show nearby stations and your position on the map. This data is used only while the app is active and is not stored or shared. You can use the app without granting location permissions.
      </Paragraph>
      <Paragraph>
        Anonymous Usage Data: The app uses standard, non-personally identifiable analytics (e.g., through Firebase Analytics) to understand user behavior, such as which features are used most often and to identify crashes. This helps us improve the app. This data is aggregated and cannot be used to identify you personally.
      </Paragraph>

      <Subheading style={styles.subheading}>2. How We Use Your Information</Subheading>
      <Paragraph>
        To Provide the Service: Location data is used to tailor the map view to your current vicinity.
      </Paragraph>
      <Paragraph>
        To Improve the App: Anonymous usage data helps us understand how the app is being used, allowing us to fix bugs and enhance the user experience.
      </Paragraph>

      <Subheading style={styles.subheading}>3. Information We Do Not Collect</Subheading>
      <Paragraph>
        We do not collect any personally identifiable information (PII) such as your name, email address, phone number, or device identifiers. The app has no user accounts or login functionality.
      </Paragraph>

      <Subheading style={styles.subheading}>4. Data Sharing</Subheading>
      <Paragraph>
        We do not sell, trade, or otherwise transfer your information to outside parties. Anonymous, aggregated usage data may be used for internal analysis but is not shared in a way that could identify any individual user.
      </Paragraph>

      <Subheading style={styles.subheading}>5. Your Consent</Subheading>
      <Paragraph>
        By using our app, you consent to our Privacy Policy.
      </Paragraph>

      <Subheading style={styles.subheading}>6. Changes to Our Privacy Policy</Subheading>
      <Paragraph>
        If we decide to change our privacy policy, we will post those changes on this page and update the "Last Updated" date.
      </Paragraph>

      <Subheading style={styles.subheading}>7. Contact Us</Subheading>
      <Paragraph>
        If you have any questions regarding this privacy policy, you may contact us.
      </Paragraph>
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
