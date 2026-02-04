import type { StreakResult } from './types'

export function renderSVG(user: string, streak: StreakResult): string {
    const radius = 38
    const circumference = 2 * Math.PI * radius

    const currentCompleteCycles = Math.floor(streak.current / 365)
    const currentRemainingDays = streak.current % 365
    const currentProgress = currentRemainingDays / 365
    const currentOffset = circumference * (1 - currentProgress)

    const longestCompleteCycles = Math.floor(streak.longest / 365)
    const longestRemainingDays = streak.longest % 365
    const longestProgress = longestRemainingDays / 365
    const longestOffset = circumference * (1 - longestProgress)

    const gradients = []
    const currentCircles = []
    const longestCircles = []
    
    for(let i = 0; i < currentCompleteCycles; i++) {
        const hueShift = (i * 120) % 360
        gradients.push(`
            <linearGradient id="gradient${i}" x1="0" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="hsl(${210 + hueShift}, 90%, 60%)" />
                <stop offset="100%" stop-color="hsl(${270 + hueShift}, 90%, 60%)" />
            </linearGradient>`
        )
        
        const visibility = i === 0 ? '' : `<set attributeName="visibility" to="visible" begin="${i * 1}s" />`
        currentCircles.push(`
            <circle r="${radius}" cx="0" cy="0" fill="none" stroke="url(#gradient${i})" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="0" transform="rotate(-90)" visibility="${i === 0 ? 'visible' : 'hidden'}">
                ${visibility}
                <animate attributeName="stroke-dashoffset" from="${circumference}" to="0" dur="1s" begin="${i * 1}s" fill="freeze" />
            </circle>`
        )
    }

    if(currentRemainingDays > 0) {
        const hueShift = (currentCompleteCycles * 120) % 360
        gradients.push(`
            <linearGradient id="gradientCurrent" x1="0" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="hsl(${210 + hueShift}, 90%, 60%)" />
                <stop offset="100%" stop-color="hsl(${270 + hueShift}, 90%, 60%)" />
            </linearGradient>`
        )
        
        const visibility = currentCompleteCycles > 0 ? `<set attributeName="visibility" to="visible" begin="${currentCompleteCycles * 1}s" />` : ''
        currentCircles.push(`
            <circle r="${radius}" cx="0" cy="0" fill="none" stroke="url(#gradientCurrent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${currentOffset}" transform="rotate(-90)" visibility="${currentCompleteCycles === 0 ? 'visible' : 'hidden'}">
                ${visibility}
                <animate attributeName="stroke-dashoffset" from="${circumference}" to="${currentOffset}" dur="1s" begin="${currentCompleteCycles * 1}s" fill="freeze" />
            </circle>`
        )
    }

    for(let i = 0; i < longestCompleteCycles; i++) {
        const hueShift = (i * 120) % 360
        gradients.push(`
            <linearGradient id="gradientLongest${i}" x1="0" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="hsl(${210 + hueShift}, 90%, 60%)" />
                <stop offset="100%" stop-color="hsl(${270 + hueShift}, 90%, 60%)" />
            </linearGradient>`
        )
        
        const visibility = i === 0 ? '' : `<set attributeName="visibility" to="visible" begin="${i * 1}s" />`
        longestCircles.push(`
            <circle r="${radius}" cx="0" cy="0" fill="none" stroke="url(#gradientLongest${i})" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="0" transform="rotate(-90)" visibility="${i === 0 ? 'visible' : 'hidden'}">
                ${visibility}
                <animate attributeName="stroke-dashoffset" from="${circumference}" to="0" dur="1s" begin="${i * 1}s" fill="freeze" />
            </circle>`
        )
    }

    if(longestRemainingDays > 0) {
        const hueShift = (longestCompleteCycles * 120) % 360
        gradients.push(`
            <linearGradient id="gradientLongestCurrent" x1="0" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="hsl(${210 + hueShift}, 90%, 60%)" />
                <stop offset="100%" stop-color="hsl(${270 + hueShift}, 90%, 60%)" />
            </linearGradient>`
        )
        
        const visibility = longestCompleteCycles > 0 ? `<set attributeName="visibility" to="visible" begin="${longestCompleteCycles * 1}s" />` : ''
        longestCircles.push(`
            <circle r="${radius}" cx="0" cy="0" fill="none" stroke="url(#gradientLongestCurrent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${longestOffset}" transform="rotate(-90)" visibility="${longestCompleteCycles === 0 ? 'visible' : 'hidden'}">
                ${visibility}
                <animate attributeName="stroke-dashoffset" from="${circumference}" to="${longestOffset}" dur="1s" begin="${longestCompleteCycles * 1}s" fill="freeze" />
            </circle>`
        )
    }

    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="450" height="160">
            <defs>${gradients.join('')}</defs>
            <style>
                text { font-family: system-ui, -apple-system, sans-serif; fill: #c9d1d9; }
            </style>

            <rect width="100%" height="100%" rx="12" fill="#0d1117"/>
            <text x="20" y="28" font-size="16"><tspan fill="#ff9d5c">${user}</tspan>'s GitHub Streak</text>
            <g transform="translate(150 80)">
                <circle r="${radius}" cx="0" cy="0" fill="none" stroke="#21262d" stroke-width="8" />
                ${currentCircles.join('\n                ')}
                <text x="0" y="4" font-size="28" font-weight="600" text-anchor="middle" dominant-baseline="middle">${streak.current}</text>
                <text x="0" y="58" font-size="14" text-anchor="middle" fill="#8b949e">Current Streak</text>
            </g>
            <line x1="225" y1="45" x2="225" y2="135" stroke="#404346" stroke-width="2" />
            <g transform="translate(300 80)">
                <circle r="${radius}" cx="0" cy="0" fill="none" stroke="#21262d" stroke-width="8" />
                ${longestCircles.join('\n                ')}
                <text x="0" y="4" font-size="28" font-weight="600" text-anchor="middle" dominant-baseline="middle">${streak.longest}</text>
                <text x="0" y="58" font-size="14" text-anchor="middle" fill="#8b949e">Longest Streak</text>
            </g>
            <text x="225" y="155" font-size="10" text-anchor="middle" fill="#8b949e">Last Updated <tspan fill="#ff9d5c">${new Date().toISOString().slice(0, 16).replace("T", " ")}</tspan> UTC</text>
        </svg>
    `
}

export function renderErrorSVG(message: string): string {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
            <style>
                text { font-family: system-ui, -apple-system, sans-serif; fill: #da4e47; }
            </style>
            <rect width="100%" height="100%" fill="#0d1117" rx="10" />
            <text x="20" y="35" font-size="16">Error: ${message}</text>
        </svg>
    `
}
