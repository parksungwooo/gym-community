export class AppServiceError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'AppServiceError'
    this.cause = options.cause ?? null
    this.operation = options.operation ?? 'service_request'
    this.code = options.code ?? null
    this.details = options.details ?? null
    this.hint = options.hint ?? null
    this.status = options.status ?? null
  }
}

export function toServiceError(error, operation) {
  if (error instanceof AppServiceError) return error

  return new AppServiceError(error?.message || 'Service request failed.', {
    cause: error,
    operation,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  })
}

export function assertServiceSuccess(error, operation) {
  if (error) {
    throw toServiceError(error, operation)
  }
}
