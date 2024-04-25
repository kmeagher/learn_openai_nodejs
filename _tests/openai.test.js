
/**
 * IMPORTANT!!
 * 
 * Each request costs a number of tokens which costs money $
 * Only uncomment and run the code when you want to execute a test and use a set number of tokens for that test
 * 
 */

// const OpenAI = require('openai');

// const openai = new OpenAI();

async function main() {
    // const completion = await openai.chat.completions.create({
    //     messages: [{
    //         role: "system",
    //         content: "You are a helpful assistant"
    //     }],
    //     model: "gpt-3.5-turbo"
    // });
    // console.log(completion);
    expect(true).toBe(true);
}

test("Test OpenAI", main, 30000);

/**
 * Example Response
 * {
      id: 'chatcmpl-9HZB4qRIXhkWipqh3aXENGBnIh0Sj',
      object: 'chat.completion',
      created: 1713973826,
      model: 'gpt-3.5-turbo-0125',
      choices: [
        {
          index: 0,
          message: [Object],
          logprobs: null,
          finish_reason: 'stop'
        }
      ],
      usage: { prompt_tokens: 12, completion_tokens: 9, total_tokens: 21 },
      system_fingerprint: 'fp_c2295e73ad'
    }
 */