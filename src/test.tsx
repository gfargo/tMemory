import test from 'ava'
import { render } from 'ink-testing-library'
import React from 'react'
import App from './App.js'

test('basic test', (t) => {
  const { lastFrame } = render(<App />)
  t.snapshot(lastFrame)
})
