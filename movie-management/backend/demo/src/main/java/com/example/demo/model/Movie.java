package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "movies")
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "rating", nullable = false)
    private double rating;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "category", nullable = false)
    private String category;

    public Movie() {}

    public Movie(String title, double rating, String description, String category) {
        this.title = title;
        this.rating = rating;
        this.description = description;
        this.category = category;
    }

    public long getId() {
        return this.id;
    }

    public String getTitle() {
        return this.title;
    }

    public double getRating() {
        return this.rating;
    }

    public String getDescription() {
        return this.description;
    }

    public String getCategory() {
        return this.category;
    }
}
