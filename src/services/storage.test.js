import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getLibrary,
  addToLibrary,
  updateBookStatus,
  removeFromLibrary,
  getBookById,
  getUniqueAuthors,
  getUniqueGenres,
  getUserProfile,
  fetchUserProfile,
  updateUserProfile,
} from './storage'

// Mocka api-modulen
vi.mock('./api', () => ({
  api: {
    books: {
      create: vi.fn(),
    },
    user: {
      getBooks: vi.fn(),
      addBook: vi.fn(),
      updateBook: vi.fn(),
      removeBook: vi.fn(),
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
    },
  },
  getAuthToken: vi.fn(),
}))

import { api, getAuthToken } from './api'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('storage.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  // --- Library Management ---

  describe('getLibrary', () => {
    it('hämtar böcker från API när användaren är inloggad', async () => {
      const mockBooks = [
        { id: 1, title: 'Bok 1' },
        { id: 2, title: 'Bok 2' },
      ]
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue(mockBooks)

      const result = await getLibrary()

      expect(api.user.getBooks).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })

    it('returnerar tom array när användaren inte är inloggad', async () => {
      getAuthToken.mockReturnValue(null)

      const result = await getLibrary()

      expect(api.user.getBooks).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('returnerar tom array vid API-fel', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockRejectedValue(new Error('API error'))

      const result = await getLibrary()

      expect(result).toEqual([])
    })
  })

  describe('addToLibrary', () => {
    it('kastar fel om användaren inte är inloggad', async () => {
      getAuthToken.mockReturnValue(null)

      await expect(addToLibrary({ title: 'Test' }))
        .rejects.toThrow('Du måste vara inloggad')
    })

    it('skapar bok i databasen om dbId saknas', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.books.create.mockResolvedValue({ book: { id: 123 } })
      api.user.addBook.mockResolvedValue({})

      const book = {
        title: 'Ny bok',
        author: 'Författare',
        isbn: '978-123',
        published: '2024',
      }

      await addToLibrary(book)

      expect(api.books.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ny bok',
          author: 'Författare',
          isbn: '978-123',
          publishedDate: '2024-01-01',
        })
      )
      expect(api.user.addBook).toHaveBeenCalledWith(123, 'Vill läsa', 0, 0, '')
    })

    it('använder befintligt dbId om det finns', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.addBook.mockResolvedValue({})

      const book = {
        title: 'Befintlig bok',
        dbId: 456,
      }

      await addToLibrary(book)

      expect(api.books.create).not.toHaveBeenCalled()
      expect(api.user.addBook).toHaveBeenCalledWith(456, 'Vill läsa', 0, 0, '')
    })

    it('konverterar årtal till datum-format', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.books.create.mockResolvedValue({ book: { id: 1 } })
      api.user.addBook.mockResolvedValue({})

      await addToLibrary({ title: 'Test', published: '2020' })

      expect(api.books.create).toHaveBeenCalledWith(
        expect.objectContaining({ publishedDate: '2020-01-01' })
      )
    })

    it('hanterar "Okänt år" som null', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.books.create.mockResolvedValue({ book: { id: 1 } })
      api.user.addBook.mockResolvedValue({})

      await addToLibrary({ title: 'Test', published: 'Okänt år' })

      expect(api.books.create).toHaveBeenCalledWith(
        expect.objectContaining({ publishedDate: null })
      )
    })

    it('skickar med status och rating om de finns', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.addBook.mockResolvedValue({})

      const book = {
        dbId: 1,
        status: 'Läser',
        rating: 4,
        progress: 50,
        notes: 'Bra bok!',
      }

      await addToLibrary(book)

      expect(api.user.addBook).toHaveBeenCalledWith(1, 'Läser', 4, 50, 'Bra bok!')
    })
  })

  describe('updateBookStatus', () => {
    it('kastar fel om användaren inte är inloggad', async () => {
      getAuthToken.mockReturnValue(null)

      await expect(updateBookStatus(1, { status: 'Läst' }))
        .rejects.toThrow('Du måste vara inloggad')
    })

    it('sätter progress till 100 automatiskt när status blir "Läst"', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([{ id: 'book1', dbId: 1 }])
      api.user.updateBook.mockResolvedValue({})

      await updateBookStatus('book1', { status: 'Läst' })

      expect(api.user.updateBook).toHaveBeenCalledWith(1, { status: 'Läst', progress: 100 })
    })

    it('behåller angiven progress om den redan finns', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([{ id: 'book1', dbId: 1 }])
      api.user.updateBook.mockResolvedValue({})

      await updateBookStatus('book1', { status: 'Läst', progress: 75 })

      expect(api.user.updateBook).toHaveBeenCalledWith(1, { status: 'Läst', progress: 75 })
    })

    it('kastar fel om boken inte hittas', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([])

      await expect(updateBookStatus('unknown', { status: 'Läst' }))
        .rejects.toThrow('Kunde inte hitta boken')
    })
  })

  describe('removeFromLibrary', () => {
    it('kastar fel om användaren inte är inloggad', async () => {
      getAuthToken.mockReturnValue(null)

      await expect(removeFromLibrary(1))
        .rejects.toThrow('Du måste vara inloggad')
    })

    it('tar bort bok via API', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([
        { id: 'book1', dbId: 1, title: 'Bok 1' },
        { id: 'book2', dbId: 2, title: 'Bok 2' },
      ])
      api.user.removeBook.mockResolvedValue({})

      const result = await removeFromLibrary('book1')

      expect(api.user.removeBook).toHaveBeenCalledWith(1)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('book2')
    })

    it('kastar fel om boken inte hittas', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([])

      await expect(removeFromLibrary('unknown'))
        .rejects.toThrow('Kunde inte hitta boken')
    })
  })

  describe('getBookById', () => {
    it('hittar bok via id', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([
        { id: 'book1', title: 'Bok 1' },
        { id: 'book2', title: 'Bok 2' },
      ])

      const result = await getBookById('book2')

      expect(result.title).toBe('Bok 2')
    })

    it('hittar bok via dbId', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([
        { id: 'book1', dbId: 100, title: 'Bok 1' },
      ])

      const result = await getBookById(100)

      expect(result.title).toBe('Bok 1')
    })

    it('returnerar undefined om boken inte finns', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([])

      const result = await getBookById('unknown')

      expect(result).toBeUndefined()
    })
  })

  // --- Helper functions ---

  describe('getUniqueAuthors', () => {
    it('extraherar unika författare från biblioteket', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([
        { author: 'Författare A' },
        { author: 'Författare B' },
        { author: 'Författare A' }, // Duplikat
      ])

      const result = await getUniqueAuthors()

      expect(result).toEqual(['Författare A', 'Författare B'])
    })

    it('hanterar authors-array', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([
        { authors: ['Författare A', 'Författare B'] },
        { authors: ['Författare C'] },
      ])

      const result = await getUniqueAuthors()

      expect(result).toContain('Författare A')
      expect(result).toContain('Författare B')
      expect(result).toContain('Författare C')
    })
  })

  describe('getUniqueGenres', () => {
    it('inkluderar fördefinierade genrer', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([])

      const result = await getUniqueGenres()

      expect(result).toContain('Deckare')
      expect(result).toContain('Fantasy')
      expect(result).toContain('Science Fiction')
    })

    it('lägger till genrer från biblioteket', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getBooks.mockResolvedValue([
        { categories: ['Min Speciella Genre'] },
      ])

      const result = await getUniqueGenres()

      expect(result).toContain('Min Speciella Genre')
    })
  })

  // --- User Profile ---

  describe('getUserProfile', () => {
    it('returnerar standardprofil om inget finns i localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getUserProfile()

      expect(result).toEqual({
        favoriteAuthors: [],
        favoriteGenres: [],
        blocklist: { authors: [], genres: [], books: [] },
        modes: {},
        preferredFormats: [],
        preferredServices: [],
      })
    })

    it('returnerar sparad profil från localStorage', () => {
      const savedProfile = {
        favoriteAuthors: ['Tolkien'],
        favoriteGenres: ['Fantasy'],
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedProfile))

      const result = getUserProfile()

      expect(result.favoriteAuthors).toEqual(['Tolkien'])
      expect(result.favoriteGenres).toEqual(['Fantasy'])
    })

    it('fyller i saknade fält med standardvärden', () => {
      const partialProfile = { favoriteAuthors: ['Tolkien'] }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(partialProfile))

      const result = getUserProfile()

      expect(result.favoriteAuthors).toEqual(['Tolkien'])
      expect(result.blocklist).toEqual({ authors: [], genres: [], books: [] })
    })
  })

  describe('fetchUserProfile', () => {
    it('returnerar lokal profil om användaren inte är inloggad', async () => {
      getAuthToken.mockReturnValue(null)
      localStorageMock.getItem.mockReturnValue(null)

      const result = await fetchUserProfile()

      expect(api.user.getProfile).not.toHaveBeenCalled()
      expect(result.favoriteAuthors).toEqual([])
    })

    it('hämtar och mappar profil från backend', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getProfile.mockResolvedValue({
        profile: {
          favoriteAuthors: ['Tolkien'],
          favoriteGenres: ['Fantasy'],
          blockedAuthors: ['Dålig Författare'],
          blockedGenres: ['Tråkig Genre'],
          preferences: {
            preferredFormats: ['pocket'],
            modes: { darkMode: true },
          },
        },
      })

      const result = await fetchUserProfile()

      expect(result.favoriteAuthors).toEqual(['Tolkien'])
      expect(result.favoriteGenres).toEqual(['Fantasy'])
      expect(result.blocklist.authors).toEqual(['Dålig Författare'])
      expect(result.blocklist.genres).toEqual(['Tråkig Genre'])
      expect(result.preferredFormats).toEqual(['pocket'])
      expect(result.modes).toEqual({ darkMode: true })
    })

    it('sparar hämtad profil i localStorage', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getProfile.mockResolvedValue({
        profile: { favoriteAuthors: ['Test'] },
      })

      await fetchUserProfile()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'forsta_kapitlet_profile',
        expect.stringContaining('Test')
      )
    })

    it('faller tillbaka till localStorage vid API-fel', async () => {
      getAuthToken.mockReturnValue('fake-token')
      api.user.getProfile.mockRejectedValue(new Error('API error'))
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        favoriteAuthors: ['Fallback'],
      }))

      const result = await fetchUserProfile()

      expect(result.favoriteAuthors).toEqual(['Fallback'])
    })
  })

  describe('updateUserProfile', () => {
    it('uppdaterar profil i localStorage', () => {
      getAuthToken.mockReturnValue(null)
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        favoriteAuthors: ['Gammal'],
      }))

      const result = updateUserProfile({ favoriteAuthors: ['Ny'] })

      expect(result.favoriteAuthors).toEqual(['Ny'])
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'forsta_kapitlet_profile',
        expect.stringContaining('Ny')
      )
    })

    it('rensar daily tip cache vid uppdatering', () => {
      getAuthToken.mockReturnValue(null)
      localStorageMock.getItem.mockReturnValue(null)

      updateUserProfile({ favoriteGenres: ['Fantasy'] })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('forsta_kapitlet_daily_tip')
    })

    it('synkar till backend om användaren är inloggad', () => {
      getAuthToken.mockReturnValue('fake-token')
      localStorageMock.getItem.mockReturnValue(null)
      api.user.updateProfile.mockResolvedValue({})

      updateUserProfile({
        favoriteAuthors: ['Tolkien'],
        blocklist: { authors: ['Dålig'], genres: [], books: [] },
      })

      expect(api.user.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          favoriteAuthors: ['Tolkien'],
          blockedAuthors: ['Dålig'],
        })
      )
    })

    it('synkar inte till backend om användaren inte är inloggad', () => {
      getAuthToken.mockReturnValue(null)
      localStorageMock.getItem.mockReturnValue(null)

      updateUserProfile({ favoriteGenres: ['Fantasy'] })

      expect(api.user.updateProfile).not.toHaveBeenCalled()
    })
  })
})
