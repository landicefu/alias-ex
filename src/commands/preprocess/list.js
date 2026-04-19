const { loadConfig } = require('../../config');
const { formatRule } = require('./format');

function listPreprocess(commandName) {
  const config = loadConfig();

  if (commandName) {
    const command = config.commands[commandName];
    if (!command) {
      console.error(`Error: Command '${commandName}' not found`);
      process.exit(1);
    }
    const rules = Array.isArray(command.preprocess) ? command.preprocess : [];
    if (rules.length === 0) {
      console.log(`No preprocess rules for '${commandName}'.`);
      return;
    }
    console.log(`Preprocess rules for '${commandName}':`);
    rules.forEach((rule, i) => {
      console.log(`  ${i + 1}. ${formatRule(rule)}`);
    });
    return;
  }

  const names = Object.keys(config.commands).sort();
  let any = false;
  for (const name of names) {
    const rules = config.commands[name].preprocess;
    if (Array.isArray(rules) && rules.length > 0) {
      any = true;
      console.log(`${name}:`);
      rules.forEach((rule, i) => {
        console.log(`  ${i + 1}. ${formatRule(rule)}`);
      });
    }
  }
  if (!any) {
    console.log('No preprocess rules configured.');
  }
}

module.exports = { listPreprocess };
