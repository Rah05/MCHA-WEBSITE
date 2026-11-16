import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import FormField from '../components/ui/FormField'

function DesignSystem() {
  return (
    <main style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>M.CHA Design System</h1>

      <h2>Buttons</h2>
      <p>
        <Button href="/shop">Shop M.CHA</Button>{' '}
        <Button variant="secondary">Secondary</Button>{' '}
        <Button disabled>Disabled</Button>
      </p>

      <h2>Card</h2>
      <Card title="Ceremonial matcha">Sample card content.</Card>

      <h2>Form fields</h2>
      <Card>
        <FormField label="Email" type="email" hint="We never share your email." />
        <FormField label="Password" type="password" error="Incorrect email or password." />
      </Card>
    </main>
  )
}

export default DesignSystem