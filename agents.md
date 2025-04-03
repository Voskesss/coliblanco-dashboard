
https://openai.github.io/openai-agents-python/

Agents
Learn how to build agents with the OpenAI API.
Agents represent systems that intelligently accomplish tasks, ranging from executing simple workflows to pursuing complex, open-ended objectives.

OpenAI provides a rich set of composable primitives that enable you to build agents. This guide walks through those primitives, and how they come together to form a robust agentic platform.

Overview
Building agents involves assembling components across several domains—such as models, tools, knowledge and memory, audio and speech, guardrails, and orchestration—and OpenAI provides composable primitives for each.

Domain
Description	OpenAI Primitives
Models	Core intelligence capable of reasoning, making decisions, and processing different modalities.	o1, o3-mini, GPT-4.5, GPT-4o, GPT-4o-mini
Tools	Interface to the world, interact with environment, function calling, built-in tools, etc.	Function calling, Web search, File search, Computer use
Knowledge and memory	Augment agents with external and persistent knowledge.	Vector stores, File search, Embeddings
Audio and speech	Create agents that can understand audio and respond back in natural language.	Audio generation, realtime, Audio agents
Guardrails	Prevent irrelevant, harmful, or undesirable behavior.	Moderation, Instruction hierarchy
Orchestration	Develop, deploy, monitor, and improve agents.	Agents SDK, Tracing, Evaluations, Fine-tuning
Voice agents	Create agents that can understand audio and respond back in natural language.	Realtime API, Voice support in the Agents SDK
Models
Model	Agentic Strengths
o1 and o3-mini	Best for long-term planning, hard tasks, and reasoning.
GPT-4.5	Best for agentic execution.
GPT-4o	Good balance of agentic capability and latency.
GPT-4o-mini	Best for low-latency.
Large language models (LLMs) are at the core of many agentic systems, responsible for making decisions and interacting with the world. OpenAI’s models support a wide range of capabilities:

High intelligence: Capable of reasoning and planning to tackle the most difficult tasks.
Tools: Call your functions and leverage OpenAI's built-in tools.
Multimodality: Natively understand text, images, audio, code, and documents.
Low-latency: Support for real-time audio conversations and smaller, faster models.
For detailed model comparisons, visit the models page.

Tools
Tools enable agents to interact with the world. OpenAI supports function calling to connect with your code, and built-in tools for common tasks like web searches and data retrieval.

Tool	Description
Function calling	Interact with developer-defined code.
Web search	Fetch up-to-date information from the web.
File search	Perform semantic search across your documents.
Computer use	Understand and control a computer or browser.
Knowledge and memory
Knowledge and memory help agents store, retrieve, and utilize information beyond their initial training data. Vector stores enable agents to search your documents semantically and retrieve relevant information at runtime. Meanwhile, embeddings represent data efficiently for quick retrieval, powering dynamic knowledge solutions and long-term agent memory. You can integrate your data using OpenAI’s vector stores and Embeddings API.

Guardrails
Guardrails ensure your agents behave safely, consistently, and within your intended boundaries—critical for production deployments. Use OpenAI’s free Moderation API to automatically filter unsafe content. Further control your agent’s behavior by leveraging the instruction hierarchy, which prioritizes developer-defined prompts and mitigates unwanted agent behaviors.

Orchestration
Building agents is a process. OpenAI provides tools to effectively build, deploy, monitor, evaluate, and improve agentic systems.

Agent Traces UI in OpenAI Dashboard
Phase
Description	
OpenAI Primitives
Build and deploy	Rapidly build agents, enforce guardrails, and handle conversational flows using the Agents SDK.	Agents SDK
Monitor	Observe agent behavior in real-time, debug issues, and gain insights through tracing.	Tracing
Evaluate and improve	Measure agent performance, identify areas for improvement, and refine your agents.	Evaluations
Fine-tuning
Get started
Get started by installing the OpenAI Agents SDK for Python via:

pip install openai-agents
Explore the repository and documentation for more details.

Was this page useful?
Overview
Models
Tools
Knowledge & memory
Guardrails
Orchestration


https://github.com/openai/openai-agents-python


Voice agents
Learn how to build voice agents that can understand audio and respond back in natural language.
Use the OpenAI API and Agents SDK to create powerful, context-aware voice agents for applications like customer support and language tutoring. This guide helps you design and build a voice agent.

Choose the right architecture
OpenAI provides two primary architectures for building voice agents:

Speech-to-speech (multimodal)
Chained (speech-to-text → LLM → text-to-speech)
Speech-to-speech (multimodal) architecture
The multimodal speech-to-speech (S2S) architecture directly processes audio inputs and outputs, handling speech in real time in a single multimodal model, gpt-4o-realtime-preview. The model thinks and responds in speech. It doesn't rely on a transcript of the user's input—it hears emotion and intent, filters out noise, and responds directly in speech. Use this approach for highly interactive, low-latency, conversational use cases.

Strengths	Best for
Low latency interactions	Interactive and unstructured conversations
Rich multimodal understanding (audio and text simultaneously)	Language tutoring and interactive learning experiences
Natural, fluid conversational flow	Conversational search and discovery
Enhanced user experience through vocal context understanding	Interactive customer service scenarios
Chained architecture
A chained architecture processes audio sequentially, converting audio to text, generating intelligent responses using large language models (LLMs), and synthesizing audio from text. We recommend this predictable architecture if you're new to building voice agents. Both the user input and model's response are in text, so you have a transcript and can control what happens in your application. It's also a reliable way to convert an existing LLM-based application into a voice agent.

You're chaining these models: gpt-4o-transcribe → gpt-4o → gpt-4o-mini-tts

Strengths	Best for
High control and transparency	Structured workflows focused on specific user objectives
Robust function calling and structured interactions	Customer support
Reliable, predictable responses	Sales and inbound triage
Support for extended conversational context	Scenarios that involve transcripts and scripted responses
Build a voice agent
Use OpenAI's APIs and SDKs to create powerful, context-aware voice agents.

Use a speech-to-speech architecture for realtime processing
Building a speech-to-speech voice agent requires:

Establishing a connection for realtime data transfer
Creating a realtime session with the Realtime API
Using an OpenAI model with realtime audio input and output capabilities
To get started, read the Realtime API guide and the Realtime API reference. Compatible models include gpt-4o-realtime-preview and gpt-4o-mini-realtime-preview.

Chain together audio input → text processing → audio output
The Agents SDK supports extending your existing agents with voice capabilities. Get started by installing the OpenAI Agents SDK for Python with voice support:

pip install openai-agents[voice]
See the Agents SDK voice agents quickstart in GitHub to follow a complete example.

In the example, you'll:

Run a speech-to-text model to turn audio into text.
Run your code, which is usually an agentic workflow, to produce a result.
Run a text-to-speech model to turn the result text back into audio.
Was this page useful?
Overview
Choose the right architecture
Build a voice agent
OpenAI Agents SDK
The OpenAI Agents SDK enables you to build agentic AI apps in a lightweight, easy-to-use package with very few abstractions. It's a production-ready upgrade of our previous experimentation for agents, Swarm. The Agents SDK has a very small set of primitives:

Agents, which are LLMs equipped with instructions and tools
Handoffs, which allow agents to delegate to other agents for specific tasks
Guardrails, which enable the inputs to agents to be validated
In combination with Python, these primitives are powerful enough to express complex relationships between tools and agents, and allow you to build real-world applications without a steep learning curve. In addition, the SDK comes with built-in tracing that lets you visualize and debug your agentic flows, as well as evaluate them and even fine-tune models for your application.

Why use the Agents SDK
The SDK has two driving design principles:

Enough features to be worth using, but few enough primitives to make it quick to learn.
Works great out of the box, but you can customize exactly what happens.
Here are the main features of the SDK:

Agent loop: Built-in agent loop that handles calling tools, sending results to the LLM, and looping until the LLM is done.
Python-first: Use built-in language features to orchestrate and chain agents, rather than needing to learn new abstractions.
Handoffs: A powerful feature to coordinate and delegate between multiple agents.
Guardrails: Run input validations and checks in parallel to your agents, breaking early if the checks fail.
Function tools: Turn any Python function into a tool, with automatic schema generation and Pydantic-powered validation.
Tracing: Built-in tracing that lets you visualize, debug and monitor your workflows, as well as use the OpenAI suite of evaluation, fine-tuning and distillation tools.
Installation

pip install openai-agents
Hello world example

from agents import Agent, Runner

agent = Agent(name="Assistant", instructions="You are a helpful assistant")

result = Runner.run_sync(agent, "Write a haiku about recursion in programming.")
print(result.final_output)

# Code within the code,
# Functions calling themselves,
# Infinite loop's dance.
(If running this, ensure you set the OPENAI_API_KEY environment variable)


export OPENAI_API_KEY=sk-...
uickstart
Create a project and virtual environment
You'll only need to do this once.


mkdir my_project
cd my_project
python -m venv .venv
Activate the virtual environment
Do this every time you start a new terminal session.


source .venv/bin/activate
Install the Agents SDK

pip install openai-agents # or `uv add openai-agents`, etc
Set an OpenAI API key
If you don't have one, follow these instructions to create an OpenAI API key.


export OPENAI_API_KEY=sk-...
Create your first agent
Agents are defined with instructions, a name, and optional config (such as model_config)


from agents import Agent

agent = Agent(
    name="Math Tutor",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)
Add a few more agents
Additional agents can be defined in the same way. handoff_descriptions provide additional context for determining handoff routing


from agents import Agent

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)

math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)
Define your handoffs
On each agent, you can define an inventory of outgoing handoff options that the agent can choose from to decide how to make progress on their task.


triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent]
)
Run the agent orchestration
Let's check that the workflow runs and the triage agent correctly routes between the two specialist agents.


from agents import Runner

async def main():
    result = await Runner.run(triage_agent, "What is the capital of France?")
    print(result.final_output)
Add a guardrail
You can define custom guardrails to run on the input or output.


from agents import GuardrailFunctionOutput, Agent, Runner
from pydantic import BaseModel

class HomeworkOutput(BaseModel):
    is_homework: bool
    reasoning: str

guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about homework.",
    output_type=HomeworkOutput,
)

async def homework_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(HomeworkOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_homework,
    )
Put it all together
Let's put it all together and run the entire workflow, using handoffs and the input guardrail.


from agents import Agent, InputGuardrail,GuardrailFunctionOutput, Runner
from pydantic import BaseModel
import asyncio

class HomeworkOutput(BaseModel):
    is_homework: bool
    reasoning: str

guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about homework.",
    output_type=HomeworkOutput,
)

math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)


async def homework_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(HomeworkOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_homework,
    )

triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent],
    input_guardrails=[
        InputGuardrail(guardrail_function=homework_guardrail),
    ],
)

async def main():
    result = await Runner.run(triage_agent, "who was the first president of the united states?")
    print(result.final_output)

    result = await Runner.run(triage_agent, "what is life")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
View your traces
To review what happened during your agent run, navigate to the Trace viewer in the OpenAI Dashboard to view traces of your agent runs.

Next steps
Learn how to build more complex agentic flows:

Learn about how to configure Agents.
Learn about running agents.
Learn about tools, guardrails and models.
Examples
Check out a variety of sample implementations of the SDK in the examples section of the repo. The examples are organized into several categories that demonstrate different patterns and capabilities.

Categories
agent_patterns: Examples in this category illustrate common agent design patterns, such as

Deterministic workflows
Agents as tools
Parallel agent execution
basic: These examples showcase foundational capabilities of the SDK, such as

Dynamic system prompts
Streaming outputs
Lifecycle events
tool examples: Learn how to implement OAI hosted tools such as web search and file search, and integrate them into your agents.

model providers: Explore how to use non-OpenAI models with the SDK.

handoffs: See practical examples of agent handoffs.

customer_service and research_bot: Two more built-out examples that illustrate real-world applications

customer_service: Example customer service system for an airline.
research_bot: Simple deep research clone.