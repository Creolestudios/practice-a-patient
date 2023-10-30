

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


## Get Images from Google Drive according to cases selected
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





# Client


```

$ npm  install 

$ npm  start

```







