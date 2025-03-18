import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Styles/App.css";
import AddMovie from "./AddMovies";
import UpdateMovie from "./UpdateMovies";

interface Movie {
  id: number;
  title: string;
  rating: number;
  description: string;
  category: string;
}

function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchAllMovies();
  }, []);

  useEffect(() => {
    fetchMovies(searchQuery, sortOrder);
  }, [searchQuery, sortOrder, selectedCategories, selectedRating]);

  const fetchAllMovies = () => {
    fetch(`http://localhost:8080/api/main`)
      .then((response) => response.json())
      .then((data: Movie[]) => {
        const uniqueCategories = Array.from(
          new Set(data.map((movie: Movie) => movie.category))
        );
        setCategories(uniqueCategories);
      })
      .catch((error) => console.error("Error fetching data:", error));
  };

  const fetchMovies = (query: string, order: "asc" | "desc" | null = null) => {
    let url = `http://localhost:8080/api/main?search=${query}`;
    if (order) {
      url += `&sort=${order}`;
    }
    if (selectedCategories.length > 0) {
      url += `&categories=${selectedCategories.join(",")}`;
    }
    if (selectedRating !== null) {
      url += `&rating=${selectedRating}`;
    }
    fetch(url)
      .then((response) => response.json())
      .then((data: Movie[]) => setMovies(data))
      .catch((error) => console.error("Error fetching data:", error));
  };

  const handleDelete = (id: number) => {
    fetch(`http://localhost:8080/api/delete/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        setMovies(movies.filter((movie) => movie.id !== id));
      })
      .catch((error) => console.error("Error deleting movie:", error));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies(searchQuery, sortOrder);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    fetchMovies(searchQuery, newOrder);
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
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedRating(null);
    fetchMovies(searchQuery, sortOrder);
  };

  return (
    <div className="container">
      <div className="image-container">
        <img src="/cinema.jpg" alt="Cinema" className="cinema-image" />
        <div className="image-text">Welcome to My Movie Management App</div>
      </div>

      <div className="sort-options">
        <button onClick={toggleSortOrder}>
          Sort by Rating {sortOrder === "asc" ? "↑" : "↓"}
        </button>
        <input
          type="text"
          placeholder="Search by title"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          <div key={movie.id} className="movie-item">
            <div
              className={`movie-number ${index % 2 === 0 ? "green" : "blue"}`}
            >
              {" "}
              {index + 1}.
            </div>
            <div className="movie-details">
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
      </div>

      <Link to="/add" className="add-btn">
        ✚ Add New Movie
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MovieList />} />
        <Route path="/add" element={<AddMovie />} />
        <Route path="/update/:id" element={<UpdateMovie />} />
      </Routes>
    </Router>
  );
}

export default App;
