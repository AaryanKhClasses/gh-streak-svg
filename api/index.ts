import type { IncomingMessage, ServerResponse } from "node:http"
import fetchContributionDays from "../dist/github.js"
import calculateStreak from "../dist/streak.js"
import { renderErrorSVG, renderSVG } from "../dist/svg.js"
import loadEnv from "../dist/dotenv.js"

loadEnv()

const cache = new Map<string, { at: number; svg: string }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

const hits = new Map<string, { count: number; at: number }>()
const WINDOW = 60 * 1000
const MAX_REQUESTS = 30

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        if (req.url === "/health") {
            res.statusCode = 200
            res.end("OK")
            return
        }

        const url = new URL(req.url ?? "", "http://localhost")
        const user = url.searchParams.get("user")

        if (!user) {
            res.setHeader("Content-Type", "image/svg+xml")
            res.end(renderErrorSVG('Missing "user" query parameter'))
            return
        }

        if (!/^[a-zA-Z0-9-]{1,39}$/.test(user)) {
            res.setHeader("Content-Type", "image/svg+xml")
            res.end(renderErrorSVG("Invalid GitHub username"))
            return
        }

        const now = Date.now()
        const hit = hits.get(user)
        if (hit && now - hit.at < WINDOW && hit.count >= MAX_REQUESTS) {
            res.statusCode = 429
            res.end("Too Many Requests")
            return
        }

        hits.set(user, {
            count: hit && now - hit.at < WINDOW ? hit.count + 1 : 1,
            at: hit?.at ?? now
        })

        const cached = cache.get(user)
        if (cached && now - cached.at < CACHE_TTL) {
            res.setHeader("Content-Type", "image/svg+xml")
            res.setHeader("Cache-Control", "public, max-age=3600")
            res.end(cached.svg)
            return
        }

        const days = await fetchContributionDays(user)
        const streak = calculateStreak(days)
        const svg = renderSVG(user, streak)

        cache.set(user, { at: Date.now(), svg })

        res.setHeader("Content-Type", "image/svg+xml")
        res.setHeader("Cache-Control", "public, max-age=3600")
        res.end(svg)
    } catch {
        if (!res.headersSent) {
            res.setHeader("Content-Type", "image/svg+xml")
            res.end(renderErrorSVG("Unknown User"))
        }
    }
}
