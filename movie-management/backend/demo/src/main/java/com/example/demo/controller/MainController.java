package com.example.demo.controller;

import com.example.demo.model.Movie;
import com.example.demo.repository.MovieRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class MainController {
    private final MovieRepository movieRepository;

    public MainController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping("/main")
    @CrossOrigin(origins = "http://localhost:3000")
    public List<Movie> getAllMovies(@RequestParam(required = false) String sort, @RequestParam(required = false) String search, @RequestParam(required = false) List<String> categories, @RequestParam(required = false) Integer rating, @RequestParam(required = false) String alphabetical) {
        Sort sortOrder = Sort.unsorted();
        if ("asc".equals(sort)) {
            sortOrder = Sort.by(Sort.Direction.ASC, "rating");
        } else if ("desc".equals(sort)) {
            sortOrder = Sort.by(Sort.Direction.DESC, "rating");
        }

        if ("asc".equals(alphabetical)) {
            sortOrder = Sort.by(Sort.Direction.ASC, "title");
        } else if ("desc".equals(alphabetical)) {
            sortOrder = Sort.by(Sort.Direction.DESC, "title");
        }

        if (search != null && !search.isEmpty()) {
            if (categories != null && !categories.isEmpty()) {
                if (rating != null) {
                    return movieRepository.findByTitleContainingIgnoreCaseAndCategoryInAndRatingGreaterThanEqual(search, categories, rating, sortOrder);
                } else {
                    return movieRepository.findByTitleContainingIgnoreCaseAndCategoryIn(search, categories, sortOrder);
                }
            } else {
                if (rating != null) {
                    return movieRepository.findByTitleContainingIgnoreCaseAndRatingGreaterThanEqual(search, rating, sortOrder);
                } else {
                    return movieRepository.findByTitleContainingIgnoreCase(search, sortOrder);
                }
            }
        } else {
            if (categories != null && !categories.isEmpty()) {
                if (rating != null) {
                    return movieRepository.findByCategoryInAndRatingGreaterThanEqual(categories, rating, sortOrder);
                } else {
                    return movieRepository.findByCategoryIn(categories, sortOrder);
                }
            } else {
                if (rating != null) {
                    return movieRepository.findByRatingGreaterThanEqual(rating, sortOrder);
                } else {
                    return movieRepository.findAll(sortOrder);
                }
            }
        }
    }

    @GetMapping("/movie/{id}")
    @CrossOrigin(origins = "http://localhost:3000")
    public ResponseEntity<Movie> getMovieById(@PathVariable Integer id) {
        return movieRepository.findById(id)
                .map(movie -> ResponseEntity.ok().body(movie))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/add")
    @CrossOrigin(origins = "http://localhost:3000")
    public ResponseEntity<Void> addMovie(@RequestBody Movie movie) {
        try {
            movieRepository.save(movie);
            return ResponseEntity.ok().build();
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/delete/{id}")
    @CrossOrigin(origins = "http://localhost::3000")
    public ResponseEntity<Void> deleteMovie(@PathVariable Integer id) {
        try {
            movieRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/update/{id}")
    @CrossOrigin(origins = "http://localhost::3000")
    public ResponseEntity<Object> updateMovie(@PathVariable Integer id, @RequestBody Movie updatedMovie) {
        return movieRepository.findById(id)
                .map(movie -> {
                    movie.setTitle(updatedMovie.getTitle());
                    movie.setCategory(updatedMovie.getCategory());
                    movie.setDescription(updatedMovie.getDescription());
                    movie.setRating(updatedMovie.getRating());
                    movieRepository.save(movie);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
