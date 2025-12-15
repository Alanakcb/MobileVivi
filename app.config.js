import 'dotenv/config';

export default {
  "expo": {
    "name": "vivimap",
    "slug": "vivimap",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Este app precisa acessar sua localização para marcar onde suas fotos foram tiradas.",
        "NSCameraUsageDescription": "Este app precisa acessar sua câmera para tirar fotos."
      },
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_API_KEY
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.alanakcb.vivimap",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA"
      ],
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "b249f51b-5c24-43f6-8599-821822a15725"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/b249f51b-5c24-43f6-8599-821822a15725"
    }
  }
}
