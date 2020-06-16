# apollo-server-cache-aerospike-kv [![Build Status](https://travis-ci.org/zulhilmizainuddin/apollo-server-cache-aerospike-kv.svg?branch=master)](https://travis-ci.org/zulhilmizainuddin/apollo-server-cache-aerospike-kv)

[![NPM](https://nodei.co/npm/apollo-server-cache-aerospike-kv.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/apollo-server-cache-aerospike-kv/)

This package exports an implementation of `KeyValueCache` that allows using Aerospike as a backing store for resource caching in [Data Sources](https://www.apollographql.com/docs/apollo-server/data/data-sources/).

## Usage

```js
import { ApolloServer } from 'apollo-server';
import { AerospikeCache } from 'apollo-server-cache-aerospike-kv';

import responseCachePlugin from 'apollo-server-plugin-response-cache';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: new AerospikeCache({
    hosts: '127.0.0.1:3000',
  }, {
    namespace: 'test',
    set: 'cache',
  }),
  cacheControl: {
    defaultMaxAge: 5,
  },
  plugins: [responseCachePlugin()],
  dataSources: () => ({
    moviesAPI: new MoviesAPI(),
  }),
});
```

For documentation of the options you can pass to the underlying Aerospike client, look [here](https://www.aerospike.com/apidocs/nodejs/Config.html).
