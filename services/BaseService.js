"use strict";

/**
 * This class is the base class the describes what the services need to implement.
 */
class BaseService {
  constructor(region) {
    this.region = region;
  }

  async listItems() {
    throw new Error("Implement this method on your service.");
  }

  /**
   * Get a string representation of an item.
   * @param item Returned by listItem.
   * @returns {string}
   */
  getItemName(item) {
    throw new Error("Implement this method on your service.");
  }

  doesItemInclude(item, someString) {
    throw new Error("Implement this method on your service.");
  }

  async listTagsOnItem(item) {
    throw new Error("Implement this method on your service.");
  }

  /**
   * Just add the vanta tags to the set of tags returned by `listTagsOnItem`. Unfortunately not all AWS services return
   * tags in the same format :-(.
   * @param vantaTags The tags from vantaTags.js (in the format of vantaTags-template.js).
   */
  combineTagsAndVantaTags(vantaTags) {
    throw new Error("Implement this method on your service.");
  }

  /**
   * Called only when --no-dry-run is passed in.
   * @param tags The tags returned from listTagsOnItem
   * @param item An item returned from listItems
   */
  async setTagsOnItem(tags, item) {
    throw new Error("Implement this method on your service.");
  }

  /**
   * Get the location of an item, if this service lists items outside the expected region.
   */
  async getLocation(item) {
    throw new Error("Implement this method on your service.");
  }
}

module.exports.BaseService = BaseService;
