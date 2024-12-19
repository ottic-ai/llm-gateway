import { AssistantToolChoice, AssistantToolChoiceOption } from "openai/resources/beta/threads/threads";
import { EnumLLMProvider } from "./enums";
import { ContentBlockParam, Message, TextBlockParam, Tool, ToolChoice } from "@anthropic-ai/sdk/resources";
import { AssistantTool } from "openai/resources/beta/assistants";
import { ChatCompletion, ChatCompletionTool, ChatCompletionToolChoiceOption, ResponseFormatJSONObject, ResponseFormatJSONSchema, ResponseFormatText } from "openai/resources";

export interface ClientOptions {
    apiKey: string;
    endpoint?: string;
    modelType: string;
}

export interface ILLMProvider {
    name: EnumLLMProvider;
    chatCompletion(params: IChatCompletionParams): Promise<any>;
    chatCompletionStream(params: IChatCompletionParams): Promise<any>;
}

export interface IChatCompletionParams {
    // Common parameters
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
        content: string | ContentBlockParam[];
        name?: string;
    }>;
    temperature?: number;
    top_p?: number;
    metadata?: any;
    tools?: ChatCompletionTool[] | Tool[];
    tool_choice?: ChatCompletionToolChoiceOption | ToolChoice;

    // OpenAI specific parameters
    n?: number;
    max_completion_tokens?: number;

    response_format?:  ResponseFormatText | ResponseFormatJSONObject | ResponseFormatJSONSchema;

    // Anthropic specific parameters
    max_tokens?: number;
    system?: string | TextBlockParam[];
    top_k?: number;
    stop_sequences?: string[];
}

export interface ILLGatewayParams {
    apiKey?: string;
    endpoint?: string;
    deployment?: string;
    apiVersion?: string;
    provider: EnumLLMProvider;
}

export interface ILLMGatewayConfig {
    retries?: number;
    timeout?: number; 
    fallbacks?: {
        fallbackModel?: string;
        fallbackProvider?: ILLGatewayParams
    }
}

export interface IOpenAIChatCompletion extends ChatCompletion {
    llmGatewayOutput?: {
        type: string;
        content?: string;
        tool_name?: string;
        arguments?: string;
    }
}

export interface IAnthropicChatCompletion extends Message {
    llmGatewayOutput?: {
        type: string;
        content?: string;
        tool_name?: string;
        arguments?: string | unknown;
    }
}
