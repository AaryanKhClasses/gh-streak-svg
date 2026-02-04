import type { ContributionDay, StreakResult } from './types'

const DAY = 24 * 60 * 60 * 1000 // 1 day

export default function calculateStreak(days: ContributionDay[]): StreakResult {
    if(days.length === 0) return { current: 0, longest: 0 }

    const unique = new Map<string, ContributionDay>()
    for(const day of days) unique.set(day.date, day)
    
    const sorted = [...unique.values()].map(day => ({ ...day, dateObj: new Date(day.date + 'T00:00:00Z') }))
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())

    let currentRun = 0, max = 0
    for(let i = 0; i < sorted.length; i++) {
        const today = sorted[i], yesterday = sorted[i-1]

        if(today.contributionCount > 0) {
            if(i > 0 && yesterday.contributionCount > 0 && today.dateObj.getTime() - yesterday.dateObj.getTime() === DAY) currentRun++
            else currentRun = 1
            max = Math.max(max, currentRun)
        } else currentRun = 0
    }

    const todayISO = new Date().toISOString().slice(0, 10)
    let startIndex = sorted.length - 1
    if(sorted[startIndex].date === todayISO) startIndex--

    let current = 0
    for(let i = startIndex; i >= 0; i--) {
        if(sorted[i].contributionCount > 0) {
            if(i === startIndex || sorted[i+1].dateObj.getTime() - sorted[i].dateObj.getTime() === DAY) current++
            else break
        } else break
    }

    return { current, longest: max }
}
