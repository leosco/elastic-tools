# elastic-tools

A simple utility library containing tools for use with the Elasticsearch database engine. Currently featuring a few simple standalone functions and MongoDB plugins, but with plans to add more functionality and publish a complete package to NPM. Issue reports and pull requests are welcome!

Developed and tested on Node v8.11.1 LTS; does not support v10.0 Latest, yet. Plugins tested on MongoDB v3.6.3 with a WiredTiger enabled database and Elasticsearch v6.1.3, no license.

## [Usage](#usage)

[Download](https://github.com/leosco/elastic-tools/archive/master.zip) or clone the repo using:

```bash
git clone https://github.com/leosco/elastic-tools.git
cd elastic-tools
npm install
# or if you've got yarn
yarn
```

To run a particular plugin in development, see the `package.json` scripts for reference:

```json
  "mongo/import": "babel-node lib/mongo/import.js",
  "mongo/mirror": "nodemon lib/mongo/mirror.js --exec babel-node",
```

to run in production, I recommend running the `build` script first

```bash
npm run build
# or
yarn build
```

before running the `dist` version of the script you want:

```json
  "dist/mongo/import": "node dist/mongo/import.js",
  "dist/mongo/mirror": "node dist/mongo/mirror.js",
```

## [API](#mongo)

### [Mongo plugins](#mongo)

MongoDB specific tools for working with Elasticsearch.

Pass parameters to a function via a settings file, defaults to a local `settings.json` in the project root, but you can pass a command line argument to the script call.

Format of the settings file is like so:

```json
{
  "elastic": {
    "host": "localhost:9200",
    "index": "test.docs",
    "type": "doc",
    "log": "error"
  },
  "mongodb": {
    "url": "mongodb://localhost:27017",
    "dbName": "test",
    "colName": "docs"
  }
}
```

#### Throughout these examples, `yarn` can be substituted with `npm run` if you don't have yarn installed

### [mongo/import](#mongo/import)

```bash
yarn mongo/import /path/to/my_params.json
# defaults to settings.json if omitted
```

Import the contents of a Mongo collection `mongodb.dbName` / `mongodb.colName` into an Elasticsearch index `elastic.index` from the instances running at `mongodb.url` and `elastic.host`, respectively. If the Elasticsearch index doesn't exist, it will be created by default.

If it already exists, new documents will be inserted and existing ones, queried by _id, will be ignored. Elasticsearch may print warnings if you try to insert an already inserted document.

### [mongo/mirror](#mongo/mirror)

```bash
yarn mongo/mirror my_params.json
# or omit my_params.json and just use a settings.json in the elastic-tools directory
```

Establish a one-way, master -> slave style mirror between a MongoDB collection and an Elasticsearch index, so every CRUD operation that is committed to the Mongo collection is propagated to Elasticsearch for the respective collection/index. It does not perform the vice-versa function of reflecting Elasticsearch data operations to Mongo.

#### This function depends on the MongoDB oplog, so your Mongod instance must have replication enabled. You don't have to actually have other members in a replica set to benefit from replication. Check out the [docs](https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/)

## Roadmap

- More robust command line functionality. The ability to pass all options in `settings.json` to the script call.
- Publishing the package to NPM with proper export practices.
- Rigorous testing of things, and improving tutorials.
- Possible abstraction to an simple REST API using Express, or a Docker image?