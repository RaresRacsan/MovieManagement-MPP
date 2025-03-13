package com.example.demo.config;

import com.example.demo.model.Movie;
import com.example.demo.repository.MovieRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(MovieRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new Movie("Movie1", 5, "film smeker", "drama"));
            }
            if (repository.count() == 1) {
                repository.save(new Movie("Movie2", 1, "film cacao", "comedie"));
            }
            if (repository.count() == 2) {
                repository.save(new Movie("Movie3", 4.2, "film bun", "horror"));
            }
            if (repository.count() == 3) {
                repository.save(new Movie("Movie4", 3, "film ok", "drama"));
            }
        };
    }
}
