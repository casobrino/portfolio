import { useState } from 'react'
import { getDashboardPassword, setDashboardPassword } from './api'
import { PhotosPanel } from './PhotosPanel'
import { PostsPanel } from './PostsPanel'
import './dashboard.css'

type Tab = 'posts' | 'photos'

export default function DashboardApp () {
  const [password, setPassword] = useState(getDashboardPassword())
  const [tab, setTab] = useState<Tab>('posts')
  const [status, setStatus] = useState<{ message: string, ok: boolean } | null>(null)

  function onStatus (message: string, ok = true) {
    setStatus({ message, ok })
  }

  return (
    <div className='dashboard'>
      <header className='dashboard-header'>
        <div>
          <span className='badge'>Dashboard</span>
          <h1>Blog y fotografías</h1>
          <p>
            Panel local (`pnpm dev`). Metadata en SQLite (`data/content.sqlite`),
            imágenes en Cloudinary. El admin JSON de CV/portafolio sigue en{' '}
            <a href='/admin'>/admin</a>.

          </p>
        </div>
        <div className='header-actions'>
          <label className='password-field'>
            <span>Contraseña</span>
            <input
              type='password'
              value={password}
              autoComplete='current-password'
              placeholder='Opcional si ADMIN_PASSWORD está vacío'
              onChange={(e) => {
                setPassword(e.target.value)
                setDashboardPassword(e.target.value)
              }}
            />
          </label>
          <a className='back-link' href='/'>← Volver al sitio</a>
        </div>
      </header>

      <nav className='tabs' aria-label='Secciones'>
        <button
          type='button'
          className={tab === 'posts' ? 'active' : undefined}
          onClick={() => setTab('posts')}
        >
          Blog
        </button>
        <button
          type='button'
          className={tab === 'photos' ? 'active' : undefined}
          onClick={() => setTab('photos')}
        >
          Fotos
        </button>
      </nav>

      {status && (
        <div className={`status ${status.ok ? 'ok' : 'error'}`} role='status'>
          {status.message}
        </div>
      )}

      <main>
        {tab === 'posts' ? <PostsPanel onStatus={onStatus} /> : <PhotosPanel onStatus={onStatus} />}
      </main>
    </div>
  )
}
