import { EnumLLMProvider } from "./enums";
import { AnthropicGateway } from "./providers/anthropic";
import { AzureGateway } from "./providers/azure";
import { OpenAIGateway } from "./providers/openai";
import { IChatCompletionParams, ILLGatewayParams, ILLMProvider, LLMGatewayConfig } from "./types";



export class LLMGateway {
    private provider: ILLMProvider;
    private fallbackProvider: ILLMProvider;
    private config: LLMGatewayConfig;

    constructor(options: ILLGatewayParams, config: LLMGatewayConfig) {
        this.config = config;
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
            let response ;
            while(this.config.fallbacks.retries > 0) {
                response = await this.provider.chatCompletion(params);
                if(response.choices.length > 0) {
                    return response;
                }
                this.config.fallbacks.retries--;
            }
            return response;
        } catch (error) {
            console.error('Error in chatCompletion:', error);
            params.model = this.config.fallbacks.fallbackModel;
            await this.fallbackProvider.chatCompletion(params);
            throw error;
        }
    }

    async chatCompletionStream(params: IChatCompletionParams) {
        return this.provider.chatCompletionStream(params);
    }
}