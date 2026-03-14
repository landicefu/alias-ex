---
name: bump-version
description: Bump project version, commit changes, tag, and push
---

# Bump Version

Automates the version bumping workflow including checking for uncommitted changes, updating version files, committing, tagging, and pushing.

## Prerequisites

- Git repository with clean working directory
- Version defined in package.json or other supported files
- Write access to the remote repository

## Usage

```bash
# Bump patch version (default)
bump-version

# Bump specific version level
bump-version patch
bump-version minor
bump-version major

# Bump to specific version
bump-version 1.2.3
```

## Workflow

1. **Check for uncommitted changes**
   - Run `git status --porcelain`
   - If uncommitted changes exist, stop and ask user to commit first

2. **Determine current version**
   - Read from `package.json` (primary source)
   - Parse semantic version (major.minor.patch)

3. **Calculate new version**
   - If argument is `patch`, `minor`, or `major`: increment accordingly
   - If argument is a specific version (e.g., `1.2.3`): use that
   - Default: `patch`

4. **Update version files**
   - Modify `package.json` version field
   - Add any other files that need version updates

5. **Commit changes**
   - Stage modified files
   - Commit with message: `Bump version to vX.Y.Z`

6. **Create tag**
   - Create annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`

7. **Push to remote**
   - Push commit: `git push origin <branch>`
   - Push tag: `git push origin vX.Y.Z`

## Examples

### Bump Patch Version (Default)
```bash
# Current: 1.0.0
bump-version
# New: 1.0.1
# Creates commit "Bump version to v1.0.1" and tag "v1.0.1"
```

### Bump Minor Version
```bash
# Current: 1.0.0
bump-version minor
# New: 1.1.0
```

### Bump Major Version
```bash
# Current: 1.0.0
bump-version major
# New: 2.0.0
```

### Bump to Specific Version
```bash
bump-version 2.5.0
# New: 2.5.0
```

## Common Mistakes to Avoid

❌ **Wrong**: Running with uncommitted changes
✅ **Correct**: Commit or stash all changes first

❌ **Wrong**: Manual version editing before running
✅ **Correct**: Let the skill handle all version updates

❌ **Wrong**: Creating tags manually
✅ **Correct**: Let the skill create and push the tag

## Troubleshooting

- **Issue**: "Uncommitted changes detected"
  - **Solution**: Run `git status` to see changes, commit or stash them

- **Issue**: "Failed to push"
  - **Solution**: Check remote access, pull latest changes first if needed

- **Issue**: "Tag already exists"
  - **Solution**: Delete existing tag or choose different version

## Related Documentation

- [Semantic Versioning](https://semver.org/)
- Git tagging best practices
