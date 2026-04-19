const { spawn } = require('child_process');
const { loadConfig } = require('../config');
const { parseTemplate, preprocessArgs } = require('../parser');

function runCommand(name, args) {
  const config = loadConfig();

  const command = config.commands[name];
  if (!command) {
    console.error(`Error: Command '${name}' not found`);
    process.exit(1);
  }

  const processedArgs = preprocessArgs(args, command.preprocess, config.tokens);
  const parsedCommand = parseTemplate(command.template, processedArgs, config.tokens);

  if (config.settings.verbose !== false) {
    console.log(`Executing: ${parsedCommand}`);
  }

  const child = spawn(parsedCommand, [], {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error(`Error executing command: ${err.message}`);
    process.exit(1);
  });
}

function runCustomCommand(template, args) {
  const config = loadConfig();

  const parsedCommand = parseTemplate(template, args, config.tokens);

  if (config.settings.verbose !== false) {
    console.log(`Executing: ${parsedCommand}`);
  }

  const child = spawn(parsedCommand, [], {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error(`Error executing command: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runCommand, runCustomCommand };
