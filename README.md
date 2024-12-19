# LLM Gateway
#### Open-source library built for fast and reliable connections to different LLM providers.

The LLM Gateway is a lightweight, open-source library built for fast and reliable connections to LLMs. <br>

It simplifies integrations with multiple providers, offering fallbacks, caching, and minimal latency with a client-side solution.


- **Minimize Downtime**: Automatic retries and fallbacks to secondary providers like Azure or Entropic.  
- **Automatic input params convertion**: Automatically convert input params between OpenAI, Anthropic and Azure formats for fallbacks.
- **Faster Responses**: Direct client-side requests for low latency.  
- **Unified Control**: A single interface to manage requests across LLMs. 
- **Unified Output**: Consistent output format across LLMs. 
```{
    openAI/AnthropicOutput:{...}
    llmGatewayOutput: {
        type: 'text' | 'tool_calls';
        content?: string; - content for text output
        tool_name?: string; - name of the tool for tool_calls
        arguments?: string; - arguments for the tool.
    }
}
```
- **Easy Model Switching**: Change between OpenAI, Anthropic, and Azure models with a simple configuration change. 

> Contribute, fork, or raise issues— so we can make it better together.

> Starring this repo helps other developers discover the LLM Gateway! ⭐  


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
    provider: EnumLLMProvider.OPENAI, // or ANTHROPIC, AZUREOPENAI
    apiKey: 'your-api-key',
    endpoint: 'your-endpoint', // Optional for OpenAI
    deployment: 'your-deployment', // Optional for Azure
    apiVersion: 'your-api-version', // Optional for Azure
});


const response = await llmGateway.chatCompletion(
    messages: [
    { role: 'user', content: 'Hello, how are you?' }
],
    model: 'gpt-4o-mini',
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
    provider: EnumLLMProvider.OPENAI,
};
const fallbackOptions = {
    apiKey: 'fallback-api-key',
    provider: EnumLLMProvider.ANTHROPIC,
    
};
const gateway = new LLMGateway(primaryOptions, {fallback:
    {
        model: 'claude-3-5-sonnet-latest',
        fallbackConfig: fallbackOptions,
    }
});
try {
    return await gateway.chatCompletion({
        model: 'gpt-4o-mini',
        messages: [{role: 'user', content: 'Hello, how are you?'}],
        max_completion_tokens: 100,
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

