const {
  S3Client, ListBucketsCommand, GetBucketTaggingCommand, PutBucketTaggingCommand, GetBucketLocationCommand
} = require("@aws-sdk/client-s3");
const minimist = require('minimist');
const {VantaTags} = require("./vantaTags");

// Parse command line arguments
const cliArguments = minimist(process.argv.slice(2));

main();

function printHelp() {
  console.log(`Options:`);
  console.log(`  --region us-east-1             search for buckets in this AWS region (default: us-east-1)`);
  console.log(`  --include someText             only include buckets that contain "someText" in their name`);
  console.log(`  --no-dry-run                   do NOT do a dry run (the default), but actually update anything. Otherwise it prints out what buckets will be updated with what tags.`);
}

async function main() {
  if (cliArguments.help) {
    printHelp();
    // For debugging command-line arguments...
    // console.log("cliArguments:", cliArguments);
    return;
  }

  const s3Client = new S3Client({region: cliArguments.region || "us-east-1"});
  try {
    const {Buckets} = await s3Client.send(new ListBucketsCommand({}));
    const bucketsWithoutTag = [];

    if (cliArguments.include) {
      console.log(`Only including buckets that have "${cliArguments.include}" in their name.`);
    }

    if (cliArguments.description) {
      console.log(`Overriding the description to be "${cliArguments.description}".`);
      VantaTags.forEach(tag => {
        if (tag.Key === "VantaDescription") {
          tag.Value = cliArguments.description;
        }
      });
    }

    for (const bucket of Buckets) {
      if (!cliArguments.include || bucket.Name.includes(cliArguments.include)) {
        try {
          const {TagSet} = await s3Client.send(new GetBucketTaggingCommand({Bucket: bucket.Name}));
          const hasTag = TagSet.some(tag => tag.Key === "VantaOwner");

          if (!hasTag) {
            bucketsWithoutTag.push(bucket.Name);
          }
        } catch (err) {
          if (err.name === 'PermanentRedirect') {
            const response = await s3Client.send(new GetBucketLocationCommand({Bucket: bucket.Name}));
            console.log(`Skipping ${bucket.Name} because it is in: ${response.LocationConstraint || "us-east-1"}`);
          } else if (err.name === 'NoSuchTagSet') {
            bucketsWithoutTag.push(bucket.Name);
          } else {
            console.error(err);
          }
        }
      }
    }

    console.log(`Buckets to be updated: \n  - ${bucketsWithoutTag.join('\n  - ')}`);

    for (const bucketName of bucketsWithoutTag) {
      console.log(`Loading tags for ${bucketName}...`);
      let tagSet = [];
      try {
        const {TagSet} = await s3Client.send(new GetBucketTaggingCommand({Bucket: bucketName}));
        tagSet = TagSet;
      } catch (err) {
        // Ignore if there aren't any tags.
      }

      if (cliArguments["dry-run"] !== false) {
        console.log(`Dry Run: Tags for ${bucketName} would have been updated to: ${JSON.stringify(VantaTags)}.`);
      } else {
        console.log(`Updating tags for ${bucketName}...`);

        await s3Client.send(new PutBucketTaggingCommand({
          Bucket: bucketName,
          Tagging: {TagSet: [...tagSet, ...VantaTags]},
        }));
        console.log(`Successfully updated tags for S3 bucket ${bucketName}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
