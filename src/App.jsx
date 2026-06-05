import { useEffect, useState } from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'


const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  

  // Debounce the search term to avoid excessive API calls
  //by waiting for users to stop typing for 500ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);


  const fetchMovies = async(query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
       const endpoint = query
       ? `/api/movies?query=${encodeURIComponent(query)}`
       : '/api/movies';
      
       const response = await fetch(endpoint);
       
        if (!response.ok) {
            throw new Error('Failed to fetch movies');
        }
        
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
          setMovieList([]);
          setErrorMessage('No movies found');
          return;
        }

        setMovieList(data.results);

        if(query && data.results?.length > 0) {
          await updateSearchCount(query, data.results[0]);
          await loadTrendingMovies();
        }
      } catch (error) {
        console.error(`Error fetching movies: ${error}`);
        setErrorMessage('Failed to fetch movies. Please try again later.');
    } finally {
        setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try { 
      const movies = await getTrendingMovies();

      setTrendingMovies(movies || []);
    } catch (error) {
        console.error(error);
        return [];
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
   fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy 
          Without the Hassle </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
      
          {trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>
            
              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id}>
                    <p>{index + 1}</p>
                    <img src={movie.poster_url} alt={movie.searchTerm} />
                  </li>
                ))}
              </ul>
            </section>
          )}
              

        <section className="all-movies">
          <h2>All Movies</h2>

            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : (
              <ul>
                {movieList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>
      )}
        </section>
      </div>
    </main>
  )
}

export default App