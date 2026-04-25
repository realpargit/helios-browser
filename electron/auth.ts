import { safeStorage, shell } from 'electron'
import { createServer, Server } from 'http'
import { createHash, randomBytes } from 'crypto'
import express from 'express'
import type { BrowserWindow } from 'electron'
import type { Storage, StoredUser } from './storage'

interface TokenSet {
  access_token: string
  refresh_token: string
  id_token: string
  expires_at: number
}

export interface UserInfo {
  sub: string
  email: string
  name: string
  picture: string
}

const REDIRECT_URI = 'http://localhost:7777/auth/callback'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const CALLBACK_TIMEOUT_MS = 2 * 60 * 1000

export class GoogleAuthManager {
  private storage: Storage
  private mainWindow: BrowserWindow | null = null
  private server: Server | null = null
  private pendingState: string | null = null
  private pendingVerifier: string | null = null
  private clientId: string

  constructor(storage: Storage) {
    this.storage = storage
    this.clientId = process.env.GOOGLE_CLIENT_ID || ''
  }

  setWindow(win: BrowserWindow) {
    this.mainWindow = win
  }

  async initialize(): Promise<UserInfo | null> {
    if (!safeStorage.isEncryptionAvailable()) return null
    const tokens = this.decryptTokens()
    if (!tokens) return null

    if (Date.now() > tokens.expires_at - 60_000) {
      const refreshed = await this.refreshTokens(tokens.refresh_token)
      if (!refreshed) {
        this.storage.clearTokens()
        return null
      }
    }

    const profile = this.storage.getUserProfile()
    if (!profile) return null
    return { ...profile }
  }

  async signIn(): Promise<void> {
    if (!this.clientId) {
      console.error('[Auth] GOOGLE_CLIENT_ID is not set')
      return
    }

    const { verifier, challenge } = this.generatePKCE()
    const state = randomBytes(16).toString('hex')
    this.pendingVerifier = verifier
    this.pendingState = state

    const url = this.buildAuthURL(challenge, state)
    shell.openExternal(url)

    let result: { code: string; state: string }
    try {
      result = await this.startCallbackServer()
    } catch (err) {
      console.error('[Auth] Callback server error:', err)
      this.pendingVerifier = null
      this.pendingState = null
      return
    }

    if (result.state !== this.pendingState) {
      console.error('[Auth] State mismatch — possible CSRF')
      return
    }

    let tokens: TokenSet
    try {
      tokens = await this.exchangeCode(result.code, verifier)
    } catch (err) {
      console.error('[Auth] Token exchange failed:', err)
      return
    }

    const user = this.parseIdToken(tokens.id_token)
    this.encryptAndStore(tokens, user)
    this.broadcastAuthChange(user)
  }

  async signOut(): Promise<void> {
    this.storage.clearTokens()
    this.broadcastAuthChange(null)
  }

  private generatePKCE(): { verifier: string; challenge: string } {
    const verifier = randomBytes(48).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    return { verifier, challenge }
  }

  private buildAuthURL(challenge: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      access_type: 'offline',
      prompt: 'consent'
    })
    return `${AUTH_ENDPOINT}?${params.toString()}`
  }

  private startCallbackServer(): Promise<{ code: string; state: string }> {
    return new Promise((resolve, reject) => {
      const app = express()
      let settled = false

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true
          this.server?.close()
          this.server = null
          reject(new Error('OAuth timeout — user did not complete sign-in'))
        }
      }, CALLBACK_TIMEOUT_MS)

      app.get('/auth/callback', (req, res) => {
        const { code, state, error } = req.query as Record<string, string>

        res.setHeader('Content-Type', 'text/html')
        res.end(`<!DOCTYPE html><html><body style="background:#0f0f0f;color:#e8e8e8;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <h2 style="font-weight:400;margin-bottom:8px">${error ? 'Sign in cancelled' : 'Signed in successfully'}</h2>
            <p style="color:#666;font-size:14px">You can close this tab and return to Helios.</p>
          </div>
        </body></html>`)

        if (!settled) {
          settled = true
          clearTimeout(timer)
          this.server?.close()
          this.server = null
          if (error || !code) {
            reject(new Error(error || 'No code returned'))
          } else {
            resolve({ code, state })
          }
        }
      })

      const httpServer = app.listen(7777, '127.0.0.1', () => {
        this.server = httpServer
      })

      httpServer.on('error', (err) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(err)
        }
      })
    })
  }

  private async exchangeCode(code: string, verifier: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: verifier
    })

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Token exchange failed: ${res.status} ${text}`)
    }

    const data = await res.json() as any
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      id_token: data.id_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000
    }
  }

  private async refreshTokens(refreshToken: string): Promise<boolean> {
    if (!refreshToken) return false
    try {
      const body = new URLSearchParams({
        client_id: this.clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
      const res = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      })
      if (!res.ok) return false
      const data = await res.json() as any
      const existing = this.decryptTokens()
      if (!existing) return false
      const updated: TokenSet = {
        ...existing,
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        ...(data.refresh_token ? { refresh_token: data.refresh_token } : {})
      }
      if (safeStorage.isEncryptionAvailable()) {
        const blob = safeStorage.encryptString(JSON.stringify(updated))
        this.storage.storeTokens(blob.toString('base64'))
      }
      return true
    } catch {
      return false
    }
  }

  private parseIdToken(idToken: string): UserInfo {
    const payload = idToken.split('.')[1]
    const decoded = Buffer.from(payload, 'base64url').toString('utf8')
    const claims = JSON.parse(decoded)
    return {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      picture: claims.picture
    }
  }

  private encryptAndStore(tokens: TokenSet, user: UserInfo) {
    if (safeStorage.isEncryptionAvailable()) {
      const blob = safeStorage.encryptString(JSON.stringify(tokens))
      this.storage.storeTokens(blob.toString('base64'))
    }
    const profile: StoredUser = { sub: user.sub, email: user.email, name: user.name, picture: user.picture }
    this.storage.storeUserProfile(profile)
  }

  private decryptTokens(): TokenSet | null {
    if (!safeStorage.isEncryptionAvailable()) return null
    const b64 = this.storage.loadEncryptedTokens()
    if (!b64) return null
    try {
      const buf = Buffer.from(b64, 'base64')
      const json = safeStorage.decryptString(buf)
      return JSON.parse(json) as TokenSet
    } catch {
      return null
    }
  }

  private broadcastAuthChange(user: UserInfo | null) {
    this.mainWindow?.webContents.send('auth-changed', user)
  }
}
