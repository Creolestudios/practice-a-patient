import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { InternalServerErrorException } from '@nestjs/common';
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.DRIVE_CLIENT_ID,
  process.env.DRIVE_CLIENT_SECRET,
  process.env.DRIVE_REDIRECT_URI,
);
oauth2Client.setCredentials({ refresh_token: process.env.DRIVE_REFRESH_TOKEN });
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

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
