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

  expo.extra = {
    ...expo.extra,
    apiUrl,
    API_URL: apiUrl,
  };

  if (!fs.existsSync(path.join(__dirname, "google-services.json"))) {
    const { googleServicesFile: _android, ...android } = expo.android ?? {};
    expo.android = android;
  }

  if (!fs.existsSync(path.join(__dirname, "GoogleService-Info.plist"))) {
    const { googleServicesFile: _ios, ...ios } = expo.ios ?? {};
    expo.ios = ios;
  }

  return { expo };
};
