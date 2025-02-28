export interface Score {
  playerName: string
  deviceId: string
  time: number
  rows: number
  cols: number
  gameMode: string
  date: string
  verified?: boolean
}

const API_DOMAIN = 'https://tmemory.griffen.codes'

/**
 * Submits a score to the API server.
 *
 * @param score - The score object to be submitted to the server
 * @returns A Promise that resolves to the parsed JSON response from the server
 * @throws Error When the server responds with a non-OK status, with details about the failure
 */
export async function submitScore(score: Score): Promise<any> {
  const response = await fetch(`${API_DOMAIN}/api/scores/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(score),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error('Failed to submit score: ' + errorData.message)
  }
  return response.json()
}

/**
 * Fetch the leaderboard from the API using optional filters.
 *
 * @param filters - An optional object containing filtering criteria:
 *   - gameMode: (optional) Specifies the game mode to filter scores.
 *   - rows: (optional) Specifies the number of rows to filter the leaderboard.
 *   - cols: (optional) Specifies the number of columns to filter the leaderboard.
 *
 * @returns A promise that resolves with the JSON response of the leaderboard data.
 *
 * @throws Will throw an error if the response from the API is not ok.
 */
export async function fetchLeaderboard(
  filters: { gameMode?: string; rows?: number; cols?: number } = {}
): Promise<any> {
  const params = new URLSearchParams()
  if (filters.gameMode) params.append('gameMode', filters.gameMode)
  if (filters.rows) params.append('rows', filters.rows.toString())
  if (filters.cols) params.append('cols', filters.cols.toString())

  const response = await fetch(
    `${API_DOMAIN}/api/scores/leaderboard?` + params.toString()
  )
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error('Failed to fetch leaderboard: ' + errorData.message)
  }
  return response.json()
}
