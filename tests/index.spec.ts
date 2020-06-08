import { promisify } from 'util';

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

  context('time-based cache expunging', () => {
    let sleep: any;

    before(() => {
      sleep = promisify(setTimeout);
    });

    beforeEach(() => {
      keyValueCache.flush && keyValueCache.flush();
    });

    after(() => {
      keyValueCache.close && keyValueCache.close();
    });

    it('is able to expire keys based on ttl', async () => {
      await keyValueCache.set('short', 's', { ttl: 1 });
      await keyValueCache.set('long', 'l', { ttl: 5 });

      expect(await keyValueCache.get('short')).to.equal('s');
      expect(await keyValueCache.get('long')).to.equal('l');

      await sleep(1500);

      expect(await keyValueCache.get('short')).to.be.undefined;
      expect(await keyValueCache.get('long')).to.equal('l');

      await sleep(4000);

      expect(await keyValueCache.get('short')).to.be.undefined;
      expect(await keyValueCache.get('long')).to.be.undefined;
    }).timeout(10000);
  });
});