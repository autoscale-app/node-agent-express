import type * as http from 'http'
import { type Agent, handle } from '@autoscale/agent'

type NextFunction = () => void

export function autoscale (agent: Agent) {
  return async function (request: http.IncomingMessage, response: http.ServerResponse, next: NextFunction) {
    const data = await handle(
      agent,
      {
        method: request.method ?? '',
        path: request.url ?? '',
        tokens: readHeader(request, 'autoscale-metric-tokens'),
        start: readHeader(request, 'x-request-start', 'x-queue-start')
      }
    )

    if (data != null) {
      response.writeHead(data.status, data.headers)
      response.write(data.body)
      response.end()
    } else {
      next()
    }
  }
}

function readHeader (request: http.IncomingMessage, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = request.headers[name]

    if (Array.isArray(value)) {
      return value[0]
    }

    if (value != null) {
      return value
    }
  }

  return undefined
}
