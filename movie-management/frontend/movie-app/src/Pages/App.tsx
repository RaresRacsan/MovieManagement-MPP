import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Styles/App.css";
import AddMovie from "./AddMovies";
import UpdateMovie from "./UpdateMovies";
import Charts from "./Charts";
import FileUpload from "./FileUpload";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// Define keys for local storage
const PENDING_OPERATIONS_KEY = "pending_movie_operations";
const CACHED_MOVIES_KEY = "cached_movies";

interface Movie {
  id: number;
  title: string;
  rating: number;
  description: string;
  category: string;
}

interface PendingOperation {
  type: "add" | "update" | "delete";
  movie: Movie;
  id?: number; // For delete and update operations
  timestamp: number;
}

function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [alphabeticalOrder, setAlphabeticalOrder] = useState<
    "asc" | "desc" | null
  >(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 10; // Increased for endless scrolling
  
  // New state for network status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isServerAvailable, setIsServerAvailable] = useState<boolean>(true);
  
  // State to track if we're loading more movies for infinite scroll
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalMovies, setTotalMovies] = useState<number>(0);

  // State for WebSocket
  const [stompClient, setStompClient] = useState<any>(null);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check server availability every 30 seconds
    const checkServerInterval = setInterval(() => {
      if (navigator.onLine) {
        checkServerAvailability();
      }
    }, 30000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkServerAvailability();
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(checkServerInterval);
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (isOnline && isServerAvailable) {
      // Connect to WebSocket
      const socket = new SockJS("http://localhost:8080/ws");
      const client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
          setStompClient(client);
  
          // Subscribe to movie updates
          client.subscribe("/topic/movies", (message) => {
            const newMovie = JSON.parse(message.body);
  
            // Update movies state
            setMovies((prevMovies) => {
              // Check if this movie is already in our list (by id)
              const movieExists = prevMovies.some(
                (movie) => movie.id === newMovie.id
              );
              if (movieExists) {
                // Replace the existing movie
                return prevMovies.map((movie) =>
                  movie.id === newMovie.id ? newMovie : movie
                );
              } else {
                // Add the new movie to the beginning
                return [newMovie, ...prevMovies];
              }
            });
  
            // Update categories list if needed
            setCategories((prevCategories) => {
              if (!prevCategories.includes(newMovie.category)) {
                return [...prevCategories, newMovie.category];
              }
              return prevCategories;
            });
          });
  
          // Subscribe to chart data updates
          client.subscribe("/topic/charts/categories", (message) => {
            const categoryData = JSON.parse(message.body);
            window.dispatchEvent(
              new CustomEvent("categoryDataUpdate", {
                detail: { data: categoryData },
              })
            );
          });
  
          client.subscribe("/topic/charts/ratings", (message) => {
            const ratingData = JSON.parse(message.body);
            window.dispatchEvent(
              new CustomEvent("ratingDataUpdate", {
                detail: { data: ratingData },
              })
            );
          });
        },
      });
  
      client.activate();
  
      return () => {
        if (client.connected) {
          client.deactivate();
        }
      };
    }
  }, [isOnline, isServerAvailable]);

  // Function to check if server is available
  const checkServerAvailability = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      setIsServerAvailable(response.ok);
      if (response.ok && !isServerAvailable) {
        // Server is back online - sync pending operations
        syncPendingOperations();
      }
    } catch (error) {
      console.error("Server check failed:", error);
      setIsServerAvailable(false);
    }
  };

  // Function to get movies from local cache
  const getMoviesFromCache = () => {
    const cachedMoviesStr = localStorage.getItem(CACHED_MOVIES_KEY);
    if (cachedMoviesStr) {
      return JSON.parse(cachedMoviesStr) as Movie[];
    }
    return [];
  };

  // Function to save movies to local cache
  const saveMoviesToCache = (moviesData: Movie[]) => {
    localStorage.setItem(CACHED_MOVIES_KEY, JSON.stringify(moviesData));
  };

  // Function to get pending operations
  const getPendingOperations = (): PendingOperation[] => {
    const pendingOpsStr = localStorage.getItem(PENDING_OPERATIONS_KEY);
    if (pendingOpsStr) {
      return JSON.parse(pendingOpsStr);
    }
    return [];
  };

  // Function to save pending operations
  const savePendingOperation = (operation: PendingOperation) => {
    const pendingOps = getPendingOperations();
    pendingOps.push(operation);
    localStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(pendingOps));
  };

  // Function to remove a pending operation
  const removePendingOperation = (index: number) => {
    const pendingOps = getPendingOperations();
    pendingOps.splice(index, 1);
    localStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(pendingOps));
  };

  // Function to sync pending operations with server
  const syncPendingOperations = async () => {
    if (!isOnline || !isServerAvailable) return;
    
    const pendingOps = getPendingOperations();
    
    for (let i = 0; i < pendingOps.length; i++) {
      const op = pendingOps[i];
      let success = false;
      
      try {
        switch(op.type) {
          case 'add':
            const addResponse = await fetch('http://localhost:8080/api/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.movie)
            });
            success = addResponse.ok;
            break;
            
          case 'update':
            const updateResponse = await fetch(`http://localhost:8080/api/update/${op.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.movie)
            });
            success = updateResponse.ok;
            break;
            
          case 'delete':
            const deleteResponse = await fetch(`http://localhost:8080/api/delete/${op.id}`, {
              method: 'DELETE'
            });
            success = deleteResponse.ok;
            break;
        }
        
        if (success) {
          removePendingOperation(i);
          i--; // Adjust index after removal
        }
      } catch (error) {
        console.error(`Error syncing operation: ${op.type}`, error);
      }
    }
    
    // Refresh movies after syncing
    fetchMovies(searchQuery, sortOrder, alphabeticalOrder, true);
  };

  useEffect(() => {
    if (isOnline && isServerAvailable) {
      fetchMovies(searchQuery, sortOrder, alphabeticalOrder, true);
    } else {
      // Load from cache if offline
      const cachedMovies = getMoviesFromCache();
      if (cachedMovies.length > 0) {
        setMovies(cachedMovies);
      }
    }
  }, [isOnline, isServerAvailable]);

  useEffect(() => {
    // Only fetch if we're online and server is available
    if (isOnline && isServerAvailable) {
      fetchMovies(searchQuery, sortOrder, alphabeticalOrder);
    }
  }, [searchQuery, sortOrder, alphabeticalOrder, selectedCategories, selectedRating]);
  
  // Setup infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (!isLoading && hasMore && (scrollHeight - scrollTop <= clientHeight + 100)) {
        loadMoreMovies();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, movies.length]);  // Remove isPaginationMode from dependencies
  

  const loadMoreMovies = () => {
    if (isOnline && isServerAvailable && hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      setIsLoading(true);
      setCurrentPage(nextPage);
      
      // Determine which API to call based on parameters
      let url;
      
      // Case 1: Filtering is required
      if (searchQuery || selectedCategories.length > 0 || selectedRating !== null) {
        url = `http://localhost:8080/api/movies/filter?page=${nextPage - 1}&size=${moviesPerPage}`;
        
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        
        if (selectedCategories.length > 0) {
          url += `&categories=${selectedCategories.join(",")}`;
        }
        
        if (selectedRating !== null) {
          url += `&rating=${selectedRating}`;
        }
      }
      // Case 2: Sorting is required
      else if (sortOrder || alphabeticalOrder) {
        url = `http://localhost:8080/api/movies/sort?page=${nextPage - 1}&size=${moviesPerPage}`;
        
        // Determine which field to sort by
        const field = sortOrder ? "rating" : "title";
        const sortValue = sortOrder || alphabeticalOrder;
        
        url += `&field=${field}&order=${sortValue}`;
      }
      // Case 3: No sorting or filtering, just get all movies
      else {
        url = `http://localhost:8080/api/main?page=${nextPage - 1}&size=${moviesPerPage}`;
      }
      
      fetch(url)
        .then(response => response.json())
        .then(data => {
          // Move all this logic inside the setMovies callback to access prevMovies
          setMovies(prevMovies => {
            const newMovies = [...prevMovies, ...(data.content || data)];
            setHasMore(data.content ? (!data.last) : (data.length === moviesPerPage));
            setTotalMovies(data.totalElements || newMovies.length);
            return newMovies;
          });
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error loading more movies:", error);
          setIsLoading(false);
        });
    }
  };

  const fetchAllMovies = () => {
    if (isOnline && isServerAvailable) {
      fetch(`http://localhost:8080/api/main`)
        .then((response) => response.json())
        .then((data: Movie[]) => {
          const uniqueCategories = Array.from(
            new Set(data.map((movie: Movie) => movie.category))
          );
          setCategories(uniqueCategories);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setIsServerAvailable(false);
        });
    } else {
      // If offline, try to get categories from cached movies
      const cachedMovies = getMoviesFromCache();
      if (cachedMovies.length > 0) {
        const uniqueCategories = Array.from(
          new Set(cachedMovies.map((movie: Movie) => movie.category))
        );
        setCategories(uniqueCategories);
      }
    }
  };

  const fetchMovies = (
    query: string,
    order: "asc" | "desc" | null = null,
    alphabeticalOrder: "asc" | "desc" | null = null,
    resetPage: boolean = false,
    ) => {
    if (!isOnline || !isServerAvailable) {
      // Use cached data for offline mode
      let cachedMovies = getMoviesFromCache();
      
      // Apply filtering and sorting locally
      if (query) {
        cachedMovies = cachedMovies.filter(movie => 
          movie.title.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (selectedCategories.length > 0) {
        cachedMovies = cachedMovies.filter(movie => 
          selectedCategories.includes(movie.category)
        );
      }
      
      if (selectedRating !== null) {
        cachedMovies = cachedMovies.filter(movie => 
          movie.rating >= selectedRating
        );
      }
      
      if (order) {
        cachedMovies.sort((a, b) => {
          return order === 'asc' ? a.rating - b.rating : b.rating - a.rating;
        });
      } else if (alphabeticalOrder) {
        cachedMovies.sort((a, b) => {
          return alphabeticalOrder === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        });
      }
      
      setMovies(cachedMovies);
      return;
    }
    
    // If we're resetting the page or clicking pagination, set loading to true
    if (resetPage) {
      setIsLoading(true);
      setCurrentPage(1);
    }
    
    // If we're resetting the page, start from page 1
    if (resetPage) {
      setCurrentPage(1);
    }
    
    // Determine which API to call based on parameters
    let url;
    
    // Case 1: Filtering is required
    if (query || selectedCategories.length > 0 || selectedRating !== null) {
      url = `http://localhost:8080/api/movies/filter?page=${resetPage ? 0 : currentPage - 1}&size=${moviesPerPage}`;
      
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      
      if (selectedCategories.length > 0) {
        url += `&categories=${selectedCategories.join(",")}`;
      }
      
      if (selectedRating !== null) {
        url += `&rating=${selectedRating}`;
      }
      
      // Add sort parameters to filter endpoint
      if (order) {
        url += `&sort=${order}&field=rating`;
      } else if (alphabeticalOrder) {
        url += `&sort=${alphabeticalOrder}&field=title`;
      }
    }
    // Case 2: Sorting is required
    else if (order || alphabeticalOrder) {
      url = `http://localhost:8080/api/movies/sort?page=${resetPage ? 0 : currentPage - 1}&size=${moviesPerPage}`;
      
      // Determine which field to sort by
      const field = order ? "rating" : "title";
      const sortValue = order || alphabeticalOrder;
      
      url += `&field=${field}&order=${sortValue}`;
    }
    // Case 3: No sorting or filtering, just get all movies
    else {
      url = `http://localhost:8080/api/main?page=${resetPage ? 0 : currentPage - 1}&size=${moviesPerPage}`;
    }
    
    console.log("API URL:", url);
    
    fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Simplify this logic - always use append mode for scroll
      if (data.content) {
        setMovies(prevMovies => resetPage ? data.content : [...prevMovies, ...data.content]);
        setHasMore(!data.last);
        setTotalMovies(data.totalElements);
      } else {
        setMovies(prevMovies => resetPage ? data : [...prevMovies, ...data]);
        setHasMore(data.length === moviesPerPage);
      }
      
      // Cache the movies for offline use
      saveMoviesToCache(data.content || data);
      setIsLoading(false);
      setIsServerAvailable(true);
    })
    .catch((error) => {
        console.error("Error fetching data:", error);
        setIsServerAvailable(false);
        setIsLoading(false);
        
        // Use cached data as fallback
        const cachedMovies = getMoviesFromCache();
        if (cachedMovies.length > 0) {
          setMovies(cachedMovies);
        }
      });
  };

  const handleDelete = (id: number) => {
    if (!isOnline || !isServerAvailable) {
      // Store operation for later sync
      const movieToDelete = movies.find(movie => movie.id === id);
      if (movieToDelete) {
        savePendingOperation({
          type: 'delete',
          movie: movieToDelete,
          id: id,
          timestamp: Date.now()
        });
      }
      // Update UI immediately
      setMovies(movies.filter((movie) => movie.id !== id));
      return;
    }
    
    fetch(`http://localhost:8080/api/delete/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setMovies(movies.filter((movie) => movie.id !== id));
          
          // Update cache
          const cachedMovies = getMoviesFromCache();
          saveMoviesToCache(cachedMovies.filter(movie => movie.id !== id));
        } else {
          throw new Error("Failed to delete movie");
        }
      })
      .catch((error) => {
        console.error("Error deleting movie:", error);
        setIsServerAvailable(false);
        
        // Store operation for later sync
        const movieToDelete = movies.find(movie => movie.id === id);
        if (movieToDelete) {
          savePendingOperation({
            type: 'delete',
            movie: movieToDelete,
            id: id,
            timestamp: Date.now()
          });
        }
        // Update UI immediately
        setMovies(movies.filter((movie) => movie.id !== id));
      });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    setAlphabeticalOrder(null); // Reset alphabetical sort when sorting by rating
    // Reset to page 1 when changing sort order
    fetchMovies(searchQuery, newOrder, null, true);
  };

  const toggleAlphabeticalOrder = () => {
    const newOrder = alphabeticalOrder === "asc" ? "desc" : "asc";
    setAlphabeticalOrder(newOrder);
    setSortOrder(null); // Reset rating sort when sorting alphabetically
    fetchMovies(searchQuery, null, newOrder, true);
  };

  const toggleFilterMenu = () => {
    setFilterMenuOpen(!filterMenuOpen);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prevCategories) =>
      prevCategories.includes(category)
        ? prevCategories.filter((cat) => cat !== category)
        : [...prevCategories, category]
    );
    // Reset to page 1
    setCurrentPage(1);
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
    // Reset to page 1
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedRating(null);
    fetchMovies("", sortOrder, alphabeticalOrder, true);
  };

  const getRatingClass = (rating: number) => {
    if (movies.length === 0) return "";
    
    const ratings = movies.map((movie) => movie.rating);
    const maxRating = Math.max(...ratings);
    const minRating = Math.min(...ratings);
    const midRating = ratings.sort((a, b) => a - b)[
      Math.floor(ratings.length / 2)
    ];

    if (rating === maxRating) return "highest-rating";
    if (rating === minRating) return "lowest-rating";
    if (rating === midRating) return "mid-rating";
    return "";
  };

  return (
    <div className="container">
      {/* Network Status Indicator */}
      <div className={`network-status ${!isOnline || !isServerAvailable ? 'visible' : ''}`}>
        {!isOnline && <div className="offline-indicator">You are offline. Changes will be saved locally.</div>}
        {isOnline && !isServerAvailable && <div className="server-down-indicator">Server is unavailable. Using cached data.</div>}
      </div>

      <div className="image-container">
        <img src="/cinema.jpg" alt="Cinema" className="cinema-image" />
        <div className="image-text">Welcome to My Movie Management App</div>
      </div>

      <div className="sort-options">
        <button onClick={toggleSortOrder}>
          Sort by Rating {sortOrder === "asc" ? "↑" : "↓"}
        </button>
        <button onClick={toggleAlphabeticalOrder}>
          Sort Alphabetically {alphabeticalOrder === "asc" ? "A-Z" : "Z-A"}
        </button>
        <input
          type="text"
          placeholder="Search by title"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to page 1 when searching
          }}
          className="search-input"
        />
        <button onClick={toggleFilterMenu} className="filter-btn">
          Filter
        </button>
      </div>

      {filterMenuOpen && (
        <div className="filter-menu">
          <div className="filter-menu-content">
            <h3>Categories:</h3>
            <div>
              {categories.map((category) => (
                <label key={category}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
            <h3>Rating:</h3>
            <div>
              {[1, 2, 3, 4].map((rating) => (
                <label key={rating}>
                  <input
                    type="radio"
                    name="rating"
                    checked={selectedRating === rating}
                    onChange={() => handleRatingChange(rating)}
                  />
                  {`> ${rating}`}
                </label>
              ))}
            </div>
            <button onClick={resetFilters} className="reset-btn">
              Reset Filters
            </button>
            <button onClick={toggleFilterMenu} className="close-btn">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="movie-list">
        {movies.map((movie, index) => (
          <div key={movie.id || `temp-${index}`} className="movie-item">
            <div
              className={`movie-number ${index % 2 === 0 ? "green" : "blue"}`}
            >
              {index + 1}.
            </div>
            <div className={`movie-details ${getRatingClass(movie.rating)}`}>
              <h2>{movie.title}</h2>
              <p>
                <strong>Category:</strong> {movie.category}
              </p>
              <p>
                <strong>Description:</strong> {movie.description}
              </p>
              <p>
                <strong>Rating:</strong> ⭐ {movie.rating}/5
              </p>
            </div>
            <div className="actions">
              <Link to={`/update/${movie.id}`} className="edit-btn">
                📝
              </Link>
              <button
                className="delete-btn"
                onClick={() => handleDelete(movie.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="loading-indicator">
            <p>Loading more movies...</p>
          </div>
        )}
        
        {!hasMore && movies.length > 0 && (
          <div className="end-message">
            <p>You've reached the end!</p>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <Link to="/add" className="add-btn">
          ✚ Add New Movie
        </Link>
        <Link to="/files" className="files-btn">
          📁 File Upload
        </Link>
      </div>

      <Charts movies={movies} />
    </div>
  );
}

// Helper function for offline operations
export const performOperationWithOfflineSupport = async (
  operation: 'add' | 'update' | 'delete',
  url: string,
  method: string,
  movieData?: Movie,
  id?: number
) => {
  const isOnline = navigator.onLine;
  
  // Try server first if online
  if (isOnline) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: movieData ? JSON.stringify(movieData) : undefined,
      });
      
      if (response.ok) {
        return { success: true, offline: false };
      }
      throw new Error('Server error');
    } catch (error) {
      console.error('Server operation failed:', error);
      // Server is down but network is up - fall back to offline mode
    }
  }
  
  // If we get here, either network is down or server is down
  if (movieData) {
    const pendingOpsStr = localStorage.getItem(PENDING_OPERATIONS_KEY);
    const pendingOps = pendingOpsStr ? JSON.parse(pendingOpsStr) : [];
    
    pendingOps.push({
      type: operation,
      movie: movieData,
      id: id,
      timestamp: Date.now()
    });
    
    localStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(pendingOps));
    
    // Update cache for immediate UI changes
    if (operation === 'add' || operation === 'update') {
      const cachedMoviesStr = localStorage.getItem(CACHED_MOVIES_KEY);
      const cachedMovies: Movie[] = cachedMoviesStr ? JSON.parse(cachedMoviesStr) : [];
      
      if (operation === 'add') {
        // Generate temporary ID for new movie
        const tempMovie = { ...movieData, id: -Date.now() }; // Negative ID to avoid conflicts with real IDs
        cachedMovies.push(tempMovie);
      } else if (operation === 'update' && id) {
        const index = cachedMovies.findIndex((movie: Movie) => movie.id === id);
        if (index !== -1) {
          cachedMovies[index] = { ...movieData, id };
        }
      }
      
      localStorage.setItem(CACHED_MOVIES_KEY, JSON.stringify(cachedMovies));
    }
  }
  
  return { success: true, offline: true };
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MovieList />} />
        <Route path="/add" element={<AddMovie />} />
        <Route path="/update/:id" element={<UpdateMovie />} />
        <Route path="/files" element={<FileUpload />} />
      </Routes>
    </Router>
  );
}

export default App;