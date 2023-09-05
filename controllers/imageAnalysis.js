const vision = require('@google-cloud/vision');
require("dotenv").config();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const {Storage} = require('@google-cloud/storage');

const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_KEYFILE_PATH
})

const storage = new Storage({
    keyFilename: process.env.GOOGLE_KEYFILE_PATH
});

// saving to GCS

async function createBucketAndUploadBuffer(buffer, mimeType, bucketName, fileName) {
    // Check if the bucket exists and create it if it doesn't
    const [buckets] = await storage.getBuckets();
    if (!buckets.map(bucket => bucket.name).includes(bucketName)) {
        await storage.createBucket(bucketName);
        console.log(`Bucket ${bucketName} created.`);
    }

    // Create a new blob in the bucket and upload the file data
    const blob = storage.bucket(bucketName).file(fileName);
    return blob.save(buffer, { 
        public: true,
        contentType: mimeType, 
        cacheControl: 'public, max-age=31536000',
    })
    .then(() => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        console.log(`File uploaded to ${publicUrl}`);
        return publicUrl; 
    })
    .catch(err => {
        console.error('Something is wrong! Unable to upload at the moment.');
    });
    

}
// analyzing the img
  async function analyzeImage(imageBuffer, mimeType) {
    const bucketName = 'educaiter-image';
    const fileName = `my-img-${uuidv4()}`

    const imageUrl = await createBucketAndUploadBuffer(imageBuffer, mimeType, bucketName, fileName);

    const request = {
        image: {
            source: {
                imageUri: imageUrl
            }
        },
        features: [{
            type: 'LABEL_DETECTION',
            maxResults: 5
        },{
            type: 'DOCUMENT_TEXT_DETECTION'
        }]
    };

    try {
        const [result] = await client.annotateImage(request);
        const labels = result.labelAnnotations;
        const textAnnotations = result.textAnnotations;


         // Delete the image from the bucket after it has been analyzed
        await storage.bucket(bucketName).file(fileName).delete();
        console.log('File deleted successfully.');

        return{
            labels: labels.map(label => label.description),
            text: textAnnotations[0].description
        } 
    } catch(error) {
        console.error(`Error calling Google Vision API: ${error}`);
    }
}




module.exports = { analyzeImage };

