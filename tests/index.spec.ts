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

  after(async () => {
    await keyValueCache.close();
  });
  
  context('basic cache functionality', () => {
    beforeEach(async () => {
      await keyValueCache.flush();
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

    beforeEach(async () => {
      await keyValueCache.flush();
    });

    it('is able to expire keys based on ttl', async () => {
      await keyValueCache.set('short', 's', { ttl: 1 });
      await keyValueCache.set('long', 'l', { ttl: 5 });

      expect(await keyValueCache.get('short')).to.equal('s');
      expect(await keyValueCache.get('long')).to.equal('l');

      await sleep(2000);

      expect(await keyValueCache.get('short')).to.be.undefined;
      expect(await keyValueCache.get('long')).to.equal('l');

      await sleep(4000);

      expect(await keyValueCache.get('short')).to.be.undefined;
      expect(await keyValueCache.get('long')).to.be.undefined;
    }).timeout(10000);

    it('does not expire when ttl is null', async () => {
      await keyValueCache.set('forever', 'yours', { ttl: null });
      expect(await keyValueCache.get('forever')).to.equal('yours');

      await sleep(2000);

      expect(await keyValueCache.get('forever')).to.equal('yours');
      
      await sleep(4000);

      expect(await keyValueCache.get('forever')).to.equal('yours');
    }).timeout(10000);;
  });
});