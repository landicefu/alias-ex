---
name: bump-version
description: Bump project version, commit changes, tag, and push
---

# Bump Version

Use this skill when the user asks to bump, update, or release a new version of the project.

## When to Use

When user says things like:
- "bump version"
- "release new version" 
- "update version"
- "bump to 1.2.3"
- "release patch version"

## Instructions

Execute these steps in order:

### 1. Check for Uncommitted Changes
```bash
git status --porcelain
```
If output is not empty, STOP and tell user: "Please commit or stash your changes first before bumping version."

### 2. Determine Version Bump Type
- If user says "major" or "breaking" → bump major version
- If user says "minor" or "feature" → bump minor version  
- If user specifies exact version (e.g., "1.2.3") → use that version
- Otherwise → **default to patch**

### 3. Calculate New Version
Read current version from `package.json`, then:
- **patch**: X.Y.Z → X.Y.(Z+1)  
- **minor**: X.Y.Z → X.(Y+1).0
- **major**: X.Y.Z → (X+1).0.0

### 4. Update package.json
Update the version field to the new version.

### 5. Commit the Change
```bash
git add package.json
git commit -m "Bump version to vX.Y.Z"
```
Use exact format: `Bump version to v{version}`

### 6. Create Git Tag
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```
Always use `v` prefix (e.g., `v1.0.1` not `1.0.1`)

### 7. Push to Remote
```bash
git push origin <current-branch>
git push origin vX.Y.Z
```

## Examples

| User Says | Current | Action | New Version |
|-----------|---------|--------|-------------|
| "bump version" | 1.0.0 | patch | 1.0.1 |
| "bump minor" | 1.0.0 | minor | 1.1.0 |
| "bump major" | 1.0.0 | major | 2.0.0 |
| "release 1.5.0" | 1.0.0 | set | 1.5.0 |

## Important Rules

1. **Default is always patch** unless user specifies otherwise
2. **Always check uncommitted changes first** - never proceed if working directory is dirty
3. **Use 'v' prefix** for all git tags
4. **Commit message format**: `Bump version to vX.Y.Z`
5. **Push both commit and tag** to remote

## Troubleshooting

- **Tag already exists**: Tell user the tag exists and ask if they want to delete it or use different version
- **Push failed**: Check if user has permission, suggest pulling latest changes first
- **package.json not found**: This skill only works for Node.js projects with package.json
