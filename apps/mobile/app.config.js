const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

/** @type {import("expo/config").ExpoConfig} */
module.exports = () => {
  const expo = { ...appJson.expo };

  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    expo.extra?.API_URL ||
    "http://127.0.0.1:8000";

  const easConfig = expo.extra?.eas;

  expo.extra = {
    ...expo.extra,
    apiUrl,
    API_URL: apiUrl,
  };

  if (easConfig) {
    expo.extra.eas = easConfig;
  }

  const localGoogleServices = path.join(__dirname, "google-services.json");
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ||
    (fs.existsSync(localGoogleServices) ? "./google-services.json" : undefined);

  if (expo.android) {
    if (googleServicesFile) {
      expo.android = { ...expo.android, googleServicesFile };
    } else {
      const { googleServicesFile: _android, ...android } = expo.android;
      expo.android = android;
    }
  }

  if (!fs.existsSync(path.join(__dirname, "GoogleService-Info.plist"))) {
    const { googleServicesFile: _ios, ...ios } = expo.ios ?? {};
    expo.ios = ios;
  }

  return { expo };
};
