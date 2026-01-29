import { Module } from '@nestjs/common'

/**
 * MFA Module - Phase-3.1.a foundation
 *
 * This module provides the infrastructure for Multi-Factor Authentication.
 * At this stage, it only exports the entity/schema - no services or controllers are implemented.
 *
 * Future increments will add:
 * - MFA repository (Postgres/in-memory)
 * - MFA service (TOTP generation, verification)
 * - MFA controller (enable/disable/verify endpoints)
 */
@Module({
    providers: [],
    exports: [],
})
export class MfaModule {}
