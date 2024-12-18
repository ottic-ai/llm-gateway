import { EnumLLMProvider } from "./enums";

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
    system?: string; // anthropic
    model: string;
    messages: any[];
    max_tokens: number;
    max_completion_tokens: number;
    metadata: any;
    n: number;
    temperature: number;
    top_p: number;
    tools: any[];
    tool_choice: any;
    response_format: any;
    stream: boolean;
    top_k: number;
    stop_sequences: string[];
}

export interface ILLGatewayParams {
    apiKey: string;
    endpoint?: string;
    deployment?: string;
    apiVersion?: string;
    provider: EnumLLMProvider;
}

export interface LLMGatewayConfig {
    fallbacks: {
        retries: number;
        timeout: number; 
        fallbackModel: string;
        fallbackProvider: ILLGatewayParams
    }
}