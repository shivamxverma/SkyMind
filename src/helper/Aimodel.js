const { openai, deploymentName } = require("./config");
const readlineSync = require('readline-sync');

// Tool that LLM can Use

function getWeatherDetail(input) {
  if (!input) return "Please provide a location";
  const loc = input.toLowerCase();
  if (loc.includes("bihar")) return "14°C";
  if (loc.includes("muraina")) return "34°C";
  if (loc.includes("punjab")) return "9°C";
  if (loc.includes("delhi")) return "13°C";
  return "Weather details not found for this location";
}

const tool = {
  "getWeatherDetail": getWeatherDetail
};

// Prompt

const SYSTEM_PROMPT = `
You are an AI Assistant that operates in a ReAct (Reasoning and Action) loop using the states: START, PLAN, ACTION, OBSERVATION, and OUTPUT.
Wait for the user's prompt and plan based on available tools. After planning, take the action with the appropriate tool and wait for observation. Once you get the observation, return the response.

You MUST strictly respond with a valid JSON object matching one of the following structures:

1. For Planning:
{
  "type": "plan",
  "plan": "Explain your step-by-step reasoning or plan here."
}

2. For Action (calling a tool):
{
  "type": "action",
  "function": "getWeatherDetail",
  "input": "LocationName"
}

3. For Output (final answer to the user):
{
  "type": "output",
  "output": "Your final detailed answer to the user here."
}

Available Tools:
- function getWeatherDetail(input: string): string
  Takes a location name and returns the weather details in °C.

Do not combine multiple states in one response. Return only ONE JSON object per turn.
`;

const messages = [
  {
    role: "system",
    content: SYSTEM_PROMPT
  }
];

async function runCLI() {
  console.log("🤖 Weather AI Agent Initialized. Type 'exit' to quit.");
  
  while (true) {
    const Input = readlineSync.question('\n>> ');
    if (Input.toLowerCase() === 'exit') {
      console.log("Goodbye!");
      break;
    }

    if (!Input.trim()) continue;

    const q = {
      type: 'user',
      user: Input
    };

    messages.push({
      role: "user",
      content: JSON.stringify(q)
    });

    while (true) {
      console.log("🤖 Thinking...");
      const chat = await openai.chat.completions.create({
        model: deploymentName,
        messages: messages,
        response_format: { type: "json_object" }
      });

      const result = chat.choices[0].message.content;
      messages.push({ role: 'assistant', content: result });

      let call;
      try {
        call = JSON.parse(result);
      } catch (e) {
        console.log("🤖 Error parsing response: ", result);
        break;
      }

      if (call.type === "output") {
        console.log("🤖 Response:", call.output);
        break;
      } else if (call.type === "plan") {
        console.log(`📋 Plan: ${call.plan}`);
        // Tell the model to proceed after planning
        messages.push({
          role: "user",
          content: "Proceed to take action."
        });
      } else if (call.type === "action") {
        console.log(`⚙️ Calling tool: ${call.function}("${call.input}")`);
        const fn = tool[call.function];
        const observation = fn ? fn(call.input) : "Tool not found";
        console.log(`🔍 Observation: ${observation}`);
        
        const obs = { "type": "observation", observation: observation };
        messages.push({ role: "user", content: JSON.stringify(obs) });
      } else {
        console.log(`🤖 Unknown type: ${result}`);
        break;
      }
    }
  }
}

if (require.main === module) {
  runCLI().catch(err => {
    console.error("Error running CLI agent:", err);
  });
}

module.exports = {
  runCLI
};