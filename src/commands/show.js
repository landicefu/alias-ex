const { loadConfig } = require('../config');

function showCommand(name) {
  if (!name) {
    console.error('Usage: ax show <name>');
    process.exit(1);
  }
  
  const config = loadConfig();
  
  const command = config.commands[name];
  if (!command) {
    console.error(`Error: Command '${name}' not found`);
    process.exit(1);
  }
  
  console.log(`Command: ${name}`);
  console.log(`Template: ${command.template}`);
}

module.exports = { showCommand };
