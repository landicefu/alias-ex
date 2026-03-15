const fs = require('fs');
const path = require('path');
const { AutoComplete } = require('enquirer');
const { addCommand } = require('./commands/add');
const { runCommand, runCustomCommand } = require('./commands/run');
const { listCommands } = require('./commands/list');
const { showCommand } = require('./commands/show');
const { removeCommand } = require('./commands/remove');
const { editCommand } = require('./commands/edit');
const { configCommand } = require('./commands/config');
const { addToken } = require('./commands/token/add');
const { listTokens } = require('./commands/token/list');
const { showToken } = require('./commands/token/show');
const { removeToken } = require('./commands/token/remove');
const { loadConfig } = require('./config');

function getVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (err) {
    return 'unknown';
  }
}

function showHelp() {
  console.log(`
Usage: ax <command> [options]

Commands:
  add <name> <template>     Add a new custom command
  run <name> [args...]      Execute a custom command
  run -c <command> [args..] Execute a custom command inline (supports token substitution)
  list                      List all configured commands
  show <name>               Show command template
  remove <name>             Remove a command
  edit <name>               Edit a command template
  config [key] [value]      Get or set configuration

Token Commands:
  token add <name> <value>  Add a reusable token
  token list                List all tokens
  token show <name>         Show token value
  token remove <name>       Remove a token

Options:
  -h, --help                Show this help message
  -v, --version             Show version number

Command Matching:
  You can use partial command names - if multiple commands match,
  an interactive fuzzy finder will help you select the right one.

Examples:
  ax token add server 192.168.1.100
  ax add deploy 'scp $1 $USER@$server:$2'
  ax run deploy ./dist /var/www/html
  ax run -c 'ssh landicefu@$server'
  ax dep                    # Fuzzy match: shows deploy, deploy-prod, etc.
  ax run dep                # Same as above
`);
}

// Find commands that match the partial input
function findMatchingCommands(partial, commands) {
  if (!partial) return Object.keys(commands);
  
  const partialLower = partial.toLowerCase();
  return Object.keys(commands).filter(cmd => 
    cmd.toLowerCase().includes(partialLower)
  );
}

// Show interactive fuzzy finder for command selection
async function promptForCommand(partial, commands, message = 'Select a command:') {
  const choices = Object.entries(commands).map(([name, cmd]) => ({
    name: name,
    message: `${name.padEnd(20)} ${cmd.template}`,
    value: name
  }));

  const prompt = new AutoComplete({
    name: 'command',
    message: message,
    limit: 10,
    initial: partial || '',
    choices: choices,
    suggest(input, choices) {
      if (!input) return choices;
      const inputLower = input.toLowerCase();
      return choices.filter(choice => 
        choice.name.toLowerCase().includes(inputLower)
      );
    }
  });

  try {
    const answer = await prompt.run();
    return answer;
  } catch (err) {
    // User cancelled (Ctrl+C)
    process.exit(0);
  }
}

// Handle command execution with fuzzy matching
async function handleCommandExecution(commandName, args, config) {
  // Exact match - execute directly
  if (config.commands[commandName]) {
    runCommand(commandName, args);
    return;
  }

  // Find partial matches
  const matches = findMatchingCommands(commandName, config.commands);

  if (matches.length === 0) {
    console.error(`Unknown command: ${commandName}`);
    console.error('Run "ax --help" for usage information');
    process.exit(1);
  } else if (matches.length === 1) {
    // Single match - execute it
    console.log(`Executing '${matches[0]}' (matched from '${commandName}')`);
    runCommand(matches[0], args);
  } else {
    // Multiple matches - show interactive picker with only matched commands
    console.log(`Multiple matches for '${commandName}':`);
    const matchedCommands = {};
    matches.forEach(match => {
      matchedCommands[match] = config.commands[match];
    });
    const selected = await promptForCommand(commandName, matchedCommands, 'Select command to run:');
    runCommand(selected, args);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    showHelp();
    return;
  }

  if (args[0] === '-v' || args[0] === '--version') {
    console.log(getVersion());
    return;
  }
  
  const command = args[0];
  const subArgs = args.slice(1);
  
  try {
    switch (command) {
      case 'add':
        addCommand(subArgs[0], subArgs.slice(1).join(' '));
        break;
      
      case 'run':
        if (subArgs[0] === '-c') {
          if (subArgs.length < 2) {
            console.error('Error: -c option requires a command argument');
            console.error('Usage: ax run -c "<command>" [args...]');
            process.exit(1);
          }
          const customCommand = subArgs[1];
          const customArgs = subArgs.slice(2);
          runCustomCommand(customCommand, customArgs);
        } else if (!subArgs[0]) {
          // ax run <TAB> or ax run with no command - show all commands
          const config = loadConfig();
          if (Object.keys(config.commands).length === 0) {
            console.log('No commands configured. Use "ax add <name> <template>" to add commands.');
          } else {
            const selected = await promptForCommand('', config.commands, 'Select command to run:');
            runCommand(selected, []);
          }
        } else {
          // Check for partial match
          const config = loadConfig();
          const commandName = subArgs[0];
          const commandArgs = subArgs.slice(1);
          
          // Exact match
          if (config.commands[commandName]) {
            runCommand(commandName, commandArgs);
          } else {
            // Try fuzzy matching
            await handleCommandExecution(commandName, commandArgs, config);
          }
        }
        break;
      
      case 'list':
        listCommands();
        break;
      
      case 'show':
        showCommand(subArgs[0]);
        break;
      
      case 'remove':
        removeCommand(subArgs[0]);
        break;
      
      case 'edit':
        editCommand(subArgs[0]);
        break;

      case 'config':
        configCommand(subArgs[0], subArgs[1]);
        break;

      case 'token':
        handleTokenCommand(subArgs);
        break;
      
      default:
        // Check if it's a custom command (exact or fuzzy match)
        const config = loadConfig();
        await handleCommandExecution(command, subArgs, config);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

function handleTokenCommand(args) {
  if (args.length === 0) {
    console.error('Usage: ax token <subcommand> [options]');
    console.error('Subcommands: add, list, show, remove');
    process.exit(1);
  }
  
  const subCommand = args[0];
  const subArgs = args.slice(1);
  
  switch (subCommand) {
    case 'add':
      addToken(subArgs[0], subArgs.slice(1).join(' '));
      break;
    
    case 'list':
      listTokens();
      break;
    
    case 'show':
      showToken(subArgs[0]);
      break;
    
    case 'remove':
      removeToken(subArgs[0]);
      break;
    
    default:
      console.error(`Unknown token subcommand: ${subCommand}`);
      console.error('Subcommands: add, list, show, remove');
      process.exit(1);
  }
}

module.exports = { main, showHelp };

// Run if called directly
if (require.main === module) {
  main();
}
