"use strict";

const {
  ECRClient,
  DescribeRepositoriesCommand,
  ListTagsForResourceCommand,
  TagResourceCommand
} = require("@aws-sdk/client-ecr");


const {BaseService} = require("./BaseService");

/**
 * This class is the base class that takes care of tagging Lambdas.
 */
class ECRService extends BaseService {
  constructor(region) {
    super(region);
    this.ecrClient = new ECRClient({region});
  }

  async listItems() {
    const {repositories} = await this.ecrClient.send(new DescribeRepositoriesCommand({}));
    return repositories;
  }

  doesItemInclude(item, someString) {
    return item.includes(someString);
  }

  async listTagsOnItem(item) {
    const {tags} = await this.ecrClient.send(new ListTagsForResourceCommand({resourceArn: item.repositoryArn}));
    return tags;
  }

  getItemName(item) {
    return item.repositoryName;
  }

  shouldIncludeExistingTags() {
    return false;
  }

  /**
   * Just add the vanta tags to the set of tags returned by `listTagsOnItem`. Unfortunately not all AWS services return
   * tags in the same format :-(.
   * @param tags The tags from from listTagsOnItem()
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
    await this.ecrClient.send(new TagResourceCommand({
      resourceArn: item.repositoryArn,
      tags: tags,
    }));
  }

  // noinspection JSUnusedLocalSymbols
  async getLocation(item) {
    // This service only lists things in this region.
    return this.region;
  }
}

module.exports.ECRService = ECRService;
