import { AzureOpenAI } from 'openai';
import { EnumLLMProvider } from '../../enums';
import { IChatCompletionParams, ILLGatewayParams, ILLMProvider } from '../../types';
import { OpenAIGateway } from '../openai';

export class AzureGateway extends OpenAIGateway implements ILLMProvider {
    constructor(params: ILLGatewayParams) {
        super(params, EnumLLMProvider.AZUREOPENAI);
        this.name = EnumLLMProvider.AZUREOPENAI
    }

}
