import { useState } from 'react'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { submitInquiry } from '../api/wholesale'
import './WholesaleInquiry.css'

const BUSINESS_TYPES = [
  'Cafe or coffee shop',
  'Restaurant or bakery',
  'Retail shop or grocer',
  'Event or catering',
  'Individual',
  'Other',
]

const EMPTY_FORM = {
  contactName: '',
  email: '',
  phone: '',
  businessName: '',
  businessType: '',
  location: '',
  monthlyVolume: '',
  message: '',
  wantsPricing: true,
}

function WholesaleInquiry() {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (!formData.businessType) {
      setMessage('Please choose your type of business.')
      return
    }

    setSubmitting(true)

    try {
      await submitInquiry({
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        location: formData.location.trim(),
        monthlyVolume: formData.monthlyVolume.trim(),
        message: formData.message.trim(),
        wantsPricing: formData.wantsPricing,
      })

      setSent(true)
      setFormData(EMPTY_FORM)
    } catch (error) {
      if (error.status) {
        setMessage(error.message)
      } else {
        setMessage('Unable to connect to the backend. Make sure the backend is running.')
      }
    }

    setSubmitting(false)
  }

  return (
    <>
      <Header />

      <main className="inquiry-page">
        <p className="inquiry-eyebrow">Wholesale</p>
        <h1>Request wholesale pricing</h1>
        <p className="inquiry-intro">
          Tell us about your business and what you're looking for. We'll review
          your request and get back to you.
        </p>

        {sent ? (
          <Card title="Thank you!">
            <p>
              We've received your request. An M.CHA team member will review it
              and be in touch soon.
            </p>
            <Button href="/wholesale">Back to wholesale</Button>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit}>
              <h2 className="inquiry-heading">Contact details</h2>

              <FormField
                label="Your name"
                name="contactName"
                type="text"
                autoComplete="name"
                value={formData.contactName}
                onChange={handleChange}
                required
              />

              <div className="inquiry-row">
                <FormField
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <FormField
                  label="Phone (optional)"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <h2 className="inquiry-heading">Business details</h2>

              <FormField
                label="Business name"
                name="businessName"
                type="text"
                autoComplete="organization"
                value={formData.businessName}
                onChange={handleChange}
                required
              />

              <div className="field">
                <label htmlFor="businessType" className="field__label">Type of business</label>
                <select
                  id="businessType"
                  name="businessType"
                  className="input"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose one</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="inquiry-row">
                <FormField
                  label="Location (city, state)"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
                <FormField
                  label="Estimated monthly amount (optional)"
                  name="monthlyVolume"
                  type="text"
                  hint="For example, 2 kg per month"
                  value={formData.monthlyVolume}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="inquiryMessage" className="field__label">
                  Questions or details (optional)
                </label>
                <textarea
                  id="inquiryMessage"
                  name="message"
                  className="input inquiry-textarea"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <label className="inquiry-checkbox">
                <input
                  type="checkbox"
                  name="wantsPricing"
                  checked={formData.wantsPricing}
                  onChange={handleChange}
                />
                <span>I'd like to receive wholesale pricing</span>
              </label>

              {message && <p className="inquiry-error" role="alert">{message}</p>}

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send request'}
              </Button>
            </form>
          </Card>
        )}
      </main>
    </>
  )
}

export default WholesaleInquiry