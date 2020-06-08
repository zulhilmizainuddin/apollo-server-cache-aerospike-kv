import {
  TestableKeyValueCache,
  KeyValueCacheSetOptions,
} from 'apollo-server-caching';

// @ts-ignore
import Aerospike, { AerospikeError } from 'aerospike';

export interface DataModel {
  readonly namespace: string;
  readonly set: string;
}

export class AerospikeCache implements TestableKeyValueCache<string> {
  private readonly client: any;
  private readonly defaultSetOptions: KeyValueCacheSetOptions = {
    ttl: 300,
  };

  // Aerospike client config reference https://www.aerospike.com/apidocs/nodejs/Config.html
  constructor(clientConfig: any, private dataModel: DataModel) {
    this.client = Aerospike.client(clientConfig);

    this.client.connect();
  }

  async set(key: string, value: string, options?: KeyValueCacheSetOptions | undefined): Promise<void> {
    const { ttl } = { ...this.defaultSetOptions, ...options };

    const { namespace, set } = this.dataModel;
    const aerospikeKey = new Aerospike.Key(namespace, set, key);

    const bins = { value };

    const meta = typeof ttl === 'number' ? { ttl } : { ttl: 0 }; // Zero means use default TTL in the namespace

    await this.client.put(aerospikeKey, bins, meta);
  }

  async get(key: string): Promise<string | undefined> {
    try {
      const { namespace, set } = this.dataModel;
      const aerospikeKey = new Aerospike.Key(namespace, set, key);

      const record = await this.client.get(aerospikeKey);

      const value = record.bins['value'];

      return value;
    } catch (err) {
      if (err.code === Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
        return;
      }

      throw err;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const { namespace, set } = this.dataModel;

      const aerospikeKey = new Aerospike.Key(namespace, set, key);

      await this.client.remove(aerospikeKey);

      return true;
    } catch (err) {
      if (err.code === Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
        return true;
      }

      throw err;
    }
  }

  async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { namespace, set } = this.dataModel;

      const scan = this.client.scan(namespace, set);
      scan.concurrent = true;
      scan.nobins = false;

      const stream = scan.foreach();
      stream.on('data', (record: any) => {
        this.client
          .remove(record.key)
          .catch((err: AerospikeError) => {
            if (err.code !== Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
              return reject(err);
            }
    
            return;
          });
      });

      stream.on('error', (err: AerospikeError) => {
        if (err.code !== Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
          return reject(err);
        }

        return;
      });

      stream.on('end', () => {
        return resolve();
      });
    });
  
  }

  async close(): Promise<void> {
    this.client.close();
  }
}