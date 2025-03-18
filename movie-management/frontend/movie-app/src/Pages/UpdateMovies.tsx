import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../Styles/App.css";
import "../Styles/AddMovies.css";

function UpdateMovie() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(""); 
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8080/api/movie/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setTitle(data.title);
        setCategory(data.category);
        setDescription(data.description);
        setRating(data.rating);
      })
      .catch((error) => console.error("Error fetching movie:", error));
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedMovie = { title, category, description, rating };

    fetch(`http://localhost:8080/api/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMovie),
    })
      .then(() => navigate("/"))
      .catch((error) => console.error("Error updating movie:", error));
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Update Movie</h1>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Category:</label>
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Rating:</label>
        <input type="number" value={rating} onChange={(e) => setRating(Number(e.target.value))} min="1" max="5" required />

        <button type="submit" className="add-btn">✚  Update Movie</button>
      </form>
      <button onClick={() => navigate("/")} className="back-btn">← Back Home</button>
    </div>
  );
}

export default UpdateMovie;