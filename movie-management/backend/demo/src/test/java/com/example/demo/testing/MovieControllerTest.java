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
        movieList.add(new Movie("10", 4.5, "This is hardcoded", "hardcoded"));
        movieList.add(new Movie("11", 1.0, "This is also hardcoded", "hardcoded"));
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
}