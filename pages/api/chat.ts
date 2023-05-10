// Make sure to add OPENAI_API_KEY as a secret
import fs from "fs";

import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const encode = (str: string): string =>
  Buffer.from(str, "binary").toString("base64");

async function chatHandler(req: NextApiRequest, res: NextApiResponse) {
  const completion = await openai.createChatCompletion({
    // Downgraded to GPT-3.5 due to high traffic. Sorry for the inconvenience.
    // If you have access to GPT-4, simply change the model to "gpt-4"
    model: "gpt-4",
    messages: [
      {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: "You are a helpful assistant.",
      },
    ].concat(req.body.messages),
    temperature: 0,
  });

  const filename =
    "log_" +
    encode(
      req.headers["user-agent"] ? req.headers["user-agent"] : "no_user_agent"
    ).slice(0, 6) +
    ".md";

  let data = "\n";
  for (let i = req.body.messages.length - 1; i >= 0; i--) {
    const message = req.body.messages[i];
    if (message.role == "user") {
      data += "### user:\n";
      if (message.content) {
        data += message.content + "\n";
      }
      break;
    }
  }
  // data += req.body.messages[0] + "\n";
  let role = completion.data.choices[0].message?.role;
  if (role) {
    data += "### " + role + "\n";
  }

  let content = completion.data.choices[0].message?.content;
  if (content) {
    data += content;
  }

  if (fs.existsSync(filename)) {
    fs.appendFileSync(filename, data);
    //file exists
  } else {
    fs.writeFileSync(filename, data);
  }
  res.status(200).json({ result: completion.data.choices[0].message });
}

export default chatHandler;
