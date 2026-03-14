const { loadConfig } = require('../config');

// ANSI color codes
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

function getTerminalWidth() {
  return process.stdout.columns || 80;
}

function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

function listCommands() {
  const config = loadConfig();

  const commandNames = Object.keys(config.commands);

  if (commandNames.length === 0) {
    console.log(`${colors.gray}No commands configured. Use "ax add <name> <template>" to add commands.${colors.reset}`);
    return;
  }

  const terminalWidth = getTerminalWidth();
  const padding = 4; // spaces between name and template

  // Find the longest command name for alignment
  const maxNameLength = Math.max(...commandNames.map(name => name.length));

  console.log(`${colors.cyan}Configured commands:${colors.reset}\n`);

  for (const name of commandNames.sort()) {
    const cmd = config.commands[name];
    const nameStr = `${colors.yellow}${name}${colors.reset}`;

    // Calculate available space for template
    const templateStart = maxNameLength + padding;
    const availableWidth = terminalWidth - templateStart;

    // Truncate template if needed
    const templateStr = availableWidth > 10
      ? truncate(cmd.template, availableWidth)
      : truncate(cmd.template, Math.max(10, terminalWidth - name.length - 2));

    // Pad the name for alignment
    const paddedName = nameStr + ' '.repeat(maxNameLength - name.length);

    console.log(`  ${paddedName}  ${colors.gray}${templateStr}${colors.reset}`);
  }
}

module.exports = { listCommands };
