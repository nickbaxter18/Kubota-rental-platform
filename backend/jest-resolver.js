const { resolve: defaultResolve } = require('jest-resolve');

module.exports = function (request, options) {
  // Try to resolve from the current directory first
  try {
    return defaultResolve(request, options);
  } catch (error) {
    // If that fails, try resolving from the workspace root
    const workspaceOptions = {
      ...options,
      basedir: options.basedir ? options.basedir.replace(/\/backend$/, '') : process.cwd()
    };

    try {
      return defaultResolve(request, workspaceOptions);
    } catch (workspaceError) {
      // If both fail, throw the original error
      throw error;
    }
  }
};
