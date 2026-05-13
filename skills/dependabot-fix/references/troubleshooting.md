# Troubleshooting Guide

Common issues encountered when fixing dependabot vulnerabilities and their solutions.

## Installation Issues

### Error: Couldn't find any versions for "package" that matches "^x.x.x"

**Cause:** Specified version doesn't exist in registry.

**Solution:**

```bash
# Check available versions
npm view package-name versions --json | tail -10

# Use an available version
```

### Error: Cannot find module 'package-name'

**Cause:** Missing peer dependency or incorrect resolution.

**Solution:**

1. Check peer dependencies:
   ```bash
   npm ls 2>&1 | grep "peer"
   ```
2. Add missing peer dependencies to `dependencies` or `devDependencies`
3. Check resolution syntax in package.json

## Build Issues

### PostCSS Configuration Error

**Error:**

```
ValidationError: Invalid options object. PostCSS Loader has been initialized using an options object that does not match the API schema.
```

**Cause:** react-scripts 5.x uses PostCSS 8, which requires new configuration format.

**Solution:**

1. Update `craco.config.js`:

```javascript
module.exports = {
	style: {
		postcss: {
			mode: 'file', // Use separate config file
		},
	},
};
```

2. Create `postcss.config.js`:

```javascript
module.exports = {
	plugins: [
		require('postcss-px-to-viewport')({
			unitToConvert: 'px',
			viewportWidth: 750,
		}),
	],
};
```

### ESLint Loader Not Found

**Error:**

```
Cannot find ESLint loader (eslint-loader)
```

**Cause:** react-scripts 5.x uses eslint-webpack-plugin instead of eslint-loader.

**Solution:**

- This is usually a warning, not an error
- To fix, update craco config to handle new ESLint setup
- Or disable ESLint if not needed:
  ```javascript
  eslint: {
  	enable: false;
  }
  ```

### Module Not Found: 'fs', 'path', 'os'

**Cause:** webpack 5 doesn't automatically polyfill Node.js core modules.

**Solution:**

1. Install fallback packages:

   ```bash
   yarn add -D buffer crypto-browserify stream-browserify util
   ```

2. Update craco.config.js:
   ```javascript
   module.exports = {
   	webpack: {
   		configure: (webpackConfig) => {
   			webpackConfig.resolve.fallback = {
   				fs: false,
   				path: require.resolve('path-browserify'),
   				os: require.resolve('os-browserify/browser'),
   			};
   			return webpackConfig;
   		},
   	},
   };
   ```

### TypeError: loaderUtils.getOptions is not a function

**Cause:** loader-utils v3 has breaking changes, incompatible with old webpack loaders.

**Solution:**

```json
{
	"resolutions": {
		"loader-utils": "^2.0.4"
	}
}
```

Note: v2.0.4 has security fixes but maintains API compatibility.

## Resolution Issues

### Resolutions Not Being Applied

**Symptoms:** Vulnerability still present after adding resolution.

**Debugging:**

```bash
# Check which version is actually installed
yarn why package-name

# List all versions in dependency tree
yarn list package-name
```

**Solutions:**

1. Ensure lock file is deleted and regenerated
2. Check resolution syntax (especially for nested packages)
3. Try explicit version without caret: `"1.2.3"` instead of `"^1.2.3"`
4. For nested packages, use full path: `"parent/child/package"`

### Peer Dependency Conflicts

**Error:**

```
warning " > package@version" has incorrect peer dependency "peer@version"
```

**Solution:**

1. Add the peer dependency as a direct dependency:

   ```json
   {
   	"dependencies": {
   		"peer-package": "^compatible.version"
   	}
   }
   ```

2. Or force resolution:
   ```json
   {
   	"resolutions": {
   		"**/peer-package": "^compatible.version"
   	}
   }
   ```

## Runtime Issues

### Application Crashes After Upgrade

**Causes:**

1. Breaking changes in updated packages
2. Removed or changed APIs
3. Peer dependency mismatches

**Debugging Steps:**

1. Check browser console for errors
2. Review migration guides for major version upgrades
3. Check if any polyfills are needed (webpack 5)
4. Verify all peer dependencies are satisfied

**Common Fixes:**

**axios 0.x → 1.x:**

- Response data structure may differ
- Check interceptors
- Default timeout behavior changed

**react-router 5.x → 6.x:**

- `useHistory()` → `useNavigate()`
- `<Switch>` → `<Routes>`
- Route component prop changes

**webpack 4 → 5:**

- Node polyfills not included by default
- Changed asset handling
- Different dev server configuration

## Git/Worktree Issues

### Husky Hooks Fail

**Error:**

```
.husky/pre-commit: line 2: .husky/_/husky.sh: No such file or directory
```

**Solution:**

```bash
# Skip hooks for this commit
git commit --no-verify -m "message"
```

Or fix husky installation:

```bash
npx husky install
```

### Worktree Already Exists

**Error:**

```
 fatal: 'tree/fix-branch' is already checked out
```

**Solution:**

```bash
# Remove existing worktree
git worktree remove tree/fix-branch

# Or use force
git worktree remove -f tree/fix-branch
```

### Cannot Push to Remote

**Error:**

```
! [rejected] branch -> branch (non-fast-forward)
```

**Solution:**

```bash
# Fetch latest changes
git fetch origin

# Rebase your changes
git rebase origin/main

# Then push
git push origin branch
```

## Testing Issues

### Tests Fail After Dependency Update

**Common Causes:**

1. Jest version upgrade (react-scripts 5 uses Jest 27)
2. Testing library API changes
3. Mock behavior changes

**Solutions:**

**Jest 26 → 27 Changes:**

- Default test environment changed to `node`
- Explicitly set in package.json:
  ```json
  {
  	"jest": {
  		"testEnvironment": "jsdom"
  	}
  }
  ```

**Testing Library:**

- Update imports if needed
- Check for deprecated methods
- May need to add `@testing-library/dom` explicitly

## Audit/Security Issues

### Vulnerabilities Still Reported After Fix

**Causes:**

1. Resolutions not applied to all dependency paths
2. Dev dependencies still vulnerable (may be acceptable)
3. False positives from audit tool

**Verification:**

```bash
# Check specific package
npm ls vulnerable-package

# Run audit with levels
npm audit --audit-level moderate
```

**Solutions:**

1. Ensure all paths covered in resolutions
2. Use `npm-force-resolutions` for npm < 8.3
3. Check if vulnerabilities are in dev dependencies only

### GitHub Still Shows Alerts After PR Merge

**Cause:** Dependabot needs time to re-scan or alert is for different manifest.

**Solution:**

1. Wait for automated re-scan (usually within hours)
2. Manually dismiss if false positive
3. Check if alert is for different branch or manifest

## Performance Issues

### Build Takes Much Longer

**Causes:**

1. webpack 5 changed caching behavior
2. Source map configuration
3. Increased bundle size from polyfills

**Solutions:**

```javascript
// craco.config.js - optimize build
module.exports = {
	webpack: {
		configure: (webpackConfig) => {
			// Enable persistent caching
			webpackConfig.cache = {
				type: 'filesystem',
			};

			// Optimize for production
			if (process.env.NODE_ENV === 'production') {
				webpackConfig.devtool = false;
			}

			return webpackConfig;
		},
	},
};
```

### Memory Issues During Build

**Solution:**

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" yarn build
```

## Pre-commit Issues

### Lint Staged Fails

**Error:** ESLint or Prettier errors in unrelated files.

**Solution:**

```bash
# Run linting fix
yarn lint --fix

# Or skip for this commit
git commit --no-verify
```

### Code Formatting Conflicts

**Cause:** Different versions of Prettier or different configs.

**Solution:**

1. Ensure consistent Prettier version:

   ```json
   {
   	"resolutions": {
   		"prettier": "^3.0.0"
   	}
   }
   ```

2. Add .prettierignore for generated files

## Best Practices to Avoid Issues

1. **Always test build after dependency changes**
2. **Commit lock file changes separately**
3. **Update one major version at a time**
4. **Read migration guides for major upgrades**
5. **Use resolutions conservatively**
6. **Keep a backup branch before major changes**
7. **Test in worktree before committing to main branch**
