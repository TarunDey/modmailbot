const json5 = require('json5');
const fs = require('fs');
const path = require('path');

let userConfig;

// Try to find our config file from several options
const configFiles = [
  'config.json',
  'config.json5',
  'config.json.json',
  'config.json.txt',
  'config.js'
];

let foundConfigFile;

for (const configFile of configFiles) {
  try {
    fs.accessSync(__dirname + '/../' + configFile);
    foundConfigFile = configFile;
    break;
  } catch (e) {}
}

if (! foundConfigFile) {
  throw new Error(`Could not find config.json!`);
}

// Parse the config using JSON5
try {
  if (foundConfigFile.endsWith('.js')) {
    userConfig = require(`../${foundConfigFile}`);
  } else {
    const raw = fs.readFileSync(__dirname + '/../' + foundConfigFile);
    userConfig = json5.parse(raw);
  }
} catch (e) {
  throw new Error(`Error reading config file! The error given was: ${e.message}`);
}

const defaultConfig = {
  "token": process.env.TOKEN,
  "mailGuildId": "537606168856494100",
  "mainGuildId": "536932666600194070",
  "logChannelId": "537609101463650304",

  "prefix": "!",
  "snippetPrefix": "!!",
  "snippetPrefixAnon": "!!!",

  "status": "Message me for help!",
  "responseMessage": null,
  "closeMessage": null,
  "allowUserClose": false,

  "newThreadCategoryId": "525654488145723392",
  "mentionRole": "here",
  "pingOnBotMention": true,
  "botMentionResponse": null,

  "inboxServerPermission": null,
  "alwaysReply": false,
  "alwaysReplyAnon": false,
  "useNicknames": false,
  "ignoreAccidentalThreads": true,
  "threadTimestamps": false,
  "allowMove": false,
  "typingProxy": true,
  "typingProxyReverse": true,
  "mentionUserInThreadHeader": false,

  "enableGreeting": false,
  "greetingMessage": null,
  "greetingAttachment": null,

  "requiredAccountAge": 24, // In hours
  "accountAgeDeniedMessage": "Your Discord account is not old enough to contact me!",

  "relaySmallAttachmentsAsAttachments": false,
  "smallAttachmentLimit": 1024 * 1024 * 2,

  "port": 8890,
  "url": null,

  "dbDir": path.join(__dirname, '..', 'db'),
  "knex": null,

  "logDir": path.join(__dirname, '..', 'logs'),
};

const required = ['token', 'mailGuildId', 'mainGuildId', 'logChannelId'];

const finalConfig = Object.assign({}, defaultConfig);

for (const [prop, value] of Object.entries(userConfig)) {
  if (! defaultConfig.hasOwnProperty(prop)) {
    throw new Error(`Invalid option: ${prop}`);
  }

  finalConfig[prop] = value;
}

// Default knex config
if (! finalConfig['knex']) {
  finalConfig['knex'] = {
    client: 'sqlite',
      connection: {
      filename: path.join(finalConfig.dbDir, 'data.sqlite')
    },
    useNullAsDefault: true
  };
}

// Make sure migration settings are always present in knex config
Object.assign(finalConfig['knex'], {
  migrations: {
    directory: path.join(finalConfig.dbDir, 'migrations')
  }
});

// Make sure all of the required config options are present
for (const opt of required) {
  if (! finalConfig[opt]) {
    console.error(`Missing required config.json value: ${opt}`);
    process.exit(1);
  }
}

if (finalConfig.smallAttachmentLimit > 1024 * 1024 * 8) {
  finalConfig.smallAttachmentLimit = 1024 * 1024 * 8;
  console.log('[WARN] smallAttachmentLimit capped at 8MB');
}

// Make sure mainGuildId is internally always an array
if (! Array.isArray(finalConfig['mainGuildId'])) {
  finalConfig['mainGuildId'] = [finalConfig['mainGuildId']];
}

// Make sure inboxServerPermission is always an array
if (! Array.isArray(finalConfig['inboxServerPermission'])) {
  if (finalConfig['inboxServerPermission'] == null) {
    finalConfig['inboxServerPermission'] = [];
  } else {
    finalConfig['inboxServerPermission'] = [finalConfig['inboxServerPermission']];
  }
}

module.exports = finalConfig;
