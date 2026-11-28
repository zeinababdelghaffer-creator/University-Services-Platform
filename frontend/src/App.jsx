import { useEffect, useRef, useState } from 'react'
import { ROUTES, NAMES } from './schema.js'
import * as api from './api.js'
import ResourcePage from './components/ResourcePage.jsx'
import EnrollmentsPage from './components/EnrollmentsPage.jsx'

const currentPage = () => {
  const h = location.hash.slice(1)
  return ROUTES.includes(h) ? h : 'departments'
}

export default function App() {
  const [page, setPage] = useState(currentPage)
  const [base, setBaseInput] = useState(api.getBase())
  const [connKey, setConnKey] = useState(0) // bump to reload pages after Connect
  const [toast, setToast] = useState(null)
  const timer = useRef()

  useEffect(() => {
    const onHash = () => setPage(currentPage())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const notify = (msg, isErr = false) => {
    setToast({ msg, isErr })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 3500)
  }

  return (
    <div className="app">
      <aside className="side">
        <h1>Campus Desk</h1>
        <nav aria-label="Sections" id="nav">
          {ROUTES.map((r) => (
            <a key={r} href={'#' + r} aria-current={r === page ? 'page' : undefined}>{NAMES[r]}</a>
          ))}
        </nav>
        <div className="conn">
          <label htmlFor="base">API base URL</label>
          <input id="base" value={base} onChange={(e) => setBaseInput(e.target.value)} placeholder="Empty = demo data" />
          <button type="button" onClick={() => { api.setBase(base); setConnKey((k) => k + 1) }}>Connect</button>
          
        </div>
      </aside>
      <main tabIndex={-1}>
        {page === 'enrollments'
          ? <EnrollmentsPage key={page + connKey} notify={notify} />
          : <ResourcePage key={page + connKey} name={page} notify={notify} />}
      </main>
      <div id="toast" role="status" aria-live="polite" className={toast ? 'show' + (toast.isErr ? ' err' : '') : ''}>{toast?.msg}</div>
    </div>
  )
}