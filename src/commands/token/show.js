const { loadConfig } = require('../../config');

function showToken(name) {
  if (!name) {
    console.error('Usage: ax token show <name>');
    process.exit(1);
  }
  
  const config = loadConfig();
  
  const value = config.tokens[name];
  if (value === undefined) {
    console.error(`Error: Token '${name}' not found`);
    process.exit(1);
  }
  
  console.log(`${name} = ${value}`);
}

module.exports = { showToken };
