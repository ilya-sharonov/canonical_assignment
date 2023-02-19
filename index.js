const DEFAULT_FETCH_URL = 'https://people.canonical.com/~anthonydillon/wp-json/wp/v2/posts.json';
const DEFAULT_TOPIC = 'Articles';
const DEFAULT_CATEGORY = 'Article';
const DEFAULT_AUTHOR = {
    name: 'Canonical',
    link: 'https://ubuntu.com/blog/author/canonical/',
};
const DEFAULT_INNER_PROPS_PATH = ['_embedded', 'wp:term'];
const DEFAULT_AUTHOR_PATH = ['_embedded', 'author'];

async function fetchData(url = DEFAULT_FETCH_URL) {
    const response = await fetch(url);
    return response.json();
}

function getTopic(elem, terms) {
    const termId =
        elem.topic.find(topic => terms[topic]) ??
        elem.group.find(group => terms[group]) ??
        elem.tags.find(tag => terms[tag]);
    const topic = terms[termId];
    const topicName = topic?.name ?? DEFAULT_TOPIC;
    return topicName.toUpperCase();
}

function getInnerProperty(elem, props) {
    return props.reduce((target, prop) => {
        return target[prop];
    }, elem);
}

function getAuthor(elem, authorPropsPath = DEFAULT_AUTHOR_PATH) {
    const authors = getInnerProperty(elem, authorPropsPath);
    return authors.find(author => author.id === elem.author) ?? DEFAULT_AUTHOR;
}

function getTerms(elem, innerPropsPath = DEFAULT_INNER_PROPS_PATH) {
    const innerProps = getInnerProperty(elem, innerPropsPath);
    return innerProps.reduce((acc, next) => {
        next.forEach(nxt => {
            acc[nxt.id] = nxt;
        });
        return acc;
    }, {});
}

function getDate(elem) {
    const date = new Date(elem.modified);
    const formatter = new Intl.DateTimeFormat('en', { month: 'long' });
    const month = formatter.format(date);
    return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

function getCategory(elem, terms) {
    const categoryId = elem.categories.find(category => terms[category]);
    const category = terms[categoryId];
    const categoryName = category?.name ?? DEFAULT_CATEGORY;
    return categoryName;
}

function prepareArticles(json) {
    return json.map(elem => {
        const terms = getTerms(elem);
        const author = getAuthor(elem);
        return {
            topic: getTopic(elem, terms),
            category: getCategory(elem, terms),
            date: getDate(elem),
            featuredMedia: elem.featured_media,
            link: elem.link,
            title: elem.title.rendered,
            author,
        };
    });
}

function renderArticle(article) {
    return `<div class="col-4">
        <div class="p-card">
            <div class="p-card__content">
                <span id="title-1">${article.topic}</span>
                <hr class="u-sv1" />
                <img
                    class="p-card__image"
                    alt=""
                    height="185"
                    width="330"
                    src="${article.featuredMedia}"
                />
                <h3>
                    <a href="${article.link}">${article.title}</a>
                </h3>
                <div class="p-card__inner">By <a href="${article.author.link}">${article.author.name}</a> on ${article.date}</div>
                <hr class="u-sv1" />
                <p class="u-no-padding--bottom">${article.category}</p>
            </div>
        </div>
    </div>`;
}

function renderError() {
    return `
    <div class="p-strip">
        <div class="row">
            <div class="u-align--right col-4 col-medium-2 col-small-1">
                <img src="https://blog.documentfoundation.org/wp-content/uploads/2016/07/canonical-logo3.png" alt="empty state" width="80">
            </div>
            <div class="u-align--left col-8 col-medium-4 col-small-3">
                <p class="p-heading--4 u-no-margin--bottom">Blog posts are not available</p>
                <p>Please try reloading the page</p>
            </div>
        </div>
    </div>
    `;
}

function render(innerHtml) {
    const mountPoint = document.querySelector('#mount-point');
    mountPoint.innerHTML = innerHtml;
}

function renderArticles(articles) {
    const innerHtml = articles.map(renderArticle).join('\n');
    render(innerHtml);
}

function renderErrors() {
    const err = renderError();
    render(err);
}

(async function init() {
    try {
        const json = await fetchData();
        const articles = prepareArticles(json);
        renderArticles(articles);
    } catch (e) {
        renderErrors();
    }
})();
