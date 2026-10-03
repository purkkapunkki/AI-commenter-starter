import {Request, Response, NextFunction} from 'express';
import fetchData from '../../lib/fetchData';
import type {Response as OpenAIResponse} from 'openai/resources/responses/responses.js';

const commentPost = async (
  req: Request<object, object, {text: string}>,
  res: Response<{response: string}>,
  next: NextFunction,
) => {
  const apiUrl = process.env.OPENAI_API_URL;
  if (!apiUrl) {
    throw new Error('API URL does not compute');
  }
  try {
    const youtubeComment = req.body.text;
    const input = `I have a YouTube channel about apples. Can you create a humorous response to this comment? Comment: "${youtubeComment}"`;
    const data = {
      model: 'gpt-6-astra',
      input: input,
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    const url = apiUrl + 'v1/responses';
    const aiResponse = await fetchData<OpenAIResponse>(url, options);
    const errors: string[] = [];
    const messages: string[] = [];
    const output = aiResponse.output;
    output.forEach((outputItem) => {
      switch (outputItem.type) {
        case 'message':
          break;
        case 'reasoning':
          // Ignore reasoning items
          return;
        default:
          throw new Error(`Unexpected output type: ${outputItem.type}`);
      }
      const outputContents = outputItem.content;
      outputContents.forEach((outputContent) => {
        if (outputContent.type === 'refusal') {
          errors.push(outputContent.refusal);
        } else {
          messages.push(outputContent.text);
        }
      });
    });
    if (errors.length > 0) {
      res.status(400).json({response: errors.join('\n')});
    } else {
      res.status(200).json({
        response: JSON.stringify(messages.join('\n\n')),
      });
    }
  } catch (error) {
    next(error);
  }
};

export {commentPost};
