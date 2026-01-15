/**
 * Script para injetar variáveis de ambiente no angular.json durante o build
 * Este script é executado antes do build no Vercel
 */

const fs = require('fs');
const path = require('path');

const angularJsonPath = path.join(__dirname, '..', 'angular.json');

// Ler a API key da variável de ambiente
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.warn('[inject-env] WARNING: GEMINI_API_KEY not found in environment variables!');
    console.warn('[inject-env] AI features (Market Insights, Business Plan) will not work.');
    process.exit(0); // Não falha o build, apenas avisa
}

console.log('[inject-env] Found GEMINI_API_KEY, injecting into angular.json...');

try {
    // Ler angular.json
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

    // Atualizar a definição da API key
    if (angularJson.projects?.app?.architect?.build?.options?.define) {
        angularJson.projects.app.architect.build.options.define['process.env.API_KEY'] = `"${geminiApiKey}"`;

        // Escrever de volta
        fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
        console.log('[inject-env] Successfully injected API key into angular.json');
    } else {
        console.error('[inject-env] Could not find define section in angular.json');
        process.exit(1);
    }
} catch (error) {
    console.error('[inject-env] Error:', error.message);
    process.exit(1);
}
