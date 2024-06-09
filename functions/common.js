import { pipeline } from 'stream';
import functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { ReplaceSectionStream } from './utils/ReplaceSectionStream.js';
import { convertToOgpString } from './utils/converter.js';

const db = getFirestore();

export const replace_ogp_tags = functions
  .region('asia-northeast1')
  .runWith({ memory: '1GB'})
  .https
  .onRequest(async (req, res) => {
    const site = `${req.protocol}://${req.headers['x-forwarded-host']}`;
    const paths = req.path.split('/');
    // 短縮前のパスにアクセスしてきた場合は変換する
    if (paths[1] === 'community') {
      paths[1] = 'c';
    }
    if (paths[3] === 'events') {
      paths[3] = 'e';
    }
    // Community 名に大文字を許可していた時代のリクエストに対応
    paths[2] = paths[2].toLowerCase();
    const path = paths.join('/');

    const response = await fetch(`${site}/index.html`);
    if (!response.ok) {
      res.status(500).send('Could not retrieve index.html');
      return;
    }

    const context = {
      site,
      url: `${site}${path}`,
      image: `${site}/shokujii_ogp.png`,
    };
    try {
      // Event ページの場合は title 等を上書き
      if (paths[1] === 'c' && paths[3] === 'e') {
        const eventId = paths[4];
        const event = await db.collectionGroup('events').where('event_id', '==', eventId).get()
        if (event.size === 0) {
          res.status(404).send('Not Found');
          return;
        }
        const eventData = event.docs[0].data();
        context.title = convertToOgpString(eventData.event_name);
        context.description = convertToOgpString(eventData.event_desc);
        context.image = eventData.event_cover_url;
        res
          .status(200)
          .set('Cache-Control', 'public, max-age=600, s-maxage=600');
        return pipeline(
          response.body,
          new ReplaceSectionStream('<!-- OGP_BEGIN_TAG -->', '<!-- OGP_END_TAG -->', makeMetaTags(context)),
          res,
          (err) => {
            console.error(err);
          }
        );
      }
    } catch (e) {
      console.warn(e);
    }
    res.status(404).send('Invalid path');
});

const makeMetaTags = (context) => `<meta property="og:title" content="${context.title}">
<meta property="og:image" content="${context.image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:description" content="${context.description}">
<meta property="og:url" content="${context.url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="食事でつながるshokujii">
<meta name="twitter:site" content="${context.site}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${context.title}">
<meta name="twitter:image" content="${context.image}">
<meta name="twitter:description" content="${context.description}">`;
