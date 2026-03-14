const { loadConfig, saveConfig } = require('../config');

const validSettings = {
  verbose: {
    type: 'boolean',
    parse: (value) => {
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      throw new Error(`Invalid value for verbose: ${value}. Use 'true' or 'false'`);
    }
  }
};

function configCommand(key, value) {
  const config = loadConfig();
  
  // Show all settings
  if (!key) {
    console.log('Current settings:');
    for (const [settingKey, settingValue] of Object.entries(config.settings)) {
      console.log(`  ${settingKey}: ${settingValue}`);
    }
    return;
  }
  
  // Validate setting key
  if (!validSettings[key]) {
    console.error(`Error: Unknown setting '${key}'`);
    console.error(`Valid settings: ${Object.keys(validSettings).join(', ')}`);
    process.exit(1);
  }
  
  // Get setting value
  if (value === undefined) {
    console.log(`${key}: ${config.settings[key]}`);
    return;
  }
  
  // Set setting value
  const settingDef = validSettings[key];
  try {
    config.settings[key] = settingDef.parse(value);
    saveConfig(config);
    console.log(`Setting '${key}' updated to: ${config.settings[key]}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { configCommand };
