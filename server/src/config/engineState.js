const config = require('./env');

let activeEngine = config.defaultDb || 'POSTGRES';

function getActiveEngine() {
  return activeEngine;
}

function setActiveEngine(engine) {
  if (['POSTGRES', 'MONGODB'].includes(engine?.toUpperCase())) {
    activeEngine = engine.toUpperCase();
  }
  return activeEngine;
}

module.exports = {
  getActiveEngine,
  setActiveEngine,
};
