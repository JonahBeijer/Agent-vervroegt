import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const DATA = path.resolve(process.env.AGENT_DATA_DIR || path.join(ROOT, 'data'));
export function loadEnvironment() {
    const candidates = [process.env.AGENT_ENV_FILE, path.resolve(ROOT, '../agent-vervroegt-secrets/azure.env'), path.resolve(ROOT, '../taalmodel-vervroegt-secrets/azure.env'), path.resolve(ROOT, '../Taalmodel-vervroegt/azure.env')].filter(Boolean);
    const file = process.env.AGENT_ENV_FILE || candidates.find(existsSync);
    if (file) {
        if (!existsSync(file)) throw new Error('AGENT_ENV_FILE verwijst naar een ontbrekend bestand.');
        process.loadEnvFile(file);
    }
    mkdirSync(DATA, { recursive: true });
    return file || null;
}
export function configuration() {
    const required = ['AZURE_OPENAI_API_KEY','AZURE_OPENAI_API_INSTANCE_NAME','AZURE_OPENAI_API_DEPLOYMENT_NAME','AZURE_OPENAI_API_VERSION'];
    return { azure: required.every(key => process.env[key]?.trim() && !process.env[key].startsWith('vul-')), news: Boolean(process.env.NEWSDATA_API?.trim()), model: process.env.AZURE_OPENAI_MODEL_NAME?.trim() || process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || null };
}
