import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.e360.financiero',
  appName: 'E360',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_e360',
      iconColor: '#00C853',
      sound: 'default',
    },
    Geolocation: {
      // Permissions are declared in AndroidManifest.xml
    },
  },
}

export default config
