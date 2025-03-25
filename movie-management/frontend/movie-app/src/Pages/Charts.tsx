import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface Movie {
  id: number;
  title: string;
  rating: number;
  description: string;
  category: string;
}

interface Props {
  movies: Movie[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function Charts({ movies }: Props) {
  const [ratingsData, setRatingsData] = useState<{ rating: string; count: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([]);
  const [averageRatingData, setAverageRatingData] = useState<{ time: string; avgRating: number }[]>([]);

  useEffect(() => {
    if (movies.length === 0) return;

    // Rating Distribution
    const ratingCounts: Record<number, number> = {};
    movies.forEach((movie) => {
      ratingCounts[movie.rating] = (ratingCounts[movie.rating] || 0) + 1;
    });
    setRatingsData(Object.keys(ratingCounts).map((key) => ({
      rating: key,
      count: ratingCounts[Number(key)],
    })));

    // Category Distribution
    const categoryCounts: Record<string, number> = {};
    movies.forEach((movie) => {
      categoryCounts[movie.category] = (categoryCounts[movie.category] || 0) + 1;
    });
    setCategoryData(Object.keys(categoryCounts).map((key) => ({
      category: key,
      count: categoryCounts[key],
    })));

    // Average Rating Over Time (Simulated Data)
    const newTime = new Date().toLocaleTimeString();
    const avgRating = movies.reduce((sum, movie) => sum + movie.rating, 0) / movies.length;
    setAverageRatingData((prev) => [...prev.slice(-5), { time: newTime, avgRating }]); // Keep last 5 points
  }, [movies]);

  return (
    <div className="charts-container">
      {/* Rating Distribution Chart */}
      <div className="chart">
        <h3>Ratings Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={ratingsData}>
            <XAxis dataKey="rating" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Distribution Chart */}
      <div className="chart">
        <h3>Category Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={categoryData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Average Rating Over Time */}
      <div className="chart">
        <h3>Average Rating Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={averageRatingData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="avgRating" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Charts;
