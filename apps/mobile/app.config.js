const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

/** @type {import("expo/config").ExpoConfig} */
module.exports = () => {
  const expo = { ...appJson.expo };

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
