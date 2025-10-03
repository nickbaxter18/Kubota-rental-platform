'use strict';

/**
 * When using the PNPM package manager, you can use pnpmfile.js to workaround
 * dependencies that have mistakes in their package.json file, or to workaround
 * bugs in the package manager itself.
 *
 * This file is automatically executed by PNPM when it runs.
 * You can use it to modify the package.json files of dependencies.
 * You can also use it to modify the package.json file of the workspace root.
 *
 * For more information, see:
 * https://pnpm.js.org/docs/en/hooks/pnpmfile
 */

module.exports = {
  hooks: {
    readPackage
  }
};

function readPackage(packageJson, context) {
  // Fix peer dependency issues for React 19
  if (packageJson.name === 'react-helmet-async') {
    packageJson.peerDependencies = packageJson.peerDependencies || {};
    packageJson.peerDependencies.react = '^18.0.0 || ^19.0.0';
  }

  // Fix Next.js and React types compatibility
  if (packageJson.name === '@types/react') {
    packageJson.peerDependencies = packageJson.peerDependencies || {};
    packageJson.peerDependencies.react = '^19.0.0';
  }

  if (packageJson.name === '@types/react-dom') {
    packageJson.peerDependencies = packageJson.peerDependencies || {};
    packageJson.peerDependencies.react = '^19.0.0';
    packageJson.peerDependencies['@types/react'] = '^19.0.0';
  }

  return packageJson;
}
