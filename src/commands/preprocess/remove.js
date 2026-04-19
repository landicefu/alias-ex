const { loadConfig, saveConfig } = require('../../config');
const { formatRule } = require('./format');

function removePreprocess(commandName, indexArg) {
  if (!commandName || indexArg === undefined) {
    console.error('Usage: ax preprocess remove <command> <index>');
    console.error('  Use "ax preprocess list <command>" to see rule indices.');
    process.exit(1);
  }

  const index = parseInt(indexArg, 10);
  if (!Number.isFinite(index) || index < 1 || String(index) !== String(indexArg)) {
    console.error(`Error: index must be a positive integer, got '${indexArg}'`);
    process.exit(1);
  }

  const config = loadConfig();
  const command = config.commands[commandName];
  if (!command) {
    console.error(`Error: Command '${commandName}' not found`);
    process.exit(1);
  }

  const rules = Array.isArray(command.preprocess) ? command.preprocess : [];
  if (index > rules.length) {
    console.error(`Error: '${commandName}' has only ${rules.length} preprocess rule(s)`);
    process.exit(1);
  }

  const [removed] = rules.splice(index - 1, 1);
  if (rules.length === 0) {
    delete command.preprocess;
  } else {
    command.preprocess = rules;
  }

  saveConfig(config);
  console.log(`Removed rule #${index} from '${commandName}': ${formatRule(removed)}`);
}

module.exports = { removePreprocess };
