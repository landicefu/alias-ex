const { loadConfig } = require('../config');

// Built-in commands
const BUILTIN_COMMANDS = [
  'add', 'run', 'list', 'show', 'remove', 'edit', 'config', 'token', 'complete', '-h', '--help', '-v', '--version'
];

// Token subcommands
const TOKEN_SUBCOMMANDS = ['add', 'list', 'show', 'remove'];

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
  local builtins="add run list show remove edit config token complete -h --help -v --version"
  
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
      COMPREPLY=( $(compgen -W "\${customs} -c" -- \${cur}) )
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
  local builtins=(add run list show remove edit config token complete -h --help -v --version)
  
  # Custom commands from config
  local customs=(${customCommands})
  
  # All commands
  local all_commands=(\${builtins[@]} \${customs[@]})
  
  _arguments -C \\
    '(-h --help)'{-h,--help}'[Show help message]' \\
    '(-v --version)'{-v,--version}'[Show version number]' \\
    '1: :->command' \\
    '*: :->args'
  
  case "\$state" in
    command)
      _describe -t commands 'ax commands' all_commands
      ;;
    args)
      case "\$line[1]" in
        run)
          _alternative \\
            'commands:custom commands:(\${customs[@]})' \\
            'options:options:(-c)'
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
set -l builtins add run list show remove edit config token complete -h --help -v --version

# Custom commands
set -l customs ${customCommands}

# Complete first argument with all commands
complete -c ax -n '__fish_is_first_arg' -a "$builtins $customs"

# Complete 'run' subcommand with custom commands and -c option
complete -c ax -n '__fish_seen_subcommand_from run' -a "$customs"
complete -c ax -n '__fish_seen_subcommand_from run' -s c -d 'Execute inline command'

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

function completeCommand(shell) {
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
      console.error('Usage: ax complete --bash|--zsh|--fish');
      console.error('');
      console.error('Generate shell completion scripts for ax.');
      console.error('');
      console.error('Examples:');
      console.error('  # Bash (add to ~/.bashrc):');
      console.error('  source <(ax complete --bash)');
      console.error('');
      console.error('  # Zsh (add to ~/.zshrc):');
      console.error('  source <(ax complete --zsh)');
      console.error('');
      console.error('  # Fish (save to completions dir):');
      console.error('  ax complete --fish > ~/.config/fish/completions/ax.fish');
      process.exit(1);
  }
}

module.exports = { completeCommand, generateBashCompletion, generateZshCompletion, generateFishCompletion };
