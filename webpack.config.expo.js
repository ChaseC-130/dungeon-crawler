const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulesSection: true,
      },
    },
    argv
  );

  // Add TypeScript support
  config.module.rules.push({
    test: /\.tsx?$/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['babel-preset-expo'],
      },
    },
  });

  // Fix for react-native-screens
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native/Libraries/TurboModule/TurboModuleRegistry': 'react-native-web/dist/exports/TurboModuleRegistry',
  };

  // Ignore certain warnings
  config.ignoreWarnings = [
    { module: /react-native-screens/ },
    { module: /TurboModuleRegistry/ },
  ];

  return config;
};