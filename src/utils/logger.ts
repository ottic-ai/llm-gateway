import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'llm-gateway' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// If we're not in production, log to the console with colorized output
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

export const logError = (message: string, error?: Error, metadata?: any) => {
    logger.error(message, {
        error: error?.message,
        stack: error?.stack,
        ...metadata
    });
};

export const logInfo = (message: string, metadata?: any) => {
    logger.info(message, metadata);
};

export const logWarn = (message: string, metadata?: any) => {
    logger.warn(message, metadata);
};

export const logDebug = (message: string, metadata?: any) => {
    logger.debug(message, metadata);
};

export default logger;
