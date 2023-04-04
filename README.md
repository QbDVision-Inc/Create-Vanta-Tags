# Purpose
The purpose of this repo is to provide a few simple utilities to quickly update [Vanta tags](https://app.vanta.com/inventory?bulk-tags=open#compute) for AWS resources in your production accounts. 

This program currently **only updates the tags where they don't exist**. It will not update existing tags (but PRs are welcome).
# Installation
Ensure that you have Node 14+ installed. Download this repo and then run `npm install`:
```shell
git clone https://github.com/QbDVision-Inc/Create-Vanta-Tags.git
npm install
```

Next, copy `vantaTags-template.js` and update it with whatever default values you want.
```shell
copy vantaTags-template.js vantaTags.js
vim vantaTags.js
```

# Update your S3 Resources

See the options available:
```shell
node updateTags.js --help
```
See the buckets that aren't tagged in `eu-central-1`. This will also warn you about buckets in other regions that aren't covered.
```shell
node updateTags.js --service S3 --region eu-central-1
```

See the buckets in `eu-central-1` that include the text `"codepipeline"` (but don't have Vanta tags). This will also warn you about buckets in other regions that match this text but wouldn't be updated.
```shell
node updateTags.js --service S3 --region eu-central-1 --include "codepipeline"
```

Add a description for these buckets (but stil execute as a dry run).
```shell
node updateTags.js --service S3 --region eu-central-1 \
  --description "Used for storing artifacts to update our build system." \
  --include codepipeline
```
Update the S3 buckets that match codepipeline with the new tags.
```shell
node updateTags.js --service S3 --region eu-central-1 \
  --description "Used for storing artifacts to update our build system." \
  --include codepipeline
  --no-dry-run
```

# Update your SQS Resources

See the queues in `eu-central-1` that include the text `"codepipeline"` (but don't have Vanta tags).
```shell
node updateTags.js --service S3 --region eu-central-1 --include "codepipeline"
```

Update the tags on SQS queues that match `codepipeline` with the new tags.
```shell
node updateTags.js --service S3 --region eu-central-1 \
  --description "Used for storing artifacts to update our build system." \
  --include codepipeline
  --no-dry-run
```
**NOTE:** You currently have to run this utility for each region separately. Again, PRs are welcome.
