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

  useEffect(() => {
    fetchMovies(searchQuery);
  }, [searchQuery]);

  const fetchMovies = (query: string, order: "asc" | "desc" | null = null) => {
    let url = `http://localhost:8080/api/main?search=${query}`;
    if (order) {
      url += `&sort=${order}`;
    }
    fetch(url)
      .then((response) => response.json())
      .then((data) => setMovies(data))
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

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    fetchMovies(searchQuery, newOrder);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies(searchQuery, sortOrder);
  };
  
  return (
    <div className="container">
      <div className="image-container">
        <img src="/cinema.jpg" alt="Cinema" className="cinema-image" />
        <div className="image-text">Welcome to My Movie Management App</div>
      </div>

      <h1 className="title">List Of All Movies</h1>

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
      </div>

      <div className="movie-list">
        {movies.map((movie, index) => (
          <div key={movie.id} className="movie-item">
            <div className={`movie-number ${index % 2 === 0 ? "green" : "blue"}`}> {index + 1}.</div>
            <div className="movie-details">
              <h2>{movie.title}</h2>
              <p><strong>Category:</strong> {movie.category}</p>
              <p><strong>Description:</strong> {movie.description}</p>
              <p><strong>Rating:</strong> ⭐ {movie.rating}/5</p>
            </div>
            <div className="actions">
              <Link to={`/update/${movie.id}`} className="edit-btn">📝</Link>
              <button className="delete-btn" onClick={() => handleDelete(movie.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <Link to="/add" className="add-btn">✚ Add New Movie</Link>
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