const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadConfig } = require('../config');

// Marker comment to identify ax completion in shell configs
const COMPLETION_MARKER = '# ax completion - managed by alias-ex';

function generateBashCompletion() {
  const config = loadConfig();
  const customCommands = Object.keys(config.commands).join(' ');
  
  return `#!/bin/bash
# Bash completion script for ax
# Source this file in your .bashrc: source <(ax complete --bash)

_ax_completions() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  
  # Built-in commands
  local builtins="add run list show remove edit config token complete"
  
  # Custom commands from config
  local customs="${customCommands}"
  
  # All commands (builtins + custom)
  local all_commands="\${builtins} \${customs}"
  
  # First argument completion
  if [ \${COMP_CWORD} -eq 1 ]; then
    COMPREPLY=( $(compgen -W "\${all_commands}" -- \${cur}) )
    return 0
  fi
  
  # Second argument based on first
  local first="\${COMP_WORDS[1]}"
  
  case "\${first}" in
    run)
      # Complete with custom commands
      COMPREPLY=( $(compgen -W "\${customs}" -- \${cur}) )
      ;;
    token)
      # Complete with token subcommands
      COMPREPLY=( $(compgen -W "add list show remove" -- \${cur}) )
      ;;
    show|remove|edit)
      # Complete with custom commands
      COMPREPLY=( $(compgen -W "\${customs}" -- \${cur}) )
      ;;
    add|list|config|complete)
      # No specific completions
      COMPREPLY=()
      ;;
    *)
      # Check if it's a custom command - complete with files/directories
      if [[ " \${customs} " =~ " \${first} " ]]; then
        COMPREPLY=( $(compgen -f -- \${cur}) )
      fi
      ;;
  esac
}

complete -F _ax_completions ax
`;
}

function generateZshCompletion() {
  const config = loadConfig();
  const customCommands = Object.keys(config.commands).join(' ');
  
  return `#!/bin/zsh
# Zsh completion script for ax
# Source this file in your .zshrc: source <(ax complete --zsh)

_ax_completions() {
  local curcontext="$curcontext" state line
  typeset -A opt_args
  
  # Built-in commands
  local builtins=(add run list show remove edit config token complete)
  
  # Custom commands from config
  local customs=(${customCommands})
  
  # All commands
  local all_commands=(\${builtins[@]} \${customs[@]})
  
  _arguments -C \\
    '1: :->command' \\
    '*: :->args'
  
  case "\$state" in
    command)
      _describe -t commands 'ax commands' all_commands
      ;;
    args)
      case "\$line[1]" in
        run)
          _describe -t commands 'custom commands' customs
          ;;
        token)
          _describe -t commands 'token subcommands' (add list show remove)
          ;;
        show|remove|edit)
          _describe -t commands 'custom commands' customs
          ;;
        *)
          # Check if it's a custom command
          if (( \${customs[(I)\$line[1]]} )); then
            _files
          fi
          ;;
      esac
      ;;
  esac
}

compdef _ax_completions ax
`;
}

function generateFishCompletion() {
  const config = loadConfig();
  const customCommands = Object.keys(config.commands).join(' ');
  
  return `# Fish completion script for ax
# Save to ~/.config/fish/completions/ax.fish or run: ax complete --fish > ~/.config/fish/completions/ax.fish

  # Built-in commands
set -l builtins add run list show remove edit config token complete

# Custom commands
set -l customs ${customCommands}

# Complete first argument with all commands
complete -c ax -n '__fish_is_first_arg' -a "$builtins $customs"

# Complete 'run' subcommand with custom commands
complete -c ax -n '__fish_seen_subcommand_from run' -a "$customs"

# Complete 'token' subcommand
complete -c ax -n '__fish_seen_subcommand_from token' -a "add list show remove"

# Complete 'show', 'remove', 'edit' with custom commands
complete -c ax -n '__fish_seen_subcommand_from show' -a "$customs"
complete -c ax -n '__fish_seen_subcommand_from remove' -a "$customs"
complete -c ax -n '__fish_seen_subcommand_from edit' -a "$customs"

# For custom commands, complete with files
complete -c ax -n "__fish_seen_subcommand_from $customs" -a '(__fish_complete_path)'
`;
}

function getShellConfigPath(shell) {
  const home = os.homedir();
  
  switch (shell) {
    case '--bash':
      return path.join(home, '.bashrc');
    case '--zsh':
      return path.join(home, '.zshrc');
    case '--fish':
      // Fish uses a different mechanism - completions go in a directory
      return path.join(home, '.config', 'fish', 'completions', 'ax.fish');
    default:
      return null;
  }
}

function isCompletionInstalled(configPath, marker) {
  try {
    if (!fs.existsSync(configPath)) {
      return false;
    }
    const content = fs.readFileSync(configPath, 'utf8');
    return content.includes(marker);
  } catch (err) {
    return false;
  }
}

function installBashCompletion() {
  const configPath = getShellConfigPath('--bash');
  const sourceLine = `${COMPLETION_MARKER}\nsource <(ax complete --bash)`;
  
  if (isCompletionInstalled(configPath, COMPLETION_MARKER)) {
    console.log('✓ Bash completion is already installed in ~/.bashrc');
    console.log('  To update, remove the line starting with "' + COMPLETION_MARKER + '" and run again');
    return;
  }
  
  try {
    fs.appendFileSync(configPath, '\n' + sourceLine + '\n');
    console.log('✓ Bash completion installed successfully!');
    console.log(`  Added to: ${configPath}`);
    console.log('  Reload your shell with: source ~/.bashrc');
  } catch (err) {
    console.error(`Error: Could not write to ${configPath}`);
    console.error(err.message);
    process.exit(1);
  }
}

function installZshCompletion() {
  const configPath = getShellConfigPath('--zsh');
  const sourceLine = `${COMPLETION_MARKER}\nsource <(ax complete --zsh)`;
  
  if (isCompletionInstalled(configPath, COMPLETION_MARKER)) {
    console.log('✓ Zsh completion is already installed in ~/.zshrc');
    console.log('  To update, remove the line starting with "' + COMPLETION_MARKER + '" and run again');
    return;
  }
  
  try {
    fs.appendFileSync(configPath, '\n' + sourceLine + '\n');
    console.log('✓ Zsh completion installed successfully!');
    console.log(`  Added to: ${configPath}`);
    console.log('  Reload your shell with: source ~/.zshrc');
  } catch (err) {
    console.error(`Error: Could not write to ${configPath}`);
    console.error(err.message);
    process.exit(1);
  }
}

function installFishCompletion() {
  const completionPath = getShellConfigPath('--fish');
  const completionDir = path.dirname(completionPath);
  
  if (isCompletionInstalled(completionPath, 'ax completion')) {
    console.log('✓ Fish completion is already installed');
    console.log(`  Location: ${completionPath}`);
    console.log('  To update, delete the file and run again');
    return;
  }
  
  try {
    // Create completions directory if it doesn't exist
    if (!fs.existsSync(completionDir)) {
      fs.mkdirSync(completionDir, { recursive: true });
    }
    
    // Write completion file
    const completionScript = generateFishCompletion();
    fs.writeFileSync(completionPath, completionScript);
    
    console.log('✓ Fish completion installed successfully!');
    console.log(`  Written to: ${completionPath}`);
    console.log('  Reload your shell or run: source ' + completionPath);
  } catch (err) {
    console.error(`Error: Could not write to ${completionPath}`);
    console.error(err.message);
    process.exit(1);
  }
}

function printCompletion(shell) {
  switch (shell) {
    case '--bash':
      console.log(generateBashCompletion());
      break;
    case '--zsh':
      console.log(generateZshCompletion());
      break;
    case '--fish':
      console.log(generateFishCompletion());
      break;
    default:
      return false;
  }
  return true;
}

function installCompletion(shell) {
  switch (shell) {
    case '--bash':
      installBashCompletion();
      break;
    case '--zsh':
      installZshCompletion();
      break;
    case '--fish':
      installFishCompletion();
      break;
    default:
      return false;
  }
  return true;
}

function completeCommand(args) {
  // Check if first arg is 'install'
  if (args[0] === 'install') {
    if (args.length < 2) {
      console.error('Usage: ax complete install --bash|--zsh|--fish');
      console.error('');
      console.error('Install shell completion to your shell configuration file.');
      console.error('');
      console.error('Examples:');
      console.error('  ax complete install --bash    # Add to ~/.bashrc');
      console.error('  ax complete install --zsh     # Add to ~/.zshrc');
      console.error('  ax complete install --fish    # Add to ~/.config/fish/completions/ax.fish');
      process.exit(1);
    }
    
    if (!installCompletion(args[1])) {
      console.error(`Error: Unknown shell "${args[1]}"`);
      console.error('Supported shells: --bash, --zsh, --fish');
      process.exit(1);
    }
  } else {
    // Print completion script
    if (args.length === 0) {
      console.error('Usage: ax complete --bash|--zsh|--fish');
      console.error('       ax complete install --bash|--zsh|--fish');
      console.error('');
      console.error('Generate or install shell completion scripts for ax.');
      console.error('');
      console.error('Print completion script:');
      console.error('  ax complete --bash      # Output bash completion');
      console.error('  ax complete --zsh       # Output zsh completion');
      console.error('  ax complete --fish      # Output fish completion');
      console.error('');
      console.error('Install completion (adds to shell config):');
      console.error('  ax complete install --bash    # Add to ~/.bashrc');
      console.error('  ax complete install --zsh     # Add to ~/.zshrc');
      console.error('  ax complete install --fish    # Add to fish completions');
      process.exit(1);
    }
    
    if (!printCompletion(args[0])) {
      console.error(`Error: Unknown option "${args[0]}"`);
      console.error('Usage: ax complete --bash|--zsh|--fish');
      console.error('       ax complete install --bash|--zsh|--fish');
      process.exit(1);
    }
  }
}

module.exports = { 
  completeCommand, 
  generateBashCompletion, 
  generateZshCompletion, 
  generateFishCompletion 
};
