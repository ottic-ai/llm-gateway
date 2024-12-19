import OpenAI, { AzureOpenAI } from 'openai';
import { AssistantTool } from 'openai/resources/beta/assistants';
import { AssistantToolChoiceOption } from 'openai/resources/beta/threads/threads';
import { ChatCompletion, ChatCompletionChunk, ChatCompletionCreateParamsBase, ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam, ChatCompletionTool, ChatCompletionToolChoiceOption } from 'openai/resources/chat/completions';
import { EnumLLMProvider, IChatCompletionParams, ILLGatewayParams, ILLMProvider, IOpenAIChatCompletion } from '../../types';
import { Stream } from 'openai/streaming';

export class OpenAIGateway implements ILLMProvider {
    name: EnumLLMProvider = EnumLLMProvider.OPENAI;
    protected openAIProvider: OpenAI;

    constructor(params: ILLGatewayParams, provider: EnumLLMProvider = EnumLLMProvider.OPENAI) {
        if(provider === EnumLLMProvider.AZUREOPENAI) {
            this.openAIProvider = new AzureOpenAI({ apiKey: params.apiKey, endpoint: params.endpoint, deployment: params.deployment, apiVersion: params.apiVersion });
        } else {
            this.openAIProvider = new OpenAI({ apiKey: params.apiKey || process.env['OPENAI_API_KEY'], baseURL: params.endpoint });
        }
    }

    async chatCompletion(params: IChatCompletionParams) {
        const input:ChatCompletionCreateParamsBase = {
            model: params.model,
            messages: params.messages as ChatCompletionMessageParam[],
            max_completion_tokens: params.max_completion_tokens,
            temperature: params.temperature,
            tools: params.tools as ChatCompletionTool[],
            tool_choice: params.tool_choice as ChatCompletionToolChoiceOption,
            top_p: params.top_p,
            n: params.n,
            response_format: params.response_format,
            metadata: params.metadata,
        }
        const response: IOpenAIChatCompletion | Stream<ChatCompletionChunk> = await this.openAIProvider.chat.completions.create({...input, ...{stream: false}});
        if(!response) {
            throw new Error('No response received');
        }

        const completion = response.choices[0];
        if (completion.finish_reason === 'tool_calls') {
            response.llmGatewayOutput = [{
                type: 'tool_calls',
                tool_name: completion.message.tool_calls[0].function.name,
                arguments: JSON.parse(completion.message.tool_calls[0].function.arguments),
            }];
        } else {
            response.llmGatewayOutput = [{
                type: 'text',
                content: completion.message.content,
            }];
        }
        return response;
    }

    async chatCompletionStream(params: IChatCompletionParams) {
        const input:ChatCompletionCreateParamsBase = {
            model: params.model,
            messages: params.messages as ChatCompletionMessageParam[],
            max_completion_tokens: params.max_completion_tokens,
            temperature: params.temperature,
            tools: params.tools as ChatCompletionTool[],
            tool_choice: params.tool_choice as ChatCompletionToolChoiceOption,
            top_p: params.top_p,
            n: params.n,
            response_format: params.response_format,
            metadata: params.metadata,
        }
        const response: Stream<ChatCompletionChunk> = await this.openAIProvider.chat.completions.create({...input, ...{stream: true}});
        if(!response) {
            throw new Error('No response received');
        }

        return response;
    }


 
} 