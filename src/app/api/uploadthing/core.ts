// import { getToken } from 'next-auth/jwt'
// import { createUploadthing, type FileRouter } from 'uploadthing/next'

// const f = createUploadthing()

// export const ourFileRouter = {
//   imageUploader: f({ image: { maxFileSize: '4MB' } })
//     .middleware(async (req) => {
//       const user = await getToken({ req })

//       if (!user) throw new Error('Unauthorized')

//       return { userId: user.id }
//     })
//     .onUploadComplete(async ({ metadata, file }) => {}),
// } satisfies FileRouter

// export type OurFileRouter = typeof ourFileRouter

// import { NextApiRequest } from 'next';
import { getToken } from 'next-auth/jwt'
import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { UploadThingError } from "uploadthing/server";

class UploadThingError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UploadThingError';
  }
}

const f = createUploadthing();
 
// const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async (req) => {
      // This code runs on your server before upload
      const user = await getToken({req});
 
      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");
 
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }): Promise<void> => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
 
      console.log("file url", file.url);
 
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      // return { uploadedBy: metadata.userId };
      return;
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;