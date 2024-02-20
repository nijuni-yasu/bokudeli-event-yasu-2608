import functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import handlebars from 'handlebars';

const db = getFirestore();

export const retrieve_index = functions
  .region('asia-northeast1')
  .https
  .onRequest(async (req, res) => {
    const site = `${req.protocol}://${req.headers['x-forwarded-host']}`;
    const paths = req.path.split('/');
    const template = handlebars.compile(await (await fetch(`${site}/_index.html`)).text());
    const context = {
      site,
      url: `${site}${req.path}`,
      image: `${site}/shokujii_ogp.png`,
    };
    try {
      // Event ページの場合は title 等を上書き
      if (paths[1] === 'community' && paths[3] === 'events') {
        const eventId = paths[4];
        const event = await db.collectionGroup('events').where('event_id', '==', eventId).get()
        if (event.size === 0) {
          res.status(404).send('Not Found')
          return
        }
        const eventData = event.docs[0].data();
        context.title = eventData.event_name;
        context.description = eventData.event_desc;
        context.image = eventData.event_cover_url;
      }
    } catch (e) {
      console.warn(e);
    }
    const html = template(context);
    res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.status(200).send(html);
  });
