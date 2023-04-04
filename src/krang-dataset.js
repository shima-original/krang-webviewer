function traverseXmlDoc(rootTag, maxDeepness, tagCallback, path = "") {
  if (!rootTag.tagName) return;
  var myPath = path + "." + rootTag.tagName;
  tagCallback(myPath, rootTag);

  if (maxDeepness > 0) {
    rootTag.childNodes.forEach((child) => {
      traverseXmlDoc(child, maxDeepness - 1, tagCallback, myPath);
    });
  }
}

async function loadCollection() {
  try {
    const parser = new DOMParser();

    const URLprefix = "https://krang-dataset.website.yandexcloud.net/";

    const response = await fetch(
      "https://storage.yandexcloud.net/krang-dataset?list-type=2"
    );

    const doc = parser.parseFromString(await response.text(), "text/xml");

    let entries = {};

    const patterns = {
      fragment: /[0-9a-f]{12}-cut/,
      preview: /[0-9a-f]{12}-preview.jpg/,
    };

    traverseXmlDoc(doc.documentElement, 5, (path, tag) => {
      if (path === ".ListBucketResult.Contents.Key") {
        const isFragment = patterns.fragment.test(tag.textContent),
          isPreview = patterns.preview.test(tag.textContent);

        const id = tag.textContent.split("/");

        console.log(id);

        entries = {
          ...entries,

          [id]: {
            ...(entries[id] ?? {}),

            id,
            fragmentURL: isFragment ? URLprefix + tag.textContent : null,
            previewURL: isPreview ? URLprefix + tag.textContent : null,
          },
        };
      }
    });

    console.log(entries);

    return entries;
  } catch (error) {
    console.error("Error while loading data", error);
    return null;
  }
}
