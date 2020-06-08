import { expect } from 'chai';

import { AerospikeCache } from '../src/index';

describe('AerospikeCache', () => {
  let keyValueCache: AerospikeCache;

  before(() => {
    keyValueCache = new AerospikeCache({
      hosts: '127.0.0.1:3000',
    }, {
      namespace: 'test',
      set: 'cache',
    });
  });

  after(() => {
    setTimeout(() => {
      keyValueCache.close();
    }, 2000);
  });
  
  context('basic cache functionality', () => {
    beforeEach(() => {
      keyValueCache.flush && keyValueCache.flush();
    });

    it('can do a basic get and set', async () => {
      await keyValueCache.set('hello', 'world');

      expect(await keyValueCache.get('hello')).to.equal('world');
      expect(await keyValueCache.get('missing')).to.be.undefined;
    });

    it('can do a basic set and delete', async () => {
      await keyValueCache.set('hello', 'world');
      expect(await keyValueCache.get('hello')).to.equal('world');
      
      await keyValueCache.delete('hello');
      expect(await keyValueCache.get('hello')).to.be.undefined;
    });
  });
});