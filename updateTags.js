const minimist = require('minimist');
const {VantaTags} = require("./vantaTags");
const {S3Service} = require("./services/S3Service");
const {SQSService} = require("./services/SQSService");

// Parse command line arguments
const cliArguments = minimist(process.argv.slice(2));

main();

function printHelp() {
  console.log(`Options:`);
  console.log(`  --service S3                   One of: S3, SQS, ECR or ECS or Lambda`);
  console.log(`  --region us-east-1             search for buckets in this AWS region (default: us-east-1)`);
  console.log(`  --include someText             only include buckets that contain "someText" in their name`);
  console.log(`  --description someText         change the description to this text`);
  console.log(`  --no-dry-run                   do NOT do a dry run (the default). Actually update everything. Otherwise it prints out what buckets will be updated with what tags.`);
}

async function main() {
  if (cliArguments.help) {
    printHelp();
    // For debugging command-line arguments...
    // console.log("cliArguments:", cliArguments);
    process.exit(1);
  }

  try {
    let service;

    if (!cliArguments.service) {
      console.error("Error: A service is required.\n");
      printHelp();
      process.exit(1);
    } else {
      const region = cliArguments.region || "us-east-1";
      switch (cliArguments.service.trim()) {
        case "S3":
          service = new S3Service(region);
          break;
        case "SQS":
          service = new SQSService(region);
          break;
        default:
          console.error(`Service ${cliArguments.service} not supported. PRs are encouraged :-).`);
          process.exit(1);
      }
    }

    const items = await service.listItems();
    const itemsWithoutTags = [];

    if (cliArguments.include) {
      console.log(`Only including items that have "${cliArguments.include}" in their name.`);
    }

    if (cliArguments.description) {
      console.log(`Overriding the description to be "${cliArguments.description}".`);
      VantaTags.forEach(tag => {
        if (tag.Key === "VantaDescription") {
          tag.Value = cliArguments.description;
        }
      });
    }

    for (const item of items) {
      if (!cliArguments.include || service.doesItemInclude(item, cliArguments.include)) {
        try {
          const tags = await service.listTagsOnItem(item);
          // Uncomment to see all the tags for each item
          // console.log(`For ${service.getItemName(item)} received:`, tags);

          let hasTag = false;
          if (Array.isArray(tags)) {
            hasTag = tags.some(tag => tag.Key === "VantaOwner");
          } else if (tags) {
            for (const tagKey in tags) {
              if (tagKey === "VantaOwner") {
                hasTag = true;
              }
            }
          }

          if (!hasTag) {
            itemsWithoutTags.push(item);
          }
        } catch (err) {
          if (err.name === 'PermanentRedirect') {
            const location = await service.getLocation(item);
            console.log(`Skipping ${item.Name} because it is in: ${location || "us-east-1"}`);
          } else if (err.name === 'NoSuchTagSet') {
            itemsWithoutTags.push(item.Name);
          } else {
            console.error(err);
          }
        }
      }
    }

    console.log(`Items to be updated: \n  - ${itemsWithoutTags.join('\n  - ')}`);

    for (const item of itemsWithoutTags) {
      console.log(`Loading tags for ${item}...`);
      let tags;
      try {
        tags = await service.listTagsOnItem(item);
      } catch (err) {
        // Ignore if there aren't any tags.
      }

      if (cliArguments["dry-run"] !== false) {
        tags = await service.combineTagsAndVantaTags(tags, VantaTags);
        console.log(`Dry Run: Tags for ${service.getItemName(item)} would have been updated to:`, tags);
      } else {
        console.log(`Updating tags for ${service.getItemName(item)}...`);

        await service.setTagsOnItem(tags, item);
        console.log(`Successfully updated tags for ${item}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}