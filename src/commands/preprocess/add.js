const { loadConfig, saveConfig } = require('../../config');

const VALID_TYPES = ['replace', 'regex', 'map', 'default'];

function usage() {
  console.error('Usage: ax preprocess add <type> <command> <arg1> <arg2>');
  console.error('Types:');
  console.error('  replace <cmd> <match>    <replace>      Literal substring replace');
  console.error('  regex   <cmd> <pattern>  <replacement>  JS regex (use $1..$9 for groups)');
  console.error('  map     <cmd> <key>      <value>        Whole-arg alias');
  console.error('  default <cmd> <position> <value>        Fill missing positional arg');
}

function addPreprocess(type, commandName, arg1, arg2) {
  if (!type || !commandName || arg1 === undefined || arg2 === undefined) {
    usage();
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type)) {
    console.error(`Error: Unknown preprocess type '${type}'`);
    usage();
    process.exit(1);
  }

  const config = loadConfig();
  const command = config.commands[commandName];
  if (!command) {
    console.error(`Error: Command '${commandName}' not found`);
    process.exit(1);
  }

  let rule;
  let identifier;
  switch (type) {
    case 'replace': {
      if (arg1 === '') {
        console.error('Error: match cannot be empty');
        process.exit(1);
      }
      rule = { type: 'replace', match: arg1, replace: arg2 };
      identifier = rule => rule.type === 'replace' && rule.match === arg1;
      break;
    }
    case 'regex': {
      if (arg1 === '') {
        console.error('Error: pattern cannot be empty');
        process.exit(1);
      }
      try {
        new RegExp(arg1);
      } catch (err) {
        console.error(`Error: Invalid regex pattern: ${err.message}`);
        process.exit(1);
      }
      rule = { type: 'regex', pattern: arg1, replacement: arg2 };
      identifier = rule => rule.type === 'regex' && rule.pattern === arg1;
      break;
    }
    case 'map': {
      if (arg1 === '') {
        console.error('Error: key cannot be empty');
        process.exit(1);
      }
      rule = { type: 'map', key: arg1, value: arg2 };
      identifier = rule => rule.type === 'map' && rule.key === arg1;
      break;
    }
    case 'default': {
      const pos = parseInt(arg1, 10);
      if (!Number.isFinite(pos) || pos < 1 || String(pos) !== arg1) {
        console.error(`Error: position must be a positive integer, got '${arg1}'`);
        process.exit(1);
      }
      rule = { type: 'default', position: pos, value: arg2 };
      identifier = rule => rule.type === 'default' && rule.position === pos;
      break;
    }
  }

  if (!Array.isArray(command.preprocess)) {
    command.preprocess = [];
  }

  const existingIndex = command.preprocess.findIndex(identifier);
  if (existingIndex !== -1) {
    command.preprocess[existingIndex] = rule;
    console.log(`Preprocess rule ${existingIndex + 1} on '${commandName}' updated (${type})`);
  } else {
    command.preprocess.push(rule);
    console.log(`Preprocess rule added to '${commandName}' (${type}) as #${command.preprocess.length}`);
  }

  saveConfig(config);
}

module.exports = { addPreprocess };
