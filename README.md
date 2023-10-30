

<h1 align="center">Welcome to OSCE GPT 👋</h1>
<p align="center">
  <img src="https://img.shields.io/npm/v/readme-md-generator.svg?orange=blue" />
  <a href="https://www.npmjs.com/package/readme-md-generator">
    <img alt="downloads" src="https://img.shields.io/npm/dm/readme-md-generator.svg?color=blue" target="_blank" />
  </a>
  <a href="https://github.com/kefranabg/readme-md-generator/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg" target="_blank" />
  </a>
  <a href="https://codecov.io/gh/kefranabg/readme-md-generator">
    <img src="https://codecov.io/gh/kefranabg/readme-md-generator/branch/master/graph/badge.svg" />
  </a>
  <a href="https://github.com/frinyvonnick/gitmoji-changelog">
    <img src="https://img.shields.io/badge/changelog-gitmoji-brightgreen.svg" alt="gitmoji-changelog">
  </a>
</p>

# Live Demo 

https://www.creole.tech/oscegpt/

# practice-a-patient
This application is helpful to the residents who are practicing medicine. Just choose in from a wide variety of symptoms/disease and the GPT will act as a patient and you can help them relief. Go easy with speech-to-text and vice versa implementation.


# Server


```

$ npm  install 

$ npm run start:dev

```


##  🚀 Get Images from Google Drive according to cases selected
```
export const getImageFromDrive = async (cases: string) => {
  try {
    const folderQuery = `name = 'OSCE_IMAGES' and mimeType = 'application/vnd.google-apps.folder'`;
    const folderResponse = await drive.files.list({
      q: folderQuery,
    });
    const folderId = folderResponse.data.files[0]?.id;
    var ImageArray = [];
    if(folderId)
    {
        for (let i = 0; i <= 3; i++) {
        if(i==0)
        {
            i++;
        }    
        const imageName = cases+`_${i}`.toString();
        // const imageName = "Atypical_2"
        // console.log(imageName);
        
        const imageQuery = `'${folderId}' in parents and name contains '${imageName}'`;
        const get = await drive.files.list({
            q: imageQuery,
            fields: 'files(id, name)',
          });
        //   console.log(get.data.files);
          
          if(get.data.files[0] != null){
            await drive.permissions.create({
                fileId: get.data.files[0].id,
                requestBody: {
                  role: 'reader',
                  type: 'anyone',
                },
              });
                const imageLink = await drive.files.get({
                fileId: get.data.files[0].id,
                // alt: 'media',
                fields: 'webViewLink , webContentLink',
                });
                ImageArray.push(imageLink.data.webViewLink); 
          }
        }
        return ImageArray;
    }
    throw new InternalServerErrorException('No folder found / Error fetching files '); 
  } catch (error) {
    console.error('Error accessing Google Drive:', error);
  }
};

```

##  🚀 Convert Audio to Text Using OpenAI Whisper Model

speech to text connversion using openai's whisper model :- https://api.openai.com/v1/audio/translations

```
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
```

##  🚀 Generate Response from OpenAI using gpt-3.5-turbo 

```
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
```


# Client


```

$ npm  install 

$ npm  start

```






