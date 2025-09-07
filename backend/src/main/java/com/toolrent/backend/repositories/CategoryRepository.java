package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

    //find category by name
    Optional<CategoryEntity> findByNameIgnoreCase(String name);

    //check if category name exists
    boolean existsByNameIgnoreCase(String name);

    //find categories containing name (case insensitive)
    List<CategoryEntity> findByNameContainingIgnoreCase(String name);

    //find all categories ordered by name
    @Query("SELECT c FROM CategoryEntity c ORDER BY c.name ASC")
    List<CategoryEntity> findAllOrderByName();
}
