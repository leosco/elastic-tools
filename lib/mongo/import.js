/* eslint-disable no-console */
import { Client } from 'elasticsearch';
import { MongoClient } from 'mongodb';
import _ from 'underscore';

import ingest from '../elastic/ingest';
import settings from '../util/settings';

const { url, dbName, colName } = settings.mongodb;
const {
  host,
  apiVersion = '6.0',
  index,
  type = 'doc',
  log = 'error',
} = settings.elastic;

MongoClient.connect(url, async (err, client) => {
  if (err) throw err;

  const Elastic = new Client({ host, apiVersion, log });
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

  const db = client.db(dbName);
  const col = db.collection(colName);
  const colSize = await col.count();

  const sel = {};
  const opts = {
    limit: 1000,
    skip: 0,
  };

  let chunk = col.find(sel, opts);

  while (opts.skip < colSize) {
    ingest(Elastic, {
      index,
      type,
      create: opts.skip === 0,
      transform: obj => _.omit(obj, '_id'),
      // eslint-disable-next-line no-await-in-loop
      data: await chunk.toArray(),
    });

    opts.skip += opts.limit;
    chunk = col.find(sel, opts);
  }

  console.log(`Done importing ${colSize} documents from ${dbName}/${colName} into ${index}!`);
  await client.close();
});
