Here's a simple README for your LLM Gateway library project:

# LLM Gateway

LLM Gateway is a TypeScript library that provides a unified interface for interacting with different Large Language Model (LLM) providers, including OpenAI, Anthropic, and Azure. This library allows users to easily switch between models with minimal configuration.

## Features

- **Unified Interface**: Interact with multiple LLM providers using a single, consistent API.
- **Easy Model Switching**: Change between OpenAI, Anthropic, and Azure models with a simple configuration change.
- **Simplified API Calls**: Focus on sending requests and receiving responses without dealing with provider-specific complexities.

## Installation

To install the library, use npm or yarn:

```bash
npm install llm-gateway
```

or

```bash
yarn add llm-gateway
```

## Usage

Here's a basic example of how to use the LLM Gateway library:

```typescript
import { LLMGateway, EnumLlmModelType } from 'llm-gateway';

const llmGateway = new LLMGateway({
    modelType: EnumLLMProvider.OPENAI, // or ANTHROPIC, AZUREOPENAI
    apiKey: 'your-api-key',
    endpoint: 'your-endpoint', // Optional for OpenAI
    deployment: 'your-deployment', // Optional for Azure
    apiVersion: 'your-api-version', // Optional for Azure
});


const response = await llmGateway.generateResponse(
    messages: [
    { role: 'user', content: 'Hello, how are you?' }
],
    model: 'text-davinci-003',
    max_tokens: 100,
    temperature: 0.7,
    top_p: 0.9,
)

console.log('Response:', response);

```

## LLM Fallbacks Configuration

The LLM Gateway library supports configuring fallbacks to ensure that if one model fails, another can be used as a backup. This is useful for maintaining service availability and reliability.

### Example Configuration

```typescript

import {LLMGateway, EnumLLMProvider} from 'llm-gateway';
const primaryOptions = {
    apiKey: 'primary-api-key',
    modelType: EnumLLMProvider.OPENAI,
};
const fallbackOptions = {
    apiKey: 'fallback-api-key',
    modelType: EnumLLMProvider.ANTHROPIC,
    
};
const gateway = new LLMGateway(primaryOptions, {fallback:
    {
        retries: 3,
        timeout: 10000,
        model: 'claude-3-5-sonnet-latest',
        fallbackConfig: fallbackOptions,
    }
});
try {
    return await gateway.generateResponse({
        model: 'gpt-4o-mini',
        messages: [{role: 'user', content: 'Hello, how are you?'}],
        max_tokens: 100,
        temperature: 0.7,
        top_p: 0.9,
    });
} catch (error) {
    console.warn('Primary model failed, switching to fallback:', error);
}

```
## Configuration

- **apiKey**: Your API key for the chosen LLM provider.
- **modelType**: The type of LLM provider you want to use (`OPENAI`, `ANTHROPIC`, `AZUREOPENAI`).
- **endpoint**: (Optional) The endpoint for OpenAI models.
- **deployment**: (Optional) The deployment name for Azure models.
- **apiVersion**: (Optional) The API version for Azure models.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License.

