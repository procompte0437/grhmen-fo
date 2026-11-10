import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Genre = 'succes' | 'erreur' | 'info'
interface Notification {
  id: number
  genre: Genre
  texte: string
}

const Contexte = createContext<(texte: string, genre?: Genre) => void>(() => {})

export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Notification[]>([])

  const notifier = useCallback((texte: string, genre: Genre = 'succes') => {
    const id = Date.now() + Math.random()
    setListe((l) => [...l, { id, genre, texte }])
    window.setTimeout(() => setListe((l) => l.filter((n) => n.id !== id)), genre === 'erreur' ? 6500 : 4000)
  }, [])

  const couleurs: Record<Genre, string> = {
    succes: 'bg-marque-800 text-white',
    erreur: 'bg-red-700 text-white',
    info: 'bg-ciel-600 text-white',
  }

  return (
    <Contexte.Provider value={notifier}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" role="status" aria-live="polite">
        {liste.map((n) => (
          <div key={n.id} className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${couleurs[n.genre]}`}>
            {n.texte}
          </div>
        ))}
      </div>
    </Contexte.Provider>
  )
}

export function useNotifier() {
  return useContext(Contexte)
}
