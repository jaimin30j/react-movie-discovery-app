import React from 'react'
import { Search } from './components/Search'
import Spinner from './components/Spinner'
import MovieCard from './components/MovieCard'
import { useDebounce } from 'react-use'
import { updateSearchCount, getTrendingMovies } from './appwrite'

const API_BASE_URL = 'https://api.themoviedb.org/3'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    accept: 'application/json',
  },
}

const App = () => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState()
  const [errorMessage, setErrorMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const [movieList, setMovieList] = React.useState([])
  const [trendingMovies, setTrendingMovies] = React.useState([])
  const [trendingError, setTrendingError] = React.useState('')
  const [trendingLoading, setTrendingLoading] = React.useState(false)
  const [noResults, setNoResults] = React.useState(false)
  const [scrollPosition, setScrollPosition] = React.useState(false)
  const movieRef = React.useRef(null)  
  //const [isToggled, setIsToggled] = React.useState(false)


  // debounce search term to avoid excessive API calls
  // by waiting for 500ms after the user stops typing before updating the debounced search term
  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm)
  }, 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    setLoading(true)
    setErrorMessage('')
    setNoResults(false)
    setScrollPosition(false)
    
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      
      const response = await fetch(endpoint, API_OPTIONS)

      if (!response.ok) {
        throw new Error('Failed to fetch movies')
      }

      const data = await response.json()

      if (data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies')
        setMovieList([])
        return;
      }

      setMovieList(data.results || [])

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0])
        setScrollPosition(true)
      }

      if (query &&  data.results.length === 0) {
        setNoResults(true)
      }

    } catch (error) {
      setErrorMessage('Failed to fetch movies. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendingMovies = async () => {
    setTrendingLoading(true)
    try {
      const movies = await getTrendingMovies()
      setTrendingMovies(movies)
    } catch (error) {
    } finally {
      setTrendingLoading(false)
    }
  }

  React.useEffect(() => {
    // Fetch movies based on searchTerm
      fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  React.useEffect(() => {
    fetchTrendingMovies()
  }, [])

  React.useEffect(() => {
      if (scrollPosition && noResults === false) {
          movieRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
      }
  }, [ scrollPosition, !noResults])


  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingLoading ? (
          <Spinner position="left"/>
        ) : trendingError ? (
          <p className=" text-red-500 mt-[40px]">{trendingError}</p>
        ) : null
        }
        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}
        
        {movieList.length > 0 && (
          <section className="all-movies" ref={movieRef}>
            <h2 className="mt-[40px]">All Movies</h2>

          {loading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  />
              ))}
            </ul>
          )}
        </section>
        )}
        {noResults && (
          <p className="text-center mt-[40px] text-yellow-500">No movies found for "{debouncedSearchTerm}"</p>
        )}
      </div>
    </main>
  )
}

export default App