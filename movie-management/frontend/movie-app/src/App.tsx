import { fireEvent } from "@testing-library/dom";
import { useEffect, useState } from "react";

interface Movie {
  id: number;
  title: string;
  rating: number;
  description: string;
  category: string;
}

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/main")
      .then((response) => response.json())
      .then((data) => setMovies(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div>
      <h1>Movie List</h1>
      <ul>
        {movies.map((movie) => (
          <li key={movie.id}>
            <h2>{movie.title}</h2>
            <p><strong>Category:</strong> {movie.category}</p>
            <p><strong>Description:</strong> {movie.description}</p>
            <p><strong>Rating:</strong> {movie.rating}/5</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
