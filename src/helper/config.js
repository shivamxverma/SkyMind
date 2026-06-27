const { OpenAI } = require("openai");
const dotenv = require("dotenv");
const path = require("path");

// Load .env file from the project root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const endpoint = process.env.ENDPOINT;
const deploymentName = process.env.MODEL;
const apiKey = process.env.API_KEY;

const openai = new OpenAI({
    baseURL: endpoint,
    apiKey: apiKey
});

async function main() {
  const runner = openai.responses
    .stream({
      model: deploymentName,
      input: 'solve 8x + 31 = 2',
    })
    .on('event', (event) => console.log(event))
    .on('response.output_text.delta', (diff) => process.stdout.write(diff.delta));

  for await (const event of runner) {
    console.log('event', event);
  }

  const result = await runner.finalResponse();
  console.log(result);
}

if (require.main === module) {
  main();
}

module.exports = {
  openai,
  deploymentName
};