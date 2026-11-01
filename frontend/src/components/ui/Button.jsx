import './Button.css'
import '../../styles/tokens.css'

function Button({ variant = 'primary', href, type = 'button', className = '', children, ...props }) {
  const classes = `btn btn--${variant} ${className}`.trim()

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button