/**
 * Configuration Error
 *
 * Custom error for fail-fast on missing or invalid configuration.
 * Used when required environment variables or credentials are not available.
 *
 * Unlike standard HTTP errors, this error:
 * - Logs at ERROR level (indicates server misconfiguration)
 * - Returns 503 Service Unavailable (service is not properly configured)
 * - Includes details about what's missing for debugging
 */
import { HttpException, HttpStatus } from '@nestjs/common'

export class ConfigurationError extends HttpException {
  /**
   * Required environment variables that are missing
   */
  public readonly missingEnvVars: string[]

  /**
   * Provider or service that failed to configure
   */
  public readonly provider: string

  constructor(message: string, provider: string, missingEnvVars: string[] = []) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Configuration Error',
        message,
        provider,
        missingEnvVars,
      },
      HttpStatus.SERVICE_UNAVAILABLE
    )

    this.provider = provider
    this.missingEnvVars = missingEnvVars
    this.name = 'ConfigurationError'
  }

  /**
   * Create error for missing environment variables
   */
  static missingEnvVars(provider: string, envVars: string[]): ConfigurationError {
    const message = `${provider} credentials not configured. Required env vars: ${envVars.join(', ')}`
    return new ConfigurationError(message, provider, envVars)
  }

  /**
   * Create error for invalid configuration
   */
  static invalidConfig(provider: string, reason: string): ConfigurationError {
    const message = `${provider} configuration is invalid: ${reason}`
    return new ConfigurationError(message, provider)
  }
}
