module.exports = {
    distDir: '.next', // or any other directory name you prefer
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        config.externals = config.externals.concat(['tedious', 'better-sqlite3', 'mysql', 'mysql2', 'sqlite3', 'fs']);
        return config;
      },
};