import { Client } from 'elasticsearch';
import { MongoClient } from 'mongodb';
import _ from 'underscore';

import settings from '../util/settings';

const { url, dbName, colName } = settings.mongodb;
const {
  host,
  apiVersion,
  index,
  type,
} = settings.elastic;

const Elastic = new Client({ host, apiVersion });

MongoClient.connect(url, async (err, client) => {
  const db = client.db(dbName);
  const col = db.collection(colName);

  const stream = col.watch();
  // eslint-disable-next-line no-console
  console.info(`Watching ${dbName}/${colName} for changes...`);

  /* eslint-disable no-underscore-dangle, no-console */
  stream.on('change', async (e) => {
    console.log(e);
    switch (e.operationType) {
      case 'insert':
        await Elastic.index({
          index,
          type,
          id: e.documentKey._id,
          body: _.omit(e.fullDocument, '_id'),
        });
        break;
      case 'update':
        await Elastic.update({
          index,
          type,
          id: e.documentKey._id,
          body: {
            doc: e.updateDescription.updatedFields,
          },
        });

        if (e.updateDescription.removedFields.length > 0) {
          await Elastic.update({
            index,
            type,
            id: e.documentKey._id,
            body: {
              script: {
                lang: 'painless',
                source: 'for (int i = 0; i < params.toRem.length; ++i) { ctx._source.remove(params.toRem[i]); }',
                params: {
                  toRem: e.updateDescription.removedFields,
                },
              },
            },
          });
        }
        break;
      case 'delete':
        await Elastic.delete({
          index,
          type,
          id: e.documentKey._id,
        });
        break;
      default:
        console.warn(`Unsupported event emitted: ${JSON.stringify(e)}`);
    }
    /* eslint-enable no-underscore-dangle, no-console */
  });
});
