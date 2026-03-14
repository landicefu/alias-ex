const { loadConfig, saveConfig } = require('../config');

function removeCommand(name) {
  if (!name) {
    console.error('Usage: ax remove <name>');
    process.exit(1);
  }
  
  const config = loadConfig();
  
  if (!config.commands[name]) {
    console.error(`Error: Command '${name}' not found`);
    process.exit(1);
  }
  
  delete config.commands[name];
  saveConfig(config);
  
  console.log(`Command '${name}' removed successfully`);
}

module.exports = { removeCommand };
