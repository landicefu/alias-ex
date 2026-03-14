const { loadConfig, saveConfig } = require('../config');

function editCommand(name) {
  if (!name) {
    console.error('Usage: ax edit <name>');
    process.exit(1);
  }
  
  const config = loadConfig();
  
  const command = config.commands[name];
  if (!command) {
    console.error(`Error: Command '${name}' not found`);
    process.exit(1);
  }
  
  // For now, just show the command and ask user to use add
  // In a full implementation, this would open an editor
  console.log(`Current template for '${name}':`);
  console.log(`  ${command.template}`);
  console.log();
  console.log('To edit, use: ax add ' + name + " '<new-template>'");
}

module.exports = { editCommand };
