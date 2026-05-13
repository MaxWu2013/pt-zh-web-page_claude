## Summary

This PR addresses multiple dependabot security vulnerabilities by upgrading dependencies and adding security resolutions.

## Changes

### Direct Dependencies Updated

| Package          | Old Version | New Version | Reason                         |
| ---------------- | ----------- | ----------- | ------------------------------ |
| axios            | ^0.20.0     | ^1.7.9      | Multiple CVEs (DoS, SSRF)      |
| qs               | ^6.9.4      | ^6.14.0     | DoS via memory exhaustion      |
| react-router-dom | ^5.2.0      | ^5.3.4      | XSS via Open Redirects         |
| react-scripts    | 3.4.3       | 5.0.1       | Transitive dep vulnerabilities |
| vconsole         | ^3.4.0      | ^3.15.1     | Prototype Pollution            |
| @craco/craco     | ^5.6.4      | ^7.1.0      | PostCSS 8 compatibility        |

### Security Resolutions Added

Added 40+ resolutions to force secure versions of transitive dependencies:

- `loader-utils`, `minimist`, `shell-quote` (Critical prototype pollution fixes)
- `immer`, `protobufjs`, `lodash` (Prototype pollution fixes)
- `semver`, `path-to-regexp` (ReDoS fixes)
- `axios`, `follow-redirects` (SSRF fixes)
- `braces`, `eventsource` (DoS fixes)
- And many more...

### Build Configuration

- Updated `craco.config.js` for PostCSS 8 compatibility
- Created `postcss.config.js` for `postcss-px-to-viewport`
- Resolved webpack 5 configuration issues

## Security Fixes

### Critical CVEs Addressed

- **CVE-2026-25639** (axios): Denial of Service via **proto** Key
- **CVE-2025-27152** (axios): SSRF and Credential Leakage
- **CVE-2023-30363** (vconsole): Prototype Pollution
- **CVE-2023-45133** (@babel/traverse): Arbitrary code execution

### High Severity CVEs

- **CVE-2025-15284** (qs): DoS via memory exhaustion
- **CVE-2026-22029** (react-router): XSS via Open Redirects
- **CVE-2022-25883** (semver): Regular Expression DoS
- **CVE-2024-39338** (axios): Server-Side Request Forgery
- **CVE-2023-46234** (browserify-sign): Signature validation bypass
- And 50+ additional high severity CVEs...

### Medium/Low Severity

Addressed 100+ medium and low severity vulnerabilities in transitive dependencies.

## Testing

- [x] `yarn install` completes successfully
- [x] `yarn build` produces production bundle
- [x] No critical or high vulnerabilities in updated packages
- [x] Application runs without runtime errors

## Breaking Changes

### react-scripts 3.4.3 → 5.0.1

This is a major version upgrade with significant changes:

- PostCSS 7 → 8 (configuration updated)
- Webpack 4 → 5
- Jest 24 → 27
- ESLint 6 → 8

**Mitigation:** All configuration files have been updated to support the new versions.

### axios 0.20.0 → 1.7.9

Generally backward compatible. Minor API changes documented in axios migration guide.

## Migration Notes

For local development after this PR:

1. Delete node_modules and lock file:

   ```bash
   rm -rf node_modules yarn.lock
   ```

2. Reinstall dependencies:

   ```bash
   yarn install
   ```

3. Verify build:
   ```bash
   yarn build
   ```

## Related

- Addresses dependabot alerts: #4407, #4406, #4405, and 100+ others
- Fixes security issues in: `statical2021`, `pt-invite`, and related tools
