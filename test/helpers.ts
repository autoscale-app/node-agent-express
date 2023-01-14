export function setup() {
  jest.useRealTimers()
  jest.restoreAllMocks()
}

export function travelTo(datetime: string) {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(datetime))
}

export function travel(distance: number) {
  jest.advanceTimersByTime(distance)
}

export const PLATFORM = "render"
export const OPTIONS = { run: false }
export const TOKEN = "u4quBFgM72qun74EwashWv6Ll5TzhBVktVmicoWoXla"
