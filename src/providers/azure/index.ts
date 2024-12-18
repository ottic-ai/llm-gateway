import { AzureOpenAI } from 'openai';
import { EnumLLMProvider } from 'src/enums';
import { IChatCompletionParams, ILLGatewayParams, ILLMProvider } from 'src/types';
import { OpenAIGateway } from '../openai';

export class AzureGateway extends OpenAIGateway implements ILLMProvider {
    constructor(params: ILLGatewayParams) {
        super(params, EnumLLMProvider.AZUREOPENAI);
        this.name = EnumLLMProvider.AZUREOPENAI
    }

}
