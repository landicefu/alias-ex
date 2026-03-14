const { loadConfig, saveConfig } = require('../config');

function addCommand(name, template) {
  if (!name || !template) {
    console.error('Usage: ax add <name> <template>');
    process.exit(1);
  }
  
  // Validate command name
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    console.error(`Error: Invalid command name '${name}'`);
    console.error('Command names must start with a letter and contain only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }
  
  const config = loadConfig();
  
  config.commands[name] = {
    template: template
  };
  
  saveConfig(config);
  console.log(`Command '${name}' added successfully`);
}

module.exports = { addCommand };
