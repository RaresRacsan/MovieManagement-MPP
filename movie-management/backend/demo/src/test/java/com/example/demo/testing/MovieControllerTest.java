package com.example.demo.testing;

import com.example.demo.model.Movie;
import com.example.demo.repository.MovieRepository;
import com.example.demo.controller.MainController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

public class MovieControllerTest {

    @Mock
    private MovieRepository movieRepository;

    @InjectMocks
    private MainController movieController;

    private List<Movie> movieList;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        movieList = new ArrayList<>();
        movieList.add(new Movie("Movie2", 1.0, "film cacao", "comedie"));
        movieList.add(new Movie("no", 1.0, "no", "no"));
        movieList.add(new Movie("AddedMovie", 2.0, "yes", "NewMovie"));
        movieList.add(new Movie("Movie3", 4.2, "film bun", "horror"));
        movieList.add(new Movie("Movie1", 5.0, "film smeker", "drama"));
    }

    @Test
    public void testDeleteMovie() {
        int initialSize = movieList.size();
        Movie movie = movieList.get(0);

        when(movieRepository.findById(movie.getId())).thenReturn(Optional.of(movie));
        doAnswer(invocation -> {
            movieList.remove(movie);
            return null;
        }).when(movieRepository).deleteById(movie.getId());

        ResponseEntity<Void> response = movieController.deleteMovie(movie.getId());

        assertEquals(ResponseEntity.ok().build(), response);
        assertEquals(initialSize - 1, movieList.size());
    }

    @Test
    public void testCreateMovie() {
        Movie newMovie = new Movie("New Movie", 3.0, "New Description", "New Category");
        int initialSize = movieList.size();

        when(movieRepository.save(newMovie)).thenAnswer(invocation -> {
            movieList.add(newMovie);
            return newMovie;
        });

        ResponseEntity<Void> response = movieController.addMovie(newMovie);

        assertEquals(ResponseEntity.ok().build(), response);
        assertEquals(initialSize + 1, movieList.size());
        assertEquals(newMovie, movieList.get(movieList.size() - 1));
    }

    @Test
    public void testReadMovies() {
        when(movieRepository.findAll()).thenReturn(movieList);

        List<Movie> response = movieController.getAllMovies();

        assertEquals(movieList.size(), response.size());
        assertEquals(movieList, response);
    }

    @Test
    public void testUpdateMovie() {
        Movie updatedMovie = new Movie("Updated Movie2", 4.0, "Updated Description", "Updated Category");
        int initialSize = movieList.size();

        ResponseEntity<Object> response = movieController.updateMovie(2, updatedMovie);

        assertEquals(initialSize, movieList.size());
    }
}