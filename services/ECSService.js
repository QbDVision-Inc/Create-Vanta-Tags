"use strict";

const {ECSClient, ListClustersCommand, ListTagsForResourceCommand, TagResourceCommand} = require("@aws-sdk/client-ecs");


const {BaseService} = require("./BaseService");

/**
 * This class is the base class that takes care of tagging Lambdas.
 */
class ECSService extends BaseService {
  constructor(region) {
    super(region);
    this.ecsClient = new ECSClient({region});
  }

  async listItems() {
    const {clusterArns} = await this.ecsClient.send(new ListClustersCommand({}));
    return clusterArns;
  }

  doesItemInclude(item, someString) {
    return item.includes(someString);
  }

  async listTagsOnItem(item) {
    const {tags} = await this.ecsClient.send(new ListTagsForResourceCommand({resourceArn: item}));
    return tags;
  }

  getItemName(item) {
    return item;
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
    let finalTags = [...(tags || []), ...vantaTags];
    finalTags = finalTags.map(tag => {
      return {
        key: tag.Key,
        value: tag.Value
      };
    });
    return finalTags;
  }

  /**
   * Called only when --no-dry-run is passed in.
   * @param tags The tags returned from listTagsOnItem
   * @param item An item returned from listItems
   */
  async setTagsOnItem(tags, item) {
    await this.ecsClient.send(new TagResourceCommand({
      resourceArn: item,
      tags: tags,
    }));
  }

  // noinspection JSUnusedLocalSymbols
  async getLocation(item) {
    // This service only lists things in this region.
    return this.region;
  }
}

module.exports.ECSService = ECSService;
