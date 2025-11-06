import React from 'react'
import Hero from './components/Hero.jsx'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: 1.4, padding: 24 }}>
      <Hero />
      <section style={{ marginTop: 24 }}>
        <h2>Project Structure</h2>
        <ul>
          <li><code>src/components</code> – UI and frontend components</li>
          <li><code>src/services</code> – API and backend-facing logic</li>
          <li><code>src/utils</code> – Utilities and shared helpers</li>
        </ul>
      </section>
    </div>
  )
}

