'use strict'

/**
 * Thin wrappers reusing the existing AES-256-GCM helpers from server/index.js.
 * We can't require index.js directly (circular), so we duplicate just the
 * two small functions here. Key is the same SSN_ENCRYPTION_KEY env var.
 */

const crypto = require('crypto')

function getKey() {
  const hex = process.env.SSN_ENCRYPTION_KEY
  if (!hex) return null
  const buf = Buffer.from(hex, 'hex')
  if (buf.length !== 32) throw new Error('SSN_ENCRYPTION_KEY must be 64 hex chars')
  return buf
}

function ssnEncrypt(plaintext) {
  const key = getKey()
  if (!key) return null
  const iv     = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

function ssnDecrypt(ct) {
  const key = getKey()
  if (!key || !ct) return null
  const parts = ct.split(':')
  if (parts.length !== 3) return null
  try {
    const iv       = Buffer.from(parts[0], 'base64')
    const tag      = Buffer.from(parts[1], 'base64')
    const enc      = Buffer.from(parts[2], 'base64')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch { return null }
}

module.exports = { ssnEncrypt, ssnDecrypt }
