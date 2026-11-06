import { useEffect, useState } from 'react'
import type { PhotoRow } from '@/lib/types'
import { dashboardApi, uploadToCloudinary } from './api'

type PhotoForm = {
  alt: string
  caption: string
  location: string
  date: string
  sort_order: number
}

const emptyForm: PhotoForm = {
  alt: '',
  caption: '',
  location: '',
  date: '',
  sort_order: 0,
}

export function PhotosPanel ({ onStatus }: { onStatus: (message: string, ok?: boolean) => void }) {
  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [form, setForm] = useState<PhotoForm>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load () {
    setLoading(true)
    try {
      const { photos: next } = await dashboardApi.listPhotos()
      setPhotos(next)
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'No se pudieron cargar las fotos', false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function startEdit (photo: PhotoRow) {
    setEditingId(photo.id)
    setFile(null)
    setForm({
      alt: photo.alt,
      caption: photo.caption,
      location: photo.location,
      date: photo.date,
      sort_order: photo.sort_order,
    })
  }

  function resetForm () {
    setEditingId(null)
    setFile(null)
    setForm(emptyForm)
  }

  async function onSubmit (event: { preventDefault: () => void }) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await dashboardApi.updatePhoto(editingId, form)
        onStatus('Foto actualizada')
      } else {
        if (!file) throw new Error('Selecciona una imagen')
        const uploaded = await uploadToCloudinary(file)
        await dashboardApi.createPhoto({
          ...uploaded,
          ...form,
        })
        onStatus('Foto subida')
      }
      resetForm()
      await load()
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Error al guardar', false)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete (id: string) {
    if (!confirm('¿Borrar esta foto de SQLite y Cloudinary?')) return
    try {
      await dashboardApi.deletePhoto(id)
      onStatus('Foto borrada')
      if (editingId === id) resetForm()
      await load()
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Error al borrar', false)
    }
  }

  return (
    <div className='panel-grid'>
      <form className='card form' onSubmit={onSubmit}>
        <h2>{editingId ? 'Editar foto' : 'Nueva foto'}</h2>
        {!editingId && (
          <label>
            Archivo
            <input
              type='file'
              accept='image/*'
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required={!editingId}
            />
          </label>
        )}
        <label>
          Alt
          <input
            value={form.alt}
            onChange={(e) => setForm((prev) => ({ ...prev, alt: e.target.value }))}
          />
        </label>
        <label>
          Caption
          <input
            value={form.caption}
            onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
          />
        </label>
        <label>
          Ubicación
          <input
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          />
        </label>
        <label>
          Fecha
          <input
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            placeholder='2026-01-15'
          />
        </label>
        <label>
          Orden
          <input
            type='number'
            value={form.sort_order}
            onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
          />
        </label>
        <div className='actions'>
          <button type='submit' disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          {editingId && (
            <button type='button' className='ghost' onClick={resetForm}>Cancelar</button>
          )}
        </div>
      </form>

      <div className='card list'>
        <h2>Fotos ({photos.length})</h2>
        {loading
          ? <p className='muted'>Cargando…</p>
          : photos.length === 0
            ? <p className='muted'>Aún no hay fotos.</p>
            : (
              <ul className='photo-list'>
                {photos.map((photo) => (
                  <li key={photo.id}>
                    <img src={photo.src} alt={photo.alt || photo.caption || 'Foto'} />
                    <div>
                      <strong>{photo.caption || photo.alt || photo.public_id}</strong>
                      <span className='muted'>{photo.location || 'Sin ubicación'} · orden {photo.sort_order}</span>
                    </div>
                    <div className='row-actions'>
                      <button type='button' className='ghost' onClick={() => startEdit(photo)}>Editar</button>
                      <button type='button' className='danger' onClick={() => void onDelete(photo.id)}>Borrar</button>
                    </div>
                  </li>
                ))}
              </ul>
              )}
      </div>
    </div>
  )
}
