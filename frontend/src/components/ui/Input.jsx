import './Form.css'
import '../../styles/tokens.css'

function Input({ invalid = false, className = '', ...props }) {
  return (
    <input
      className={`input ${invalid ? 'input--invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export default Input