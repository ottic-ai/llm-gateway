import Anthropic from '@anthropic-ai/sdk';
import { EnumLLMProvider } from 'src/enums';
import { IChatCompletionParams, ILLGatewayParams, ILLMProvider } from 'src/types';

export class AnthropicGateway implements ILLMProvider {
    name: EnumLLMProvider = EnumLLMProvider.ANTHROPIC;
    private anthropic: Anthropic;

    constructor({apiKey}: ILLGatewayParams) {
        this.anthropic = new Anthropic({ apiKey });
    }

    async chatCompletion({model, messages, metadata, max_tokens, temperature, top_p, stream = false, top_k, system, tools, tool_choice, stop_sequences}: IChatCompletionParams) {
        return this.anthropic.messages.create({
            model,
            messages,
            max_tokens,
            temperature,
            top_p,
            top_k,
            system,
            tools,
            tool_choice,
            stop_sequences,
            metadata,
            stream,
        });
    }

    async chatCompletionStream({model, messages, metadata, max_tokens, temperature, top_p, top_k, system, tools, tool_choice, stop_sequences}: IChatCompletionParams) {
        return await this.anthropic.messages.stream({
            model,
            messages,
            max_tokens,
            temperature,
            top_p,
            top_k,
            system,
            tools,
            tool_choice,
            metadata,
            stop_sequences,
        })
    }
}
