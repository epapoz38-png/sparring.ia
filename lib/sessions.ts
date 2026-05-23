import { PersonaDetails } from './types'

export type DecodedSession = {
  subject: string
  persona: PersonaDetails | null
}

export function encodeSession(subject: string, persona: PersonaDetails): string {
  return JSON.stringify({ v: 1, subject, persona })
}

export function decodeSession(situation: string): DecodedSession {
  try {
    const json = JSON.parse(situation)
    if (json.v === 1 && json.subject) {
      return { subject: json.subject, persona: json.persona ?? null }
    }
  } catch {}
  // Ancien format : situation est une chaîne brute
  return { subject: situation, persona: null }
}
