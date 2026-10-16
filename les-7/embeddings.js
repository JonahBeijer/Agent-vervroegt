import { Embeddings } from '@langchain/core/embeddings';
import path from 'node:path';
import { DATA } from '../les-5/config.js';
let modelPromise;
export class LocalEmbeddings extends Embeddings {
    constructor() { super({ maxConcurrency: 1 }); }
    async model(onProgress) {
        if (!modelPromise) modelPromise = import('@huggingface/transformers').then(({ pipeline, env }) => {
            env.cacheDir = path.join(DATA, 'models');
            return pipeline('feature-extraction', 'Xenova/multilingual-e5-small', { dtype: 'q8', device: 'cpu', progress_callback: onProgress });
        }).catch(error => { modelPromise = null; throw error; });
        return modelPromise;
    }
    async vectors(texts, prefix, progress) {
        const model = await this.model();
        const vectors = [];
        for (let i = 0; i < texts.length; i += 8) {
            const tensor = await model(texts.slice(i, i + 8).map(text => prefix + text), { pooling: 'mean', normalize: true });
            vectors.push(...tensor.tolist());
            progress?.(Math.min(i + 8, texts.length), texts.length);
        }
        return vectors;
    }
    async embedDocuments(texts, progress) { return this.vectors(texts, 'passage: ', progress); }
    async embedQuery(text) { return (await this.vectors([text], 'query: '))[0]; }
}
