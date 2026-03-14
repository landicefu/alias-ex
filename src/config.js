const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.config');
const CONFIG_FILE = process.env.ALIAS_EX_CONFIG || path.join(CONFIG_DIR, 'alias-ex.json');

const defaultConfig = {
  tokens: {},
  commands: {}
};

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...defaultConfig };
  }
  
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(data);
    return {
      tokens: config.tokens || {},
      commands: config.commands || {}
    };
  } catch (err) {
    console.error('Warning: Config file corrupted, using defaults');
    return { ...defaultConfig };
  }
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

module.exports = {
  loadConfig,
  saveConfig,
  CONFIG_FILE
};
