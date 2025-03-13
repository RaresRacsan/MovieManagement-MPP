import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/App.css";
import "../Styles/AddMovies.css";

function AddMovie() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(""); 
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newMovie = { title, category, description, rating };

    fetch("http://localhost:8080/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMovie),
    })
      .then(() => navigate("/")) // Redirect back to the movie list
      .catch((error) => console.error("Error adding movie:", error));
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Add a New Movie</h1>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Category:</label>
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Rating:</label>
        <input type="number" value={rating} onChange={(e) => setRating(Number(e.target.value))} min="1" max="5" required />

        <button type="submit" className="add-btn">✚  Add Movie</button>
      </form>
      <button onClick={() => navigate("/")} className="back-btn">← Back Home</button>
    </div>
  );
}

export default AddMovie;