import { EnumLLMProvider } from '../enums';
import { IChatCompletionParams, ILLMProvider } from '../types';

export class MockProvider implements ILLMProvider {
    name = EnumLLMProvider.OPENAI;
    private shouldFail: boolean;
    private emptyResponse: boolean;

    constructor(shouldFail = false, emptyResponse = false) {
        this.shouldFail = shouldFail;
        this.emptyResponse = emptyResponse;
    }

    async chatCompletion(params: IChatCompletionParams): Promise<any> {
        if (this.shouldFail) {
            throw new Error('Mock provider error');
        }

        return {
            choices: this.emptyResponse ? [] : [{
                message: {
                    content: 'Mock response',
                    role: 'assistant'
                },
                finish_reason: 'stop'
            }]
        };
    }

    async chatCompletionStream(params: IChatCompletionParams): Promise<any> {
        if (this.shouldFail) {
            throw new Error('Mock provider stream error');
        }

        const mockStream = {
            async* [Symbol.asyncIterator]() {
                yield {
                    choices: [{
                        delta: {
                            content: 'Mock',
                            role: 'assistant'
                        }
                    }]
                };
                yield {
                    choices: [{
                        delta: {
                            content: ' stream',
                            role: 'assistant'
                        }
                    }]
                };
            }
        };

        return mockStream;
    }
}
