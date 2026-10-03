const EventEmitter = require('events');
const config = require('./env');

class SystemState extends EventEmitter {
  constructor() {
    super();
    this.activeEngine = config.defaultDatabase === 'mongodb' ? 'mongodb' : 'postgres';
    this.switchedAt = new Date();
    this.switchHistory = [
      {
        engine: this.activeEngine,
        switchedAt: this.switchedAt,
        switchedBy: 'system_init',
      },
    ];
  }

  getActiveEngine() {
    return this.activeEngine;
  }

  setActiveEngine(engine, switchedBy = 'admin') {
    const normalized = (engine || '').toLowerCase().trim();
    if (normalized !== 'postgres' && normalized !== 'mongodb') {
      throw new Error(`Invalid database engine: "${engine}". Must be either "postgres" or "mongodb".`);
    }

    if (this.activeEngine !== normalized) {
      const prev = this.activeEngine;
      this.activeEngine = normalized;
      this.switchedAt = new Date();

      const record = {
        engine: this.activeEngine,
        previousEngine: prev,
        switchedAt: this.switchedAt,
        switchedBy,
      };

      this.switchHistory.push(record);
      if (this.switchHistory.length > 50) {
        this.switchHistory.shift();
      }

      this.emit('engineSwitched', record);
      console.log(`[Database Switch] Active engine switched from "${prev}" to "${normalized}" by ${switchedBy}`);
    }

    return {
      activeEngine: this.activeEngine,
      switchedAt: this.switchedAt,
    };
  }

  getState() {
    return {
      activeEngine: this.activeEngine,
      switchedAt: this.switchedAt,
      historyCount: this.switchHistory.length,
    };
  }

  getHistory() {
    return [...this.switchHistory];
  }
}

const systemState = new SystemState();

module.exports = systemState;
