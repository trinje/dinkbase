import { useActionState, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import './login.css'

function Field({
  autoComplete = 'off',
  error = undefined,
  label = '',
  name = '',
  onChange = /** @type {(event: import('react').ChangeEvent<HTMLInputElement>) => void} */ (() => {}),
  placeholder = '',
  type = 'text',
}) {
  return (
    <label className="login-field">
      <span>{label}</span>
      <input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="login-input"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={type}
      />
      {error && (
        <span className="login-error" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}



const initialFormState = { error: '', success: false, username: '' }

const Login = () => {
  const [mode, setMode] = useState('login')
  const [formState, formAction, isPending] = useActionState(
    async (_previousState, formData) => {
      const username = String(formData.get('username') ?? '').trim()
      const password = String(formData.get('password') ?? '').trim()
      const phoneNumber = String(formData.get('phoneNumber') ?? '').trim()

      try {
        if (mode === 'login') {
          const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .eq('password', password)
            .maybeSingle()

          if (error) {
            return { ...initialFormState, error: 'Could not fetch the user record. Please try again.' }
          }

          if (!data) {
            return { ...initialFormState, error: 'No matching user record. Username and/or password may be incorrect.' }
          }
        } else {
          const { data, error } = await supabase
            .from('users')
            .insert({
              username,
              password,
              phone_number: phoneNumber,
            })
            .select('username')
            .maybeSingle()

          if (error) {
            return { ...initialFormState, error: error.message }
          }

          if (!data) {
            return { ...initialFormState, error: 'No user record was created.' }
          }
        }

        return { error: '', success: true, username }
      } catch (error) {
        console.error(`Unexpected error during ${mode}:`, error)
        return { ...initialFormState, error: 'Something went wrong. Please try again.' }
      }
    },
    initialFormState,
  )

  useEffect(() => {
    if (formState.success) {
      localStorage.setItem('dinkbase.username', formState.username)
      window.location.assign('/dashboard')
    }
  }, [formState.success, formState.username])

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="login-decoration login-decoration-large" />
          <div className="login-decoration login-decoration-small" />
          <div className="login-decoration login-decoration-bottom" />
          <div className="login-brand-mark">
            <div className="login-brand-icon">
              <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
                <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="9.2" cy="9.2" r="1" fill="currentColor" />
                <circle cx="14.8" cy="9.2" r="1" fill="currentColor" />
                <circle cx="9.2" cy="14.8" r="1" fill="currentColor" />
                <circle cx="14.8" cy="14.8" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="login-brand-name">Dinkbase</p>
              <p className="login-brand-caption">PICKLEBALL TRACKER</p>
            </div>
          </div>

          <div className="login-brand-pitch">
            <p className="login-brand-eyebrow">Play. Track. Improve.</p>
            <h1 className="login-brand-heading">Every rally tells a story.</h1>
            <p className="login-brand-description">
              Keep every score, teammate, and court in one place—and watch your game grow over time.
            </p>
          </div>

          <div className="login-brand-footer">
            <span className="login-footer-line" />
            Built for the next game
          </div>
        </section>

        <section className="login-content">
          <div className="login-content-inner">
            <div className="login-mobile-brand">
              <div>
                <p className="login-brand-name">Dinkbase</p>
                <p className="login-mobile-brand-caption">PICKLEBALL TRACKER</p>
              </div>
            </div>

            <p className="login-page-eyebrow">
              {mode === 'login' ? 'Welcome back' : 'Join Dinkbase today'}
            </p>
            <h2 className="login-title">
              {mode === 'login' ? 'Sign in to your court' : 'Create your account'}
            </h2>
            <p className="login-description">
              {mode === 'login'
                ? 'Your game history is ready when you are.'
                : 'Start tracking your matches in less than a minute.'}
            </p>

            <div className="login-tabs" role="tablist">
              <button
                aria-selected={mode === 'login'}
                className={`login-tab${mode === 'login' ? ' is-active' : ''}`}
                role="tab"
                onClick={() => setMode('login')}
                type="button"
              >
                Log in
              </button>
              <button
                aria-selected={mode === 'signup'}
                className={`login-tab${mode === 'signup' ? ' is-active' : ''}`}
                role="tab"
                onClick={() => setMode('signup')}
                type="button"
              >
                Sign up
              </button>
            </div>

            <form className="login-form" action={formAction}>
              {mode === 'signup' && (
                <Field
                  autoComplete="tel"
                  label="Phone number"
                  name="phoneNumber"
                  placeholder="555 123 4567"
                  type="tel"
                />
              )}
              <Field
                autoComplete="username"
                label="Username"
                name="username"
                placeholder="your_username"
              />
              <Field
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                label="Password"
                name="password"
                placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
                type="password"
              />

              {formState.error && <p className="login-error" role="alert">{formState.error}</p>}

              <button className="login-submit" type="submit" disabled={isPending}>
                {isPending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
              </button>
            </form>

            <p className="login-terms">
              By continuing, you agree to keep the rallies friendly and the line calls honest.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
