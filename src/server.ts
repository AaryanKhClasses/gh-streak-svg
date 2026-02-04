import http from 'node:http'
import fetchContributionDays from './github.js'
import calculateStreak from './streak.js'
import loadEnv from './dotenv.js'
import { renderErrorSVG, renderSVG } from './svg.js'

loadEnv()

const cache = new Map<string, { at: number, svg: string }>()
const CACHE_TTL = 1 * 60 * 60 * 1000 // 1 hour

const hits = new Map<string, { count: number, at: number }>()
const WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 30

setInterval(() => {
    const now = Date.now()
    for (const [k, v] of cache) if (now - v.at > CACHE_TTL) cache.delete(k)
    for (const [k, v] of hits) if (now - v.at > WINDOW) hits.delete(k)
}, 60 * 60 * 1000)

if(!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN is not set in environment variables.')
    process.exit(1)
}

const server = http.createServer(async(req, res) => {
    try {
        if (req.url === "/") {
            res.writeHead(200, { 'Content-Type': 'text/plain' })
            res.end('GitHub Streak SVG - Usage: /?user=AaryanKhClasses')
            return
        }

        if(req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'text/plain' })
            res.end('OK')
            return
        }

        const url = new URL(req.url ?? "", "http://localhost")
        const user = url.searchParams.get("user")

        if(!user) {
            res.writeHead(400, { 'Content-Type': 'image/svg+xml; charset=utf-8' })
            res.end(renderErrorSVG('Missing "user" query parameter'))
            return
        }

        if(!/^[a-zA-Z0-9-]{1,39}$/.test(user)) {
            res.writeHead(400 , { 'Content-Type': 'image/svg+xml; charset=utf-8' })
            res.end(renderErrorSVG('Invalid GitHub username'))
            return
        }

        const now = Date.now()
        const hit = hits.get(user)
        if(hit && now - hit.at < WINDOW && hit.count >= MAX_REQUESTS) {
            res.writeHead(429)
            res.end('Too Many Requests')
            return
        }

        hits.set(user, {
            count: hit && now - hit.at < WINDOW ? hit.count + 1 : 1,
            at: hit?.at ?? now
        })

        const cached = cache.get(user)
        if(cached && (Date.now() - cached.at) < CACHE_TTL) {
            res.writeHead(200, {
                'Content-Type': 'image/svg+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            })
            res.end(cached.svg)
            return
        }

        const days = await fetchContributionDays(user)
        const streak = calculateStreak(days)
        const svg = renderSVG(user, streak)
        cache.set(user, { at: Date.now(), svg })

        res.writeHead(200, {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        })
        res.end(svg)
    } catch(_) {
        if(res.headersSent) return
        res.writeHead(500, { 'Content-Type': 'image/svg+xml; charset=utf-8' })
        res.end(renderErrorSVG(`Unknown User`))
    }
})

server.listen(3000, () => console.log('Server running on http://localhost:3000'))
