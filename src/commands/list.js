const { loadConfig } = require('../config');

function listCommands() {
  const config = loadConfig();
  
  const commandNames = Object.keys(config.commands);
  
  if (commandNames.length === 0) {
    console.log('No commands configured. Use "ax add <name> <template>" to add commands.');
    return;
  }
  
  console.log('Configured commands:');
  console.log();
  
  for (const name of commandNames.sort()) {
    const cmd = config.commands[name];
    console.log(`  ${name}`);
    console.log(`    ${cmd.template}`);
    console.log();
  }
}

module.exports = { listCommands };
