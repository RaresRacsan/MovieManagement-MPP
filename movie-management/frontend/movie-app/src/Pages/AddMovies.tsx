import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { performOperationWithOfflineSupport } from './App';

function AddMovie() {
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isOfflineSubmit, setIsOfflineSubmit] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newMovie = {
      id: 0, // Will be assigned by the server
      title,
      rating,
      description,
      category,
    };

    const result = await performOperationWithOfflineSupport(
      'add',
      'http://localhost:8080/api/add',
      'POST',
      newMovie
    );

    if (result.success) {
      if (result.offline) {
        setIsOfflineSubmit(true);
        setMessage("Movie saved offline. It will sync when connection is restored.");
      } else {
        navigate("/");
      }
    } else {
      setMessage("Failed to add movie. Please try again.");
    }
  };

  return (
    <div className="add-movie-container">
      <h2>Add New Movie</h2>
      {message && (
        <div className={`message ${isOfflineSubmit ? "offline-message" : ""}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Form fields remain the same */}
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Rating:</label>
          <input
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Category:</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div className="form-buttons">
          <button type="submit">Add Movie</button>
          <button type="button" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMovie;