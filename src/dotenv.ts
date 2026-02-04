import fs from 'node:fs'

export default function loadEnv() {
    if(!fs.existsSync('.env')) return

    const lines = fs.readFileSync('.env', 'utf-8').split('\n')
    for(const line of lines) {
        const trimmed = line.trim()
        if(!trimmed || trimmed.startsWith('#')) continue

        const [key, ...rest] = trimmed.split('=')
        process.env[key] ??= rest.join('=').trim()
    }
}
