const { addCommand } = require('./commands/add');
const { runCommand } = require('./commands/run');
const { listCommands } = require('./commands/list');
const { showCommand } = require('./commands/show');
const { removeCommand } = require('./commands/remove');
const { editCommand } = require('./commands/edit');
const { configCommand } = require('./commands/config');
const { addToken } = require('./commands/token/add');
const { listTokens } = require('./commands/token/list');
const { showToken } = require('./commands/token/show');
const { removeToken } = require('./commands/token/remove');

function showHelp() {
  console.log(`
Usage: ax <command> [options]

Commands:
  add <name> <template>     Add a new custom command
  run <name> [args...]      Execute a custom command
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

Examples:
  ax token add server 192.168.1.100
  ax add deploy 'scp $1 $USER@$server:$2'
  ax run deploy ./dist /var/www/html
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    showHelp();
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
        runCommand(subArgs[0], subArgs.slice(1));
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
        console.error(`Unknown command: ${command}`);
        console.error('Run "ax --help" for usage information');
        process.exit(1);
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
