import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload completed. File URL:', file.url);
    }),
};

export default uploadRouter;
