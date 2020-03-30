
export function slugGenerate(model, req) {
    return new Promise((resolve, reject) => {
        let initSlug = createInitial(req.body);
        model.find({ name: req.body.name })
            .select({ seo_url: 1 })
            .sort({ seo_url: -1 })
            .exec()
            .then(items => {
                if (items.length > 0) {
                    // let newSlugs = makeSlug({ name: req.body.name, items: items });
                    let gnSlug=initSlug.default_slug + '-0' + items.length;
                    resolve({ seo_url: gnSlug, lang_seo_url: (initSlug.lang_slug + '-0' + items.length) })
                } else {
                    resolve({ seo_url: initSlug.default_slug, lang_seo_url: initSlug.lang_slug })
                }
            })
            .catch(err => {
                resolve({ seo_url: initSlug.default_slug, lang_seo_url: initSlug.lang_slug })
            });
    })
}

export function slugUpdate(model, req) {
    return new Promise((resolve, reject) => {
        let initSlug = createInitial(req.body);
        model.find({name: req.body.name})
            .sort({ seo_url: -1 })
            .exec()
            .then(items => {
                if (items && items.length > 0) {
                    let newSlugs = makeSlug({ pre_default: items[0].seo_url, pre_lang: items[0].lang[0].content.seo_url });
                    resolve({ seo_url: newSlugs.default_slug, lang_seo_url: newSlugs.lang_slug })
                } else {
                    resolve({ seo_url: initSlug.default_slug, lang_seo_url: initSlug.lang_slug })
                }
            })
            .catch(err => {
                resolve({ seo_url: initSlug.default_slug, lang_seo_url: initSlug.lang_slug })
            });
    })
}

function createInitial(doc) {
    let default_slug = doc.name.toLowerCase();
    default_slug = default_slug.replace(/[&\/\\#,+()$~%.|'":*?<>{}]/g, '');;
    default_slug = default_slug.replace(/ /g, "-");
    let lang_slug = doc.lang[0].content.name;
    lang_slug = lang_slug.replace(/[&\/\\#,+()$~%.|ঃ'":*?<>{}]/g, '');
    lang_slug = lang_slug.replace(/ /g, "-");
    return { default_slug: default_slug, lang_slug: lang_slug };
}

function makeSlug(lastObj) {
    let currentSlugTextArray = lastObj.pre_default.split('-');
    let currentPostFix = currentSlugTextArray[currentSlugTextArray.length - 1];
    let uniqPostFix = isNaN(currentPostFix) ? '-100' : parseInt(currentPostFix) + 1;
    let newSlugObj = { default_slug: '', lang_slug: '' };
    if (isNaN(currentPostFix)) {
        newSlugObj.default_slug = currentSlugTextArray.join('-') + uniqPostFix;
        newSlugObj.lang_slug = lastObj.pre_lang + uniqPostFix;
    } else {
        currentSlugTextArray.pop();
        let rootDefaultText = currentSlugTextArray.join('-');
        newSlugObj.default_slug = rootDefaultText + '-' + uniqPostFix;

        let currentLangTextArray = lastObj.pre_lang.split('-');
        currentLangTextArray.pop();
        let rootLangText = currentLangTextArray.join('-');
        newSlugObj.lang_slug = rootLangText + '-' + uniqPostFix;

    }
    return newSlugObj

}
