import { useCallback, useEffect, useState } from 'react'
import * as api from '../api.js'
import { SCHEMA, LABEL } from '../schema.js'
import FormDialog from './FormDialog.jsx'

const show = (key, v) => (v == null || v === '' ? '—' : key === 'gpa' || key === 'total_gpa' ? Number(v).toFixed(2) : String(v))

export default function ResourcePage({ name, notify }) {
  const cfg = SCHEMA[name]
  const [rows, setRows] = useState([])
  const [refData, setRefData] = useState({})
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, row = edit
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const refs = [...new Set(cfg.fields.filter((f) => f.ref).map((f) => f.ref))]
    Promise.all(refs.map(async (r) => [r, await api.list(r)]))
      .then((pairs) => setRefData(Object.fromEntries(pairs)))
      .catch((e) => setLoadError(e.message))
    if (cfg.filter) api.list('departments').then(setDepartments).catch(() => {})
  }, [cfg])

  const load = useCallback(async () => {
    try {
      const params = { search }
      if (cfg.filter) params[cfg.filter] = dept
      setRows(await api.list(name, params))
      setLoadError('')
    } catch (e) { setLoadError(e.message) }
  }, [name, cfg, search, dept])
  useEffect(() => { load() }, [load])

  const refName = (ref, id) => (refData[ref] || []).find((x) => x.id === id)?.[LABEL[ref]] ?? '—'
  const attempt = async (fn) => { try { await fn() } catch (e) { notify(e.message, true) } }

  const save = (data) => attempt(async () => {
    if (editing.id) await api.update(name, editing.id, data)
    else await api.create(name, data)
    setEditing(null); notify('Saved'); await load()
  })
  const del = (r) => attempt(async () => {
    if (!confirm('Delete this record? Related data may also be removed.')) return
    await api.remove(name, r.id); notify('Deleted'); await load()
  })

  return (
    <>
      <div className="head">
        <div><h2>{cfg.title}</h2><p className="sub">{cfg.sub}</p></div>
        <div className="tools">
          <input type="search" placeholder="Search…" aria-label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          {cfg.filter && (
            <select aria-label="Filter by department" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button className="primary" onClick={() => setEditing({})}>Add</button>
        </div>
      </div>
      {loadError ? (
        <div className="empty">Could not load data: {loadError}. Check the API base URL, or clear it to use demo data.</div>
      ) : rows.length === 0 ? (
        <div className="empty">No {cfg.title.toLowerCase()} found. Use “Add” to create the first one.</div>
      ) : (
        <div className="wrap">
          <table>
            <thead><tr>{cfg.fields.map((f) => <th key={f.key}>{f.label}</th>)}<th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {cfg.fields.map((f) => <td key={f.key}>{f.ref ? refName(f.ref, r[f.key]) : show(f.key, r[f.key])}</td>)}
                  <td className="act">
                    <button className="small" onClick={() => setEditing(r)}>Edit</button>
                    <button className="small danger" onClick={() => del(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <FormDialog name={name} cfg={cfg} row={editing.id ? editing : null} refData={refData} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}