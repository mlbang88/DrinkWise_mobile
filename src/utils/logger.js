/**
 * 📊 Logger centralisé pour DrinkWise
 * Gestion intelligente des logs avec niveaux et environnements
 */

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LogColors = {
  ERROR: '#ff4444',
  WARN: '#ff8800',
  INFO: '#2196f3',
  DEBUG: '#9e9e9e'
};

class Logger {
  constructor() {
    // En production, ne logger que les erreurs
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.level = isDev ? LogLevel.DEBUG : LogLevel.ERROR;
    this.enableStorage = true;
    this.maxStoredLogs = 1000;
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `DW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  shouldLog(level) {
    return level <= this.level;
  }

  formatMessage(level, context, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel)[Object.values(LogLevel).indexOf(level)];
    
    return {
      timestamp,
      level: levelName,
      context,
      message,
      args,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };
  }

  storeLog(logData) {
    if (!this.enableStorage || typeof window === 'undefined') return;
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('drinkwise_logs') || '[]');
      existingLogs.push(logData);
      
      // Garder seulement les logs récents
      if (existingLogs.length > this.maxStoredLogs) {
        existingLogs.splice(0, existingLogs.length - this.maxStoredLogs);
      }
      
      localStorage.setItem('drinkwise_logs', JSON.stringify(existingLogs));
    } catch (error) {
      // Fallback silencieux si localStorage plein
    }
  }

  log(level, context, message, ...args) {
    if (!this.shouldLog(level)) return;

    const logData = this.formatMessage(level, context, message, ...args);
    const levelName = logData.level;
    const color = LogColors[levelName] || '#000000';

    // Console avec style (uniquement en développement)
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDev && typeof console !== 'undefined') {
      const prefix = `%c[${logData.timestamp.split('T')[1].split('.')[0]}] ${levelName} ${context}`;
      const style = `color: ${color}; font-weight: bold;`;
      
      if (args.length > 0) {
        console.log(prefix, style, message, ...args);
      } else {
        console.log(prefix, style, message);
      }
    }

    // Stockage local
    this.storeLog(logData);

    // Envoi des erreurs critiques (production uniquement)
    const isProduction = !isDev;
    if (level === LogLevel.ERROR && isProduction) {
      this.reportError(logData);
    }
  }

  error(context, message, ...args) {
    this.log(LogLevel.ERROR, context, message, ...args);
  }

  warn(context, message, ...args) {
    this.log(LogLevel.WARN, context, message, ...args);
  }

  info(context, message, ...args) {
    this.log(LogLevel.INFO, context, message, ...args);
  }

  debug(context, message, ...args) {
    this.log(LogLevel.DEBUG, context, message, ...args);
  }

  // Méthodes utilitaires
  setLevel(level) {
    this.level = level;
  }

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem('drinkwise_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('drinkwise_logs');
    }
  }

  exportLogs() {
    const logs = this.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `drinkwise_logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  async reportError(logData) {
    // TODO: Intégrer avec un service de monitoring (Sentry, LogRocket, etc.)
    try {
      // Pour l'instant, stockage local renforcé des erreurs
      const errorKey = `drinkwise_errors_${new Date().toISOString().split('T')[0]}`;
      const existingErrors = JSON.parse(localStorage.getItem(errorKey) || '[]');
      existingErrors.push(logData);
      localStorage.setItem(errorKey, JSON.stringify(existingErrors));
    } catch (error) {
      // Fallback silencieux
    }
  }

  // Helper pour les performances
  time(label) {
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDev && typeof console !== 'undefined' && console.time) {
      console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label) {
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDev && typeof console !== 'undefined' && console.timeEnd) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }
}

// Instance singleton
export const logger = new Logger();

// Helpers rapides pour les contextes fréquents
export const authLogger = {
  error: (msg, ...args) => logger.error('AUTH', msg, ...args),
  warn: (msg, ...args) => logger.warn('AUTH', msg, ...args),
  info: (msg, ...args) => logger.info('AUTH', msg, ...args),
  debug: (msg, ...args) => logger.debug('AUTH', msg, ...args)
};

export const firebaseLogger = {
  error: (msg, ...args) => logger.error('FIREBASE', msg, ...args),
  warn: (msg, ...args) => logger.warn('FIREBASE', msg, ...args),
  info: (msg, ...args) => logger.info('FIREBASE', msg, ...args),
  debug: (msg, ...args) => logger.debug('FIREBASE', msg, ...args)
};

export const uiLogger = {
  error: (msg, ...args) => logger.error('UI', msg, ...args),
  warn: (msg, ...args) => logger.warn('UI', msg, ...args),
  info: (msg, ...args) => logger.info('UI', msg, ...args),
  debug: (msg, ...args) => logger.debug('UI', msg, ...args)
};

export const apiLogger = {
  error: (msg, ...args) => logger.error('API', msg, ...args),
  warn: (msg, ...args) => logger.warn('API', msg, ...args),
  info: (msg, ...args) => logger.info('API', msg, ...args),
  debug: (msg, ...args) => logger.debug('API', msg, ...args)
};

export default logger;