import './Card.css'
import '../../styles/tokens.css'

function Card({ title, className = '', children }) {
  return (
    <section className={`card ${className}`.trim()}>
      {title && <h3 className="card__title">{title}</h3>}
      {children}
    </section>
  )
}

export default Card