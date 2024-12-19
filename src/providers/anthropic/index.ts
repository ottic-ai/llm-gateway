import Anthropic from '@anthropic-ai/sdk';
import { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources';
import { Message, MessageCreateParamsBase, MessageParam, Tool, ToolChoice, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';
import { EnumLLMProvider } from '../../enums';
import { IAnthropicChatCompletion, IChatCompletionParams, ILLGatewayParams, ILLMProvider } from '../../types';

export class AnthropicGateway implements ILLMProvider {
    name: EnumLLMProvider = EnumLLMProvider.ANTHROPIC;
    private anthropic: Anthropic;

    constructor({apiKey}: ILLGatewayParams) {
        this.anthropic = new Anthropic({ apiKey });
    }

    async chatCompletion({model, messages, metadata, max_tokens, temperature, top_p, top_k, system, tools, tool_choice, stop_sequences}: IChatCompletionParams) {
        const inputParams:MessageCreateParamsBase = {
            system,
            model,
            messages: messages as MessageParam[],
            max_tokens,
            temperature,
            top_p,
            top_k,
            tools: tools as Tool[],
            tool_choice: tool_choice as ToolChoice,
            stop_sequences,
            metadata,
        }
        const response:IAnthropicChatCompletion = await this.anthropic.messages.create({...inputParams, ...{stream:false}});
        if (response.stop_reason === 'tool_use') {
            const toolUseBlock = response.content[response.content.length - 1] as ToolUseBlock;
            response.llmGatewayOutput = {
                type: 'tool_calls',
                tool_name: toolUseBlock.name,
                arguments: toolUseBlock.input,
            };
        }
        return response;
    }

    async chatCompletionStream({model, messages, metadata, max_tokens, temperature, top_p, top_k, system, tools, tool_choice, stop_sequences}: IChatCompletionParams) {
        return await this.anthropic.messages.stream({
            model,
            messages: messages as MessageParam[],
            max_tokens,
            temperature,
            top_p,
            top_k,
            system,
            tools: tools as Tool[],
            tool_choice: tool_choice as ToolChoice,
            metadata,
            stop_sequences,
        })
    }
}
