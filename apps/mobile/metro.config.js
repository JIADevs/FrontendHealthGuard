const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to strictly use the workspace's version of React Native
config.resolver.extraNodeModules = {
  // Workspace packages
  "@healthguard/stores": path.resolve(workspaceRoot, "packages/stores"),
  "@healthguard/api":    path.resolve(workspaceRoot, "packages/api"),
  "@healthguard/config": path.resolve(workspaceRoot, "packages/config"),
  "@healthguard/ui":     path.resolve(workspaceRoot, "packages/ui"),

  // Pinned native packages
  "react-native":              path.resolve(workspaceRoot, "node_modules/react-native"),
  "expo-asset":                path.resolve(projectRoot,   "node_modules/expo-asset"),
  "react-native-toast-message": path.resolve(workspaceRoot, "node_modules/react-native-toast-message"),
};

module.exports = config;
