const parser = new DOMParser();

const patterns = {
  fragment: /[0-9a-f]{12}-cut/,
  fragmentId: /[0-9a-f]{12}/,
  preview: /[0-9a-f]{12}-preview.jpg/,
};

function traverseXMLDocument(rootNode, maxDepth, nodeHandler, path = "") {
  if (!rootNode.tagName) {
    return void null;
  } else {
    const nodePath = path + "." + rootNode.tagName;

    nodeHandler(nodePath, rootNode);

    if (maxDepth > 0) {
      rootNode.childNodes.forEach((child) => {
        traverseXMLDocument(child, maxDepth - 1, nodeHandler, nodePath);
      });
    }
  }
}

async function loadFragmentsCollection() {
  try {
    const response = await fetch(
      "https://storage.yandexcloud.net/krang-dataset?list-type=2"
    );

    let entries = {};

    traverseXMLDocument(
      parser.parseFromString(await response.text(), "text/xml").documentElement,
      5,

      /**
       * Parses XML node data and appends it to the collection
       */
      (path, xmlNode) => {
        if (path === ".ListBucketResult.Contents.Key") {
          /*
           * Get fragment's id if it's possible
           */
          const fragmentId = xmlNode.textContent
            .match(patterns.fragmentId)
            ?.at(0);

          if (fragmentId) {
            const URL = `https://krang-dataset.website.yandexcloud.net/${xmlNode.textContent}`;

            entries = {
              /*
               * Extend the existing collection data
               */
              ...entries,

              /*
               * Index fragments by id
               */
              [fragmentId]: {
                /*
                 * Make every fragment "know" its position in the collection
                 */
                id: fragmentId,

                /*
                 * Extend the existing fragment data if it exists
                 */
                ...(entries[fragmentId] ?? {}),

                /*
                 * Append fragments file URL if it's detected
                 */
                ...(patterns.fragment.test(xmlNode.textContent)
                  ? { fragmentURL: URL }
                  : {}),

                /*
                 * Append fragments preview file URL if it's detected
                 */
                ...(patterns.preview.test(xmlNode.textContent)
                  ? { previewURL: URL }
                  : {}),
              },
            };
          }
        }
      }
    );

    return entries ?? {};
  } catch (error) {
    console.error("Error while loading data", error);
    return {};
  }
}
