function traverseXmlDoc(rootTag, maxDeepness, tagCallback, path=""){
	if(!rootTag.tagName) return;
	var myPath = path + "." + rootTag.tagName;
	tagCallback(myPath, rootTag);

	if(maxDeepness > 0) {
		rootTag.childNodes.forEach((child) => {traverseXmlDoc(child, maxDeepness-1, tagCallback, myPath)})
	}
}

async function krang_listPreviews(){
	try {
		let response = await fetch("https://storage.yandexcloud.net/krang-dataset?list-type=2&prefix=thumbnails/")
		let text = await response.text()
		console.log("response", response)
		let parser = new DOMParser()
		let doc = await parser.parseFromString(text, "text/xml")

		const filenames = []
		const previewPattern = /[0-9a-f]{12}-preview.jpg/

		traverseXmlDoc(doc.documentElement, 5, (path, tag)=>{
			if(path == ".ListBucketResult.Contents.Key"){
				console.log("filename", tag.textContent)
				if(previewPattern.test(tag.textContent)){
					filenames.push(tag.textContent);
				}
			}
		});
		console.log("filenames", filenames);

		const prefix = "https://krang-dataset.website.yandexcloud.net/"
		const list = filenames.map(filename => {
			return {
				url: prefix + filename,
				id: filename.slice(11,23)
				}
		})
		console.debug(list);

		return list

	} catch(e) {
		console.error("Error while loading list of previews", e)
		return null;
	}
}
