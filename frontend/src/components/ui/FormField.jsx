import { useId } from 'react'
import Input from './Input'
import './Form.css'

function FormField({ label, error, hint, ...inputProps }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">{label}</label>
      <Input id={id} invalid={Boolean(error)} {...inputProps} />
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  )
}

export default FormField