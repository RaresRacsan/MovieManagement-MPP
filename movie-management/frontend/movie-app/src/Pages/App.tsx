import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Styles/App.css";
import AddMovie from "./AddMovies";

interface Movie {
  id: number;
  title: string;
  rating: number;
  description: string;
  category: string;
}

function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/main")
      .then((response) => response.json())
      .then((data) => setMovies(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="container">
      <div className="image-container">
        <img src="/cinema.jpg" alt="Cinema" className="cinema-image" />
      </div>

      <h1 className="title">List Of All Movies</h1>

      <div className="movie-list">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-content">
              <h2>{movie.title}</h2>
              <p><strong>Category:</strong> {movie.category}</p>
              <p><strong>Description:</strong> {movie.description}</p>
              <p><strong>Rating:</strong> ⭐ {movie.rating}/5</p>
            </div>
            <div className="actions">
              <button className="edit-btn">📝</button>
              <button className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <Link to="/add" className="add-btn">
      ✚  Add New Movie
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
      </Routes>
    </Router>
  );
}

export default App;
