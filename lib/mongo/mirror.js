/* eslint-disable no-console */
import { Client } from 'elasticsearch';
import { MongoClient } from 'mongodb';
import _ from 'underscore';

import settings from '../util/settings';

const { url, dbName, colName } = settings.mongodb;
const {
  host,
  index,
  type = 'doc',
  log = 'error',
  apiVersion = '6.0',
} = settings.elastic;

MongoClient.connect(url, async (err, client) => {
  const db = client.db(dbName);
  const col = db.collection(colName);

  const Elastic = new Client({ host, log, apiVersion });
  try {
    await Elastic.ping({
      // if Elastic doesn't respond in 10 secs, throw
      requestTimeout: 10000,
    });
  }
  catch (e) {
    console.warn(`Elastic instance at ${host} not responsive!`);
    throw e;
  }

  // Collection.watch() requires replication to be enabled on the Mongod
  const stream = col.watch();
  console.info(`Watching ${dbName}/${colName} for changes...`);

  /* eslint-disable no-underscore-dangle */
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
    /* eslint-enable no-underscore-dangle */
  });
});
