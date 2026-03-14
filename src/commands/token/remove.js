const { loadConfig, saveConfig } = require('../../config');

function removeToken(name) {
  if (!name) {
    console.error('Usage: ax token remove <name>');
    process.exit(1);
  }
  
  const config = loadConfig();
  
  if (config.tokens[name] === undefined) {
    console.error(`Error: Token '${name}' not found`);
    process.exit(1);
  }
  
  delete config.tokens[name];
  saveConfig(config);
  
  console.log(`Token '${name}' removed successfully`);
}

module.exports = { removeToken };
