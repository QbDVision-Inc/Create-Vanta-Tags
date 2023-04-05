"use strict";

const {
  LambdaClient,
  ListFunctionsCommand,
  ListTagsCommand,
  TagResourceCommand,
} = require("@aws-sdk/client-lambda");

const {BaseService} = require("./BaseService");

/**
 * This class is the base class that takes care of tagging Lambdas.
 */
class LambdaService extends BaseService {
  constructor(region) {
    super(region);
    this.lambdaClient = new LambdaClient({region});
  }

  async listItems() {
    let nextMarker = null;
    let allFunctions = [];
    do {
      let input = nextMarker ? {Marker: nextMarker} : {};
      const {Functions, NextMarker} = await this.lambdaClient.send(
        new ListFunctionsCommand(input));
      allFunctions = allFunctions.concat(Functions);
      if (NextMarker) {
        nextMarker = NextMarker;
      } else {
        nextMarker = null;
      }
    } while (nextMarker)
    return allFunctions;
  }

  doesItemInclude(item, someString) {
    return item.FunctionName.includes(someString);
  }

  async listTagsOnItem(item) {
    const {Tags} = await this.lambdaClient.send(new ListTagsCommand({Resource: item.FunctionArn}));
    return Tags;
  }

  getItemName(item) {
    return item.FunctionName;
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
    const returnTags = {...(tags || {})};
    for (const vantaTag of vantaTags) {
      returnTags[vantaTag.Key] = vantaTag.Value;
    }
    return returnTags;
  }

  /**
   * Called only when --no-dry-run is passed in.
   * @param tags The tags returned from listTagsOnItem
   * @param item An item returned from listItems
   */
  async setTagsOnItem(tags, item) {
    await this.lambdaClient.send(new TagResourceCommand({
      Resource: item.FunctionArn,
      Tags: tags,
    }));
  }

  // noinspection JSUnusedLocalSymbols
  async getLocation(item) {
    // This service only lists things in this region.
    return this.region;
  }
}

module.exports.LambdaService = LambdaService;
