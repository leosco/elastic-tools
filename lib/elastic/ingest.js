import elastify from './elastify';

/*
  Given an elasticsearch client instance, and a params object in the form of
  [{
    index: 'an_index',
    type: 'a_type', // only one type per index is best practice now, anyway
    data: [{}],     // an array of JSON-able objects
    createBody: {}, // an optional body of params to pass to the Client.indices.create() call
    idGenerator(),  // an optional _id generator function
    transform(),    // an optional transform function to be applied per item
  }]
  or a singular object of the same format. For each param
  1. prepare the raw data for insertion by assigning _ids and transforming types
  2. create the indices if they don't exist
  3. insert the data using bulk operations
*/
export default function (Client, params) {
  // eslint-disable-next-line no-param-reassign
  if (!Array.isArray(params)) params = [params];
  params.forEach(async (p) => {
    if (p.create) {
      const exists = await Client.indices.exists({ index: p.index });
      if (!exists) await Client.indices.create({ index: p.index, body: p.createBody });
    }

    await Client.bulk({ body: elastify(p.data, p) });
  });
}
