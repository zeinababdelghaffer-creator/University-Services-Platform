import { useEffect, useRef, useState } from 'react'
import { LABEL } from '../schema.js'
import { validate } from '../validate.js'

export default function FormDialog({ name, cfg, row, refData, onClose, onSave }) {
  const dlg = useRef()
  const [values, setValues] = useState(() => Object.fromEntries(cfg.fields.map((f) => [f.key, row?.[f.key] ?? ''])))
  const [errors, setErrors] = useState([])
  const single = cfg.title.toLowerCase().replace(/s$/, '')

  useEffect(() => {
    const d = dlg.current
    if (!d.open) d.showModal()
    return () => { if (d.open) d.close() }
  }, [])

  const submit = async () => {
    const data = {}
    for (const f of cfg.fields) {
      const v = values[f.key]
      data[f.key] = f.ref || f.type === 'number' ? (v === '' || v === null ? null : Number(v)) : String(v).trim()
    }
    const problems = validate(name, data)
    setErrors(problems)
    if (!problems.length) await onSave(data)
  }

  return (
    <dialog ref={dlg} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit() }}>
        <h3>{row ? `Edit ${single}` : `Add ${single}`}</h3>
        {cfg.fields.map((f) => (
          <label className="f" key={f.key}>
            {f.label}
            {f.ref ? (
              <select value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                <option value="">None</option>
                {(refData[f.ref] || []).map((o) => <option key={o.id} value={o.id}>{o[LABEL[f.ref]]}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} step={f.step} value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
            )}
          </label>
        ))}
        <ul className="errs" aria-live="polite">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        <div className="row">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Save changes</button>
        </div>
      </form>
    </dialog>
  )
}