import { Injectable } from '@nestjs/common';
import { AppService } from '../app.service.js';
import { cases } from '../prompts/cases.js';
import { Configuration, OpenAIApi } from 'openai';
import * as fs from 'fs';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { encode } from 'gpt-3-encoder';
import { getImageFromDrive } from '../helpers/googledrive.js';
dotenv.config();

// let model: string = 'whisper-1';
let model: string = 'whisper-1';

const filePath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filePath);
@Injectable()
export class PatientService {
  /// creating the initial prompt
  async createPrompt(body: any): Promise<any> {
    let { option, tokens, memory } = body;
    const diseaseImage = await getImageFromDrive(option);
    /// initial prompt for the selected option
    let instructions = `Instructions: You are a patient talking to your doctor. Use the provided context to answer your doctor. Answer like a patient, i.e., everyday language, not medical jargon. Do not give too much away unless asked. You do not know any medical jargon.\n\nContext:${cases[option][0].case_info}\n\nInstruction: The medical professional whose name you do not know has just entered your room. You are the patient. Greet your doctor by introducing yourself. If your doctor doesn't ask you anything after introductions, briefly explain why you are here in one or two sentences.`;

    const images: [] = cases[option][0].images;
    let image_prompt = '';
    if (images.length > 0) {  
      /// initial prompt for images
      instructions +=
        "\nPlease write the image files in parentheses if you would like to use them in your questions. If you've already used an image, no need to include it in parentheses.";
      image_prompt = '\n\nImages:\n';

      /// getting the images from the json file if any
      for (let i = 0; i < images.length; i++) {
        image_prompt += cases[option][0]['images'][i];
        image_prompt += ': ';
        image_prompt += cases[option][0]['img_descriptions'][i];
        image_prompt += '\n';
      }
    }
    /// storing the initial prompt in memory
    memory[0].content = instructions + image_prompt;

    /// updating the token length
    tokens = encode(memory[0].content).length;

    if (cases[option][0].question_stem !=="") {
      return {
        text: `Clinical scenario initialized. You may begin speaking now. Click 'Start' to start recording and click 'Stop' when you're finished speaking.\n\nCase prompt: ${cases[option][0].question_stem}`,
        tokens,
        memory,
        diseaseImage
      };
    }

    return {
      text: "Clinical scenario initialized. You may begin speaking now. Click 'Start' to start recording and click 'Stop' when you're finished speaking.",
      tokens,
      memory,
      diseaseImage
    };
  }

  /// transcribing audio
  async transcribeAudio(file: any) {
    /// creating formadata for the the model to parse
    const formData = new FormData();
    formData.append('model', model);
    formData.append(
      'file',
      new Blob([file?.buffer], { type: 'audio/wav' }),
      'x.mp3',
    );

    /// converting the audio to text with the help of whisper-1 model
    try {
      let response = await axios.post(
        'https://api.openai.com/v1/audio/translations',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
          },
        },
      );

      return { text: `${response.data.text}` };
    } catch (err) {
      return { error: err?.response?.data?.error?.message };
    }
  }

  /// function to update the memory
  async updateMemory(
    role: string,
    text: string,
    memory: any[],
    tokens: number,
    maxTokens: number,
  ): Promise<{ tokens: number; maxTokens: number; memory: any[] }> {
    return new Promise<{ tokens: number; maxTokens: number; memory: any[] }>(
      (resolve) => {
        // pushing to the memory
        memory.push({ role: role, content: text });

        /// adding the tokens of user prompt
        tokens += encode(text).length;

        /// If memory has increased the token size then pop while it reaches below the maxTokens
        while (tokens > maxTokens) {
          /// pop the top entries in array
          let poppedItem = memory.shift();
          tokens -= encode(poppedItem?.content).length;
        }
        resolve({ tokens, maxTokens, memory });
      },
    );
  }

  /// function to update the history
  async updateHistory(text: string, history: any): Promise<void> {
    /// pushing to the memory
    history.push(text);

    /// count the tokens if it exceeds 8000
    let tokens = encode(history.join('\n')).length;

    /// If memory has increased the token size then pop while it reaches below the maxTokens
    while (tokens > 8000) {
      /// pop the top entries in array
      let poppedItem = history.shift();
      tokens -= encode(poppedItem?.content).length;
    }
  }

  /// generating the response from the audio text
  async generateResponse(body: any): Promise<any> {
    let { tokens, memory, text, maxTokens, history } = body;

    if (text && text.length != 0) {
      try {
        // update the memory with the audio file text
        const updateMemory1 = await this.updateMemory(
          'user',
          text,
          memory,
          tokens,
          maxTokens,
        );

        memory = updateMemory1.memory;
        maxTokens = updateMemory1.maxTokens;
        tokens = updateMemory1.tokens;

        /// configuring the openai API
        const configuration = new Configuration({
          apiKey: process.env.OPEN_AI_KEY,
        });
        const openai = new OpenAIApi(configuration);

        /// calling the API
        const response = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: body.memory,
          temperature: 0.75,
          top_p: 1,
        });

        /// extract the data
        const data = response.data.choices[0].message.content;

        /// store the data in memory
        const updateMemory2 = await this.updateMemory(
          'assistant',
          data,
          memory,
          tokens,
          maxTokens,
        );

        memory = updateMemory2.memory;
        maxTokens = updateMemory2.maxTokens;
        tokens = updateMemory2.tokens;

        /// maintain the history
        await this.updateHistory(`Me: ${text}`, history);
        await this.updateHistory(`Patient: ${data}`, history);

        return { memory, tokens, maxTokens, history, text: data }; // Return the updated body object
      } catch (err) {
        console.log('Error while generating response... ', err);
        throw err?.response?.data;
      }
    } else {
      return { error: 'Sorry I cannot understand you... Please speak again' };
    }
  }
}
