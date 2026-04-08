/**
 * Telemetry Stub
 *
 * No-op implementations for telemetry functions removed during extraction.
 */

export async function maybeShowTelemetryNotice(): Promise<void> {
  // no-op
}

export async function trackCommand(_command: string, _version?: string): Promise<void> {
  // no-op
}

export async function shutdown(): Promise<void> {
  // no-op
}
