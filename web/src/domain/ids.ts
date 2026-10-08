/**
 * Invite codes, avatars and small id helpers.
 */

import type { Member, UserProfile } from './types';

/**
 * Alphabet with no characters that are easy to confuse when read aloud or
 * copied off a screen: no 0/O, 1/I/L, 5/S, 8/B, 2/Z.
 */
const CODE_ALPHABET = '34679ACDEFGHJKMNPQRTUVWXY';

export const INVITE_CODE_LENGTH = 6;

/** Uses `crypto.getRandomValues` where available so codes are not predictable. */
export function generateInviteCode(length = INVITE_CODE_LENGTH): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

function randomInt(bound: number): number {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj?.getRandomValues) {
    const buffer = new Uint32Array(1);
    cryptoObj.getRandomValues(buffer);
    return buffer[0]! % bound;
  }
  return Math.floor(Math.random() * bound);
}

/** Normalise whatever the user typed or scanned into a comparable code. */
export function normaliseInviteCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter((ch) => CODE_ALPHABET.includes(ch))
    .join('')
    .slice(0, INVITE_CODE_LENGTH);
}

export function isValidInviteCode(input: string): boolean {
  return normaliseInviteCode(input).length === INVITE_CODE_LENGTH;
}

/** Deterministic 0-based bucket, so a person keeps the same avatar colour. */
export function avatarBucket(key: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % buckets;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export type AnyMemberish = Pick<Member, 'uid' | 'displayName' | 'photoURL'> | UserProfile;

/** The label to show for a member who has since left or been removed. */
export function displayNameOf(
  uid: string,
  members: readonly AnyMemberish[],
  fallback = 'Someone',
): string {
  return members.find((m) => m.uid === uid)?.displayName || fallback;
}

export function photoOf(uid: string, members: readonly AnyMemberish[]): string | null {
  return members.find((m) => m.uid === uid)?.photoURL ?? null;
}

/** A stable key for list rendering and per-user memoisation. */
export function memberKey(uid: string, members: readonly AnyMemberish[]): string {
  return `${uid}:${displayNameOf(uid, members)}`;
}
