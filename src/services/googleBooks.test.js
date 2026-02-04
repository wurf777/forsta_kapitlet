import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatBookData, searchBooks } from './googleBooks'

// Mocka api-modulen
vi.mock('./api', () => ({
  api: {
    books: {
      search: vi.fn()
    }
  }
}))

import { api } from './api'

describe('formatBookData', () => {
  it('extraherar grundläggande bokinfo från Google Books-format', () => {
    const googleBook = {
      id: 'abc123',
      volumeInfo: {
        title: 'Sagan om ringen',
        authors: ['J.R.R. Tolkien'],
        description: 'En fantasybok om hobbitar.',
        pageCount: 423,
        publishedDate: '1954-07-29',
        language: 'sv',
        categories: ['Fantasy', 'Fiction'],
      }
    }

    const result = formatBookData(googleBook)

    expect(result.id).toBe('abc123')
    expect(result.title).toBe('Sagan om ringen')
    expect(result.author).toBe('J.R.R. Tolkien')
    expect(result.synopsis).toBe('En fantasybok om hobbitar.')
    expect(result.pages).toBe(423)
    expect(result.published).toBe('1954')
    expect(result.publishedDate).toBe('1954-07-29')
    expect(result.language).toBe('sv')
    expect(result.categories).toEqual(['Fantasy', 'Fiction'])
  })

  it('slår ihop flera författare med komma', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'En bok',
        authors: ['Författare Ett', 'Författare Två', 'Författare Tre'],
      }
    }

    const result = formatBookData(googleBook)

    expect(result.author).toBe('Författare Ett, Författare Två, Författare Tre')
  })

  it('hanterar bok utan författare', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Anonym bok',
      }
    }

    const result = formatBookData(googleBook)

    expect(result.author).toBe('Okänd författare')
  })

  it('hanterar bok utan beskrivning', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Mystisk bok',
      }
    }

    const result = formatBookData(googleBook)

    expect(result.synopsis).toBe('Ingen beskrivning tillgänglig.')
  })

  it('sätter standardvärden för saknade fält', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Minimal bok',
      }
    }

    const result = formatBookData(googleBook)

    expect(result.rating).toBe(0)
    expect(result.progress).toBe(0)
    expect(result.status).toBe('Vill läsa')
    expect(result.pages).toBe(0)
    expect(result.published).toBe('Okänt år')
    expect(result.publishedDate).toBe(null)
    expect(result.language).toBe('okänt')
    expect(result.categories).toEqual([])
    expect(result.cover).toBe(null)
    expect(result.isbn).toBe(null)
  })

  it('väljer ISBN-13 före ISBN-10', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'ISBN-bok',
        industryIdentifiers: [
          { type: 'ISBN_10', identifier: '1234567890' },
          { type: 'ISBN_13', identifier: '9781234567890' },
        ]
      }
    }

    const result = formatBookData(googleBook)

    expect(result.isbn).toBe('9781234567890')
  })

  it('faller tillbaka till ISBN-10 om ISBN-13 saknas', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Gammal bok',
        industryIdentifiers: [
          { type: 'ISBN_10', identifier: '1234567890' },
        ]
      }
    }

    const result = formatBookData(googleBook)

    expect(result.isbn).toBe('1234567890')
  })

  it('väljer bästa tillgängliga omslagsbild', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Bok med bilder',
        imageLinks: {
          smallThumbnail: 'http://small.jpg',
          thumbnail: 'http://thumb.jpg',
          medium: 'http://medium.jpg',
        }
      }
    }

    const result = formatBookData(googleBook)

    // Ska välja medium (bästa tillgängliga) och konvertera till https
    expect(result.cover).toBe('https://medium.jpg')
  })

  it('konverterar http till https i omslagsbilds-URL', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Bok',
        imageLinks: {
          thumbnail: 'http://example.com/cover.jpg',
        }
      }
    }

    const result = formatBookData(googleBook)

    expect(result.cover).toBe('https://example.com/cover.jpg')
  })

  it('avkodar HTML-entiteter i titel och beskrivning', () => {
    const googleBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Tom &amp; Jerry',
        description: 'En bok om &quot;vänskap&quot;',
      }
    }

    const result = formatBookData(googleBook)

    expect(result.title).toBe('Tom & Jerry')
    expect(result.synopsis).toBe('En bok om "vänskap"')
  })
})

describe('searchBooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returnerar tom array för tom söksträng', async () => {
    const result = await searchBooks('')
    expect(result).toEqual([])
  })

  it('returnerar tom array för null söksträng', async () => {
    const result = await searchBooks(null)
    expect(result).toEqual([])
  })

  it('returnerar lokala resultat om det finns minst 5 böcker', async () => {
    const localBooks = [
      { id: 1, title: 'Bok 1' },
      { id: 2, title: 'Bok 2' },
      { id: 3, title: 'Bok 3' },
      { id: 4, title: 'Bok 4' },
      { id: 5, title: 'Bok 5' },
    ]

    api.books.search.mockResolvedValue(localBooks)

    const result = await searchBooks('test')

    expect(api.books.search).toHaveBeenCalledWith('test', 10)
    expect(result).toHaveLength(5)
    expect(result[0].source).toBe('db')
    // Ska inte anropa Google Books API
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('kompletterar med Google Books om färre än 5 lokala resultat', async () => {
    const localBooks = [
      { id: 1, title: 'Lokal bok', isbn: '111' },
    ]

    const googleResponse = {
      items: [
        {
          id: 'google1',
          volumeInfo: {
            title: 'Google bok',
            authors: ['Författare'],
          }
        }
      ]
    }

    api.books.search.mockResolvedValue(localBooks)
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve(googleResponse)
    })

    const result = await searchBooks('test')

    expect(result).toHaveLength(2)
    expect(result[0].source).toBe('db')
    expect(result[1].source).toBe('google')
  })

  it('deduplicerar böcker baserat på ISBN', async () => {
    const localBooks = [
      { id: 1, title: 'Samma bok lokalt', isbn: '9781234567890' },
    ]

    const googleResponse = {
      items: [
        {
          id: 'google1',
          volumeInfo: {
            title: 'Samma bok från Google',
            industryIdentifiers: [
              { type: 'ISBN_13', identifier: '9781234567890' }
            ]
          }
        }
      ]
    }

    api.books.search.mockResolvedValue(localBooks)
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve(googleResponse)
    })

    const result = await searchBooks('test')

    // Ska bara ha en bok (den lokala, eftersom den kom först)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('db')
  })

  it('returnerar lokala resultat om Google Books API misslyckas', async () => {
    const localBooks = [
      { id: 1, title: 'Lokal bok' },
    ]

    api.books.search.mockResolvedValue(localBooks)
    global.fetch.mockRejectedValue(new Error('Network error'))

    const result = await searchBooks('test')

    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('db')
  })

  it('hanterar tomt svar från Google Books', async () => {
    api.books.search.mockResolvedValue([])
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve({ totalItems: 0 }) // Inget items-fält
    })

    const result = await searchBooks('obskyr sökning')

    expect(result).toEqual([])
  })
})
