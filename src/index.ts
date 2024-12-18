import { EnumLLMProvider } from "./enums";
import { AnthropicGateway } from "./providers/anthropic";
import { AzureGateway } from "./providers/azure";
import { OpenAIGateway } from "./providers/openai";
import { IChatCompletionParams, ILLGatewayParams, ILLMProvider, LLMGatewayConfig } from "./types";
import { logError, logInfo, logDebug, logWarn } from './utils/logger';

export class LLMGateway {
    private provider: ILLMProvider;
    private fallbackProvider: ILLMProvider;
    private config: LLMGatewayConfig;

    constructor(options: ILLGatewayParams, config: LLMGatewayConfig) {
        this.config = config;
        logDebug('Initializing LLMGateway', { provider: options.provider });
        switch (options.provider) {
            case EnumLLMProvider.OPENAI:
                this.provider = new OpenAIGateway(options);
                break;
            case EnumLLMProvider.AZUREOPENAI:
                this.provider = new AzureGateway(options);
                break;
            case EnumLLMProvider.ANTHROPIC:
                this.provider = new AnthropicGateway(options);
                break;
            default:
                throw new Error('Unsupported model type');
        }
        if(config.fallbacks) {
            logInfo('Configuring fallback provider', { 
                provider: config.fallbacks.fallbackProvider.provider,
                model: config.fallbacks.fallbackModel 
            });
            switch (config.fallbacks.fallbackProvider.provider) {
                case EnumLLMProvider.OPENAI:
                    this.fallbackProvider = new OpenAIGateway(options);
                    break;
                case EnumLLMProvider.ANTHROPIC:
                    this.fallbackProvider = new AnthropicGateway(options);
                    break;
                case EnumLLMProvider.AZUREOPENAI:
                    this.fallbackProvider = new AzureGateway(options);
                    break;
            }
        }
    }

    async chatCompletion(params: IChatCompletionParams) {
        try {
            let response;
            let attempts = 0;
            const maxRetries = this.config.fallbacks?.retries || 0;
            
            while(attempts <= maxRetries) {
                try {
                    logDebug('Attempting chat completion', { 
                        attempt: attempts + 1, 
                        model: params.model 
                    });
                    
                    response = await this.provider.chatCompletion(params);
                    
                    if(response.choices.length > 0) {
                        logInfo('Chat completion successful', { 
                            model: params.model,
                            attempts: attempts + 1
                        });
                        return response;
                    }
                    
                    attempts++;
                    logWarn('Empty response received, retrying', { 
                        attempt: attempts,
                        remainingRetries: maxRetries - attempts
                    });
                } catch (error) {
                    attempts++;
                    logError('Error in chat completion attempt', error as Error, {
                        attempt: attempts,
                        remainingRetries: maxRetries - attempts
                    });
                    if (attempts > maxRetries) throw error;
                }
            }
            
            return response;
        } catch (error) {
            logError('All chat completion attempts failed, trying fallback', error as Error);
            
            if (!this.fallbackProvider || !this.config.fallbacks?.fallbackModel) {
                logError('No fallback configuration available', error as Error);
                throw error;
            }

            try {
                params.model = this.config.fallbacks.fallbackModel;
                const fallbackResponse = await this.fallbackProvider.chatCompletion(params);
                logInfo('Fallback request successful', { 
                    fallbackModel: params.model 
                });
                return fallbackResponse;
            } catch (fallbackError) {
                logError('Fallback request failed', fallbackError as Error);
                throw fallbackError;
            }
        }
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