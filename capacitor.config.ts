import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alharris.chorequest',
  appName: 'Chore Quest',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;