const readline = require('readline');
const { spawn } = require('child_process');
const { loadConfig, saveConfig } = require('../config');
const { parseTemplate } = require('../parser');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function getPrompt(config) {
  const commandCount = Object.keys(config.commands || {}).length;
  return `${colors.cyan}ax${colors.reset}${colors.gray}:${colors.reset}${colors.green}${commandCount}${colors.reset}${colors.yellow}>${colors.reset} `;
}

function printWelcome(config) {
  const commandCount = Object.keys(config.commands || {}).length;
  const tokenCount = Object.keys(config.tokens || {}).length;

  console.log(`
${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}
${colors.cyan}║${colors.reset}      Welcome to ${colors.bright}ax${colors.reset} interactive shell       ${colors.cyan}║${colors.reset}
${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}

${colors.gray}Commands:${colors.reset} ${colors.green}${commandCount}${colors.reset} custom | ${colors.gray}Tokens:${colors.reset} ${colors.green}${tokenCount}${colors.reset}

${colors.dim}Type 'help' for available commands, 'exit' or 'quit' to leave.${colors.reset}
`);
}

function printHelp(config) {
  const commands = Object.keys(config.commands || {}).sort();

  console.log(`
${colors.bright}Available ax commands:${colors.reset}`);
  if (commands.length === 0) {
    console.log(`  ${colors.gray}(none defined)${colors.reset}`);
  } else {
    commands.forEach(cmd => {
      const template = config.commands[cmd].template;
      const displayTemplate = template.length > 50 ? template.substring(0, 50) + '...' : template;
      console.log(`  ${colors.green}${cmd.padEnd(15)}${colors.reset} ${colors.gray}${displayTemplate}${colors.reset}`);
    });
  }

  console.log(`
${colors.bright}Special commands:${colors.reset}
  ${colors.yellow}help${colors.reset}                     Show this help message
  ${colors.yellow}exit/quit${colors.reset}                Exit interactive shell
  ${colors.yellow}clear${colors.reset}                    Clear the screen
  ${colors.yellow}list${colors.reset}                     List all ax commands
  ${colors.yellow}tokens${colors.reset}                   List all tokens

${colors.bright}Token commands:${colors.reset}
  ${colors.yellow}token list${colors.reset}               List all tokens
  ${colors.yellow}token add <name> <value>${colors.reset}   Add a new token
  ${colors.yellow}token remove <name>${colors.reset}       Remove a token
  ${colors.yellow}token show <name>${colors.reset}         Show token value

${colors.bright}Usage:${colors.reset}
  • Type an ${colors.cyan}ax command name${colors.reset} to execute it directly
  • Type any ${colors.gray}shell command${colors.reset} to run it normally
`);
}

function clearScreen() {
  console.clear();
  process.stdout.write('\x1Bc');
}

function listTokens(config) {
  const tokens = Object.keys(config.tokens || {}).sort();

  console.log(`\n${colors.bright}Available tokens:${colors.reset}`);
  if (tokens.length === 0) {
    console.log(`  ${colors.gray}(none defined)${colors.reset}`);
  } else {
    tokens.forEach(name => {
      const value = config.tokens[name];
      const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`  ${colors.magenta}$${name.padEnd(15)}${colors.reset} ${colors.gray}= ${displayValue}${colors.reset}`);
    });
  }
  console.log();
}

function listCommands(config) {
  const commands = Object.keys(config.commands || {}).sort();

  console.log(`\n${colors.bright}Available commands:${colors.reset}`);
  if (commands.length === 0) {
    console.log(`  ${colors.gray}(none defined)${colors.reset}`);
  } else {
    commands.forEach(cmd => {
      const template = config.commands[cmd].template;
      const displayTemplate = template.length > 60 ? template.substring(0, 60) + '...' : template;
      console.log(`  ${colors.green}${cmd.padEnd(15)}${colors.reset} ${colors.gray}${displayTemplate}${colors.reset}`);
    });
  }
  console.log();
}

function handleTokenCommand(args, config) {
  if (args.length === 0) {
    console.log(`${colors.yellow}Usage:${colors.reset} token <list|add|remove|show> [options]`);
    return;
  }

  const subCommand = args[0];
  const subArgs = args.slice(1);

  switch (subCommand) {
    case 'list':
      listTokens(config);
      break;

    case 'add': {
      if (subArgs.length < 2) {
        console.error(`${colors.red}Error: token add requires name and value${colors.reset}`);
        console.log(`${colors.yellow}Usage:${colors.reset} token add <name> <value>`);
        return;
      }
      const name = subArgs[0];
      const value = subArgs.slice(1).join(' ');
      config.tokens[name] = value;
      saveConfig(config);
      console.log(`${colors.green}✓ Token '$${name}' added${colors.reset}`);
      break;
    }

    case 'remove':
    case 'rm': {
      if (subArgs.length < 1) {
        console.error(`${colors.red}Error: token remove requires a name${colors.reset}`);
        console.log(`${colors.yellow}Usage:${colors.reset} token remove <name>`);
        return;
      }
      const name = subArgs[0];
      if (config.tokens[name]) {
        delete config.tokens[name];
        saveConfig(config);
        console.log(`${colors.green}✓ Token '$${name}' removed${colors.reset}`);
      } else {
        console.error(`${colors.red}Error: Token '$${name}' not found${colors.reset}`);
      }
      break;
    }

    case 'show': {
      if (subArgs.length < 1) {
        console.error(`${colors.red}Error: token show requires a name${colors.reset}`);
        console.log(`${colors.yellow}Usage:${colors.reset} token show <name>`);
        return;
      }
      const name = subArgs[0];
      if (config.tokens[name]) {
        console.log(`${colors.magenta}$${name}${colors.reset} = ${config.tokens[name]}`);
      } else {
        console.error(`${colors.red}Error: Token '$${name}' not found${colors.reset}`);
      }
      break;
    }

    default:
      console.error(`${colors.red}Unknown token subcommand: ${subCommand}${colors.reset}`);
      console.log(`${colors.yellow}Usage:${colors.reset} token <list|add|remove|show>`);
  }
}

async function interactiveShell() {
  const config = loadConfig();
  let sigintCount = 0;
  let isCommandRunning = false;
  let currentChild = null;

  printWelcome(config);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(config),
    completer: (line) => {
      const commands = Object.keys(config.commands || {});
      const builtins = ['help', 'exit', 'quit', 'clear', 'list', 'tokens', 'token'];
      const all = [...commands, ...builtins].sort();
      const hits = all.filter(c => c.startsWith(line));
      return [hits.length ? hits : all, line];
    }
  });

  // Handle Ctrl+C when readline is active (idle at prompt).
  // readline intercepts \x03 in raw mode and emits this event.
  // Having this listener prevents readline from closing on Ctrl+C.
  rl.on('SIGINT', () => {
    // Clear the current line
    rl.line = '';
    rl.cursor = 0;

    sigintCount++;
    if (sigintCount === 1) {
      console.log(`\n${colors.gray}(Press Ctrl+C again to exit)${colors.reset}`);
      rl.prompt();
    } else {
      console.log(`\n${colors.gray}Goodbye!${colors.reset}`);
      process.exit(0);
    }
  });

  // Handle Ctrl+C when a command is running.
  // During command execution, readline is paused and stdin raw mode is OFF,
  // so Ctrl+C generates a real SIGINT signal handled here.
  process.on('SIGINT', () => {
    if (isCommandRunning && currentChild && currentChild.pid) {
      try {
        // Kill the entire child process group with SIGTERM.
        // SIGTERM kills sh immediately, preventing it from running
        // subsequent commands in a chain (e.g. "sleep 5; echo test").
        process.kill(-currentChild.pid, 'SIGTERM');
      } catch (e) {
        try {
          currentChild.kill('SIGTERM');
        } catch (e2) {
          // Process already dead
        }
      }
    }
  });

  rl.prompt();

  rl.on('line', async (input) => {
    sigintCount = 0;
    const trimmed = input.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    const parts = trimmed.split(/\s+/);
    const firstWord = parts[0];
    const args = parts.slice(1);

    switch (firstWord) {
      case 'exit':
      case 'quit':
        console.log(`${colors.gray}Goodbye!${colors.reset}`);
        rl.close();
        process.exit(0);
        break;

      case 'help':
        printHelp(config);
        rl.prompt();
        return;

      case 'clear':
        clearScreen();
        rl.prompt();
        return;

      case 'list':
        listCommands(config);
        rl.prompt();
        return;

      case 'tokens':
        listTokens(config);
        rl.prompt();
        return;

      case 'token':
        handleTokenCommand(args, config);
        rl.prompt();
        return;
    }

    // Execute command (ax command or shell command)
    let commandLine;
    if (config.commands && config.commands[firstWord]) {
      commandLine = parseTemplate(config.commands[firstWord].template, args, config.tokens);
      console.log(`${colors.gray}→ ${commandLine}${colors.reset}`);
    } else {
      commandLine = trimmed;
    }

    isCommandRunning = true;

    // Pause readline and disable raw mode so that Ctrl+C generates a real
    // SIGINT signal from the terminal instead of being silently buffered
    // as \x03 in readline's raw-mode input stream.
    rl.pause();
    if (process.stdin.isTTY && process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }

    try {
      await new Promise((resolve) => {
        // detached: true puts the child in its own process group.
        // Ctrl+C from the terminal only reaches ax's process group (not
        // the child), so our SIGINT handler sends SIGTERM to the child's
        // entire group — killing sh before it can run subsequent commands.
        const child = spawn(commandLine, [], {
          stdio: 'inherit',
          shell: true,
          detached: true
        });

        currentChild = child;

        child.on('close', (code) => {
          currentChild = null;
          resolve(code);
        });

        child.on('error', (err) => {
          currentChild = null;
          console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
          resolve(1);
        });
      });
    } finally {
      currentChild = null;
      isCommandRunning = false;

      // Restore raw mode and resume readline
      if (process.stdin.isTTY && process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      rl.resume();
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n${colors.gray}Goodbye!${colors.reset}`);
    process.exit(0);
  });
}

module.exports = { interactiveShell };
