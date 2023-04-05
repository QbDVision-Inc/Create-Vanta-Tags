"use strict";

const {SQSClient, TagQueueCommand, ListQueueTagsCommand, ListQueuesCommand} = require("@aws-sdk/client-sqs");
const {BaseService} = require("./BaseService");

/**
 * This class is the base class that takes care of tagging SQS Queues.
 */
class SQSService extends BaseService {
  constructor(region) {
    super(region);
    this.sqsClient = new SQSClient({region});
  }

  async listItems() {
    let nextMarker = null;
    let allQueues = [];
    do {
      let input = nextMarker ? {NextToken: nextMarker} : {};
      const {QueueUrls, NextToken} = await this.sqsClient.send(new ListQueuesCommand(input));
      allQueues = allQueues.concat(QueueUrls);
      console.log("Received next token:", NextToken, "URLs:", QueueUrls);
      if (NextToken) {
        nextMarker = NextToken;
      } else {
        nextMarker = null;
      }
    } while (nextMarker)
    return allQueues;
  }

  doesItemInclude(item, someString) {
    return item.includes(someString);
  }

  async listTagsOnItem(item) {
    const {Tags} = await this.sqsClient.send(new ListQueueTagsCommand({QueueUrl: item}));
    return Tags;
  }

  getItemName(item) {
    return item;
  }

  shouldIncludeExistingTags() {
    return true;
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
    await this.sqsClient.send(new TagQueueCommand({
      QueueUrl: item,
      Tags: tags,
    }));
  }

  // noinspection JSUnusedLocalSymbols
  async getLocation(item) {
    // This service only lists things in this region.
    return this.region;
  }
}

module.exports.SQSService = SQSService;
