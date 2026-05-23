import { useEffect, useMemo, useRef, useState } from 'react'
import { onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { tokenDoc } from './firebase'
import './App.css'

const DEFAULT_TOKEN = '0'
const CLIENT_ID_KEY = 'token-client-id'

const getClientId = () => {
  if (typeof window === 'undefined') {
    return 'server'
  }

  const existing = window.sessionStorage.getItem(CLIENT_ID_KEY)
  if (existing) {
    return existing
  }

  const randomId = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`
  window.sessionStorage.setItem(CLIENT_ID_KEY, randomId)
  return randomId
}

const sanitizeToken = (rawValue) => {
  const digitsOnly = rawValue.replace(/\D/g, '')
  return digitsOnly.replace(/^0+(?=\d)/, '')
}

const speakToken = (tokenValue) => {
  if (!('speechSynthesis' in window)) {
    return
  }

  const utterance = new SpeechSynthesisUtterance(`token no ${tokenValue}`)
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

function App() {
  const clientId = useMemo(() => getClientId(), [])
  const [tokenValue, setTokenValue] = useState(DEFAULT_TOKEN)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(tokenDoc, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : null
      const rawToken = data?.token
      const numericToken =
        typeof rawToken === 'number' && Number.isFinite(rawToken)
          ? rawToken
          : Number.parseInt(String(rawToken ?? ''), 10)
      const nextToken = Number.isFinite(numericToken)
        ? String(numericToken)
        : DEFAULT_TOKEN

      setTokenValue(nextToken)

      const isInitial = !hasLoadedRef.current
      hasLoadedRef.current = true

      const isRemoteUpdate = data?.updatedBy && data.updatedBy !== clientId
      if (!isInitial && isRemoteUpdate) {
        speakToken(nextToken)
      }
    })

    return () => unsubscribe()
  }, [clientId])

  const handleChange = (event) => {
    const cleaned = sanitizeToken(event.target.value)
    const nextToken = cleaned === '' ? DEFAULT_TOKEN : cleaned

    if (nextToken === tokenValue) {
      return
    }

    setTokenValue(nextToken)

    const numericToken = Number.parseInt(nextToken, 10)
    if (!Number.isFinite(numericToken)) {
      return
    }

    void setDoc(
      tokenDoc,
      {
        token: numericToken,
        updatedBy: clientId,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  return (
    <main className="app">
      <input
        className="token-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={tokenValue}
        onChange={handleChange}
        aria-label="Token number"
      />
    </main>
  )
}

export default App
