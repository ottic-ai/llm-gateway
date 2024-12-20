import { LLMGateway } from '../index';
import { MockProvider } from '../__mocks__/mockProvider';
import { EnumLLMProvider, IChatCompletionParams, ILLGatewayParams, ILLMGatewayConfig, } from '../types';
import { ChatCompletionTool, ChatCompletionToolChoiceOption } from 'openai/resources/index.mjs';

// Mock the logger to prevent actual logging during tests
jest.mock('../utils/logger', () => ({
    logError: jest.fn(),
    logInfo: jest.fn(),
    logDebug: jest.fn(),
    logWarn: jest.fn(),
}));

describe('LLMGateway', () => {
    // Mock the provider creation in LLMGateway
    const createMockGateway = (
        shouldFail = false, 
        emptyResponse = false, 
        fallbackShouldFail = false
    ) => {
        const options: ILLGatewayParams = {
            apiKey: 'test-key',
            provider: EnumLLMProvider.OPENAI
        };

        const config: ILLMGatewayConfig = {
            retries: 2,
            timeout: 1000,
            fallbacks: {
                fallbackModel: 'gpt-3.5-turbo',
                fallbackProvider: {
                    apiKey: 'fallback-key',
                    provider: EnumLLMProvider.ANTHROPIC
                }
            }
        };

        const gateway = new LLMGateway(options, config);
        // Replace the providers with our mocks
        (gateway as any).provider = new MockProvider(shouldFail, emptyResponse);
        (gateway as any).fallbackProvider = new MockProvider(fallbackShouldFail);

        return gateway;
    };

    const mockParams: IChatCompletionParams = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100,
        metadata: {},
        temperature: 0.7,
        top_p: 1,
        tools: [{
            type: "function",
            function: {
                name: "test_function",
                description: "A test function",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        } as ChatCompletionTool],
        tool_choice: 'auto' as ChatCompletionToolChoiceOption
    };

    test('should successfully complete a chat request', async () => {
        const gateway = createMockGateway();
        const response = await gateway.chatCompletion(mockParams);

        expect(response).toBeDefined();
        expect(response.choices).toHaveLength(1);
        expect(response.choices[0].message?.content).toBe('Mock response');
    });

    test('should successfully handle streaming chat completion', async () => {
        const gateway = createMockGateway();
        const stream = await gateway.chatCompletionStream({
            ...mockParams,
        });

        const chunks: Array<{
            choices: Array<{
                delta: {
                    content?: string;
                };
            }>;
        }> = [];
        
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        expect(chunks).toHaveLength(2);
        expect(chunks[0].choices[0].delta.content).toBe('Mock');
        expect(chunks[1].choices[0].delta.content).toBe(' stream');
    });

    test('should fall back to secondary provider when primary fails', async () => {
        const gateway = createMockGateway(true, false, false);
        const response = await gateway.chatCompletion(mockParams);

        expect(response).toBeDefined();
        expect(response.choices).toHaveLength(1);
        expect(response.choices[0].message?.content).toBe('Mock response');
    });

    test('should handle retries when receiving empty responses', async () => {
        const gateway = createMockGateway(false, true, false);
        const response = await gateway.chatCompletion(mockParams);

        // Should eventually fall back to the fallback provider
        expect(response).toBeDefined();
        expect(response.choices).toHaveLength(1);
        expect(response.choices[0].message?.content).toBe('Mock response');
    });

    test('should throw error when both primary and fallback providers fail', async () => {
        const gateway = createMockGateway(true, false, true);
        
        await expect(gateway.chatCompletion(mockParams))
            .rejects
            .toThrow('Mock provider error');
    });
});
