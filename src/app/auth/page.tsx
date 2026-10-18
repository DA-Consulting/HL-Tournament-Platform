'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { loginAction, registerAction } from '@/actions/auth.actions'

export default function AuthPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      if (authMode === 'register') {
        const response = await registerAction({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        })

        if (!response.success) {
          setErrorMsg(response.message)
          toast.error('Error al registrar cuenta', {
            description: response.message,
          })
        } else {
          setSuccessMsg(response.message)
          toast.success('¡Registro exitoso!', {
            description: response.message,
          })
          setTimeout(() => {
            router.push('/')
          }, 1200)
        }
      } else {
        const response = await loginAction({
          email: email.trim(),
          password,
        })

        if (!response.success) {
          setErrorMsg(response.message)
          toast.error('Error al iniciar sesión', {
            description: response.message,
          })
        } else {
          setSuccessMsg(response.message)
          toast.success('¡Sesión iniciada!', {
            description: response.message,
          })
          setTimeout(() => {
            router.push('/')
          }, 1000)
        }
      }
    })
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Header con enlace de regreso */}
        <div className="auth-header-nav">
          <Link href="/" className="auth-back-link">
            <span>←</span> Volver a Half Life / AG
          </Link>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">
              {authMode === 'login' ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
            </h1>
            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Ingresa a tu cuenta para competir en los torneos oficiales'
                : 'Crea tu perfil de combatiente y únete a la comunidad de Half-Life / AG'}
            </p>
          </div>

          {/* Selector de modo (Tabs) */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('register')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="auth-form">
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nickname / Nombre de Jugador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Gordon_Freeman_PE"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-control"
                  autoComplete="nickname"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {/* Botón de acción con estilo btn-join */}
            <div className="auth-action-wrapper">
              <button
                type="submit"
                className="btn-join auth-submit-btn"
                disabled={isPending}
              >
                <span>{isPending ? 'PROCESANDO...' : authMode === 'login' ? 'INGRESAR' : 'CREAR CUENTA'}</span>
                <span>➔</span>
              </button>
            </div>
          </form>

          {/* Pie con cambio de modo */}
          <div className="auth-card-footer">
            <button
              type="button"
              className="auth-toggle-link"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
            >
              {authMode === 'login'
                ? '¿Aún no tienes cuenta? Regístrate aquí'
                : '¿Ya tienes una cuenta registrada? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
