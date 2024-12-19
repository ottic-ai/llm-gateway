import * as winston from 'winston';
const { createLogger, format, transports } = winston;
const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
    ),
    defaultMeta: { service: 'llm-gateway' },
    transports: [
        new transports.Console({
            format: combine(
                colorize(),
                simple()
            )
        })
    ]
});

// Add file transports only in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new transports.File({ filename: 'error.log', level: 'error' }));
    logger.add(new transports.File({ filename: 'combined.log' }));
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
