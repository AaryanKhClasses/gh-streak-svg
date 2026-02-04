import type { ContributionDay } from './types'

const ENDPOINT = 'https://api.github.com/graphql'

async function fetchYear(user: string, from: Date, to: Date): Promise<ContributionDay[]> {
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'gh-streak-svg'
        },
        body: JSON.stringify({
            query: `
                query($login: String!, $from: DateTime!, $to: DateTime!) {
                    user(login: $login) {
                        contributionsCollection(from: $from, to: $to) {
                            contributionCalendar {
                                weeks {
                                    contributionDays {
                                        date
                                        contributionCount
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            variables: {
                login: user,
                from: from.toISOString(),
                to: to.toISOString()
            }
        })
    })

    if(!res.ok) throw new Error(`GitHub API responded with status ${res.status}`)
    const data = await res.json()
    return data.data.user.contributionsCollection.contributionCalendar.weeks.flatMap((week: any) => week.contributionDays)
}

export default async function fetchContributionDays(user: string, years = 5): Promise<ContributionDay[]> {
    const all: ContributionDay[] = []
    let to = new Date(), from = new Date()
    for(let i = 0; i < years; i++) {
        from = new Date(to)
        from.setUTCFullYear(from.getUTCFullYear() - 1)
        const chunk = await fetchYear(user, from, to)
        all.push(...chunk)
        to = from
    }

    return all
}
