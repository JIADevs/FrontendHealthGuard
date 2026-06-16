const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

function resolveHoistedPackage(...segments) {
  for (const base of [projectRoot, workspaceRoot]) {
    const candidate = path.join(base, "node_modules", ...segments);
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }
  return path.join(workspaceRoot, "node_modules", ...segments);
}

const config = getDefaultConfig(projectRoot);

// 1. Watch:
//    - workspaceRoot/node_modules  → all hoisted packages (real dirs with node-linker=hoisted)
//    - shared packages              → workspace source watched for HMR
//    Keep this list narrow to avoid ENOMEM (don't watch apps/web or all of workspaceRoot).
const sharedPackages = ["api", "config", "stores", "ui"];
config.watchFolders = [
  path.resolve(workspaceRoot, "node_modules"),
  ...sharedPackages.map((name) => path.resolve(workspaceRoot, "packages", name)),
];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to strictly use the workspace's version of these packages
config.resolver.extraNodeModules = {
  // Workspace packages
  "@healthguard/stores": path.resolve(workspaceRoot, "packages/stores"),
  "@healthguard/api": path.resolve(workspaceRoot, "packages/api"),
  "@healthguard/config": path.resolve(workspaceRoot, "packages/config"),
  "@healthguard/ui": path.resolve(workspaceRoot, "packages/ui"),

  // Pinned native packages
  "react-native": path.resolve(workspaceRoot, "node_modules/react-native"),
  "expo-asset": resolveHoistedPackage("expo-asset"),
  "expo-modules-core": resolveHoistedPackage("expo-modules-core"),
  "@react-native-async-storage/async-storage": resolveHoistedPackage(
    "@react-native-async-storage",
    "async-storage",
  ),
  "react-native-toast-message": resolveHoistedPackage("react-native-toast-message"),
};

module.exports = config;
