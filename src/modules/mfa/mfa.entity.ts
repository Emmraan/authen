/**
 * MFA Entity - Phase-3.1.a foundation
 *
 * This entity represents the MFA configuration for a user.
 * At this stage, no MFA functionality is active - this is schema-only preparation.
 */
export class Mfa {
    id!: string
    userId!: string
    mfaEnabled!: boolean
    totpSecretEncrypted?: string | null
    backupCodesHash?: string[] | null // Will store as JSONB array
    createdAt!: Date
    verifiedAt?: Date | null
}
