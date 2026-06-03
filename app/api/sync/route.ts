import { NextRequest, NextResponse } from 'next/server'

const ORDS_BASE = process.env.ORACLE_ORDS_URL!
const ORACLE_USER = process.env.ORACLE_USER!
const ORACLE_PASS = process.env.ORACLE_PASS!
const COLLECTION = 'e360_state'

function authHeader() {
  return 'Basic ' + Buffer.from(`${ORACLE_USER}:${ORACLE_PASS}`).toString('base64')
}

function sanitizeKey(key: string): string {
  // Only allow alphanumeric, dash, underscore — max 40 chars
  return key.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default'
}

// GET — restore state from Oracle
export async function GET(req: NextRequest) {
  try {
    const userKey = sanitizeKey(req.nextUrl.searchParams.get('key') || 'main')
    const url = `${ORDS_BASE}/soda/latest/${COLLECTION}/${userKey}`
    const res = await fetch(url, {
      headers: { Authorization: authHeader(), Accept: 'application/json' },
      cache: 'no-store',
    })

    if (res.status === 404) return NextResponse.json({ found: false })
    if (!res.ok) return NextResponse.json({ error: 'DB read failed' }, { status: 502 })

    const data = await res.json()
    return NextResponse.json({ found: true, state: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PUT — save state to Oracle
export async function PUT(req: NextRequest) {
  try {
    const userKey = sanitizeKey(req.nextUrl.searchParams.get('key') || 'main')
    const body = await req.json()
    const url = `${ORDS_BASE}/soda/latest/${COLLECTION}/${userKey}`

    let res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 404) {
      await fetch(`${ORDS_BASE}/soda/latest/${COLLECTION}`, {
        method: 'POST',
        headers: {
          Authorization: authHeader(),
          'Content-Type': 'application/json',
          'X-ORDS-KEY': userKey,
        },
        body: JSON.stringify(body),
      })
      return NextResponse.json({ ok: true, created: true })
    }

    if (!res.ok) return NextResponse.json({ error: 'DB write failed' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
