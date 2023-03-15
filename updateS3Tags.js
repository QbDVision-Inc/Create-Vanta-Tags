const {
  S3Client, ListBucketsCommand, GetBucketTaggingCommand, PutBucketTaggingCommand
} = require("@aws-sdk/client-s3");
const {VantaTags} = require("./vantaTags");

const s3Client = new S3Client({region: "us-east-1"});

main();
async function main() {
  try {
    const {Buckets} = await s3Client.send(new ListBucketsCommand({}));
    const bucketsWithoutTag = [];

    for (const bucket of Buckets) {
      if (bucket.Name.includes("deploymentbucket")) {
        try {
          const {TagSet} = await s3Client.send(new GetBucketTaggingCommand({Bucket: bucket.Name}));
          const hasTag = TagSet.some(tag => tag.Key === "VantaOwner");

          if (!hasTag) {
            bucketsWithoutTag.push(bucket.Name);
          }
        } catch (err) {
          if (err.name === 'PermanentRedirect') {
            console.log(`Skipping ${bucket.Name} because it needs to be loaded from ${err.Endpoint}`);
          } else if (err.name === 'NoSuchTagSet') {
            bucketsWithoutTag.push(bucket.Name);
          } else {
            console.error(err);
          }
        }
      }
    }

    console.log(`Buckets to be updated: ${bucketsWithoutTag.join('\n')}`);

    for (const bucketName of bucketsWithoutTag) {
      console.log(`Loading tags for ${bucketName}...`);
      let tagSet = [];
      try {
        const {TagSet} = await s3Client.send(new GetBucketTaggingCommand({Bucket: bucketName}));
        tagSet = TagSet;
      } catch (err) {
        // Ignore if there aren't any tags.
      }
      console.log(`Updating tags for ${bucketName}...`);

      // To update descriptions
      // const indexToUpdate = tagSet.findIndex(tag => tag.Key === "VantaDescription");
      // tagSet[indexToUpdate].Value = 'The bucket used to host the deployment CloudFormation scripts.';

      await s3Client.send(new PutBucketTaggingCommand({
        Bucket: bucketName,
        Tagging: {TagSet: [...tagSet, ...VantaTags]}
      }));
      console.log(`Successfully updated tags for S3 bucket ${bucketName}`);
    }
  } catch (err) {
    console.error(err);
  }
}
