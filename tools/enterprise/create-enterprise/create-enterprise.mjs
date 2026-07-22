/**
 * createEnterprise Callable を support 権限で実行する運用 CLI。
 *
 * Usage:
 *   cd functions/default
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/adminsdk.json
 *   export FIREBASE_PROJECT_ID=bokudeli-event-yasu-2510
 *   export FIREBASE_API_KEY=...
 *   export SUPPORT_UID=...   # configs/global.support_user_ids のいずれか
 *   node ../../tools/enterprise/create-enterprise/create-enterprise.mjs \
 *     --payload ../../tools/enterprise/create-enterprise/payload.local.json
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const DEFAULT_REGION = 'asia-northeast1'

function usage() {
  console.error(`Usage: create-enterprise.mjs --payload <path> [--dry-run]

Environment variables (required unless noted):
  GOOGLE_APPLICATION_CREDENTIALS  Service account JSON path
  FIREBASE_PROJECT_ID             Firebase project ID
  FIREBASE_API_KEY                Web API Key (enterprise/.env.* の VITE_API_KEY)
  SUPPORT_UID                     Support user UID (configs/global.support_user_ids)
  FIREBASE_FUNCTIONS_REGION       Optional. Default: ${DEFAULT_REGION}`)
}

function parseArgs(argv) {
  let payloadPath
  let dryRun = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--payload') {
      payloadPath = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--dry-run') {
      dryRun = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    }
    console.error(`Unknown argument: ${arg}`)
    usage()
    process.exit(1)
  }

  if (payloadPath == null || payloadPath === '') {
    usage()
    process.exit(1)
  }

  return {
    payloadPath: resolve(payloadPath),
    dryRun,
  }
}

function requireEnv(name) {
  const value = process.env[name]
  if (value == null || value.trim() === '') {
    console.error(`${name} is required`)
    usage()
    process.exit(1)
  }
  return value.trim()
}

const { payloadPath, dryRun } = parseArgs(process.argv.slice(2))

const credPath = requireEnv('GOOGLE_APPLICATION_CREDENTIALS')
const projectId = requireEnv('FIREBASE_PROJECT_ID')
const apiKey = requireEnv('FIREBASE_API_KEY')
const supportUid = requireEnv('SUPPORT_UID')
const region = process.env.FIREBASE_FUNCTIONS_REGION?.trim() || DEFAULT_REGION

const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'))
const payload = JSON.parse(readFileSync(payloadPath, 'utf8'))

if (dryRun) {
  console.log(
    JSON.stringify(
      {
        projectId,
        region,
        supportUid,
        payloadPath,
        payload,
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

initializeApp({
  credential: cert(serviceAccount),
  projectId,
})

const customToken = await getAuth().createCustomToken(supportUid)

const signInRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  },
)
const signInJson = await signInRes.json()
if (!signInRes.ok) {
  console.error('signInWithCustomToken failed:', signInJson)
  process.exit(1)
}

const idToken = signInJson.idToken

const callableRes = await fetch(`https://${region}-${projectId}.cloudfunctions.net/createEnterprise`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({ data: payload }),
})
const callableJson = await callableRes.json()
if (!callableRes.ok) {
  console.error('createEnterprise failed:', callableJson)
  process.exit(1)
}

console.log(JSON.stringify(callableJson, null, 2))
