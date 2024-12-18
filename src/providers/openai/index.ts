import OpenAI, { AzureOpenAI } from 'openai';
import { EnumLLMProvider } from 'src/enums';
import { IChatCompletionParams, ILLGatewayParams, ILLMProvider } from 'src/types';

export class OpenAIGateway implements ILLMProvider {
    name: EnumLLMProvider = EnumLLMProvider.OPENAI;
    protected openAIProvider: OpenAI;

    constructor(params: ILLGatewayParams, provider: EnumLLMProvider = EnumLLMProvider.OPENAI) {
        if(provider === EnumLLMProvider.AZUREOPENAI) {
            this.openAIProvider = new AzureOpenAI({ apiKey: params.apiKey, endpoint: params.endpoint, deployment: params.deployment, apiVersion: params.apiVersion });
        } else {
            this.openAIProvider = new OpenAI({ apiKey: params.apiKey, baseURL: params.endpoint });
        }
    }

    async chatCompletion({stream = false, ...params}: IChatCompletionParams) {
        const response = await this.openAIProvider.chat.completions.create({
            model: params.model,
            messages: params.messages,
            max_completion_tokens: params.max_completion_tokens,
            temperature: params.temperature,
            tools: params.tools,
            tool_choice: params.tool_choice,
            top_p: params.top_p,
            n: params.n,
            response_format: params.response_format,
            metadata: params.metadata,
            stream
        });
  
        return response;
    }

    async chatCompletionStream(params: IChatCompletionParams) {
        return this.chatCompletion({...params, stream: true});
    }


 
} 