# AGENTS.md - alias-ex Development Guide

This document contains implementation details and architectural information for AI agents working on alias-ex.

## Project Structure

```
alias-ex/
├── bin/
│   └── ax                      # CLI entry point (shebang: #!/usr/bin/env node)
├── src/
│   ├── index.js               # Main entry point, command routing
│   ├── config.js              # JSON file management (~/.config/alias-ex.json)
│   ├── parser.js              # Variable substitution engine
│   └── commands/
│       ├── add.js             # Add command implementation
│       ├── run.js             # Run command implementation
│       ├── list.js            # List commands
│       ├── show.js            # Show command details
│       ├── remove.js          # Remove command
│       ├── edit.js            # Interactive edit (optional)
│       └── token/             # Token management commands
│           ├── add.js
│           ├── list.js
│           ├── show.js
│           └── remove.js
├── package.json
└── README.md
```

## Variable Substitution Logic

The parser processes templates in this exact order:

1. **User-defined tokens** first: `$mac-mini`, `$prod-server` (from `config.tokens`)
2. **Special variables**: `$DATE`, `$TIME`, `$DATETIME`, `$RANDOM`
3. **Environment variables**: Any `$VAR_NAME` not matching other patterns
4. **Positional arguments with modifiers**: `$1:b`, `$2:d`, etc.
5. **Simple positional arguments**: `$1`, `$2`, etc.
6. **Argument slices**: `$@1`, `$@2`, etc.
7. **All arguments**: `$@`, `$*`
8. **Argument count**: `$#`

**Important**: Use regex with word boundaries or careful ordering to prevent partial matches (e.g., `$1` shouldn't match inside `$10`).

**Token Resolution Example:**
```javascript
// Config has: tokens: { "mac-mini": "192.168.1.100", "user": "admin" }
// Template: "ssh $user@$mac-mini"
// Step 1: Replace $mac-mini → "192.168.1.100"
// Step 2: Replace $user → "admin"
// Result: "ssh admin@192.168.1.100"
```

## Argument Modifiers Implementation

Located in `src/parser.js`:

```javascript
function applyModifier(value, modifier) {
  switch (modifier) {
    case 'b': // basename
      return value.split(/[\/]/).pop();
    case 'd': { // dirname
      const parts = value.split(/[\/]/);
      parts.pop();
      return parts.join('/') || '.';
    }
    case 'e': { // extension
      const match = value.match(/\.[^.]+$/);
      return match ? match[0] : '';
    }
    case 'r': // remove extension
      return value.replace(/\.[^.]+$/, '');
    case 'u': // uppercase
      return value.toUpperCase();
    case 'l': // lowercase
      return value.toLowerCase();
    case 'f': // fullpath / absolute path
      return path.resolve(value);
    default:
      return value;
  }
}
```

## Error Handling

- **Command not found**: Exit code 1 with message "Error: Command '<name>' not found"
- **Missing arguments**: Exit code 1 with usage hint
- **Invalid modifier**: Silently ignore or warn, return unmodified value
- **Config file errors**: Create default config if missing/corrupted
- **Permission errors**: Exit code 1 with clear error message

## Edge Cases

- Arguments with spaces: Should be handled correctly when using `$@`
- Empty arguments: `$1` should resolve to empty string if no arg provided
- Nested modifiers: Not supported (e.g., `$1:b:u`), apply one at a time
- Environment variables that don't exist: Resolve to empty string
- Command names: Must validate (no spaces, no special chars except - and _)
- Token names: Must start with letter/underscore, can contain letters, numbers, hyphens, underscores

## Command Execution

Uses `child_process.spawn` with `stdio: 'inherit'` and `shell: true`:

```javascript
const { spawn } = require('child_process');

function executeCommand(commandString) {
  const child = spawn(commandString, [], {
    stdio: 'inherit',
    shell: true
  });
  
  return new Promise((resolve, reject) => {
    child.on('close', (code) => resolve(code));
    child.on('error', (err) => reject(err));
  });
}
```

## Configuration System

Config stored at `~/.config/alias-ex.json` (configurable via `ALIAS_EX_CONFIG` env var):

```javascript
const defaultConfig = {
  tokens: {},
  commands: {},
  settings: {
    verbose: true  // Controls whether 'Executing: ' is shown
  }
};
```

Settings:
- `verbose`: When false, `ax run` won't print "Executing: <command>" output

## Testing

Run tests with:
```bash
npm test
```

## Version Management

Version is read dynamically from `package.json` in `src/index.js`:
```javascript
function getVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}
```

This ensures `-v` and `--version` flags always show the correct version without code changes.

## Publishing

Package is published as `@landicefu/alias-ex` (scoped). The `publishConfig` in package.json includes `"access": "public"` so no `--access=public` flag is needed when publishing.
