import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Title, Paragraph, Subheading } from 'react-native-paper';

const TermsOfUseScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Terms and Conditions for SloGas</Title>
      <Paragraph style={styles.date}>Last Updated: September 29, 2025</Paragraph>
      <Paragraph>
        Welcome to SloGas! These terms and conditions outline the rules and regulations for the use of the SloGas mobile application.
      </Paragraph>

      <Subheading style={styles.subheading}>1. Acceptance of Terms</Subheading>
      <Paragraph>
        By accessing and using this app, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use the app.
      </Paragraph>

      <Subheading style={styles.subheading}>2. Description of Service</Subheading>
      <Paragraph>
        SloGas is a free, informational mobile application that provides users with the locations and details of petrol and EV charging stations in Slovenia. The data is provided for informational purposes only.
      </Paragraph>

      <Subheading style={styles.subheading}>3. Use of the App</Subheading>
      <Paragraph>
        You agree to use SloGas only for its intended purpose. You are solely responsible for any actions you take based on the information provided within the app (e.g., navigating to a station).
      </Paragraph>

      <Subheading style={styles.subheading}>4. Data Accuracy</Subheading>
      <Paragraph>
        The station data, including prices and locations, is sourced from third-party providers via Firebase. While we strive for accuracy, we do not warrant that the information will always be complete, accurate, or current. Prices and station availability can change rapidly.
      </Paragraph>

      <Subheading style={styles.subheading}>5. Intellectual Property</Subheading>
      <Paragraph>
        The app and its original content, features, and functionality are owned by the app creator and are protected by international copyright and other intellectual property or proprietary rights laws.
      </Paragraph>

      <Subheading style={styles.subheading}>6. Limitation of Liability</Subheading>
      <Paragraph>
        In no event shall SloGas or its owner be liable for any direct, indirect, incidental, or consequential damages arising out of the use or inability to use the service, including any inaccuracies or omissions in the data provided.
      </Paragraph>

      <Subheading style={styles.subheading}>7. Changes to Terms</Subheading>
      <Paragraph>
        We reserve the right to modify these terms and conditions at any time. We will notify users of any changes by updating the "Last Updated" date of this agreement.
      </Paragraph>

      <Subheading style={styles.subheading}>8. Governing Law</Subheading>
      <Paragraph>
        These terms shall be governed by and construed in accordance with the laws of Slovenia, without regard to its conflict of law provisions.
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

export default TermsOfUseScreen;
