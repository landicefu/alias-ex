# alias-ex

A CLI tool for managing custom command aliases with variable substitution. Define reusable commands with placeholders for arguments, environment variables, and more.

## Features

- **User-Defined Tokens**: Define reusable values (e.g., `$mac-mini`, `$prod-server`) and use them across all commands
- **Custom Commands**: Create reusable command templates
- **Variable Substitution**: Use placeholders like `$1`, `$2`, `$@`, `$#`
- **Argument Modifiers**: Transform arguments with `:b`, `:d`, `:e`, `:r`, `:u`, `:l`
- **Environment Variables**: Access any environment variable with `$VAR_NAME`
- **Lightweight**: Simple JSON configuration, no complex setup

## Installation

```bash
npm install -g @landicefu/alias-ex
```

## Quick Start

```bash
# Add tokens for frequently used values
ax token add mac-mini 192.168.1.100
ax token add user admin

# Add a custom command using tokens
ax add deploy 'scp -r $1 $user@$mac-mini:$2 && echo "Deployed $1:b to $mac-mini"'

# Use it
ax run deploy ./dist /var/www/html
# → Executes: scp -r ./dist admin@192.168.1.100:/var/www/html && echo "Deployed ./dist to 192.168.1.100"

# Or after setting up shell integration:
deploy ./dist /var/www/html

# List all commands and tokens
ax list
ax token list

# Show command details
ax show deploy

# Remove a command
ax remove deploy
```

## Configuration

Configuration is stored at `~/.config/alias-ex.json`:

```json
{
  "tokens": {
    "mac-mini": "192.168.1.100",
    "prod-server": "production.example.com",
    "user": "admin"
  },
  "commands": {
    "deploy": {
      "template": "scp -r $1 $USER@$mac-mini:$2 && echo 'Deployed $1:b'"
    },
    "backup": {
      "template": "tar czf $1:r.tar.gz $1 && scp $1:r.tar.gz backup@$prod-server:/backups/"
    },
    "sync": {
      "template": "rsync -avz --delete $@ $USER@$prod-server:$1"
    }
  }
}
```

## Commands

### `ax add <name> <template>`

Add a new custom command with variable substitution support.

```bash
# Basic command
ax add hello 'echo "Hello, $1!"'

# Multiple arguments
ax add move 'mv $1 $2 && echo "Moved $1:b to $2:d"'

# Using all arguments
ax add log 'git log --oneline $@ | head -$1'
```

### `ax run <name> [args...]`

Execute a custom command with arguments.

```bash
ax run deploy ./build production-server
ax run backup ~/Documents/important.txt
ax run sync ~/Projects remote:/data/
```

### `ax list`

List all configured commands.

```bash
ax list
```

### `ax show <name>`

Show the template for a specific command.

```bash
ax show deploy
```

### `ax remove <name>`

Remove a command.

```bash
ax remove deploy
```

### `ax edit <name>`

Edit a command template interactively.

```bash
ax edit deploy
```

### `ax token add <name> <value>`

Add a reusable token/variable that can be used in any command template.

**Quoting Rules:**
- **Token values without spaces**: No quotes needed: `ax token add server 192.168.1.100`
- **Token values with spaces**: Wrap in quotes so the shell treats them as one argument:
  ```bash
  ax token add filename '"My Document.txt"'
  ax token add projectdir '"/path with spaces/myproject"'
  ```
- The quotes become part of the token value and are substituted literally into commands

```bash
# Add tokens for frequently used values
ax token add mac-mini 192.168.1.100
ax token add prod-server production.example.com
ax token add user admin
```

### `ax token list`

List all defined tokens.

```bash
ax token list
```

### `ax token show <name>`

Show a token's value.

```bash
ax token show mac-mini
```

### `ax token remove <name>`

Remove a token.

```bash
ax token remove mac-mini
```

## Quoting Guide

Understanding when to use quotes is essential for using alias-ex correctly.

### Token Values

| Scenario | Command | Stored Value |
|----------|---------|--------------|
| No spaces | `ax token add server 192.168.1.100` | `192.168.1.100` |
| With spaces | `ax token add path '"/path/to/my file"'` | `"/path/to/my file"` |
| With spaces | `ax token add name '"John Doe"'` | `"John Doe"` |

### Command Templates

**Always use single quotes** around command templates to prevent shell expansion:

```bash
# CORRECT: Template is treated as one argument
ax add deploy 'scp -r $1 $user@$server:$2'

# WRONG: Shell splits on spaces, $user gets expanded by shell
ax add deploy scp -r $1 $user@$server:$2
```

### Why Quotes Matter

The shell processes your command **before** alias-ex sees it. Single quotes prevent the shell from:
- Expanding variables (`$HOME` → `/Users/you`)
- Splitting arguments on spaces
- Expanding wildcards (`*`)

### Examples

```bash
# Good: Token with quotes for files with spaces
ax token add mydoc '"My Document.txt"'
ax add delete 'rm $mydoc'
ax run delete
# Result: rm "My Document.txt"  ✓ Works correctly

# Good: Token without quotes for normal values
ax token add server 192.168.1.100
ax add ping 'ping -c 3 $server'
ax run ping
# Result: ping -c 3 192.168.1.100  ✓ Works correctly

# Good: Using both patterns together
ax token add projectdir '"/Users/me/My Projects/app"'
ax token add backupdir '"/Volumes/Backup Drive"'
ax add backup 'cp -r $projectdir $backupdir/$DATE'
ax run backup
# Result: cp -r "/Users/me/My Projects/app" "/Volumes/Backup Drive/2024-03-14"  ✓ Works correctly
```

## Variable System

### Tokens (User-Defined Variables)

The most powerful feature of alias-ex is the ability to define reusable tokens:

```bash
# Define tokens
ax token add mac-mini 192.168.1.100
ax token add user admin
ax token add home /Users/admin

# Use tokens in any command
ax add ssh-mac 'ssh $user@$mac-mini'
ax add backup 'cp -r $home/Documents $home/Backups/$DATE'
```

Tokens can be used in command templates with `$token-name` syntax. Tokens are resolved before other variables.

**Token Naming Rules:**
- Must start with a letter or underscore
- Can contain letters, numbers, hyphens, and underscores
- Cannot conflict with positional arguments (`$1`, `$2`, etc.) or special variables

### Positional Arguments

| Variable | Description | Example |
|----------|-------------|---------|
| `$1`, `$2`, ... | Individual arguments | `deploy file.txt server` → `$1` = `file.txt` |
| `$@` | All arguments as string | `a b c` → `a b c` |
| `$*` | Same as `$@` | `a b c` → `a b c` |
| `$#` | Number of arguments | `a b c` → `3` |
| `$@1`, `$@2` | Arguments from position N | `$@2` with `a b c` → `b c` |

### Environment Variables

Any environment variable can be accessed:

```bash
ax add info 'echo "User: $USER, Home: $HOME, PWD: $PWD"'
```

### Special Variables

| Variable | Description |
|----------|-------------|
| `$DATE` | Current date (YYYY-MM-DD) |
| `$TIME` | Current time (HH:MM:SS) |
| `$DATETIME` | Current datetime (YYYY-MM-DD HH:MM:SS) |
| `$RANDOM` | Random number (0-32767) |

## Argument Modifiers

Apply modifiers to transform argument values:

| Modifier | Description | Example (`$1` = `/path/to/File.txt`) |
|----------|-------------|--------------------------------------|
| `:b` | Basename (filename) | `File.txt` |
| `:d` | Directory name | `/path/to` |
| `:e` | Extension | `.txt` |
| `:r` | Remove extension | `/path/to/File` |
| `:u` | Uppercase | `/PATH/TO/FILE.TXT` |
| `:l` | Lowercase | `/path/to/file.txt` |

### Modifier Examples

```bash
# Deploy with basename only
ax add deploy 'scp $1 $USER@$HOST:/var/www/$1:b'
ax run deploy /home/user/project/dist.tar.gz
# → scp /home/user/project/dist.tar.gz user@host:/var/www/dist.tar.gz

# Backup with date in filename
ax add backup 'cp $1 $1:r-$(date +%Y%m%d)$1:e'
ax run backup document.txt
# → cp document.txt document-20240314.txt

# Case transformations
ax add shout 'echo "$1:u"'
ax add whisper 'echo "$1:l"'
```

## Usage Examples

### Token-Based Remote Management

```bash
# Define your infrastructure tokens once
ax token add mac-mini 192.168.1.100
ax token add raspberry-pi 192.168.1.50
ax token add prod-server production.example.com
ax token add user admin

# Create reusable remote commands
ax add ssh 'ssh $user@$1'
ax add vnc 'open vnc://$1'
ax add deploy 'scp -r ./dist $user@$1:/var/www/html'
ax add backup-remote 'ssh $user@$1 "tar czf backup.tar.gz /data" && scp $user@$1:backup.tar.gz ./backups/'

# Use with any token
ax run ssh mac-mini           # → ssh admin@192.168.1.100
ax run vnc raspberry-pi       # → open vnc://192.168.1.50
ax run deploy prod-server     # → scp -r ./dist admin@production.example.com:/var/www/html
ax run backup-remote mac-mini # → backup from mac-mini locally
```

### Development Workflow

```bash
# Quick git commit
ax add gc 'git add -A && git commit -m "$1" && git push'
ax run gc "Fix login bug"

# Run tests with coverage
ax add test 'npm test -- --coverage --reporter=lcov $@'
ax run test --watch

# Build and deploy
ax add ship 'npm run build && ax run deploy ./dist $1'
ax run ship production-server
```

### File Operations

```bash
# Safe file copy with backup
ax add safe-cp 'cp $1 $1:r.backup-$(date +%s)$1:e && cp $1 $2'
ax run safe-cp important.doc /backup/

# Organize downloads by extension
ax add organize 'mkdir -p $1/$2:e && mv $2 $1/$2:e/'
ax run organize ~/Downloads ~/Downloads/*.zip
```

### System Administration

```bash
# SSH to common servers
ax add prod 'ssh admin@$1.prod.company.com'
ax run prod web01

# Check disk usage
ax add disk 'df -h $@ | grep -E "(Filesystem|$1)"'
ax run disk /dev/sda1

# Quick archive
ax add archive 'tar czf $1-$(date +%Y%m%d).tar.gz $@2'
ax run archive backups ~/Documents ~/Pictures
```

## Shell Integration (Optional)

To use commands directly without `ax run` prefix:

### Bash

Add to `~/.bashrc`:

```bash
# Alias-ex integration
ax() {
  if [ $# -eq 0 ]; then
    command ax
  elif command ax show "$1" &>/dev/null; then
    command ax run "$@"
  else
    command ax "$@"
  fi
}
```

### Zsh

Add to `~/.zshrc`:

```zsh
# Alias-ex integration
ax() {
  if [ $# -eq 0 ]; then
    command ax
  elif command ax show "$1" &>/dev/null; then
    command ax run "$@"
  else
    command ax "$@"
  fi
}
```

Now you can use:
```bash
deploy ./dist production    # Instead of: ax run deploy ./dist production
backup ~/documents         # Instead of: ax run backup ~/documents
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALIAS_EX_CONFIG` | Path to config file | `~/.config/alias-ex.json` |

## Implementation Details

### Project Structure

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

### package.json Structure

```json
{
  "name": "@landicefu/alias-ex",
  "version": "0.0.1",
  "description": "Custom command aliases with variable substitution",
  "main": "src/index.js",
  "bin": {
    "ax": "./bin/ax"
  },
  "scripts": {
    "start": "node bin/ax",
    "test": "node test/test.js"
  },
  "keywords": ["cli", "alias", "command", "template"],
  "license": "MIT",
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### Variable Substitution Logic

The parser should process templates in this order:

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

### Modifier Implementation

```javascript
// Example implementation approach
applyModifier(value, modifier) {
  switch (modifier) {
    case 'b': // basename
      return value.split(/[\\/]/).pop();
    case 'd': // dirname
      const parts = value.split(/[\\/]/);
      parts.pop();
      return parts.join('/') || '.';
    case 'e': // extension
      const match = value.match(/\.[^.]+$/);
      return match ? match[0] : '';
    case 'r': // remove extension
      return value.replace(/\.[^.]+$/, '');
    case 'u': // uppercase
      return value.toUpperCase();
    case 'l': // lowercase
      return value.toLowerCase();
    default:
      return value;
  }
}
```

### Error Handling

- **Command not found**: Exit code 1 with message "Error: Command '<name>' not found"
- **Missing arguments**: Exit code 1 with usage hint
- **Invalid modifier**: Silently ignore or warn, return unmodified value
- **Config file errors**: Create default config if missing/corrupted
- **Permission errors**: Exit code 1 with clear error message

### Edge Cases

- Arguments with spaces: Should be handled correctly when using `$@`
- Empty arguments: `$1` should resolve to empty string if no arg provided
- Nested modifiers: Not supported (e.g., `$1:b:u`), apply one at a time
- Environment variables that don't exist: Resolve to empty string
- Command names: Should validate (no spaces, no special chars except - and _)

### Command Execution

Use `child_process.spawn` with `stdio: 'inherit'` and `shell: true`:

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

### Default Config Creation

If config file doesn't exist:

```javascript
const defaultConfig = {
  tokens: {},
  commands: {}
};
```

### Testing Checklist

- [ ] `ax token add mac-mini 192.168.1.100` creates token
- [ ] `ax token list` shows tokens
- [ ] `ax add test 'echo $mac-mini'` creates command using token
- [ ] `ax run test` outputs "192.168.1.100"
- [ ] `ax add test 'echo $1'` creates command
- [ ] `ax run test hello` outputs "hello"
- [ ] `ax add test 'echo $1:b'` with `/path/file.txt` outputs "file.txt"
- [ ] `ax add test 'echo $#'` with 3 args outputs "3"
- [ ] `ax add test 'echo $@'` with "a b c" outputs "a b c"
- [ ] `ax list` shows all commands
- [ ] `ax show test` displays template
- [ ] `ax remove test` deletes command
- [ ] `ax token remove mac-mini` deletes token
- [ ] Invalid command name shows error
- [ ] Missing template shows usage

## License

MIT
