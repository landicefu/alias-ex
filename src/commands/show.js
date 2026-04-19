const { loadConfig } = require('../config');
const { formatRule } = require('./preprocess/format');

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

  if (Array.isArray(command.preprocess) && command.preprocess.length > 0) {
    console.log(`Preprocess rules:`);
    command.preprocess.forEach((rule, i) => {
      console.log(`  ${i + 1}. ${formatRule(rule)}`);
    });
  }
}

module.exports = { showCommand };
