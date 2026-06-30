const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error")
    throw new Error(`API error (${res.status}): ${errorText}`)
  }
  return res.json()
}

export const api = {
  // Goals
  async getGoals(userId: string) {
    return safeFetch(`${API_URL}/api/goals?user_id=${userId}`)
  },

  async getGoal(goalId: string) {
    return safeFetch(`${API_URL}/api/goals/${goalId}`)
  },

  async createGoal(data: {
    title: string
    deadline: string
    daily_hours: number
    user_id: string
    description?: string
  }) {
    return safeFetch(`${API_URL}/api/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  },

  async generatePlan(goalId: string, file?: File) {
    const formData = new FormData()
    if (file) formData.append("file", file)

    return safeFetch(`${API_URL}/api/goals/${goalId}/generate`, {
      method: "POST",
      body: formData
    })
  },

  async parseVoiceGoal(transcript: string) {
    return safeFetch(`${API_URL}/api/goals/parse-voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript })
    })
  },


  async getGoalHealth(goalId: string) {
    return safeFetch(`${API_URL}/api/health/${goalId}`)
  },

  async getAgentEvents(goalId: string) {
    return safeFetch(`${API_URL}/api/goals/${goalId}/agents`)
  },

  async getFocusTasks(goalId: string) {
    return safeFetch(`${API_URL}/api/goals/${goalId}/focus`)
  },

  async completeTask(taskId: string) {
    return safeFetch(`${API_URL}/api/tasks/${taskId}/complete`, {
      method: "PATCH"
    })
  },

  async skipTask(taskId: string) {
    return safeFetch(`${API_URL}/api/tasks/${taskId}/skip`, {
      method: "PATCH"
    })
  },

  async getInterventions(userId: string) {
    return safeFetch(`${API_URL}/api/interventions?user_id=${userId}`)
  },

  async acceptIntervention(id: string, accessToken?: string) {
    return safeFetch(`${API_URL}/api/interventions/${id}/accept`, {
      method: "POST",
      headers: accessToken ? { "Content-Type": "application/json" } : undefined,
      body: accessToken ? JSON.stringify({ access_token: accessToken }) : undefined
    })
  },

  async dismissIntervention(id: string) {
    return safeFetch(`${API_URL}/api/interventions/${id}/dismiss`, {
      method: "POST"
    })
  },

  async analyzeGoal(goalId: string) {
    return safeFetch(`${API_URL}/api/health/${goalId}/analyze`, {
      method: "POST"
    })
  },

  async getInsights(userId: string) {
    return safeFetch(`${API_URL}/api/insights/latest?user_id=${userId}`)
  },

  async generateInsights(userId: string) {
    return safeFetch(`${API_URL}/api/insights/generate?user_id=${userId}`, {
      method: "POST"
    })
  },

  async getHealthHistory(goalId: string) {
    return safeFetch(`${API_URL}/api/health/${goalId}/history`)
  },

  // SSE stream for real-time agent events
  streamAgentEvents(goalId: string, onEvent: (event: any) => void) {
    const eventSource = new EventSource(
      `${API_URL}/api/goals/${goalId}/agents/stream`
    )

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onEvent(data)
      } catch {
        // ignore parse errors
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return eventSource
  },

  async syncCalendar(goalId: string, accessToken?: string) {
    return safeFetch(`${API_URL}/api/goals/${goalId}/sync-calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken || undefined })
    })
  },

  async syncGoalsFromCalendar(accessToken: string | undefined, userId: string) {
    return safeFetch(`${API_URL}/api/goals/sync-from-calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken || undefined, user_id: userId })
    })
  },

  async seedDemoData(userId: string, email: string) {
    return safeFetch(`${API_URL}/api/goals/seed-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, email })
    })
  },

  async clearDemoData(userId: string, email: string) {
    return safeFetch(`${API_URL}/api/goals/clear-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, email })
    })
  },

  // Settings
  async getSettings(userId: string) {
    return safeFetch(`${API_URL}/api/settings?user_id=${userId}`)
  },

  async updateSettings(userId: string, settings: {
    whatsapp_number?: string
    notification_email?: string
    whatsapp_enabled?: boolean
    email_enabled?: boolean
    pushover_user_key?: string
    pushover_enabled?: boolean
    telegram_chat_id?: string
    telegram_enabled?: boolean
    gemini_api_key?: string
    google_calendar_enabled?: boolean
  }) {
    return safeFetch(`${API_URL}/api/settings?user_id=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    })
  },

  async triggerTestAlert(channel: string, body?: { access_token?: string; user_email?: string; user_id?: string }) {
    return safeFetch(`${API_URL}/api/interventions/test-alert?channel=${channel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    })
  }
}
