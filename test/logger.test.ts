import { logDebug, logInfo, logError, logWarn } from '../src/utils/logger';

// Test logging
logDebug('Debug message', { meta: 'debug metadata' });
logInfo('Info message', { meta: 'info metadata' });
logWarn('Warning message', { meta: 'warning metadata' });
logError('Error message', new Error('Test error'), { meta: 'error metadata' });
