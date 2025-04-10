Audio and speech
Explore audio and speech features in the OpenAI API.
The OpenAI API provides a range of audio capabilities. If you know what you want to build, find your use case below to get started. If you're not sure where to start, read this page as an overview.

Build with audio
Build voice agents
Build voice agents
Build interactive voice-driven applications.
Transcribe audio
Transcribe audio
Convert speech to text instantly and accurately.
Speak text
Speak text
Turn text into natural-sounding speech in real time.
A tour of audio use cases
LLMs can process audio by using sound as input, creating sound as output, or both. OpenAI has several API endpoints that help you build audio applications or voice agents.

Voice agents
Voice agents understand audio to handle tasks and respond back in natural language. There are two main ways to approach voice agents: either with speech-to-speech models and the Realtime API, or by chaining together a speech-to-text model, a text language model to process the request, and a text-to-speech model to respond. Speech-to-speech is lower latency and more natural, but chaining together a voice agent is a reliable way to extend a text-based agent into a voice agent. If you are already using the Agents SDK, you can extend your existing agents with voice capabilities using the chained approach.

Streaming audio
Process audio in real time to build voice agents and other low-latency applications, including transcription use cases. You can stream audio in and out of a model with the Realtime API. Our advanced speech models provide automatic speech recognition for improved accuracy, low-latency interactions, and multilingual support.

Text to speech
For turning text into speech, use the Audio API audio/speech endpoint. Models compatible with this endpoint are gpt-4o-mini-tts, tts-1, and tts-1-hd. With gpt-4o-mini-tts, you can ask the model to speak a certain way or with a certain tone of voice.

Speech to text
For speech to text, use the Audio API audio/transcriptions endpoint. Models compatible with this endpoint are gpt-4o-transcribe, gpt-4o-mini-transcribe, and whisper-1. With streaming, you can continuously pass in audio and get a continuous stream of text back.

Choosing the right API
There are multiple APIs for transcribing or generating audio:

API	Supported modalities	Streaming support
Realtime API	Audio and text inputs and outputs	Audio streaming in and out
Chat Completions API	Audio and text inputs and outputs	Audio streaming out
Transcription API	Audio inputs	Audio streaming out
Speech API	Text inputs and audio outputs	Audio streaming out
General use APIs vs. specialized APIs
The main distinction is general use APIs vs. specialized APIs. With the Realtime and Chat Completions APIs, you can use our latest models' native audio understanding and generation capabilities and combine them with other features like function calling. These APIs can be used for a wide range of use cases, and you can select the model you want to use.

On the other hand, the Transcription, Translation and Speech APIs are specialized to work with specific models and only meant for one purpose.

Talking with a model vs. controlling the script
Another way to select the right API is asking yourself how much control you need. To design conversational interactions, where the model thinks and responds in speech, use the Realtime or Chat Completions API, depending if you need low-latency or not.

You won't know exactly what the model will say ahead of time, as it will generate audio responses directly, but the conversation will feel natural.

For more control and predictability, you can use the Speech-to-text / LLM / Text-to-speech pattern, so you know exactly what the model will say and can control the response. Please note that with this method, there will be added latency.

This is what the Audio APIs are for: pair an LLM with the audio/transcriptions and audio/speech endpoints to take spoken user input, process and generate a text response, and then convert that to speech that the user can hear.

Recommendations
If you need real-time interactions or transcription, use the Realtime API.
If realtime is not a requirement but you're looking to build a voice agent or an audio-based application that requires features such as function calling, use the Chat Completions API.
For use cases with one specific purpose, use the Transcription, Translation, or Speech APIs.
Add audio to your existing application
Models such as GPT-4o or GPT-4o mini are natively multimodal, meaning they can understand and generate multiple modalities as input and output.

If you already have a text-based LLM application with the Chat Completions endpoint, you may want to add audio capabilities. For example, if your chat application supports text input, you can add audio input and output—just include audio in the modalities array and use an audio model, like gpt-4o-audio-preview.

Audio is not yet supported in the Responses API.


Audio output from model

Audio input to model
Create a human-like audio response to a prompt
import { writeFileSync } from "node:fs";
import OpenAI from "openai";

const openai = new OpenAI();

// Generate an audio response to the given prompt
const response = await openai.chat.completions.create({
  model: "gpt-4o-audio-preview",
  modalities: ["text", "audio"],
  audio: { voice: "alloy", format: "wav" },
  messages: [
    {
      role: "user",
      content: "Is a golden retriever a good family dog?"
    }
  ],
  store: true,
});

// Inspect returned data
console.log(response.choices[0]);

// Write audio data to a file
writeFileSync(
  "dog.wav",
  Buffer.from(response.choices[0].message.audio.data, 'base64'),
  { encoding: "utf-8" }
);
Was this page useful?
Overview
Build with audio
A tour of audio use cases
Choosing the right API
Add audio to your existing application
Structured Outputs
Ensure responses adhere to a JSON schema.
Try it out
Try it out in the Playground or generate a ready-to-use schema definition to experiment with structured outputs.

Introduction
JSON is one of the most widely used formats in the world for applications to exchange data.

Structured Outputs is a feature that ensures the model will always generate responses that adhere to your supplied JSON Schema, so you don't need to worry about the model omitting a required key, or hallucinating an invalid enum value.

Some benefits of Structured Outputs include:

Reliable type-safety: No need to validate or retry incorrectly formatted responses
Explicit refusals: Safety-based model refusals are now programmatically detectable
Simpler prompting: No need for strongly worded prompts to achieve consistent formatting
In addition to supporting JSON Schema in the REST API, the OpenAI SDKs for Python and JavaScript also make it easy to define object schemas using Pydantic and Zod respectively. Below, you can see how to extract information from unstructured text that conforms to a schema defined in code.

Getting a structured response
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI();

const CalendarEvent = z.object({
  name: z.string(),
  date: z.string(),
  participants: z.array(z.string()),
});

const completion = await openai.beta.chat.completions.parse({
  model: "gpt-4o-2024-08-06",
  messages: [
    { role: "system", content: "Extract the event information." },
    { role: "user", content: "Alice and Bob are going to a science fair on Friday." },
  ],
  response_format: zodResponseFormat(CalendarEvent, "event"),
});

const event = completion.choices[0].message.parsed;
Supported models
Structured Outputs is available in our latest large language models, starting with GPT-4o:

gpt-4.5-preview-2025-02-27 and later
o3-mini-2025-1-31 and later
o1-2024-12-17 and later
gpt-4o-mini-2024-07-18 and later
gpt-4o-2024-08-06 and later
Older models like gpt-4-turbo and earlier may use JSON mode instead.

When to use Structured Outputs via function calling vs via response_format
Structured Outputs is available in two forms in the OpenAI API:

When using function calling
When using a json_schema response format
Function calling is useful when you are building an application that bridges the models and functionality of your application.

For example, you can give the model access to functions that query a database in order to build an AI assistant that can help users with their orders, or functions that can interact with the UI.

Conversely, Structured Outputs via response_format are more suitable when you want to indicate a structured schema for use when the model responds to the user, rather than when the model calls a tool.

For example, if you are building a math tutoring application, you might want the assistant to respond to your user using a specific JSON Schema so that you can generate a UI that displays different parts of the model's output in distinct ways.

Put simply:

If you are connecting the model to tools, functions, data, etc. in your system, then you should use function calling
If you want to structure the model's output when it responds to the user, then you should use a structured response_format
The remainder of this guide will focus on non-function calling use cases in the Chat Completions API. To learn more about how to use Structured Outputs with function calling, check out the Function Calling guide.

Structured Outputs vs JSON mode
Structured Outputs is the evolution of JSON mode. While both ensure valid JSON is produced, only Structured Outputs ensure schema adherance. Both Structured Outputs and JSON mode are supported in the Responses API,Chat Completions API, Assistants API, Fine-tuning API and Batch API.

We recommend always using Structured Outputs instead of JSON mode when possible.

However, Structured Outputs with response_format: {type: "json_schema", ...} is only supported with the gpt-4o-mini, gpt-4o-mini-2024-07-18, and gpt-4o-2024-08-06 model snapshots and later.

Structured Outputs	JSON Mode
Outputs valid JSON	Yes	Yes
Adheres to schema	Yes (see supported schemas)	No
Compatible models	gpt-4o-mini, gpt-4o-2024-08-06, and later	gpt-3.5-turbo, gpt-4-* and gpt-4o-* models
Enabling	response_format: { type: "json_schema", json_schema: {"strict": true, "schema": ...} }	response_format: { type: "json_object" }
Examples

Chain of thought

Structured data extraction

UI generation

Moderation
Chain of thought
You can ask the model to output an answer in a structured, step-by-step way, to guide the user through the solution.

Structured Outputs for chain-of-thought math tutoring
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI();

const Step = z.object({
  explanation: z.string(),
  output: z.string(),
});

const MathReasoning = z.object({
  steps: z.array(Step),
  final_answer: z.string(),
});

const completion = await openai.beta.chat.completions.parse({
  model: "gpt-4o-2024-08-06",
  messages: [
    { role: "system", content: "You are a helpful math tutor. Guide the user through the solution step by step." },
    { role: "user", content: "how can I solve 8x + 7 = -23" },
  ],
  response_format: zodResponseFormat(MathReasoning, "math_reasoning"),
});

const math_reasoning = completion.choices[0].message.parsed;
Example response
{
  "steps": [
    {
      "explanation": "Start with the equation 8x + 7 = -23.",
      "output": "8x + 7 = -23"
    },
    {
      "explanation": "Subtract 7 from both sides to isolate the term with the variable.",
      "output": "8x = -23 - 7"
    },
    {
      "explanation": "Simplify the right side of the equation.",
      "output": "8x = -30"
    },
    {
      "explanation": "Divide both sides by 8 to solve for x.",
      "output": "x = -30 / 8"
    },
    {
      "explanation": "Simplify the fraction.",
      "output": "x = -15 / 4"
    }
  ],
  "final_answer": "x = -15 / 4"
}
How to use Structured Outputs with response_format
You can use Structured Outputs with the new SDK helper to parse the model's output into your desired format, or you can specify the JSON schema directly.

Note: the first request you make with any schema will have additional latency as our API processes the schema, but subsequent requests with the same schema will not have additional latency.


SDK objects

Manual schema
Step 1: Define your object
Step 2: Supply your object in the API call
Step 3: Handle edge cases
Refusals with Structured Outputs
When using Structured Outputs with user-generated input, OpenAI models may occasionally refuse to fulfill the request for safety reasons. Since a refusal does not necessarily follow the schema you have supplied in response_format, the API response will include a new field called refusal to indicate that the model refused to fulfill the request.

When the refusal property appears in your output object, you might present the refusal in your UI, or include conditional logic in code that consumes the response to handle the case of a refused request.

const Step = z.object({
  explanation: z.string(),
  output: z.string(),
});

const MathReasoning = z.object({
  steps: z.array(Step),
  final_answer: z.string(),
});

const completion = await openai.beta.chat.completions.parse({
  model: "gpt-4o-2024-08-06",
  messages: [
    { role: "system", content: "You are a helpful math tutor. Guide the user through the solution step by step." },
    { role: "user", content: "how can I solve 8x + 7 = -23" },
  ],
  response_format: zodResponseFormat(MathReasoning, "math_reasoning"),
});

const math_reasoning = completion.choices[0].message

// If the model refuses to respond, you will get a refusal message
if (math_reasoning.refusal) {
  console.log(math_reasoning.refusal);
} else {
  console.log(math_reasoning.parsed);
}
The API response from a refusal will look something like this:

{
  "id": "chatcmpl-9nYAG9LPNonX8DAyrkwYfemr3C8HC",
  "object": "chat.completion",
  "created": 1721596428,
  "model": "gpt-4o-2024-08-06",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "refusal": "I'm sorry, I cannot assist with that request."
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 81,
    "completion_tokens": 11,
    "total_tokens": 92,
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "system_fingerprint": "fp_3407719c7f"
}
Tips and best practices
Handling user-generated input
If your application is using user-generated input, make sure your prompt includes instructions on how to handle situations where the input cannot result in a valid response.

The model will always try to adhere to the provided schema, which can result in hallucinations if the input is completely unrelated to the schema.

You could include language in your prompt to specify that you want to return empty parameters, or a specific sentence, if the model detects that the input is incompatible with the task.

Handling mistakes
Structured Outputs can still contain mistakes. If you see mistakes, try adjusting your instructions, providing examples in the system instructions, or splitting tasks into simpler subtasks. Refer to the prompt engineering guide for more guidance on how to tweak your inputs.

Avoid JSON schema divergence
To prevent your JSON Schema and corresponding types in your programming language from diverging, we strongly recommend using the native Pydantic/zod sdk support.

If you prefer to specify the JSON schema directly, you could add CI rules that flag when either the JSON schema or underlying data objects are edited, or add a CI step that auto-generates the JSON Schema from type definitions (or vice-versa).

Streaming
You can use streaming to process model responses or function call arguments as they are being generated, and parse them as structured data.

That way, you don't have to wait for the entire response to complete before handling it. This is particularly useful if you would like to display JSON fields one by one, or handle function call arguments as soon as they are available.

We recommend relying on the SDKs to handle streaming with Structured Outputs.

You can find an example of how to stream function call arguments without the SDK stream helper in the function calling guide.

Here is how you can stream a model response with the stream helper:

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
export const openai = new OpenAI();

const EntitiesSchema = z.object({
  attributes: z.array(z.string()),
  colors: z.array(z.string()),
  animals: z.array(z.string()),
});

const stream = openai.beta.chat.completions
  .stream({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Extract entities from the input text" },
      {
        role: "user",
        content:
          "The quick brown fox jumps over the lazy dog with piercing blue eyes",
      },
    ],
    response_format: zodResponseFormat(EntitiesSchema, "entities"),
  })
  .on("refusal.done", () => console.log("request refused"))
  .on("content.delta", ({ snapshot, parsed }) => {
    console.log("content:", snapshot);
    console.log("parsed:", parsed);
    console.log();
  })
  .on("content.done", (props) => {
    console.log(props);
  });

await stream.done();

const finalCompletion = await stream.finalChatCompletion();

console.log(finalCompletion);
You can also use the stream helper to parse function call arguments:

import { zodFunction } from "openai/helpers/zod";
import OpenAI from "openai/index";
import { z } from "zod";

const GetWeatherArgs = z.object({
  city: z.string(),
  country: z.string(),
});

const client = new OpenAI();

const stream = client.beta.chat.completions
  .stream({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: "What's the weather like in SF and London?",
      },
    ],
    tools: [zodFunction({ name: "get_weather", parameters: GetWeatherArgs })],
  })
  .on("tool_calls.function.arguments.delta", (props) =>
    console.log("tool_calls.function.arguments.delta", props)
  )
  .on("tool_calls.function.arguments.done", (props) =>
    console.log("tool_calls.function.arguments.done", props)
  )
  .on("refusal.delta", ({ delta }) => {
    process.stdout.write(delta);
  })
  .on("refusal.done", () => console.log("request refused"));

const completion = await stream.finalChatCompletion();

console.log("final completion:", completion);
Supported schemas
Structured Outputs supports a subset of the JSON Schema language.

Supported types
The following types are supported for Structured Outputs:

String
Number
Boolean
Integer
Object
Array
Enum
anyOf
Root objects must not be anyOf
Note that the root level object of a schema must be an object, and not use anyOf. A pattern that appears in Zod (as one example) is using a discriminated union, which produces an anyOf at the top level. So code such as the following won't work:

import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const BaseResponseSchema = z.object({ /* ... */ });
const UnsuccessfulResponseSchema = z.object({ /* ... */ });

const finalSchema = z.discriminatedUnion('status', [
    BaseResponseSchema,
    UnsuccessfulResponseSchema,
]);

// Invalid JSON Schema for Structured Outputs
const json = zodResponseFormat(finalSchema, 'final_schema');
All fields must be required
To use Structured Outputs, all fields or function parameters must be specified as required.

{
    "name": "get_weather",
    "description": "Fetches the weather in the given location",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The location to get the weather for"
            },
            "unit": {
                "type": "string",
                "description": "The unit to return the temperature in",
                "enum": ["F", "C"]
            }
        },
        "additionalProperties": false,
        "required": ["location", "unit"]
    }
}
Although all fields must be required (and the model will return a value for each parameter), it is possible to emulate an optional parameter by using a union type with null.

{
    "name": "get_weather",
    "description": "Fetches the weather in the given location",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The location to get the weather for"
            },
            "unit": {
                "type": ["string", "null"],
                "description": "The unit to return the temperature in",
                "enum": ["F", "C"]
            }
        },
        "additionalProperties": false,
        "required": [
            "location", "unit"
        ]
    }
}
Objects have limitations on nesting depth and size
A schema may have up to 100 object properties total, with up to 5 levels of nesting.

Limitations on total string size
In a schema, total string length of all property names, definition names, enum values, and const values cannot exceed 15,000 characters.

Limitations on enum size
A schema may have up to 500 enum values across all enum properties.

For a single enum property with string values, the total string length of all enum values cannot exceed 7,500 characters when there are more than 250 enum values.

additionalProperties: false must always be set in objects
additionalProperties controls whether it is allowable for an object to contain additional keys / values that were not defined in the JSON Schema.

Structured Outputs only supports generating specified keys / values, so we require developers to set additionalProperties: false to opt into Structured Outputs.

{
    "name": "get_weather",
    "description": "Fetches the weather in the given location",
    "strict": true,
    "schema": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The location to get the weather for"
            },
            "unit": {
                "type": "string",
                "description": "The unit to return the temperature in",
                "enum": ["F", "C"]
            }
        },
        "additionalProperties": false,
        "required": [
            "location", "unit"
        ]
    }
}
Key ordering
When using Structured Outputs, outputs will be produced in the same order as the ordering of keys in the schema.

Some type-specific keywords are not yet supported
Notable keywords not supported include:

For strings: minLength, maxLength, pattern, format
For numbers: minimum, maximum, multipleOf
For objects: patternProperties, unevaluatedProperties, propertyNames, minProperties, maxProperties
For arrays: unevaluatedItems, contains, minContains, maxContains, minItems, maxItems, uniqueItems
If you turn on Structured Outputs by supplying strict: true and call the API with an unsupported JSON Schema, you will receive an error.

For anyOf, the nested schemas must each be a valid JSON Schema per this subset
Here's an example supported anyOf schema:

{
    "type": "object",
    "properties": {
        "item": {
            "anyOf": [
                {
                    "type": "object",
                    "description": "The user object to insert into the database",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "The name of the user"
                        },
                        "age": {
                            "type": "number",
                            "description": "The age of the user"
                        }
                    },
                    "additionalProperties": false,
                    "required": [
                        "name",
                        "age"
                    ]
                },
                {
                    "type": "object",
                    "description": "The address object to insert into the database",
                    "properties": {
                        "number": {
                            "type": "string",
                            "description": "The number of the address. Eg. for 123 main st, this would be 123"
                        },
                        "street": {
                            "type": "string",
                            "description": "The street name. Eg. for 123 main st, this would be main st"
                        },
                        "city": {
                            "type": "string",
                            "description": "The city of the address"
                        }
                    },
                    "additionalProperties": false,
                    "required": [
                        "number",
                        "street",
                        "city"
                    ]
                }
            ]
        }
    },
    "additionalProperties": false,
    "required": [
        "item"
    ]
}
Definitions are supported
You can use definitions to define subschemas which are referenced throughout your schema. The following is a simple example.

{
    "type": "object",
    "properties": {
        "steps": {
            "type": "array",
            "items": {
                "$ref": "#/$defs/step"
            }
        },
        "final_answer": {
            "type": "string"
        }
    },
    "$defs": {
        "step": {
            "type": "object",
            "properties": {
                "explanation": {
                    "type": "string"
                },
                "output": {
                    "type": "string"
                }
            },
            "required": [
                "explanation",
                "output"
            ],
            "additionalProperties": false
        }
    },
    "required": [
        "steps",
        "final_answer"
    ],
    "additionalProperties": false
}
Recursive schemas are supported
Sample recursive schema using # to indicate root recursion.

{
    "name": "ui",
    "description": "Dynamically generated UI",
    "strict": true,
    "schema": {
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "description": "The type of the UI component",
                "enum": ["div", "button", "header", "section", "field", "form"]
            },
            "label": {
                "type": "string",
                "description": "The label of the UI component, used for buttons or form fields"
            },
            "children": {
                "type": "array",
                "description": "Nested UI components",
                "items": {
                    "$ref": "#"
                }
            },
            "attributes": {
                "type": "array",
                "description": "Arbitrary attributes for the UI component, suitable for any element",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "The name of the attribute, for example onClick or className"
                        },
                        "value": {
                            "type": "string",
                            "description": "The value of the attribute"
                        }
                    },
                    "additionalProperties": false,
                    "required": ["name", "value"]
                }
            }
        },
        "required": ["type", "label", "children", "attributes"],
        "additionalProperties": false
    }
}
Sample recursive schema using explicit recursion:

{
    "type": "object",
    "properties": {
        "linked_list": {
            "$ref": "#/$defs/linked_list_node"
        }
    },
    "$defs": {
        "linked_list_node": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "number"
                },
                "next": {
                    "anyOf": [
                        {
                            "$ref": "#/$defs/linked_list_node"
                        },
                        {
                            "type": "null"
                        }
                    ]
                }
            },
            "additionalProperties": false,
            "required": [
                "next",
                "value"
            ]
        }
    },
    "additionalProperties": false,
    "required": [
        "linked_list"
    ]
}
JSON mode
JSON mode is a more basic version of the Structured Outputs feature. While JSON mode ensures that model output is valid JSON, Structured Outputs reliably matches the model's output to the schema you specify. We recommend you use Structured Outputs if it is supported for your use case.

When JSON mode is turned on, the model's output is ensured to be valid JSON, except for in some edge cases that you should detect and handle appropriately.

To turn on JSON mode with the Chat Completions or Assistants API you can set the response_format to { "type": "json_object" }. If you are using function calling, JSON mode is always turned on.

Important notes:

When using JSON mode, you must always instruct the model to produce JSON via some message in the conversation, for example via your system message. If you don't include an explicit instruction to generate JSON, the model may generate an unending stream of whitespace and the request may run continually until it reaches the token limit. To help ensure you don't forget, the API will throw an error if the string "JSON" does not appear somewhere in the context.
JSON mode will not guarantee the output matches any specific schema, only that it is valid and parses without errors. You should use Structured Outputs to ensure it matches your schema, or if that is not possible, you should use a validation library and potentially retries to ensure that the output matches your desired schema.
Your application must detect and handle the edge cases that can result in the model output not being a complete JSON object (see below)
Handling edge cases
Resources
To learn more about Structured Outputs, we recommend browsing the following resources:

Check out our introductory cookbook on Structured Outputs
Learn how to build multi-agent systems with Structured Outputs
Was this page useful?
Introduction
Examples
How to use
Streaming
Supported schemas
JSON mode
Function calling
Enable models to fetch data and take actions.
Function calling provides a powerful and flexible way for OpenAI models to interface with your code or external services. This guide will explain how to connect the models to your own custom code to fetch data or take action.


Get weather

Send email

Search knowledge base
Function calling example with get_weather function
import { OpenAI } from "openai";

const openai = new OpenAI();

const tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current temperature for a given location.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country e.g. Bogotá, Colombia"
                }
            },
            "required": [
                "location"
            ],
            "additionalProperties": false
        },
        "strict": true
    }
}];

const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: "What is the weather like in Paris today?" }],
    tools,
    store: true,
});

console.log(completion.choices[0].message.tool_calls);
Output
[{
    "id": "call_12345xyz",
    "type": "function",
    "function": {
        "name": "get_weather",
        "arguments": "{\"location\":\"Paris, France\"}"
    }
}]
Experiment with function calling and generate function schemas in the Playground!

Overview
You can give the model access to your own custom code through function calling. Based on the system prompt and messages, the model may decide to call these functions — instead of (or in addition to) generating text or audio.

You'll then execute the function code, send back the results, and the model will incorporate them into its final response.

Function Calling Diagram Steps

Function calling has two primary use cases:

Fetching Data	Retrieve up-to-date information to incorporate into the model's response (RAG). Useful for searching knowledge bases and retrieving specific data from APIs (e.g. current weather data).
Taking Action	Perform actions like submitting a form, calling APIs, modifying application state (UI/frontend or backend), or taking agentic workflow actions (like handing off the conversation).
Sample function
Let's look at the steps to allow a model to use a real get_weather function defined below:

Sample get_weather function implemented in your codebase
async function getWeather(latitude, longitude) {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`);
    const data = await response.json();
    return data.current.temperature_2m;
}
Unlike the diagram earlier, this function expects precise latitude and longitude instead of a general location parameter. (However, our models can automatically determine the coordinates for many locations!)

Function calling steps
Call model with functions defined – along with your system and user messages.

Step 1: Call model with get_weather tool defined
import { OpenAI } from "openai";

const openai = new OpenAI();

const tools = [{
    type: "function",
    function: {
        name: "get_weather",
        description: "Get current temperature for provided coordinates in celsius.",
        parameters: {
            type: "object",
            properties: {
                latitude: { type: "number" },
                longitude: { type: "number" }
            },
            required: ["latitude", "longitude"],
            additionalProperties: false
        },
        strict: true
    }
}];

const messages = [
    {
        role: "user",
        content: "What's the weather like in Paris today?"
    }
];

const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools,
    store: true,
});
Model decides to call function(s) – model returns the name and input arguments.

completion.choices[0].message.tool_calls
[{
    "id": "call_12345xyz",
    "type": "function",
    "function": {
      "name": "get_weather",
      "arguments": "{\"latitude\":48.8566,\"longitude\":2.3522}"
    }
}]
Execute function code – parse the model's response and handle function calls.

Step 3: Execute get_weather function
const toolCall = completion.choices[0].message.tool_calls[0];
const args = JSON.parse(toolCall.function.arguments);

const result = await getWeather(args.latitude, args.longitude);
Supply model with results – so it can incorporate them into its final response.

Step 4: Supply result and call model again
messages.push(completion.choices[0].message); // append model's function call message
messages.push({                               // append result message
    role: "tool",
    tool_call_id: toolCall.id,
    content: result.toString()
});

const completion2 = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools,
    store: true,
});

console.log(completion2.choices[0].message.content);
Model responds – incorporating the result in its output.

completion_2.choices[0].message.content
"The current temperature in Paris is 14°C (57.2°F)."
Defining functions
Functions can be set in the tools parameter of each API request inside a function object.

A function is defined by its schema, which informs the model what it does and what input arguments it expects. It comprises the following fields:

Field	Description
name	The function's name (e.g. get_weather)
description	Details on when and how to use the function
parameters	JSON schema defining the function's input arguments
Take a look at this example or generate your own below (or in our Playground).

Example function schema
{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Retrieves current weather for the given location.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country e.g. Bogotá, Colombia"
                },
                "units": {
                    "type": "string",
                    "enum": [
                        "celsius",
                        "fahrenheit"
                    ],
                    "description": "Units the temperature will be returned in."
                }
            },
            "required": [
                "location",
                "units"
            ],
            "additionalProperties": false
        },
        "strict": true
    }
}
Because the parameters are defined by a JSON schema, you can leverage many of its rich features like property types, enums, descriptions, nested objects, and, recursive objects.

(Optional) Function calling wth pydantic and zod
Best practices for defining functions
Write clear and detailed function names, parameter descriptions, and instructions.

Explicitly describe the purpose of the function and each parameter (and its format), and what the output represents.
Use the system prompt to describe when (and when not) to use each function. Generally, tell the model exactly what to do.
Include examples and edge cases, especially to rectify any recurring failures. (Note: Adding examples may hurt performance for reasoning models.)
Apply software engineering best practices.

Make the functions obvious and intuitive. (principle of least surprise)
Use enums and object structure to make invalid states unrepresentable. (e.g. toggle_light(on: bool, off: bool) allows for invalid calls)
Pass the intern test. Can an intern/human correctly use the function given nothing but what you gave the model? (If not, what questions do they ask you? Add the answers to the prompt.)
Offload the burden from the model and use code where possible.

Don't make the model fill arguments you already know. For example, if you already have an order_id based on a previous menu, don't have an order_id param – instead, have no params submit_refund() and pass the order_id with code.
Combine functions that are always called in sequence. For example, if you always call mark_location() after query_location(), just move the marking logic into the query function call.
Keep the number of functions small for higher accuracy.

Evaluate your performance with different numbers of functions.
Aim for fewer than 20 functions at any one time, though this is just a soft suggestion.
Leverage OpenAI resources.

Generate and iterate on function schemas in the Playground.
Consider fine-tuning to increase function calling accuracy for large numbers of functions or difficult tasks. (cookbook)
Token Usage
Under the hood, functions are injected into the system message in a syntax the model has been trained on. This means functions count against the model's context limit and are billed as input tokens. If you run into token limits, we suggest limiting the number of functions or the length of the descriptions you provide for function parameters.

It is also possible to use fine-tuning to reduce the number of tokens used if you have many functions defined in your tools specification.

Handling function calls
When the model calls a function, you must execute it and return the result. Since model responses can include zero, one, or multiple calls, it is best practice to assume there are several.

The response has an array of tool_calls, each with an id (used later to submit the function result) and a function containing a name and JSON-encoded arguments.

Sample response with multiple function calls
[
    {
        "id": "call_12345xyz",
        "type": "function",
        "function": {
            "name": "get_weather",
            "arguments": "{\"location\":\"Paris, France\"}"
        }
    },
    {
        "id": "call_67890abc",
        "type": "function",
        "function": {
            "name": "get_weather",
            "arguments": "{\"location\":\"Bogotá, Colombia\"}"
        }
    },
    {
        "id": "call_99999def",
        "type": "function",
        "function": {
            "name": "send_email",
            "arguments": "{\"to\":\"bob@email.com\",\"body\":\"Hi bob\"}"
        }
    }
]
Execute function calls and append results
for (const toolCall of completion.choices[0].message.tool_calls) {
    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    const result = callFunction(name, args);
    messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.toString()
    });
}
In the example above, we have a hypothetical call_function to route each call. Here’s a possible implementation:

Execute function calls and append results
const callFunction = async (name, args) => {
    if (name === "get_weather") {
        return getWeather(args.latitude, args.longitude);
    }
    if (name === "send_email") {
        return sendEmail(args.to, args.body);
    }
};
Formatting results
A result must be a string, but the format is up to you (JSON, error codes, plain text, etc.). The model will interpret that string as needed.

If your function has no return value (e.g. send_email), simply return a string to indicate success or failure. (e.g. "success")

Incorporating results into response
After appending the results to your messages, you can send them back to the model to get a final response.

Send results back to model
const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools,
    store: true,
});
Final response
"It's about 15°C in Paris, 18°C in Bogotá, and I've sent that email to Bob."
Additional configurations
Tool choice
By default the model will determine when and how many tools to use. You can force specific behavior with the tool_choice parameter.

Auto: (Default) Call zero, one, or multiple functions. tool_choice: "auto"
Required: Call one or more functions. tool_choice: "required"
Forced Function: Call exactly one specific function. tool_choice: {"type": "function", "function": {"name": "get_weather"}}
Function Calling Diagram Steps

You can also set tool_choice to "none" to imitate the behavior of passing no functions.

Parallel function calling
The model may choose to call multiple functions in a single turn. You can prevent this by setting parallel_tool_calls to false, which ensures exactly zero or one tool is called.

Note: Currently, if the model calls multiple functions in one turn then strict mode will be disabled for those calls.

Strict mode
Setting strict to true will ensure function calls reliably adhere to the function schema, instead of being best effort. We recommend always enabling strict mode.

Under the hood, strict mode works by leveraging our structured outputs feature and therefore introduces a couple requirements:

additionalProperties must be set to false for each object in the parameters.
All fields in properties must be marked as required.
You can denote optional fields by adding null as a type option (see example below).


Strict mode enabled

Strict mode disabled
{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Retrieves current weather for the given location.",
        "strict": true,
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country e.g. Bogotá, Colombia"
                },
                "units": {
                    "type": ["string", "null"],
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Units the temperature will be returned in."
                }
            },
            "required": ["location", "units"],
            "additionalProperties": false
        }
    }
}
All schemas generated in the playground have strict mode enabled.

While we recommend you enable strict mode, it has a few limitations:

Some features of JSON schema are not supported. (See supported schemas.)
Schemas undergo additional processing on the first request (and are then cached). If your schemas vary from request to request, this may result in higher latencies.
Schemas are cached for performance, and are not eligible for zero data retention.
Streaming
Streaming can be used to surface progress by showing which function is called as the model fills its arguments, and even displaying the arguments in real time.

Streaming function calls is very similar to streaming regular responses: you set stream to true and get chunks with delta objects.

Streaming function calls
import { OpenAI } from "openai";

const openai = new OpenAI();

const tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current temperature for a given location.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country e.g. Bogotá, Colombia"
                }
            },
            "required": ["location"],
            "additionalProperties": false
        },
        "strict": true
    }
}];

const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: "What's the weather like in Paris today?" }],
    tools,
    stream: true,
    store: true,
});

for await (const chunk of stream) {
    const delta = chunk.choices[0].delta;
    console.log(delta.tool_calls);
}
Output delta.tool_calls
[{"index": 0, "id": "call_DdmO9pD3xa9XTPNJ32zg2hcA", "function": {"arguments": "", "name": "get_weather"}, "type": "function"}]
[{"index": 0, "id": null, "function": {"arguments": "{\"", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "location", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "\":\"", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "Paris", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": ",", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": " France", "name": null}, "type": null}]
[{"index": 0, "id": null, "function": {"arguments": "\"}", "name": null}, "type": null}]
null
Instead of aggregating chunks into a single content string, however, you're aggregating chunks into an encoded arguments JSON object.

When the model calls one or more functions the tool_calls field of each delta will be populated. Each tool_call contains the following fields:

Field	Description
index	Identifies which function call the delta is for
id	Tool call id.
function	Function call delta (name and arguments)
type	Type of tool_call (always function for function calls)
Many of these fields are only set for the first delta of each tool call, like id, function.name, and type.

Below is a code snippet demonstrating how to aggregate the deltas into a final tool_calls object.

Accumulating tool_call deltas
const finalToolCalls = {};

for await (const chunk of stream) {
    const toolCalls = chunk.choices[0].delta.tool_calls || [];
    for (const toolCall of toolCalls) {
        const { index } = toolCall;

        if (!finalToolCalls[index]) {
            finalToolCalls[index] = toolCall;
        }

        finalToolCalls[index].function.arguments += toolCall.function.arguments;
    }
}
Accumulated final_tool_calls[0]
{
    "index": 0,
    "id": "call_RzfkBpJgzeR0S242qfvjadNe",
    "function": {
        "name": "get_weather",
        "arguments": "{\"location\":\"Paris, France\"}"
    }
}
Was this page useful?
Overview
Function calling steps
Defining functions
Handling function calls
Additional configs
Streaming
Conversation state
Learn how to manage conversation state during a model interaction.
OpenAI provides a few ways to manage conversation state, which is important for preserving information across multiple messages or turns in a conversation.

Manually manage conversation state
While each text generation request is independent and stateless (unless you're using the Assistants API), you can still implement multi-turn conversations by providing additional messages as parameters to your text generation request. Consider a knock-knock joke:

Manually construct a past conversation
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        {
            role: "user",
            content: "knock knock.",
        },
        {
            role: "assistant",
            content: "Who's there?",
        },
        {
            role: "user",
            content: "Orange.",
        },
    ],
});

console.log(response.choices[0].message.content);
By using alternating user and assistant messages, you capture the previous state of a conversation in one request to the model.

To manually share context across generated responses, include the model's previous response output as input, and append that input to your next request.

In the following example, we ask the model to tell a joke, followed by a request for another joke. Appending previous responses to new requests in this way helps ensure conversations feel natural and retain the context of previous interactions.

Manually manage conversation state with the Chat Completions API.
import OpenAI from "openai";

const openai = new OpenAI();

let history = [
    {
        role: "user",
        content: "tell me a joke",
    },
];

const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: history,
});

console.log(completion.choices[0].message.content);

history.push(completion.choices[0].message);
history.push({
    role: "user",
    content: "tell me another",
});

const secondCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: history,
});

console.log(secondCompletion.choices[0].message.content);
OpenAI APIs for conversation state
Our APIs make it easier to manage conversation state automatically, so you don't have to do pass inputs manually with each turn of a conversation.

We recommend using the Responses API instead. Because it's stateful, managing context across conversations is a simple paramater.

If you're using the Chat Completions endpoint, you'll need to either manually manage state, as documented above, or use the Assistants API to create persistent threads.

Managing the context window
Understanding context windows will help you successfully create threaded conversations and manage state across model interactions.

The context window is the maximum number of tokens that can be used in a single request. This max tokens number includes input, output, and reasoning tokens. To learn your model's context window, see model details.

Managing context for text generation
As your inputs become more complex, or you include more turns in a conversation, you'll need to consider both output token and context window limits. Model inputs and outputs are metered in tokens, which are parsed from inputs to analyze their content and intent and assembled to render logical outputs. Models have limits on token usage during the lifecycle of a text generation request.

Output tokens are the tokens generated by a model in response to a prompt. Each model has different limits for output tokens. For example, gpt-4o-2024-08-06 can generate a maximum of 16,384 output tokens.
A context window describes the total tokens that can be used for both input and output tokens (and for some models, reasoning tokens). Compare the context window limits of our models. For example, gpt-4o-2024-08-06 has a total context window of 128k tokens.
If you create a very large prompt—often by including extra context, data, or examples for the model—you run the risk of exceeding the allocated context window for a model, which might result in truncated outputs.

Use the tokenizer tool, built with the tiktoken library, to see how many tokens are in a particular string of text.

For example, when making an API request to Chat Completions with the o1 model, the following token counts will apply toward the context window total:

Input tokens (inputs you include in the messages array with Chat Completions)
Output tokens (tokens generated in response to your prompt)
Reasoning tokens (used by the model to plan a response)
Tokens generated in excess of the context window limit may be truncated in API responses.

context window visualization

You can estimate the number of tokens your messages will use with the tokenizer tool.

Next steps
For more specific examples and use cases, visit the OpenAI Cookbook, or learn more about using the APIs to extend model capabilities:

Receive JSON responses with Structured Outputs
Extend the models with function calling
Enable streaming for real-time responses
Build a computer using agent
Was this page useful?
Overview
Manual state management
APIs for state management
Managing the context window
Next steps
Streaming API responses
Learn how to stream model responses from the OpenAI API using server-sent events.
By default, when you make a request to the OpenAI API, we generate the model's entire output before sending it back in a single HTTP response. When generating long outputs, waiting for a response can take time. Streaming responses lets you start printing or processing the beginning of the model's output while it continues generating the full response.

Enable streaming
Streaming Chat Completions is fairly straightforward. However, we recommend using the Responses API for streaming, as we designed it with streaming in mind. The Responses API uses semantic events for streaming and is type-safe.

Stream a chat completion
To stream completions, set stream=True when calling the Chat Completions or legacy Completions endpoints. This returns an object that streams back the response as data-only server-sent events.

The response is sent back incrementally in chunks with an event stream. You can iterate over the event stream with a for loop, like this:

import OpenAI from "openai";
const openai = new OpenAI();

const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
        {
            role: "user",
            content: "Say 'double bubble bath' ten times fast." ,
        }
    ],
    stream: true,
});

for await (const chunk of stream) {
    console.log(chunk);
    console.log(chunk.choices[0].delta);
    console.log("****************");
}
Read the responses
When you stream a chat completion, the responses has a delta field rather than a message field. The delta field can hold a role token, content token, or nothing.

{ role: 'assistant', content: '', refusal: null }
****************
{ content: 'Why' }
****************
{ content: " don't" }
****************
{ content: ' scientists' }
****************
{ content: ' trust' }
****************
{ content: ' atoms' }
****************
{ content: '?\n\n' }
****************
{ content: 'Because' }
****************
{ content: ' they' }
****************
{ content: ' make' }
****************
{ content: ' up' }
****************
{ content: ' everything' }
****************
{ content: '!' }
****************
{}
****************
To stream only the text response of your chat completion, your code would like this:

import OpenAI from "openai";
const client = new OpenAI();

const stream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
        {
            role: "user",
            content: "Say 'double bubble bath' ten times fast.",
        },
    ],
    stream: true,
});

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
Advanced use cases
For more advanced use cases, like streaming tool calls, check out the following dedicated guides:

Streaming function calls
Streaming structured output
Moderation risk
Note that streaming the model's output in a production application makes it more difficult to moderate the content of the completions, as partial completions may be more difficult to evaluate. This may have implications for approved usage.

Was this page useful?
Enable streaming
Read the responses
Advanced use cases
Moderation risk
Realtime API
Beta
Build low-latency, multi-modal experiences with the Realtime API.
The OpenAI Realtime API enables low-latency, multimodal interactions including speech-to-speech conversational experiences and real-time transcription.

This API works with natively multimodal models such as GPT-4o and GPT-4o mini, offering capabilities such as real-time text and audio processing, function calling, and speech generation, and with the latest transcription models GPT-4o Transcribe and GPT-4o mini Transcribe.

Get started with the Realtime API
You can connect to the Realtime API in two ways:

Using WebRTC, which is ideal for client-side applications (for example, a web app)
Using WebSockets, which is great for server-to-server applications (from your backend or if you're building a voice agent over phone for example)
Start by exploring examples and partner integrations below, or learn how to connect to the Realtime API using the most relevant method for your use case below.

Example applications
Check out one of the example applications below to see the Realtime API in action.

Realtime Console
To get started quickly, download and configure the Realtime console demo. See events flowing back and forth, and inspect their contents. Learn how to execute custom logic with function calling.

Realtime Solar System demo
A demo of the Realtime API with the WebRTC integration, navigating the solar system through voice thanks to function calling.

Twilio Integration Demo
A demo combining the Realtime API with Twilio to build an AI calling assistant.

Realtime API Agents Demo
A demonstration of handoffs between Realtime API voice agents with reasoning model validation.

Partner integrations
Check out these partner integrations, which use the Realtime API in frontend applications and telephony use cases.

LiveKit integration guide
How to use the Realtime API with LiveKit's WebRTC infrastructure.

Twilio integration guide
Build Realtime apps using Twilio's powerful voice APIs.

Agora integration quickstart
How to integrate Agora's real-time audio communication capabilities with the Realtime API.

Pipecat integration guide
Create voice agents with OpenAI audio models and Pipecat orchestration framework.

Client-side tool calling
Built with Cloudflare Workers, an example application showcasing client-side tool calling. Also check out the tutorial on YouTube.

Use cases
The most common use case for the Realtime API is to build a real-time, speech-to-speech, conversational experience. This is great for building voice agents and other voice-enabled applications.

The Realtime API can also be used independently for transcription and turn detection use cases. A client can stream audio in and have Realtime API produce streaming transcripts when speech is detected.

Both use-cases benefit from built-in voice activity detection (VAD) to automatically detect when a user is done speaking. This can be helpful to seamlessly handle conversation turns, or to analyze transcriptions one phrase at a time.

Learn more about these use cases in the dedicated guides.

Realtime Speech-to-Speech
Learn to use the Realtime API for streaming speech-to-speech conversations.

Realtime Transcription
Learn to use the Realtime API for transcription-only use cases.

Depending on your use case (conversation or transcription), you should initialize a session in different ways. Use the switcher below to see the details for each case.

Connect with WebRTC
WebRTC is a powerful set of standard interfaces for building real-time applications. The OpenAI Realtime API supports connecting to realtime models through a WebRTC peer connection. Follow this guide to learn how to configure a WebRTC connection to the Realtime API.

Overview
In scenarios where you would like to connect to a Realtime model from an insecure client over the network (like a web browser), we recommend using the WebRTC connection method. WebRTC is better equipped to handle variable connection states, and provides a number of convenient APIs for capturing user audio inputs and playing remote audio streams from the model.

Connecting to the Realtime API from the browser should be done with an ephemeral API key, generated via the OpenAI REST API. The process for initializing a WebRTC connection is as follows (assuming a web browser client):

A browser makes a request to a developer-controlled server to mint an ephemeral API key.
The developer's server uses a standard API key to request an ephemeral key from the OpenAI REST API, and returns that new key to the browser. Note that ephemeral keys currently expire one minute after being issued.
The browser uses the ephemeral key to authenticate a session directly with the OpenAI Realtime API as a WebRTC peer connection.
connect to realtime via WebRTC

While it is technically possible to use a standard API key to authenticate client-side WebRTC sessions, this is a dangerous and insecure practice because it leaks your secret key. Standard API keys grant access to your full OpenAI API account, and should only be used in secure server-side environments. We recommend ephemeral keys in client-side applications whenever possible.

Connection details
Connecting via WebRTC requires the following connection information:

URL	
https://api.openai.com/v1/realtime

Query Parameters	
model

Realtime model ID to connect to, like gpt-4o-realtime-preview-2024-12-17

Headers	
Authorization: Bearer EPHEMERAL_KEY

Substitute EPHEMERAL_KEY with an ephemeral API token - see below for details on how to generate one.

The following example shows how to initialize a WebRTC session (including the data channel to send and receive Realtime API events). It assumes you have already fetched an ephemeral API token (example server code for this can be found in the next section).

async function init() {
  // Get an ephemeral key from your server - see server code below
  const tokenResponse = await fetch("/session");
  const data = await tokenResponse.json();
  const EPHEMERAL_KEY = data.client_secret.value;

  // Create a peer connection
  const pc = new RTCPeerConnection();

  // Set up to play remote audio from the model
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  pc.ontrack = e => audioEl.srcObject = e.streams[0];

  // Add local audio track for microphone input in the browser
  const ms = await navigator.mediaDevices.getUserMedia({
    audio: true
  });
  pc.addTrack(ms.getTracks()[0]);

  // Set up data channel for sending and receiving events
  const dc = pc.createDataChannel("oai-events");
  dc.addEventListener("message", (e) => {
    // Realtime server events appear here!
    console.log(e);
  });

  // Start the session using the Session Description Protocol (SDP)
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview-2024-12-17";
  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp"
    },
  });

  const answer = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };
  await pc.setRemoteDescription(answer);
}

init();
The WebRTC APIs provide rich controls for handling media streams and input devices. For more guidance on building user interfaces on top of WebRTC, refer to the docs on MDN.

Creating an ephemeral token
To create an ephemeral token to use on the client-side, you will need to build a small server-side application (or integrate with an existing one) to make an OpenAI REST API request for an ephemeral key. You will use a standard API key to authenticate this request on your backend server.

Below is an example of a simple Node.js express server which mints an ephemeral API key using the REST API:

import express from "express";

const app = express();

// An endpoint which would work with the client code above - it returns
// the contents of a REST API request to this protected endpoint
app.get("/session", async (req, res) => {
  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "verse",
    }),
  });
  const data = await r.json();

  // Send back the JSON we received from the OpenAI REST API
  res.send(data);
});

app.listen(3000);
You can create a server endpoint like this one on any platform that can send and receive HTTP requests. Just ensure that you only use standard OpenAI API keys on the server, not in the browser.

Sending and receiving events
To learn how to send and receive events over the WebRTC data channel, refer to the Realtime conversations guide.

Connect with WebSockets
WebSockets are a broadly supported API for realtime data transfer, and a great choice for connecting to the OpenAI Realtime API in server-to-server applications. For browser and mobile clients, we recommend connecting via WebRTC.

Overview
In a server-to-server integration with Realtime, your backend system will connect via WebSocket directly to the Realtime API. You can use a standard API key to authenticate this connection, since the token will only be available on your secure backend server.

connect directly to realtime API

WebSocket connections can also be authenticated with an ephemeral client token (as shown above in the WebRTC section) if you choose to connect to the Realtime API via WebSocket on a client device.


Standard OpenAI API tokens should only be used in secure server-side environments.

Connection details

Speech-to-Speech

Transcription
Connecting via WebSocket requires the following connection information:

URL	
wss://api.openai.com/v1/realtime

Query Parameters	
model

Realtime model ID to connect to, like gpt-4o-realtime-preview-2024-12-17

Headers	
Authorization: Bearer YOUR_API_KEY

Substitute YOUR_API_KEY with a standard API key on the server, or an ephemeral token on insecure clients (note that WebRTC is recommended for this use case).

OpenAI-Beta: realtime=v1

This header is required during the beta period.

Below are several examples of using these connection details to initialize a WebSocket connection to the Realtime API.


ws module (Node.js)

websocket-client (Python)

WebSocket (browsers)
Connect using the ws module (Node.js)
import WebSocket from "ws";

const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const ws = new WebSocket(url, {
  headers: {
    "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
  },
});

ws.on("open", function open() {
  console.log("Connected to server.");
});

ws.on("message", function incoming(message) {
  console.log(JSON.parse(message.toString()));
});
Sending and receiving events
To learn how to send and receive events over Websockets, refer to the Realtime conversations guide.

Was this page useful?
Get started
Use cases
Connect with WebRTC
Connect with WebSockets
Realtime console
Visualize events, learn function calls.
Realtime conversations
Beta
Learn how to manage Realtime speech-to-speech conversations.
Once you have connected to the Realtime API through either WebRTC or WebSocket, you can call a Realtime model (such as gpt-4o-realtime-preview) to have speech-to-speech conversations. Doing so will require you to send client events to initiate actions, and listen for server events to respond to actions taken by the Realtime API.

This guide will walk through the event flows required to use model capabilities like audio and text generation and function calling, and how to think about the state of a Realtime Session.

If you do not need to have a conversation with the model, meaning you don't expect any response, you can use the Realtime API in transcription mode.

Realtime speech-to-speech sessions
A Realtime Session is a stateful interaction between the model and a connected client. The key components of the session are:

The Session object, which controls the parameters of the interaction, like the model being used, the voice used to generate output, and other configuration.
A Conversation, which represents user input Items and model output Items generated during the current session.
Responses, which are model-generated audio or text Items that are added to the Conversation.
Input audio buffer and WebSockets

If you are using WebRTC, much of the media handling required to send and receive audio from the model is assisted by WebRTC APIs.


If you are using WebSockets for audio, you will need to manually interact with the input audio buffer by sending audio to the server, sent with JSON events with base64-encoded audio.

All these components together make up a Realtime Session. You will use client events to update the state of the session, and listen for server events to react to state changes within the session.

diagram realtime state

Session lifecycle events
After initiating a session via either WebRTC or WebSockets, the server will send a session.created event indicating the session is ready. On the client, you can update the current session configuration with the session.update event. Most session properties can be updated at any time, except for the voice the model uses for audio output, after the model has responded with audio once during the session. The maximum duration of a Realtime session is 30 minutes.

The following example shows updating the session with a session.update client event. See the WebRTC or WebSocket guide for more on sending client events over these channels.

Update the system instructions used by the model in this session
const event = {
  type: "session.update",
  session: {
    instructions: "Never use the word 'moist' in your responses!"
  },
};

// WebRTC data channel and WebSocket both have .send()
dataChannel.send(JSON.stringify(event));
When the session has been updated, the server will emit a session.updated event with the new state of the session.

Related client events	Related server events
session.update

session.created

session.updated

Text inputs and outputs
To generate text with a Realtime model, you can add text inputs to the current conversation, ask the model to generate a response, and listen for server-sent events indicating the progress of the model's response. In order to generate text, the session must be configured with the text modality (this is true by default).

Create a new text conversation item using the conversation.item.create client event. This is similar to sending a user message (prompt) in Chat Completions in the REST API.

Create a conversation item with user input
const event = {
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user",
    content: [
      {
        type: "input_text",
        text: "What Prince album sold the most copies?",
      }
    ]
  },
};

// WebRTC data channel and WebSocket both have .send()
dataChannel.send(JSON.stringify(event));
After adding the user message to the conversation, send the response.create event to initiate a response from the model. If both audio and text are enabled for the current session, the model will respond with both audio and text content. If you'd like to generate text only, you can specify that when sending the response.create client event, as shown below.

Generate a text-only response
const event = {
  type: "response.create",
  response: {
    modalities: [ "text" ]
  },
};

// WebRTC data channel and WebSocket both have .send()
dataChannel.send(JSON.stringify(event));
When the response is completely finished, the server will emit the response.done event. This event will contain the full text generated by the model, as shown below.

Listen for response.done to see the final results
function handleEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (serverEvent.type === "response.done") {
    console.log(serverEvent.response.output[0]);
  }
}

// Listen for server messages (WebRTC)
dataChannel.addEventListener("message", handleEvent);

// Listen for server messages (WebSocket)
// ws.on("message", handleEvent);
While the model response is being generated, the server will emit a number of lifecycle events during the process. You can listen for these events, such as response.text.delta, to provide realtime feedback to users as the response is generated. A full listing of the events emitted by there server are found below under related server events. They are provided in the rough order of when they are emitted, along with relevant client-side events for text generation.

Related client events	Related server events
conversation.item.create

response.create

conversation.item.created

response.created

response.output_item.added

response.content_part.added

response.text.delta

response.text.done

response.content_part.done

response.output_item.done

response.done

rate_limits.updated

Audio inputs and outputs
One of the most powerful features of the Realtime API is voice-to-voice interaction with the model, without an intermediate text-to-speech or speech-to-text step. This enables lower latency for voice interfaces, and gives the model more data to work with around the tone and inflection of voice input.

Voice options
Realtime sessions can be configured to use one of several built‑in voices when producing audio output. You can set the voice on session creation (or on a response.create) to control how the model sounds. Current voice options are alloy, ash, ballad, coral, echo, sage, shimmer, and verse. Once the model has emitted audio in a session, the voice cannot be modified for that session.

Handling audio with WebRTC
If you are connecting to the Realtime API using WebRTC, the Realtime API is acting as a peer connection to your client. Audio output from the model is delivered to your client as a remote media stream. Audio input to the model is collected using audio devices (getUserMedia), and media streams are added as tracks to to the peer connection.

The example code from the WebRTC connection guide shows a basic example of configuring both local and remote audio using browser APIs:

// Create a peer connection
const pc = new RTCPeerConnection();

// Set up to play remote audio from the model
const audioEl = document.createElement("audio");
audioEl.autoplay = true;
pc.ontrack = e => audioEl.srcObject = e.streams[0];

// Add local audio track for microphone input in the browser
const ms = await navigator.mediaDevices.getUserMedia({
  audio: true
});
pc.addTrack(ms.getTracks()[0]);
The snippet above enables simple interaction with the Realtime API, but there's much more that can be done. For more examples of different kinds of user interfaces, check out the WebRTC samples repository. Live demos of these samples can also be found here.

Using media captures and streams in the browser enables you to do things like mute and unmute microphones, select which device to collect input from, and more.

Client and server events for audio in WebRTC
By default, WebRTC clients don't need to send any client events to the Realtime API before sending audio inputs. Once a local audio track is added to the peer connection, your users can just start talking!

However, WebRTC clients still receive a number of server-sent lifecycle events as audio is moving back and forth between client and server over the peer connection. Examples include:

When input is sent over the local media track, you will receive input_audio_buffer.speech_started events from the server.
When local audio input stops, you'll receive the input_audio_buffer.speech_stopped event.
You'll receive delta events for the in-progress audio transcript.
You'll receive a response.done event when the model has transcribed and completed sending a response.
Manipulating WebRTC APIs for media streams may give you all the control you need. However, it may occasionally be necessary to use lower-level interfaces for audio input and output. Refer to the WebSockets section below for more information and a listing of events required for granular audio input handling.

Handling audio with WebSockets
When sending and receiving audio over a WebSocket, you will have a bit more work to do in order to send media from the client, and receive media from the server. Below, you'll find a table describing the flow of events during a WebSocket session that are necessary to send and receive audio over the WebSocket.

The events below are given in lifecycle order, though some events (like the delta events) may happen concurrently.

Lifecycle stage	Client events	Server events
Session initialization	
session.update

session.created

session.updated

User audio input	
conversation.item.create
  (send whole audio message)

input_audio_buffer.append
  (stream audio in chunks)

input_audio_buffer.commit
  (used when VAD is disabled)

response.create
  (used when VAD is disabled)

input_audio_buffer.speech_started

input_audio_buffer.speech_stopped

input_audio_buffer.committed

Server audio output	
input_audio_buffer.clear
  (used when VAD is disabled)

conversation.item.created

response.created

response.output_item.created

response.content_part.added

response.audio.delta

response.audio_transcript.delta

response.text.delta

response.audio.done

response.audio_transcript.done

response.text.done

response.content_part.done

response.output_item.done

response.done

rate_limits.updated

Streaming audio input to the server
To stream audio input to the server, you can use the input_audio_buffer.append client event. This event requires you to send chunks of Base64-encoded audio bytes to the Realtime API over the socket. Each chunk cannot exceed 15 MB in size.

The format of the input chunks can be configured either for the entire session, or per response.

Session: session.input_audio_format in session.update
Response: response.input_audio_format in response.create
Append audio input bytes to the conversation
import fs from 'fs';
import decodeAudio from 'audio-decode';

// Converts Float32Array of audio data to PCM16 ArrayBuffer
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

// Converts a Float32Array to base64-encoded PCM16 data
base64EncodeAudio(float32Array) {
  const arrayBuffer = floatTo16BitPCM(float32Array);
  let binary = '';
  let bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    let chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// Fills the audio buffer with the contents of three files,
// then asks the model to generate a response.
const files = [
  './path/to/sample1.wav',
  './path/to/sample2.wav',
  './path/to/sample3.wav'
];

for (const filename of files) {
  const audioFile = fs.readFileSync(filename);
  const audioBuffer = await decodeAudio(audioFile);
  const channelData = audioBuffer.getChannelData(0);
  const base64Chunk = base64EncodeAudio(channelData);
  ws.send(JSON.stringify({
    type: 'input_audio_buffer.append',
    audio: base64Chunk
  }));
});

ws.send(JSON.stringify({type: 'input_audio_buffer.commit'}));
ws.send(JSON.stringify({type: 'response.create'}));
Send full audio messages
It is also possible to create conversation messages that are full audio recordings. Use the conversation.item.create client event to create messages with input_audio content.

Create full audio input conversation items
const fullAudio = "<a base64-encoded string of audio bytes>";

const event = {
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user",
    content: [
      {
        type: "input_audio",
        audio: fullAudio,
      },
    ],
  },
};

// WebRTC data channel and WebSocket both have .send()
dataChannel.send(JSON.stringify(event));
Working with audio output from a WebSocket
To play output audio back on a client device like a web browser, we recommend using WebRTC rather than WebSockets. WebRTC will be more robust sending media to client devices over uncertain network conditions.

But to work with audio output in server-to-server applications using a WebSocket, you will need to listen for response.audio.delta events containing the Base64-encoded chunks of audio data from the model. You will either need to buffer these chunks and write them out to a file, or maybe immediately stream them to another source like a phone call with Twilio.

Note that the response.audio.done and response.done events won't actually contain audio data in them - just audio content transcriptions. To get the actual bytes, you'll need to listen for the response.audio.delta events.

The format of the output chunks can be configured either for the entire session, or per response.

Session: session.output_audio_format in session.update
Response: response.output_audio_format in response.create
Listen for response.audio.delta events
function handleEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (serverEvent.type === "response.audio.delta") {
    // Access Base64-encoded audio chunks
    // console.log(serverEvent.delta);
  }
}

// Listen for server messages (WebSocket)
ws.on("message", handleEvent);
Voice activity detection
By default, Realtime sessions have voice activity detection (VAD) enabled, which means the API will determine when the user has started or stopped speaking and respond automatically.

Read more about how to configure VAD in our voice activity detection guide.

Disable VAD
VAD can be disabled by setting turn_detection to null with the session.update client event. This can be useful for interfaces where you would like to take granular control over audio input, like push to talk interfaces.

When VAD is disabled, the client will have to manually emit some additional client events to trigger audio responses:

Manually send input_audio_buffer.commit, which will create a new user input item for the conversation.
Manually send response.create to trigger an audio response from the model.
Send input_audio_buffer.clear before beginning a new user input.
Keep VAD, but disable automatic responses
If you would like to keep VAD mode enabled, but would just like to retain the ability to manually decide when a response is generated, you can set turn_detection.interrupt_response and turn_detection.create_response to false with the session.update client event. This will retain all the behavior of VAD but not automatically create new Responses. Clients can trigger these manually with a response.create event.

This can be useful for moderation or input validation or RAG patterns, where you're comfortable trading a bit more latency in the interaction for control over inputs.

Create responses outside the default conversation
By default, all responses generated during a session are added to the session's conversation state (the "default conversation"). However, you may want to generate model responses outside the context of the session's default conversation, or have multiple responses generated concurrently. You might also want to have more granular control over which conversation items are considered while the model generates a response (e.g. only the last N number of turns).

Generating "out-of-band" responses which are not added to the default conversation state is possible by setting the response.conversation field to the string none when creating a response with the response.create client event.

When creating an out-of-band response, you will probably also want some way to identify which server-sent events pertain to this response. You can provide metadata for your model response that will help you identify which response is being generated for this client-sent event.

Create an out-of-band model response
const prompt = `
Analyze the conversation so far. If it is related to support, output
"support". If it is related to sales, output "sales".
`;

const event = {
  type: "response.create",
  response: {
    // Setting to "none" indicates the response is out of band
    // and will not be added to the default conversation
    conversation: "none",

    // Set metadata to help identify responses sent back from the model
    metadata: { topic: "classification" },
    
    // Set any other available response fields
    modalities: [ "text" ],
    instructions: prompt,
  },
};

// WebRTC data channel and WebSocket both have .send()
dataChannel.send(JSON.stringify(event));
Now, when you listen for the response.done server event, you can identify the result of your out-of-band response.

Create an out-of-band model response
function handleEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (
    serverEvent.type === "response.done" &&
    serverEvent.response.metadata?.topic === "classification"
  ) {
    // this server event pertained to our OOB model response
    console.log(serverEvent.response.output[0]);
  }
}

// Listen for server messages (WebRTC)
dataChannel.addEventListener("message", handleEvent);

// Listen for server messages (WebSocket)
// ws.on("message", handleEvent);
Create a custom context for responses
You can also construct a custom context that the model will use to generate a response, outside the default/current conversation. This can be done using the input array on a response.create client event. You can use new inputs, or reference existing input items in the conversation by ID.

Listen for out-of-band model response with custom context
const event = {
  type: "response.create",
  response: {
    conversation: "none",
    metadata: { topic: "pizza" },
    modalities: [ "text" ],

    // Create a custom input array for this request with whatever context
    // is appropriate
    input: [
      // potentially include existing conversation items:
      {
        type: "item_reference",
        id: "some_conversation_item_id"
      },
      {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Is it okay to put pineapple on pizza?",
          },
        ],
      },
    ],
  },
};

// WebRTC data channel and WebSocket both have .send()
dataChannel.send(JSON.stringify(event));
Create responses with no context
You can also insert responses into the default conversation, ignoring all other instructions and context. Do this by setting input to an empty array.

Insert no-context model responses into the default conversation
const prompt = `
Say exactly the following:
I'm a little teapot, short and stout! 
This is my handle, this is my spout!
`;

const event = {
  type: "response.create",
  response: {
    // An empty input array removes existing context
    input: [],
    instructions: prompt,
  },
};

// WebRTC data channel and WebSocket both have .send()
dataChannel.send(JSON.stringify(event));
Function calling
The Realtime models also support function calling, which enables you to execute custom code to extend the capabilities of the model. Here's how it works at a high level:

When updating the session or creating a response, you can specify a list of available functions for the model to call.
If when processing input, the model determines it should make a function call, it will add items to the conversation representing arguments to a function call.
When the client detects conversation items that contain function call arguments, it will execute custom code using those arguments
When the custom code has been executed, the client will create new conversation items that contain the output of the function call, and ask the model to respond.
Let's see how this would work in practice by adding a callable function that will provide today's horoscope to users of the model. We'll show the shape of the client event objects that need to be sent, and what the server will emit in turn.

Configure callable functions
First, we must give the model a selection of functions it can call based on user input. Available functions can be configured either at the session level, or the individual response level.

Session: session.tools property in session.update
Response: response.tools property in response.create
Here's an example client event payload for a session.update that configures a horoscope generation function, that takes a single argument (the astrological sign for which the horoscope should be generated):

session.update

{
  "type": "session.update",
  "session": {
    "tools": [
      {
        "type": "function",
        "name": "generate_horoscope",
        "description": "Give today's horoscope for an astrological sign.",
        "parameters": {
          "type": "object",
          "properties": {
            "sign": {
              "type": "string",
              "description": "The sign for the horoscope.",
              "enum": [
                "Aries",
                "Taurus",
                "Gemini",
                "Cancer",
                "Leo",
                "Virgo",
                "Libra",
                "Scorpio",
                "Sagittarius",
                "Capricorn",
                "Aquarius",
                "Pisces"
              ]
            }
          },
          "required": ["sign"]
        }
      }
    ],
    "tool_choice": "auto",
  }
}
The description fields for the function and the parameters help the model choose whether or not to call the function, and what data to include in each parameter. If the model receives input that indicates the user wants their horoscope, it will call this function with a sign parameter.

Detect when the model wants to call a function
Based on inputs to the model, the model may decide to call a function in order to generate the best response. Let's say our application adds the following conversation item and attempts to generate a response:

conversation.item.create

{
  "type": "conversation.item.create",
  "item": {
    "type": "message",
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "What is my horoscope? I am an aquarius."
      }
    ]
  }
}
Followed by a client event to generate a response:

response.create

{
  "type": "response.create"
}
Instead of immediately returning a text or audio response, the model will instead generate a response that contains the arguments that should be passed to a function in the developer's application. You can listen for realtime updates to function call arguments using the response.function_call_arguments.delta server event, but response.done will also have the complete data we need to call our function.

response.done

{
  "type": "response.done",
  "event_id": "event_AeqLA8iR6FK20L4XZs2P6",
  "response": {
    "object": "realtime.response",
    "id": "resp_AeqL8XwMUOri9OhcQJIu9",
    "status": "completed",
    "status_details": null,
    "output": [
      {
        "object": "realtime.item",
        "id": "item_AeqL8gmRWDn9bIsUM2T35",
        "type": "function_call",
        "status": "completed",
        "name": "generate_horoscope",
        "call_id": "call_sHlR7iaFwQ2YQOqm",
        "arguments": "{\"sign\":\"Aquarius\"}"
      }
    ],
    "usage": {
      "total_tokens": 541,
      "input_tokens": 521,
      "output_tokens": 20,
      "input_token_details": {
        "text_tokens": 292,
        "audio_tokens": 229,
        "cached_tokens": 0,
        "cached_tokens_details": { "text_tokens": 0, "audio_tokens": 0 }
      },
      "output_token_details": {
        "text_tokens": 20,
        "audio_tokens": 0
      }
    },
    "metadata": null
  }
}
In the JSON emitted by the server, we can detect that the model wants to call a custom function:

Property	Function calling purpose
response.output[0].type	When set to function_call, indicates this response contains arguments for a named function call.
response.output[0].name	The name of the configured function to call, in this case generate_horoscope
response.output[0].arguments	A JSON string containing arguments to the function. In our case, "{\"sign\":\"Aquarius\"}".
response.output[0].call_id	A system-generated ID for this function call - you will need this ID to pass a function call result back to the model.
Given this information, we can execute code in our application to generate the horoscope, and then provide that information back to the model so it can generate a response.

Provide the results of a function call to the model
Upon receiving a response from the model with arguments to a function call, your application can execute code that satisfies the function call. This could be anything you want, like talking to external APIs or accessing databases.

Once you are ready to give the model the results of your custom code, you can create a new conversation item containing the result via the conversation.item.create client event.

conversation.item.create

{
  "type": "conversation.item.create",
  "item": {
    "type": "function_call_output",
    "call_id": "call_sHlR7iaFwQ2YQOqm",
    "output": "{\"horoscope\": \"You will soon meet a new friend.\"}"
  }
}
The conversation item type is function_call_output
item.call_id is the same ID we got back in the response.done event above
item.output is a JSON string containing the results of our function call
Once we have added the conversation item containing our function call results, we again emit the response.create event from the client. This will trigger a model response using the data from the function call.

response.create

{
  "type": "response.create"
}
Error handling
The error event is emitted by the server whenever an error condition is encountered on the server during the session. Occasionally, these errors can be traced to a client event that was emitted by your application.

Unlike HTTP requests and responses, where a response is implicitly tied to a request from the client, we need to use an event_id property on client events to know when one of them has triggered an error condition on the server. This technique is shown in the code below, where the client attempts to emit an unsupported event type.

const event = {
  event_id: "my_awesome_event",
  type: "scooby.dooby.doo",
};

dataChannel.send(JSON.stringify(event));
This unsuccessful event sent from the client will emit an error event like the following:

{
  "type": "invalid_request_error",
  "code": "invalid_value",
  "message": "Invalid value: 'scooby.dooby.doo' ...",
  "param": "type",
  "event_id": "my_awesome_event"
}
Was this page useful?
Realtime speech-to-speech sessions
Session lifecycle events
Text inputs and outputs
Voice options
Handling audio with WebRTC
Handling audio with WebSockets
Voice activity detection
Responses outside the default conversation
Function calling
Error handling
Realtime transcription
Beta
Learn how to transcribe audio in real-time with the Realtime API.
You can use the Realtime API for transcription-only use cases, either with input from a microphone or from a file. For example, you can use it to generate subtitles or transcripts in real-time. With the transcription-only mode, the model will not generate responses.

If you want the model to produce responses, you can use the Realtime API in speech-to-speech conversation mode.

Realtime transcription sessions
To use the Realtime API for transcription, you need to create a transcription session, connecting via WebSockets or WebRTC.

Unlike the regular Realtime API sessions for conversations, the transcription sessions typically don't contain responses from the model.

The transcription session object is also different from regular Realtime API sessions:

{
  object: "realtime.transcription_session",
  id: string,
  input_audio_format: string,
  input_audio_transcription: [{
    model: string,
    prompt: string,
    language: string
  }],
  turn_detection: {
    type: "server_vad",
    threshold: float,
    prefix_padding_ms: integer,
    silence_duration_ms: integer,
  } | null,
  input_audio_noise_reduction: {
    type: "near_field" | "far_field"
  },
  include: list[string] | null
}
Some of the additional properties transcription sessions support are:

input_audio_transcription.model: The transcription model to use, currently gpt-4o-transcribe, gpt-4o-mini-transcribe, and whisper-1 are supported
input_audio_transcription.prompt: The prompt to use for the transcription, to guide the model (e.g. "Expect words related to technology")
input_audio_transcription.language: The language to use for the transcription, ideally in ISO-639-1 format (e.g. "en", "fr"...) to improve accuracy and latency
input_audio_noise_reduction: The noise reduction configuration to use for the transcription
include: The list of properties to include in the transcription events
Possible values for the input audio format are: pcm16 (default), g711_ulaw and g711_alaw.

You can find more information about the transcription session object in the API reference.

Handling transcriptions
When using the Realtime API for transcription, you can listen for the conversation.item.input_audio_transcription.delta and conversation.item.input_audio_transcription.completed events.

For whisper-1 the delta event will contain full turn transcript, same as completed event. For gpt-4o-transcribe and gpt-4o-mini-transcribe the delta event will contain incremental transcripts as they are streamed out from the model.

Here is an example transcription delta event:

{
  "event_id": "event_2122",
  "type": "conversation.item.input_audio_transcription.delta",
  "item_id": "item_003",
  "content_index": 0,
  "delta": "Hello,"
}
Here is an example transcription completion event:

{
  "event_id": "event_2122",
  "type": "conversation.item.input_audio_transcription.completed",
  "item_id": "item_003",
  "content_index": 0,
  "transcript": "Hello, how are you?"
}
Note that ordering between completion events from different speech turns is not guaranteed. You should use item_id to match these events to the input_audio_buffer.committed events and use input_audio_buffer.committed.previous_item_id to handle the ordering.

To send audio data to the transcription session, you can use the input_audio_buffer.append event.

You have 2 options:

Use a streaming microphone input
Stream data from a wav file
Voice activity detection
The Realtime API supports automatic voice activity detection (VAD). Enabled by default, VAD will control when the input audio buffer is committed, therefore when transcription begins.

Read more about configuring VAD in our Voice Activity Detection guide.

You can also disable VAD by setting the turn_detection property to null, and control when to commit the input audio on your end.

Additional configurations
Noise reduction
You can use the input_audio_noise_reduction property to configure how to handle noise reduction in the audio stream.

The possible values are:

near_field: Use near-field noise reduction.
far_field: Use far-field noise reduction.
null: Disable noise reduction.
The default value is near_field, and you can disable noise reduction by setting the property to null.

Using logprobs
You can use the include property to include logprobs in the transcription events, using item.input_audio_transcription.logprobs.

Those logprobs can be used to calculate the confidence score of the transcription.

{
  "type": "transcription_session.update",
  "input_audio_format": "pcm16",
  "input_audio_transcription": {
    "model": "gpt-4o-transcribe",
    "prompt": "",
    "language": ""
  },
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 500,
  },
  "input_audio_noise_reduction": {
    "type": "near_field"
  },
  "include": [ 
    "item.input_audio_transcription.logprobs",
  ],
}
Was this page useful?
Realtime transcription sessions
Handling transcriptions
Voice activity detection
Additional configurations

Voice activity detection (VAD)
Beta
Learn about automatic voice activity detection in the Realtime API.
Voice activity detection (VAD) is a feature available in the Realtime API allowing to automatically detect when the user has started or stopped speaking. It is enabled by default in speech-to-speech or transcription Realtime sessions, but is optional and can be turned off.

Overview
When VAD is enabled, the audio is chunked automatically and the Realtime API sends events to indicate when the user has started or stopped speaking:

input_audio_buffer.speech_started: The start of a speech turn
input_audio_buffer.speech_stopped: The end of a speech turn
You can use these events to handle speech turns in your application. For example, you can use them to manage conversation state or process transcripts in chunks.

You can use the turn_detection property of the session.update event to configure how audio is chunked within each speech-to-text sample.

There are two modes for VAD:

server_vad: Automatically chunks the audio based on periods of silence.
semantic_vad: Chunks the audio when the model believes based on the words said by the user that they have completed their utterance.
The default value is server_vad.

Read below to learn more about the different modes.

Server VAD
Server VAD is the default mode for Realtime sessions, and uses periods of silence to automatically chunk the audio.

You can adjust the following properties to fine-tune the VAD settings:

threshold: Activation threshold (0 to 1). A higher threshold will require louder audio to activate the model, and thus might perform better in noisy environments.
prefix_padding_ms: Amount of audio (in milliseconds) to include before the VAD detected speech.
silence_duration_ms: Duration of silence (in milliseconds) to detect speech stop. With shorter values turns will be detected more quickly.
Here is an example VAD configuration:

{
  "type": "session.update",
  "session": {
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500,
      "create_response": true, // only in conversation mode
      "interrupt_response": true, // only in conversation mode
    }
  }
}
Semantic VAD
Semantic VAD is a new mode that uses a semantic classifier to detect when the user has finished speaking, based on the words they have uttered. This classifier scores the input audio based on the probability that the user is done speaking. When the probability is low, the model will wait for a timeout, whereas when it is high, there is no need to wait. For example, user audio that trails off with an "ummm..." would result in a longer timeout than a definitive statement.

With this mode, the model is less likely to interrupt the user during a speech-to-speech conversation, or chunk a transcript before the user is done speaking.

Semantic VAD can be activated by setting turn_detection.type to semantic_vad in a session.update event.

It can be configured like this:

{
  "type": "session.update",
  "session": {
    "turn_detection": {
      "type": "semantic_vad",
      "eagerness": "low" | "medium" | "high" | "auto", // optional
      "create_response": true, // only in conversation mode
      "interrupt_response": true, // only in conversation mode
    }
  }
}
The optional eagerness property is a way to control how eager the model is to interrupt the user, tuning the maximum wait timeout. In transcription mode, even if the model doesn't reply, it affects how the audio is chunked.

auto is the default value, and is equivalent to medium.
low will let the user take their time to speak.
high will chunk the audio as soon as possible.
If you want the model to respond more often in conversation mode, or to return transcription events faster in transcription mode, you can set eagerness to high.
Text to speech
Learn how to turn text into lifelike spoken audio.
The Audio API provides a speech endpoint based on our GPT-4o mini TTS (text-to-speech) model. It comes with 11 built-in voices and can be used to:

Narrate a written blog post
Produce spoken audio in multiple languages
Give realtime audio output using streaming
Here's an example of the alloy voice:

Our usage policies require you to provide a clear disclosure to end users that the TTS voice they are hearing is AI-generated and not a human voice.

Quickstart
The speech endpoint takes three key inputs:

The model you're using
The text to be turned into audio
The voice that will speak the output
Here's a simple request example:

Generate spoken audio from input text
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();
const speechFile = path.resolve("./speech.mp3");

const mp3 = await openai.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "coral",
  input: "Today is a wonderful day to build something people love!",
  instructions: "Speak in a cheerful and positive tone.",
});

const buffer = Buffer.from(await mp3.arrayBuffer());
await fs.promises.writeFile(speechFile, buffer);
By default, the endpoint outputs an MP3 of the spoken audio, but you can configure it to output any supported format.

Text-to-speech models
For intelligent realtime applications, use the gpt-4o-mini-tts model, our newest and most reliable text-to-speech model. You can prompt the model to control aspects of speech, including:

Accent
Emotional range
Intonation
Impressions
Speed of speech
Tone
Whispering
Our other text-to-speech models are tts-1 and tts-1-hd. The tts-1 model provides lower latency, but at a lower quality than the tts-1-hd model.

Voice options
The TTS endpoint provides 11 built‑in voices to control how speech is rendered from text. Hear and play with these voices in OpenAI.fm, our interactive demo for trying the latest text-to-speech model in the OpenAI API. Voices are currently optimized for English.

alloy
ash
ballad
coral
echo
fable
onyx
nova
sage
shimmer
If you're using the Realtime API, note that the set of available voices is slightly different—see the realtime model capabilities guide for current realtime voices.

Streaming realtime audio
The Speech API provides support for realtime audio streaming using chunk transfer encoding. This means the audio can be played before the full file is generated and made accessible.

Stream spoken audio from input text directly to your speakers
import OpenAI from "openai";
import { playAudio } from "openai/helpers/audio";

const openai = new OpenAI();

const response = await openai.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "coral",
  input: "Today is a wonderful day to build something people love!",
  instructions: "Speak in a cheerful and positive tone.",
  response_format: "wav",
});

await playAudio(response);
For the fastest response times, we recommend using wav or pcm as the response format.

Supported output formats
The default response format is mp3, but other formats like opus and wav are available.

MP3: The default response format for general use cases.
Opus: For internet streaming and communication, low latency.
AAC: For digital audio compression, preferred by YouTube, Android, iOS.
FLAC: For lossless audio compression, favored by audio enthusiasts for archiving.
WAV: Uncompressed WAV audio, suitable for low-latency applications to avoid decoding overhead.
PCM: Similar to WAV but contains the raw samples in 24kHz (16-bit signed, low-endian), without the header.
Supported languages
The TTS model generally follows the Whisper model in terms of language support. Whisper supports the following languages and performs well, despite voices being optimized for English:

Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Marathi, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh.

You can generate spoken audio in these languages by providing input text in the language of your choice.

Customization and ownership
Custom voices
We do not support custom voices or creating a copy of your own voice.

Who owns the output?
As with all outputs from our API, the person who created them owns the output. You are still required to inform end users that they are hearing audio generated by AI and not a real person talking to them.

Was this page useful?
Overview
Quickstart
Supported formats
Supported languages
Customization and ownership

On the other hand, if you want to let the user speak uninterrupted in conversation mode, or if you would like larger transcript chunks in transcription mode, you can set eagerness to low.

Was this page useful?
Overview
Server VAD
Semantic VAD

    