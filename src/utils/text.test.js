import { describe, it, expect } from 'vitest'
import { decodeHtmlEntities, normalizeBookText, normalizeBookListText } from './text'

describe('decodeHtmlEntities', () => {
  it('avkodar &amp; till &', () => {
    expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry')
  })

  it('avkodar &#039; till apostrof', () => {
    expect(decodeHtmlEntities("Harry Potter &#039;s")).toBe("Harry Potter 's")
  })

  it('avkodar &quot; till citattecken', () => {
    expect(decodeHtmlEntities('&quot;Hej&quot;')).toBe('"Hej"')
  })

  it('avkodar &lt; och &gt; till < och >', () => {
    expect(decodeHtmlEntities('&lt;html&gt;')).toBe('<html>')
  })

  it('hanterar flera entiteter i samma sträng', () => {
    const input = 'Böcker &amp; Filmer &lt;3 &quot;Bra&quot;'
    const expected = 'Böcker & Filmer <3 "Bra"'
    expect(decodeHtmlEntities(input)).toBe(expected)
  })

  it('returnerar tom sträng för null', () => {
    expect(decodeHtmlEntities(null)).toBe('')
  })

  it('returnerar tom sträng för undefined', () => {
    expect(decodeHtmlEntities(undefined)).toBe('')
  })

  it('returnerar oförändrad sträng utan entiteter', () => {
    expect(decodeHtmlEntities('Vanlig text')).toBe('Vanlig text')
  })
})

describe('normalizeBookText', () => {
  it('avkodar HTML-entiteter i boktitel', () => {
    const book = { title: 'Tom &amp; Jerry' }
    const result = normalizeBookText(book)
    expect(result.title).toBe('Tom & Jerry')
  })

  it('avkodar HTML-entiteter i författare', () => {
    const book = { author: 'J.R.R. Tolkien &amp; Co' }
    const result = normalizeBookText(book)
    expect(result.author).toBe('J.R.R. Tolkien & Co')
  })

  it('avkodar alla textfält', () => {
    const book = {
      title: 'Titel &amp; Mer',
      author: 'Författare &quot;X&quot;',
      subtitle: 'Undertitel &lt;1&gt;',
      synopsis: 'Synopsis &amp; text',
      description: 'Beskrivning &amp; info',
      publisher: 'Förlag &amp; AB',
    }
    const result = normalizeBookText(book)

    expect(result.title).toBe('Titel & Mer')
    expect(result.author).toBe('Författare "X"')
    expect(result.subtitle).toBe('Undertitel <1>')
    expect(result.synopsis).toBe('Synopsis & text')
    expect(result.description).toBe('Beskrivning & info')
    expect(result.publisher).toBe('Förlag & AB')
  })

  it('avkodar författare i authors-array', () => {
    const book = {
      title: 'En bok',
      authors: ['Författare &amp; Ett', 'Författare &amp; Två'],
    }
    const result = normalizeBookText(book)

    expect(result.authors).toEqual(['Författare & Ett', 'Författare & Två'])
  })

  it('avkodar kategorier i categories-array', () => {
    const book = {
      title: 'En bok',
      categories: ['Science &amp; Fiction', 'Fantasy &amp; Magic'],
    }
    const result = normalizeBookText(book)

    expect(result.categories).toEqual(['Science & Fiction', 'Fantasy & Magic'])
  })

  it('behåller andra fält oförändrade', () => {
    const book = {
      title: 'Titel',
      id: 123,
      isbn: '978-123',
      pageCount: 300,
    }
    const result = normalizeBookText(book)

    expect(result.id).toBe(123)
    expect(result.isbn).toBe('978-123')
    expect(result.pageCount).toBe(300)
  })

  it('returnerar null för null input', () => {
    expect(normalizeBookText(null)).toBe(null)
  })

  it('returnerar undefined för undefined input', () => {
    expect(normalizeBookText(undefined)).toBe(undefined)
  })
})

describe('normalizeBookListText', () => {
  it('normaliserar alla böcker i en lista', () => {
    const books = [
      { title: 'Bok &amp; Ett' },
      { title: 'Bok &amp; Två' },
    ]
    const result = normalizeBookListText(books)

    expect(result[0].title).toBe('Bok & Ett')
    expect(result[1].title).toBe('Bok & Två')
  })

  it('returnerar tom array för tom array', () => {
    expect(normalizeBookListText([])).toEqual([])
  })

  it('returnerar input oförändrad om det inte är en array', () => {
    expect(normalizeBookListText(null)).toBe(null)
    expect(normalizeBookListText('string')).toBe('string')
  })
})
