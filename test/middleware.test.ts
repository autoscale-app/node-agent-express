import express from "express"
import connect from "connect"
import httpMocks from "node-mocks-http"
import { autoscale } from "../src/middleware"
import { Agent } from "@autoscale/agent"
import { PLATFORM, OPTIONS, TOKEN, setup } from "./helpers"

beforeEach(setup)

test("use express", () => {
  express().use(autoscale(new Agent(PLATFORM, OPTIONS)))
})

test("use connect", () => {
  connect().use(autoscale(new Agent(PLATFORM, OPTIONS)))
})

test("default", async () => {
  const middleware = autoscale(new Agent(PLATFORM, OPTIONS))
  const request = httpMocks.createRequest()
  const response = httpMocks.createResponse()
  const next = jest.fn()
  await middleware(request, response, next)
  expect(next).toHaveBeenCalled()
  expect(response.statusCode).toBe(200)
  expect(response._getData()).toBe("")
})

test("serve", async () => {
  const agent = new Agent(PLATFORM, OPTIONS).serve(TOKEN, async () => 1.23)
  const middleware = autoscale(agent)
  const request = httpMocks.createRequest({
    path: "/autoscale",
    headers: {
      "autoscale-metric-tokens": `${TOKEN},invalid`
    }
  })
  const response = httpMocks.createResponse()
  const next = jest.fn()
  await middleware(request, response, next)
  expect(next).not.toHaveBeenCalled()
  expect(response.getHeaders()).toStrictEqual(
    {
      "content-length": "4",
      "cache-control": "must-revalidate, private, max-age=0",
      "content-type": "application/json"
    }
  )
  expect(response.statusCode).toBe(200)
  expect(response._getData()).toBe("1.23")
})

test("serve 404", async () => {
  const agent = new Agent(PLATFORM, OPTIONS).serve(TOKEN, async () => 1.23)
  const middleware = autoscale(agent)
  const request = httpMocks.createRequest({
    path: "/autoscale",
    headers: {
      "autoscale-metric-tokens": `invalid`
    }
  })
  const response = httpMocks.createResponse()
  const next = jest.fn()
  await middleware(request, response, next)
  expect(next).not.toHaveBeenCalled()
  expect(response.statusCode).toBe(404)
  expect(response._getData()).toBe("can't find token-associated worker server")
})

test("call record queue time", async () => {
  const agent = new Agent(PLATFORM, OPTIONS).dispatch(TOKEN)
  const middleware = autoscale(agent)
  const request = httpMocks.createRequest({
    path: "/",
    headers: {
      "x-request-start": String(Date.now())
    }
  })
  const response = httpMocks.createResponse()
  const next = jest.fn()
  await middleware(request, response, next)
  expect(next).toHaveBeenCalled()
  expect(response.statusCode).toBe(200)
  expect(response._getData()).toBe("")
  const dispatcher = agent.webDispatchers.queueTime
  if (dispatcher == null) { throw new Error("Expected dispatcher") }
  expect(dispatcher["buffer"].size).toBe(1)
})
