"use strict";

const {
  S3Client,
  GetBucketTaggingCommand,
  PutBucketTaggingCommand,
  ListBucketsCommand,
  GetBucketLocationCommand
} = require("@aws-sdk/client-s3");
const {BaseService} = require("./BaseService");

/**
 * This class is the base class that takes care of tagging S3 buckets.
 */
class S3Service extends BaseService {
  constructor(region) {
    super(region);
    this.s3Client = new S3Client({region});
  }

  async listItems() {
    const {Buckets} = await this.s3Client.send(new ListBucketsCommand({}));
    return Buckets;
  }

  doesItemInclude(item, someString) {
    return item.Name.includes(someString);
  }

  async listTagsOnItem(item) {
    const {TagSet} = await this.s3Client.send(new GetBucketTaggingCommand({Bucket: item.Name}));
    return TagSet;
  }

  getItemName(item) {
    return item.Name;
  }

  shouldIncludeExistingTags() {
    return true;
  }

  /**
   * Just add the vanta tags to the set of tags returned by `listTagsOnItem`. Unfortunately not all AWS services return
   * tags in the same format :-(.
   * @param tags The tags from from listTagsOnItem(), possibly null or undefined
   * @param vantaTags The tags from vantaTags.js (in the format of vantaTags-template.js).
   */
  combineTagsAndVantaTags(tags, vantaTags) {
    return [...(tags || []), ...vantaTags];
  }

  /**
   * Called only when --no-dry-run is passed in.
   * @param tags The tags returned from listTagsOnItem
   * @param item An item returned from listItems
   */
  async setTagsOnItem(tags, item) {
    await this.s3Client.send(new PutBucketTaggingCommand({
      Bucket: item.Name,
      Tagging: {TagSet: tags},
    }));
  }

  async getLocation(item) {
    const response = await this.s3Client.send(new GetBucketLocationCommand({Bucket: item.Name}));
    return response.LocationConstraint;
  }
}

module.exports.S3Service = S3Service;
