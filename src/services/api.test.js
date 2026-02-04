import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, getAuthToken, setAuthToken, APIError } from './api'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock fetch
global.fetch = vi.fn()

describe('api.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  // --- Token Management ---

  describe('getAuthToken', () => {
    it('hämtar token från localStorage', () => {
      localStorageMock.getItem.mockReturnValue('my-token')

      const result = getAuthToken()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken')
      expect(result).toBe('my-token')
    })

    it('returnerar null om ingen token finns', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getAuthToken()

      expect(result).toBe(null)
    })
  })

  describe('setAuthToken', () => {
    it('sparar token i localStorage', () => {
      setAuthToken('new-token')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token')
    })

    it('tar bort token om null skickas', () => {
      setAuthToken(null)

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
    })

    it('tar bort token om undefined skickas', () => {
      setAuthToken(undefined)

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
    })
  })

  // --- APIError ---

  describe('APIError', () => {
    it('skapar error med message, statusCode och data', () => {
      const error = new APIError('Not found', 404, { detail: 'Book not found' })

      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
      expect(error.data).toEqual({ detail: 'Book not found' })
      expect(error instanceof Error).toBe(true)
    })
  })

  // --- apiFetch (testat genom api-metoderna) ---

  describe('apiFetch', () => {
    it('inkluderar Content-Type header', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await api.books.search('test')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('inkluderar Authorization header när token finns', async () => {
      localStorageMock.getItem.mockReturnValue('my-secret-token')
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await api.user.getBooks()

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer my-secret-token',
          }),
        })
      )
    })

    it('inkluderar inte Authorization header när token saknas', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await api.books.search('test')

      const [, options] = fetch.mock.calls[0]
      expect(options.headers.Authorization).toBeUndefined()
    })

    it('returnerar data vid lyckad request', async () => {
      const mockData = { books: [{ id: 1, title: 'Test' }] }
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const result = await api.books.search('test')

      expect(result).toEqual(mockData)
    })

    it('kastar APIError vid 400 Bad Request', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid input' }),
      })

      await expect(api.books.create({}))
        .rejects.toThrow(APIError)

      try {
        await api.books.create({})
      } catch (error) {
        expect(error.statusCode).toBe(400)
        expect(error.message).toBe('Invalid input')
      }
    })

    it('kastar APIError vid 401 Unauthorized', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      })

      await expect(api.user.getBooks())
        .rejects.toThrow(APIError)

      try {
        await api.user.getBooks()
      } catch (error) {
        expect(error.statusCode).toBe(401)
      }
    })

    it('kastar APIError vid 403 Forbidden', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Admin access required' }),
      })

      await expect(api.admin.listUsers())
        .rejects.toThrow(APIError)

      try {
        await api.admin.listUsers()
      } catch (error) {
        expect(error.statusCode).toBe(403)
        expect(error.message).toBe('Admin access required')
      }
    })

    it('kastar APIError vid 404 Not Found', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Book not found' }),
      })

      await expect(api.books.get(999))
        .rejects.toThrow(APIError)

      try {
        await api.books.get(999)
      } catch (error) {
        expect(error.statusCode).toBe(404)
      }
    })

    it('kastar APIError vid 500 Server Error', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      })

      await expect(api.books.search('test'))
        .rejects.toThrow(APIError)

      try {
        await api.books.search('test')
      } catch (error) {
        expect(error.statusCode).toBe(500)
      }
    })

    it('använder fallback-meddelande om error saknas i response', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({}),
      })

      try {
        await api.books.create({})
      } catch (error) {
        expect(error.message).toBe('Request failed')
      }
    })

    it('kastar APIError vid nätverksfel', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      await expect(api.books.search('test'))
        .rejects.toThrow(APIError)

      try {
        await api.books.search('test')
      } catch (error) {
        expect(error.statusCode).toBe(0)
        expect(error.message).toBe('Network error or server unavailable')
        expect(error.data.originalError).toBe('Network error')
      }
    })

    it('kastar APIError vid JSON-parse-fel', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(api.books.search('test'))
        .rejects.toThrow(APIError)

      try {
        await api.books.search('test')
      } catch (error) {
        expect(error.statusCode).toBe(0)
        expect(error.message).toBe('Network error or server unavailable')
      }
    })
  })

  // --- Books API ---

  describe('api.books', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    })

    it('search anropar rätt endpoint med query', async () => {
      await api.books.search('tolkien')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/books/search.php?q=tolkien'),
        expect.any(Object)
      )
    })

    it('search URL-encodar query', async () => {
      await api.books.search('sagan om ringen')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=sagan%20om%20ringen'),
        expect.any(Object)
      )
    })

    it('search inkluderar limit och offset', async () => {
      await api.books.search('test', 20, 10)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10'),
        expect.any(Object)
      )
    })

    it('get anropar rätt endpoint med id', async () => {
      await api.books.get(123)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/books/get.php?id=123'),
        expect.any(Object)
      )
    })

    it('create använder POST med body', async () => {
      const bookData = { title: 'Ny bok', author: 'Test' }

      await api.books.create(bookData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/books/create.php'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(bookData),
        })
      )
    })
  })

  // --- Auth API ---

  describe('api.auth', () => {
    it('register skickar email, password och name', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await api.auth.register('test@example.com', 'password123', 'Test User')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register.php'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          }),
        })
      )
    })

    it('login sparar token vid lyckad inloggning', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'jwt-token-123', user: { id: 1 } }),
      })

      await api.auth.login('test@example.com', 'password')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'jwt-token-123')
    })

    it('login sparar inte token om den saknas i response', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1 } }),
      })

      await api.auth.login('test@example.com', 'password')

      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('logout tar bort token', () => {
      api.auth.logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
    })

    it('requestPasswordReset skickar email', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await api.auth.requestPasswordReset('test@example.com')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password.php'),
        expect.objectContaining({
          body: JSON.stringify({ action: 'request', email: 'test@example.com' }),
        })
      )
    })

    it('resetPassword skickar token och nytt lösenord', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await api.auth.resetPassword('reset-token', 'new-password')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ action: 'reset', token: 'reset-token', password: 'new-password' }),
        })
      )
    })

    it('verify anropar rätt endpoint med token', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await api.auth.verify('verification-token')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/verify.php?token=verification-token'),
        expect.any(Object)
      )
    })
  })

  // --- User API ---

  describe('api.user', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })

    it('getBooks anropar rätt endpoint', async () => {
      await api.user.getBooks()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/books.php'),
        expect.any(Object)
      )
    })

    it('addBook skickar alla parametrar', async () => {
      await api.user.addBook(123, 'Läser', 4, 50, 'Bra bok!')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/add-book.php'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            bookId: 123,
            status: 'Läser',
            rating: 4,
            progress: 50,
            notes: 'Bra bok!',
          }),
        })
      )
    })

    it('addBook använder standardvärden', async () => {
      await api.user.addBook(123)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            bookId: 123,
            status: 'Vill läsa',
            rating: 0,
            progress: 0,
            notes: '',
          }),
        })
      )
    })

    it('updateBook använder PUT med updates', async () => {
      await api.user.updateBook(123, { status: 'Läst', rating: 5 })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/update-book.php'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ bookId: 123, status: 'Läst', rating: 5 }),
        })
      )
    })

    it('removeBook använder DELETE', async () => {
      await api.user.removeBook(123)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/remove-book.php?bookId=123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('getProfile anropar rätt endpoint', async () => {
      await api.user.getProfile()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/profile.php'),
        expect.any(Object)
      )
    })

    it('updateProfile använder PUT', async () => {
      const profileData = { favoriteAuthors: ['Tolkien'] }

      await api.user.updateProfile(profileData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/profile.php'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(profileData),
        })
      )
    })
  })

  // --- Admin API ---

  describe('api.admin', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })

    it('listUsers inkluderar limit och offset', async () => {
      await api.admin.listUsers('', 100, 50)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=50'),
        expect.any(Object)
      )
    })

    it('listUsers inkluderar search om angiven', async () => {
      await api.admin.listUsers('test@example.com')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test%40example.com'),
        expect.any(Object)
      )
    })

    it('createUser använder POST', async () => {
      const userData = { email: 'new@example.com', name: 'New User' }

      await api.admin.createUser(userData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users.php'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      )
    })

    it('updateUser använder PUT med userId', async () => {
      await api.admin.updateUser(123, { name: 'Updated Name' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ id: 123, name: 'Updated Name' }),
        })
      )
    })

    it('deleteUser använder DELETE', async () => {
      await api.admin.deleteUser(123)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users.php?id=123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('updateBook använder PUT', async () => {
      await api.admin.updateBook(123, { ai_summary: 'AI-genererad sammanfattning' })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/books/update.php'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ id: 123, ai_summary: 'AI-genererad sammanfattning' }),
        })
      )
    })
  })
})
