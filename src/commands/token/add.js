const { loadConfig, saveConfig } = require('../../config');

function addToken(name, value) {
  if (!name || value === undefined) {
    console.error('Usage: ax token add <name> <value>');
    process.exit(1);
  }
  
  // Validate token name
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name)) {
    console.error(`Error: Invalid token name '${name}'`);
    console.error('Token names must start with a letter or underscore and contain only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }
  
  // Check for conflicts with positional args and special vars
  if (/^\d+$/.test(name) || ['DATE', 'TIME', 'DATETIME', 'RANDOM'].includes(name)) {
    console.error(`Error: Token name '${name}' conflicts with reserved variable names`);
    process.exit(1);
  }
  
  const config = loadConfig();
  
  config.tokens[name] = value;
  
  saveConfig(config);
  console.log(`Token '${name}' added successfully`);
}

module.exports = { addToken };
