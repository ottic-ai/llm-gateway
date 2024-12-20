import { EnumLLMProvider } from "./types";
import { AnthropicGateway } from "./providers/anthropic";
import { AzureGateway } from "./providers/azure";
import { OpenAIGateway } from "./providers/openai";
import { IChatCompletionParams, ILLGatewayParams, ILLMProvider, ILLMGatewayConfig } from "./types";
import { logError, logInfo, logDebug, logWarn } from './utils/logger';
import { 
    convertOpenAIToAnthropic, 
    convertAnthropicToOpenAI, 
    isAnthropicFormat, 
    isOpenAIFormat 
} from './utils/paramConverters';
import * as crypto from 'crypto';

export class LLMGateway {
    private provider: ILLMProvider;
    private fallbackProvider: ILLMProvider;
    private config: ILLMGatewayConfig;

    constructor(options: ILLGatewayParams, config: ILLMGatewayConfig = {}) {
        this.config = config;
        logDebug('Initializing LLMGateway', { provider: options.provider });
        this.provider = this.initProvider(options.provider, options);
        if(config.fallbacks) {
            logInfo('Configuring fallback provider', { 
                provider: config.fallbacks.fallbackProvider.provider,
                model: config.fallbacks.fallbackModel 
            });
            this.fallbackProvider = this.initProvider(config.fallbacks.fallbackProvider.provider, config.fallbacks.fallbackProvider);
        }
    }

    initProvider(provider: string, options) {
        switch (provider) {
            case EnumLLMProvider.OPENAI:
                return new OpenAIGateway(options);
            case EnumLLMProvider.AZUREOPENAI:
                return new AzureGateway(options);
            case EnumLLMProvider.ANTHROPIC:
                return new AnthropicGateway(options);
            default:
                throw new Error('Unsupported model type');
        }
    }

    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        params: IChatCompletionParams,
        maxRetries: number = this.config.retries || 0
    ): Promise<T> {
        let attempts = 0;
        
        while (true) {
            const requestId = crypto.randomUUID();
            try {
                logDebug('Starting operation attempt', { 
                    requestId,
                    attempt: attempts + 1, 
                    model: params.model 
                });
                
                const response = await operation();
                
                logInfo('Operation successful', { 
                    requestId,
                    model: params.model,
                    attempts: attempts + 1
                });
                
                return response;
            } catch (error) {
                attempts++;
                const remainingRetries = maxRetries - attempts;
                
                logError('Operation failed', error as Error, {
                    requestId,
                    attempt: attempts,
                    remainingRetries
                });
                
                if (attempts > maxRetries || !this.shouldRetry(error)) {
                    throw error;
                }
                
                const delayMs = this.calculateBackoff(attempts);
                logDebug('Retrying after delay', { 
                    requestId,
                    delayMs,
                    attempt: attempts + 1
                });
                
                await this.delay(delayMs);
            }
        }
    }
    
    private shouldRetry(error: any): boolean {
        // Retry on rate limits or temporary network issues
        if (error.status === 429 || error.status === 503) return true;
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
        return false;
    }
    
    private calculateBackoff(attempt: number): number {
        const base = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.random() * 1000;
        return Math.floor(base + jitter);
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async chatCompletion(params: IChatCompletionParams) {
        try {
            return await this.retryWithBackoff(
                () => this.provider.chatCompletion(params),
                params
            );
        } catch (error) {
            logInfo('All chat completion attempts failed, trying fallback');
            
            if (!this.fallbackProvider || !this.config.fallbacks?.fallbackModel) {
                throw error;
            }

            try {
                const convertedParams = this.convertParamsForProvider(params);
                convertedParams.model = this.config.fallbacks.fallbackModel;
                
                return await this.retryWithBackoff(
                    () => this.fallbackProvider.chatCompletion(convertedParams),
                    convertedParams
                );
            } catch (fallbackError) {
                logError('Fallback provider also failed', fallbackError as Error);
                throw fallbackError;
            }
        }
    }

    private convertParamsForProvider(params: IChatCompletionParams): IChatCompletionParams {
        const isCurrentAnthropic = this.provider instanceof AnthropicGateway;
        const isFallbackAnthropic = this.fallbackProvider instanceof AnthropicGateway;

        if (isCurrentAnthropic && !isFallbackAnthropic) {
            // Converting from Anthropic to OpenAI format
            logDebug('Converting parameters from Anthropic to OpenAI format');
            return convertAnthropicToOpenAI(params);
        } else if (!isCurrentAnthropic && isFallbackAnthropic) {
            // Converting from OpenAI to Anthropic format
            logDebug('Converting parameters from OpenAI to Anthropic format');
            return convertOpenAIToAnthropic(params);
        }

        return params;
    }

    async chatCompletionStream(params: IChatCompletionParams) {
        try {
            logDebug('Starting chat completion stream', { model: params.model });
            const stream = await this.provider.chatCompletionStream(params);
            logInfo('Chat completion stream established successfully');
            return stream;
        } catch (error) {
            logError('Error in chat completion stream', error as Error);
            throw error;
        }
    }
}