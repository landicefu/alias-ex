const { loadConfig } = require('../../config');

function listTokens() {
  const config = loadConfig();
  
  const tokenNames = Object.keys(config.tokens);
  
  if (tokenNames.length === 0) {
    console.log('No tokens configured. Use "ax token add <name> <value>" to add tokens.');
    return;
  }
  
  console.log('Configured tokens:');
  console.log();
  
  for (const name of tokenNames.sort()) {
    const value = config.tokens[name];
    console.log(`  ${name} = ${value}`);
  }
}

module.exports = { listTokens };
