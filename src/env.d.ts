export {};
declare global {
    interface Env {
        /** Cloudflare R2 bucket for Aether-Core storage */
        BUCKET: R2Bucket;
        /** Cloudflare D1 database for Aether-Core */
        DB: D1Database;
        /** Cloudflare Vectorize index for embeddings */
        VECTORIZE: VectorizeIndex;
    }
}
