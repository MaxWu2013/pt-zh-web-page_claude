# Resolutions and Overrides Reference

Complete reference for forcing secure dependency versions across package managers.

## Yarn (v1) Resolutions

Add to `package.json`:

```json
{
	"resolutions": {
		"**/loader-utils": "^2.0.4",
		"**/minimist": "^1.2.8",
		"**/shell-quote": "^1.8.1",
		"**/immer": "^9.0.21",
		"**/eventsource": "^2.0.2",
		"**/json5": "^2.2.3",
		"**/follow-redirects": "^1.15.9",
		"**/node-forge": "^1.3.1",
		"**/nth-check": "^2.1.1",
		"**/postcss": "^8.5.1",
		"**/semver": "^7.6.3",
		"**/serialize-javascript": "^6.0.2",
		"**/terser": "^5.37.0",
		"**/tough-cookie": "^4.1.4",
		"**/word-wrap": "^1.2.5",
		"**/ws": "^8.18.0",
		"**/yaml": "^2.7.0",
		"**/ansi-html": "^0.0.9",
		"**/ansi-regex": "^5.0.1",
		"**/async": "^3.2.6",
		"**/braces": "^3.0.3",
		"**/cross-spawn": "^7.0.6",
		"**/decode-uri-component": "^0.2.2",
		"**/fast-loops": "^1.1.4",
		"**/got": "^11.8.6",
		"**/http-cache-semantics": "^4.1.1",
		"**/http-proxy-middleware": "^2.0.7",
		"**/ip": "^2.0.1",
		"**/jpeg-js": "^0.4.4",
		"**/jsonwebtoken": "^9.0.2",
		"**/lodash": "^4.17.21",
		"**/lodash-es": "^4.17.21",
		"**/minimatch": "^9.0.5",
		"**/nanoid": "^3.3.8",
		"**/node-notifier": "^10.0.1",
		"**/object-path": "^0.11.8",
		"**/path-to-regexp": "^0.1.12",
		"**/protobufjs": "^7.4.0",
		"**/request": "^2.88.2",
		"**/rollup": "^2.79.2",
		"**/sockjs": "^0.3.24",
		"**/swiper": "^11.2.1",
		"**/systeminformation": "^5.25.11",
		"**/tar": "^6.2.1",
		"**/tmpl": "^1.0.5",
		"**/yargs-parser": "^21.1.1"
	}
}
```

## NPM Overrides

Add to `package.json`:

```json
{
	"overrides": {
		"loader-utils": "^2.0.4",
		"minimist": "^1.2.8",
		"shell-quote": "^1.8.1",
		"immer": "^9.0.21",
		"eventsource": "^2.0.2",
		"json5": "^2.2.3",
		"follow-redirects": "^1.15.9",
		"node-forge": "^1.3.1",
		"nth-check": "^2.1.1",
		"postcss": "^8.5.1",
		"semver": "^7.6.3",
		"serialize-javascript": "^6.0.2",
		"terser": "^5.37.0",
		"tough-cookie": "^4.1.4",
		"word-wrap": "^1.2.5",
		"ws": "^8.18.0",
		"yaml": "^2.7.0",
		"ansi-html": "^0.0.9",
		"ansi-regex": "^5.0.1",
		"async": "^3.2.6",
		"braces": "^3.0.3",
		"cross-spawn": "^7.0.6",
		"decode-uri-component": "^0.2.2",
		"fast-loops": "^1.1.4",
		"got": "^11.8.6",
		"http-cache-semantics": "^4.1.1",
		"http-proxy-middleware": "^2.0.7",
		"ip": "^2.0.1",
		"jpeg-js": "^0.4.4",
		"jsonwebtoken": "^9.0.2",
		"lodash": "^4.17.21",
		"lodash-es": "^4.17.21",
		"minimatch": "^9.0.5",
		"nanoid": "^3.3.8",
		"node-notifier": "^10.0.1",
		"object-path": "^0.11.8",
		"path-to-regexp": "^0.1.12",
		"protobufjs": "^7.4.0",
		"request": "^2.88.2",
		"rollup": "^2.79.2",
		"sockjs": "^0.3.24",
		"swiper": "^11.2.1",
		"systeminformation": "^5.25.11",
		"tar": "^6.2.1",
		"tmpl": "^1.0.5",
		"yargs-parser": "^21.1.1"
	}
}
```

## Yarn 2/3 (Berry) packageExtensions

Add to `.yarnrc.yml`:

```yaml
packageExtensions:
  'react-scripts@*':
    dependencies:
      'loader-utils': '^2.0.4'
      'minimist': '^1.2.8'
      'shell-quote': '^1.8.1'

  '@craco/craco@*':
    dependencies:
      'loader-utils': '^2.0.4'

  # Add more as needed
```

## PNPM Overrides

Add to `package.json`:

```json
{
	"pnpm": {
		"overrides": {
			"loader-utils": "^2.0.4",
			"minimist": "^1.2.8",
			"shell-quote": "^1.8.1"
		}
	}
}
```

Or use `.npmrc`:

```
shamefully-hoist=true
strict-peer-dependencies=false
```

## Version Selection Strategy

### Major Version Upgrades

Only upgrade major versions when:

1. Current version has critical vulnerabilities
2. New major version has security fixes
3. Breaking changes are documented and manageable

### Minor/Patch Upgrades

Always prefer latest minor/patch:

- Contains security fixes
- Backward compatible
- Minimal risk

### Transitive Dependencies

Use resolutions/overrides for:

- Packages with known CVEs
- Packages that haven't released patches
- Deeply nested dependencies

## Common Patterns

### Forcing Specific Versions

```json
{
	"resolutions": {
		"**/package-name": "1.2.3"
	}
}
```

### Nested Dependency Override

```json
{
	"resolutions": {
		"parent-package/child-package/grandchild-package": "^secure.version"
	}
}
```

### Multiple Versions (Advanced)

```json
{
	"resolutions": {
		"package-a/package-x": "^1.0.0",
		"package-b/package-x": "^2.0.0"
	}
}
```

## After Adding Resolutions

1. **Delete lock file:**

   ```bash
   rm yarn.lock  # or package-lock.json
   ```

2. **Reinstall dependencies:**

   ```bash
   yarn install  # or npm install
   ```

3. **Verify resolutions applied:**

   ```bash
   yarn why package-name
   # or
   npm ls package-name
   ```

4. **Test build:**
   ```bash
   yarn build
   ```

## Troubleshooting

### Resolution Not Applied

- Check syntax in package.json
- Ensure yarn.lock is regenerated
- Verify package name spelling
- Check for nested dependency conflicts

### Build Failures After Resolution

- Some secure versions may have breaking changes
- Check if major version upgrade occurred
- Review package migration guides
- May need to update configuration files

### Peer Dependency Warnings

- Add explicit peer dependency declarations
- Use `resolutions` to force compatible versions
- May need to add packages as direct dependencies
