import { Tool } from '@anthropic-ai/sdk/resources';
import { IChatCompletionParams } from '../types';
import { MessageParam, ToolChoice } from '@anthropic-ai/sdk/resources';
import { AssistantToolChoiceOption } from 'openai/resources/beta/threads/threads';
import { AssistantTool } from 'openai/resources/beta/assistants';
import { ChatCompletionTool } from 'openai/resources';


export const convertOpenAIToAnthropic = (openAIParams: IChatCompletionParams): IChatCompletionParams => {
    const anthropicParams: IChatCompletionParams = {
        ...openAIParams,
        messages: [],
        system: undefined,
    };

    // Extract system message if present
    const systemMessage = openAIParams.messages.find(msg => msg.role === 'system');
    if (systemMessage) {
        anthropicParams.system = systemMessage.content.toString();
    }

    // Convert messages format
    anthropicParams.messages = openAIParams.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => {
            if (msg.role === 'user' || msg.role === 'assistant') {
                return {
                    role: msg.role,
                    content: msg.content
                };
            }
            // Convert other roles to assistant messages
            return {
                role: 'assistant',
                content: msg.content
            };
        }) as MessageParam[];

    // Convert tool-related parameters
    if (openAIParams.tools && openAIParams.tools.length > 0) {
        anthropicParams.tools = openAIParams.tools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: tool.function.parameters
        } as Tool));

        // Handle tool_choice if specified
        if (openAIParams.tool_choice) {
            if (typeof openAIParams.tool_choice === 'string') {
                switch (openAIParams.tool_choice) {
                    case 'auto':
                        anthropicParams.tool_choice = { type: 'auto' };
                        break;
                    case 'required':
                        anthropicParams.tool_choice = { type: 'any' };
                        break;
                    default:
                        anthropicParams.tool_choice = undefined;
                }
            } else if (openAIParams.tool_choice.type === 'function') {
                anthropicParams.tool_choice = { 
                    type: 'tool', 
                    name: openAIParams.tool_choice.function.name 
                } as ToolChoice;
            }
        }
    }

    // Convert max_tokens if present
    if (openAIParams.max_completion_tokens !== undefined) {
        anthropicParams.max_tokens = openAIParams.max_completion_tokens;
    }

    // Remove OpenAI specific parameters
    delete anthropicParams.n;
    delete anthropicParams.max_completion_tokens;
    delete anthropicParams.response_format;

    return anthropicParams;
};

export const convertAnthropicToOpenAI = (anthropicParams: IChatCompletionParams): IChatCompletionParams => {
    const openAIParams: IChatCompletionParams = {
        ...anthropicParams,
        messages: [],
    };

    // Convert system parameter to system message
    if (anthropicParams.system) {
        openAIParams.messages.push({
            role: 'system',
            content: anthropicParams.system
        });
    }

    // Convert messages format
    openAIParams.messages.push(...anthropicParams.messages.map(msg => ({
        role: msg.role,
        content: msg.content
    })));

    // Convert tools if present
    if (anthropicParams.tools && anthropicParams.tools.length > 0) {
        openAIParams.tools = anthropicParams.tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.input_schema
            }
        } as ChatCompletionTool));
    }

    // Convert tool_choice if present
    if (anthropicParams.tool_choice) {
        const anthToolChoice = anthropicParams.tool_choice as ToolChoice;
        if (anthToolChoice.type) {
            switch (anthToolChoice.type) {
                case 'auto':
                    openAIParams.tool_choice = 'auto';
                    break;
                case 'any':
                    openAIParams.tool_choice = 'required';
                    break;
                case 'tool':
                    if (anthToolChoice.name) {
                        openAIParams.tool_choice = {
                            type: 'function',
                            function: { name: anthToolChoice.name }
                        };
                    }
                    break;
            }
        }
    }

    // Convert max_tokens if present
    if (anthropicParams.max_tokens !== undefined) {
        openAIParams.max_completion_tokens = anthropicParams.max_tokens;
    }

    // Remove Anthropic specific parameters
    delete openAIParams.max_tokens;
    delete openAIParams.system;
    delete openAIParams.top_k;
    delete openAIParams.stop_sequences;

    return openAIParams;
};

export const isAnthropicFormat = (params: IChatCompletionParams): boolean => {
    return 'system' in params || 'stop_sequences' in params || 'top_k' in params;
};

export const isOpenAIFormat = (params: IChatCompletionParams): boolean => {
    return 'n' in params || 'tools' in params || 'tool_choice' in params || 
           'response_format' in params || 'max_completion_tokens' in params;
};
