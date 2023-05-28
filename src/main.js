const parser = new DOMParser()

const patterns = {
	fragment: /[0-9a-f]{12}-cut/,
	fullImage: /[0-9a-f]{12}.tiff/,
	preview: /[0-9a-f]{12}-preview.jpg/,
	slideId: /[0-9a-f]{12}/,
}

const traverseXMLDocument = (rootNode, maxDepth, nodeHandler, path = "") => {
	if (!rootNode.tagName) {
		return void null
	} else {
		const nodePath = `${path}.${rootNode.tagName}`

		nodeHandler(nodePath, rootNode)

		if (maxDepth > 0) {
			rootNode.childNodes.forEach((child) => {
				traverseXMLDocument(child, maxDepth - 1, nodeHandler, nodePath)
			})
		}
	}
}

const loadSlideCollection = async () => {
	try {
		const response = await fetch("https://storage.yandexcloud.net/krang-dataset?list-type=2")

		let entries = {}

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
					const slideId = xmlNode.textContent.match(patterns.slideId)?.at(0)

					if (slideId) {
						const URL = `https://krang-dataset.website.yandexcloud.net/${xmlNode.textContent}`

						const fragmentId = URL.split("cut__")[1]?.split(".")[0]

						entries = {
							/*
							 * Extend the existing collection data
							 */
							...entries,

							/*
							 * Index fragments by id
							 */
							[slideId]: {
								/*
								 * Make every fragment "know" its position in the collection
								 */
								id: slideId,

								/*
								 * Extend the existing fragment data if it exists
								 */
								...(entries[slideId] ?? {}),

								/*
								 * Append slide fragment URL if it's detected
								 */
								...(patterns.fragment.test(xmlNode.textContent) ? {
									fragments: {
										...(entries[slideId]?.fragments ?? {}),
										[fragmentId]: { id: fragmentId, URL }
									}
								} : {}),

								/*
								 * Append slide full image URL if it's detected
								 */
								...(patterns.fullImage.test(xmlNode.textContent) ? { fullImageURL: URL } : {}),

								/*
								 * Append slide preview URL if it's detected
								 */
								...(patterns.preview.test(xmlNode.textContent) ? { previewURL: URL } : {}),
							},
						}
					}
				}
			}
		)

		return entries ?? {}
	} catch (error) {
		console.error("Error while loading data", error)
		return {}
	}
}
