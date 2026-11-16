// Add / edit product form shown in a dialog on the admin products page (SCRUM-63, SCRUM-64).
// Pass `product` to edit it, or leave it out to add a new one.
import { useEffect, useRef, useState } from 'react'
import { createProduct, updateProduct } from '../api/adminProducts'
import './ProductForm.css'

const PRODUCT_CATEGORIES = ['Matcha', 'Roasted tea', 'Teaware', 'Drinks (pop-up)']

// Form inputs hold text, so convert a product into strings for the inputs...
function toFormValues(product) {
  return {
    name: product?.name ?? '',
    category: product?.category ?? PRODUCT_CATEGORIES[0],
    description: product?.description ?? '',
    price: product?.price != null ? String(product.price) : '',
    wholesalePrice: product?.wholesalePrice != null ? String(product.wholesalePrice) : '',
    stock: product?.stock != null ? String(product.stock) : '0',
    stockLabel: product?.stockLabel ?? '',
    imageUrl: product?.imageUrl ?? '',
    isAvailable: product?.isAvailable ?? true,
  }
}

// ...and back into the types the API expects. Blank optional fields become null.
function toApiValues(values) {
  const optional = (text) => (text.trim() === '' ? null : text.trim())
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    description: optional(values.description),
    price: Number(values.price),
    wholesalePrice: values.wholesalePrice.trim() === '' ? null : Number(values.wholesalePrice),
    stock: Number(values.stock),
    stockLabel: optional(values.stockLabel),
    imageUrl: optional(values.imageUrl),
    isAvailable: values.isAvailable,
  }
}

const isMoney = (text) => /^\d+(\.\d{1,2})?$/.test(text.trim())

// Quick checks before calling the API, so common mistakes show next to the right field.
// The server checks everything again.
function findErrors(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Enter a product name'
  else if (values.name.trim().length > 150) errors.name = 'Use 150 characters or fewer'
  if (!values.category.trim()) errors.category = 'Choose a category'
  if (!isMoney(values.price)) errors.price = 'Enter a price like 18 or 18.50'
  if (values.wholesalePrice.trim() !== '' && !isMoney(values.wholesalePrice)) {
    errors.wholesalePrice = 'Enter a price like 12.50, or leave blank if not sold wholesale'
  }
  if (!/^\d+$/.test(values.stock.trim())) errors.stock = 'Enter a whole number, 0 or more'
  if (values.imageUrl.trim() && !/^https?:\/\/\S+$/i.test(values.imageUrl.trim())) {
    errors.imageUrl = 'Enter a link starting with http:// or https://'
  }
  return errors
}

// For edits, send only the fields that changed.
function changedFields(original, next) {
  return Object.fromEntries(Object.entries(next).filter(([key, value]) => original[key] !== value))
}

function ProductForm({ product, onSaved, onCancel }) {
  const isEdit = Boolean(product)
  const [values, setValues] = useState(() => toFormValues(product))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const firstInput = useRef(null)

  useEffect(() => {
    firstInput.current?.focus()
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onCancel])

  const setField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')

    const found = findErrors(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const apiValues = toApiValues(values)
    try {
      setSaving(true)
      let saved
      if (isEdit) {
        const changes = changedFields(toApiValues(toFormValues(product)), apiValues)
        if (Object.keys(changes).length === 0) {
          onCancel()
          return
        }
        saved = await updateProduct(product.id, changes)
      } else {
        saved = await createProduct(apiValues)
      }
      onSaved(saved, isEdit)
    } catch (err) {
      if (err.status === 409) {
        setErrors({ name: 'A product with this name already exists' })
      } else {
        setServerError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (field) =>
    errors[field] && (
      <span className="product-form-error" id={`${field}-error`}>
        {errors[field]}
      </span>
    )
  const describedBy = (field) => (errors[field] ? `${field}-error` : undefined)

  return (
    <div className="product-form-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form
        className="product-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <header className="product-form-header">
          <span className="admin-eyebrow">CATALOG</span>
          <h2 id="product-form-title">{isEdit ? `Edit ${product.name}` : 'Add product'}</h2>
        </header>

        {serverError && (
          <p className="product-form-alert" role="alert">
            {serverError}
          </p>
        )}

        <div className="product-form-grid">
          <label className="product-form-field wide">
            Product name *
            <input
              ref={firstInput}
              value={values.name}
              onChange={setField('name')}
              maxLength={150}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy('name')}
            />
            {fieldError('name')}
          </label>

          <label className="product-form-field">
            Category *
            <input
              list="product-categories"
              value={values.category}
              onChange={setField('category')}
              maxLength={50}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={describedBy('category')}
            />
            <datalist id="product-categories">
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {fieldError('category')}
          </label>

          <label className="product-form-field">
            Image link
            <input
              type="url"
              placeholder="https://…"
              value={values.imageUrl}
              onChange={setField('imageUrl')}
              maxLength={500}
              aria-invalid={Boolean(errors.imageUrl)}
              aria-describedby={describedBy('imageUrl')}
            />
            {fieldError('imageUrl')}
          </label>

          <label className="product-form-field">
            Retail price ($) *
            <input
              inputMode="decimal"
              placeholder="18.00"
              value={values.price}
              onChange={setField('price')}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={describedBy('price')}
            />
            {fieldError('price')}
          </label>

          <label className="product-form-field">
            Wholesale price ($)
            <input
              inputMode="decimal"
              placeholder="Leave blank if not sold wholesale"
              value={values.wholesalePrice}
              onChange={setField('wholesalePrice')}
              aria-invalid={Boolean(errors.wholesalePrice)}
              aria-describedby={describedBy('wholesalePrice')}
            />
            {fieldError('wholesalePrice')}
          </label>

          <label className="product-form-field">
            Stock
            <input
              inputMode="numeric"
              value={values.stock}
              onChange={setField('stock')}
              aria-invalid={Boolean(errors.stock)}
              aria-describedby={describedBy('stock')}
            />
            {fieldError('stock')}
          </label>

          <label className="product-form-field">
            Stock label
            <input
              placeholder="e.g. Made to order, Seasonal"
              value={values.stockLabel}
              onChange={setField('stockLabel')}
              maxLength={50}
            />
          </label>

          <label className="product-form-field wide">
            Description
            <textarea rows={3} value={values.description} onChange={setField('description')} maxLength={5000} />
          </label>

          <label className="product-form-check wide">
            <input type="checkbox" checked={values.isAvailable} onChange={setField('isAvailable')} />
            Show in the shop
          </label>
        </div>

        <footer className="product-form-actions">
          <button type="button" className="admin-secondary-button" onClick={onCancel} disabled={saving}>
            CANCEL
          </button>
          <button type="submit" className="admin-primary-button" disabled={saving}>
            {saving ? 'SAVING…' : isEdit ? 'SAVE CHANGES' : 'ADD PRODUCT'}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default ProductForm
