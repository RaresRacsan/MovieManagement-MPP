package com.example.demo.controller;

import com.example.demo.model.Movie;
import com.example.demo.repository.MovieRepository;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class MainController {
    private final MovieRepository movieRepository;

    public MainController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping("/main")
    public List<Movie> getMovies() {
        List<Movie> movies = new ArrayList<>();
        movies = movieRepository.findAll();
        return movies;
    }
}
