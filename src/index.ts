import { EnumLLMProvider } from "./enums";
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

    async chatCompletion(params: IChatCompletionParams) {
        try {
            let response;
            let attempts = 0;
            const maxRetries = this.config.retries || 0;
            
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
            
            while(attempts <= maxRetries) {
                try {
                    logDebug('Attempting chat completion', { 
                        attempt: attempts + 1, 
                        model: params.model 
                    });
                    
                    response = await this.provider.chatCompletion(params);
                    
                    if(!response) {
                        throw new Error('No response received');
                    }
                    logInfo('Chat completion successful', { 
                        model: params.model,
                        attempts: attempts + 1
                    });
                    return response;

                } catch (error) {
                    attempts++;
                    logError('Error in chat completion attempt', error as Error, {
                        attempt: attempts,
                        remainingRetries: maxRetries - attempts
                    });
                    
                    if (attempts > maxRetries) throw error;
                    
                    // Random delay between 1000-2000ms (1-2 seconds)
                    logDebug('Waiting before next attempt', { 
                        delayMs: Math.round(1000),
                        attempt: attempts + 1
                    });
                    await delay(1000);
                }
            }
            
            return response;
        } catch (error) {
            logInfo('All chat completion attempts failed, trying fallback');
            
            if (!this.fallbackProvider || !this.config.fallbacks?.fallbackModel) {
                throw error;
            }

            try {
                // Convert parameters based on provider type
                const convertedParams = this.convertParamsForProvider(params);
                convertedParams.model = this.config.fallbacks.fallbackModel;
                
                const fallbackResponse = await this.fallbackProvider.chatCompletion(convertedParams);
                logInfo('Fallback request successful', { 
                    fallbackModel: convertedParams.model 
                });
                return fallbackResponse;
            } catch (fallbackError) {
                logError('Fallback request failed', fallbackError as Error);
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