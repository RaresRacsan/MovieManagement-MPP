package com.example.demo.repository;

import com.example.demo.model.Movie;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface MovieRepository extends JpaRepository<Movie, Integer> {
    List<Movie> findByTitleContainingIgnoreCase(String title, Sort sort);
    List<Movie> findByTitleContainingIgnoreCaseAndCategoryIn(String title, List<String> categories, Sort sort);
    List<Movie> findByTitleContainingIgnoreCaseAndRatingGreaterThanEqual(String title, Integer rating, Sort sort);
    List<Movie> findByTitleContainingIgnoreCaseAndCategoryInAndRatingGreaterThanEqual(String title, List<String> categories, Integer rating, Sort sort);
    List<Movie> findByCategoryIn(List<String> categories, Sort sort);
    List<Movie> findByCategoryInAndRatingGreaterThanEqual(List<String> categories, Integer rating, Sort sort);
    List<Movie> findByRatingGreaterThanEqual(Integer rating, Sort sort);

}
