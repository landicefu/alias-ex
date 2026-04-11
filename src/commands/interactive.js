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
  • Pass arguments to commands: ${colors.green}deploy ./dist /var/www${colors.reset}
`);
}

function executeShellCommand(commandLine) {
  return new Promise((resolve) => {
    const child = spawn(commandLine, [], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      resolve(code);
    });
    
    child.on('error', (err) => {
      console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
      resolve(1);
    });
  });
}

function executeAxCommand(commandName, args, config) {
  return new Promise((resolve) => {
    const command = config.commands[commandName];
    if (!command) {
      console.error(`${colors.red}Error: Command '${commandName}' not found${colors.reset}`);
      resolve(1);
      return;
    }
    
    const parsedCommand = parseTemplate(command.template, args, config.tokens);
    
    console.log(`${colors.gray}→ ${parsedCommand}${colors.reset}`);
    
    const child = spawn(parsedCommand, [], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`${colors.gray}(exit code: ${code})${colors.reset}`);
      }
      resolve(code);
    });
    
    child.on('error', (err) => {
      console.error(`${colors.red}Error executing command: ${err.message}${colors.reset}`);
      resolve(1);
    });
  });
}

function clearScreen() {
  console.clear();
  // Also send clear escape sequence for better compatibility
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
      // Mask sensitive values
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
  
  rl.prompt();
  
  rl.on('line', async (input) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      rl.prompt();
      return;
    }
    
    const parts = trimmed.split(/\s+/);
    const firstWord = parts[0];
    const args = parts.slice(1);
    
    // Check for special commands
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
    
    // Check if it's an ax command
    if (config.commands && config.commands[firstWord]) {
      await executeAxCommand(firstWord, args, config);
    } else {
      // Execute as shell command
      await executeShellCommand(trimmed);
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    console.log(`\n${colors.gray}Goodbye!${colors.reset}`);
    process.exit(0);
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log();
    rl.prompt();
  });
}

module.exports = { interactiveShell };
