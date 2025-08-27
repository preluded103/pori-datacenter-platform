# pnpm Migration Plan - Pori Datacenter Platform
## Comprehensive Migration from npm to pnpm v10.15.0

### Executive Summary
This plan outlines the complete migration of the Pori datacenter platform from npm to pnpm v10.15.0, as mandated by CLAUDE.md. The migration will improve install times by ~50% and provide better dependency resolution while maintaining full Vercel deployment compatibility.

### Current Environment Analysis

**Current Package Manager**: npm (package-lock.json v3)
**Target**: pnpm v10.15.0
**Platform**: Next.js 14.1.0 on Vercel
**Critical Systems**: Supabase integration, Mapbox GL JS, European API data server

**Current Dependencies Inventory:**
- Production: 10 packages (React, Next.js, Supabase, Mapbox, etc.)
- Development: 15 packages (TypeScript, Playwright, Vitest, etc.)
- Total lockfile entries: Extensive npm v7+ lockfile structure

## Phase 1: pnpm Installation and Configuration

### 1.1 Local pnpm Installation
```bash
# Verify current pnpm installation (from CLAUDE.md)
/Users/andrewmetcalf/Library/pnpm/pnpm --version  # Should show 10.15.0

# If not installed, install via npm
npm install -g pnpm@10.15.0

# Configure environment (already in ~/.zshrc per CLAUDE.md)
export PNPM_HOME="/Users/andrewmetcalf/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"
```

### 1.2 Global pnpm Configuration
```bash
# Set global configuration options
pnpm config set store-dir ~/.pnpm-store
pnpm config set global-bin-dir ~/.pnpm-global/bin
pnpm config set auto-install-peers true
pnpm config set prefer-workspace-packages true
pnpm config set hoist-pattern '*'
```

### 1.3 Project-Specific Configuration Files

**Create .npmrc (pnpm configuration)**:
```ini
# pnpm-optimized settings
auto-install-peers=true
prefer-workspace-packages=true
resolution-mode=highest
save-exact=false
strict-peer-dependencies=false
shamefully-hoist=true
public-hoist-pattern=*eslint*,*prettier*,*@types*
```

## Phase 2: Migration Steps from npm to pnpm

### 2.1 Pre-Migration Backup
```bash
# Create backup of current state
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Document current dependency tree
npm ls --all > npm-dependency-tree.txt
```

### 2.2 Remove npm Artifacts
```bash
# Remove npm lockfile and node_modules
rm -rf node_modules/
rm package-lock.json

# Clear npm cache (optional but recommended)
npm cache clean --force
```

### 2.3 Generate pnpm Lockfile
```bash
# Install dependencies using pnpm
pnpm install

# Verify installation success
pnpm ls --depth=0
```

## Phase 3: Package.json Updates

### 3.1 Add Package Manager Field
```json
{
  "name": "datacenter-predd-platform",
  "version": "0.1.0",
  "packageManager": "pnpm@10.15.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "supabase migration new",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset"
  }
}
```

### 3.2 Script Optimization for pnpm
No script changes required - all npm scripts work with pnpm

## Phase 4: Lockfile Migration Strategy

### 4.1 pnpm-lock.yaml Analysis
```bash
# Generate lockfile with full dependency resolution
pnpm install --frozen-lockfile=false

# Verify lockfile integrity
pnpm install --frozen-lockfile

# Compare dependency resolution with npm
pnpm why [package-name]  # For key dependencies
```

### 4.2 Dependency Resolution Verification
```bash
# Key dependencies to verify:
pnpm why next
pnpm why @supabase/supabase-js
pnpm why mapbox-gl
pnpm why @playwright/test
pnpm why typescript
```

## Phase 5: CI/CD Pipeline Updates

### 5.1 Vercel Configuration Updates

**Update vercel.json**:
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "installCommand": "pnpm install --frozen-lockfile",
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  }
}
```

### 5.2 GitHub Actions (if applicable)
```yaml
# Example workflow update
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10.15.0

- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build
  run: pnpm run build
```

### 5.3 Environment Variable Considerations
No changes required - all current env vars work with pnpm:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY  
- VITE_MAPBOX_TOKEN

## Phase 6: Testing Strategy

### 6.1 Local Development Testing
```bash
# 1. Development server
pnpm run dev
# Verify: localhost:3000 loads correctly
# Verify: Mapbox integration works
# Verify: Supabase connection active

# 2. Build process
pnpm run build
# Verify: No TypeScript errors
# Verify: Build completes successfully

# 3. Production server
pnpm run start
# Verify: Production build serves correctly
```

### 6.2 End-to-End Testing
```bash
# Run Playwright tests
pnpm run test:e2e
# Verify: All existing E2E tests pass

# Run unit tests
pnpm run test
# Verify: All Vitest tests pass
```

### 6.3 Dependency Integrity Testing
```bash
# Verify critical packages
pnpm ls @supabase/supabase-js
pnpm ls mapbox-gl
pnpm ls next
pnpm ls typescript

# Check for missing peer dependencies
pnpm install --frozen-lockfile 2>&1 | grep -i "warning"
```

## Phase 7: Performance Validation

### 7.1 Install Performance Comparison
```bash
# Before migration (npm)
time npm ci  # Baseline timing

# After migration (pnpm)
time pnpm install --frozen-lockfile  # Should be ~50% faster
```

### 7.2 Build Performance Testing
```bash
# Compare build times
time pnpm run build  # Should be similar or faster than npm
```

### 7.3 Node_modules Analysis
```bash
# Compare disk usage
du -sh node_modules/  # Should be smaller with pnpm's linking
pnpm why --json | jq '.packages | length'  # Package count verification
```

## Phase 8: Deployment Testing

### 8.1 Vercel Deployment Test
```bash
# Test deployment with pnpm
npx vercel --prod --yes

# Verify deployment success:
# - Build logs show pnpm commands
# - No package resolution errors
# - Application functions correctly
```

### 8.2 European API Data Server Compatibility
```bash
# Verify server startup
pnpm start  # Should start on localhost:3001
curl http://localhost:3001/health  # Health check
curl http://localhost:3001/api/countries  # Data endpoint test
```

## Phase 9: Rollback Procedures

### 9.1 Quick Rollback (if critical issues)
```bash
# Restore npm setup
rm -rf node_modules/ pnpm-lock.yaml .npmrc
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
npm ci

# Verify rollback
npm run dev
npm run build
```

### 9.2 Selective Rollback (vercel.json only)
```bash
# Revert vercel.json only while keeping pnpm locally
git checkout vercel.json
# Update vercel.json buildCommand back to "npm run build"
```

### 9.3 Emergency Deployment Rollback
```bash
# If Vercel deployment fails, immediately revert
npx vercel --prod --yes --with-build-command="npm run build"
```

## Phase 10: Post-Migration Validation

### 10.1 Functionality Checklist
- [ ] Next.js dev server starts successfully
- [ ] Build process completes without errors
- [ ] Production server runs correctly
- [ ] Mapbox maps render properly
- [ ] Supabase database connections work
- [ ] API routes respond correctly
- [ ] TypeScript compilation succeeds
- [ ] All tests pass (unit and E2E)
- [ ] Vercel deployment succeeds
- [ ] European API data server operational

### 10.2 Performance Metrics
- [ ] Install time improved by ~40-50%
- [ ] Build time maintained or improved
- [ ] node_modules size reduced
- [ ] No regression in runtime performance

### 10.3 Developer Experience
- [ ] All npm scripts work with pnpm
- [ ] IDE integration unchanged
- [ ] Hot reload functionality intact
- [ ] Error messages clear and actionable

## Risk Assessment and Mitigation

### High Risk Items
1. **Vercel Build Process**: pnpm may behave differently than npm in Vercel environment
   - **Mitigation**: Test deployment to preview branch first
   
2. **Peer Dependency Resolution**: pnpm stricter than npm
   - **Mitigation**: Configure auto-install-peers=true

3. **Hoisting Differences**: Different node_modules structure
   - **Mitigation**: Use shamefully-hoist=true if needed

### Medium Risk Items
1. **TypeScript Path Resolution**: Different module resolution
   - **Mitigation**: Test builds thoroughly
   
2. **Environment Variables**: Different loading behavior
   - **Mitigation**: Verify all VITE_ variables load correctly

### Low Risk Items
1. **Development Server**: Should work identically
2. **API Routes**: No package manager dependency
3. **Database Connections**: Unchanged

## Success Criteria

### Primary Success Criteria
1. ✅ All existing functionality works identically
2. ✅ Vercel deployments succeed consistently  
3. ✅ Performance improvements achieved (install time)
4. ✅ No breaking changes to developer workflow

### Secondary Success Criteria
1. ✅ Smaller node_modules footprint
2. ✅ Better dependency resolution logging
3. ✅ Improved monorepo support (future-ready)
4. ✅ Stricter dependency management

## Implementation Timeline

**Day 1**: Local development migration and testing
**Day 2**: CI/CD pipeline updates and testing  
**Day 3**: Vercel deployment testing and optimization
**Day 4**: Full end-to-end validation and documentation
**Day 5**: Production deployment and monitoring

## Monitoring and Maintenance

### Post-Migration Monitoring
- Monitor Vercel build times and success rates
- Track any dependency-related issues
- Verify European API data server stability
- Monitor application performance metrics

### Ongoing Maintenance
- Keep pnpm updated to latest stable versions
- Regularly audit dependencies with `pnpm audit`
- Use `pnpm outdated` for update management
- Maintain .npmrc configuration as project evolves

## Documentation Updates Required

1. Update README.md with pnpm installation instructions
2. Update CLAUDE.md to reflect successful migration
3. Document any pnpm-specific commands for team
4. Create troubleshooting guide for common pnpm issues

This comprehensive migration plan ensures a smooth transition from npm to pnpm v10.15.0 while maintaining full compatibility with the Pori datacenter platform's existing functionality and deployment pipeline.