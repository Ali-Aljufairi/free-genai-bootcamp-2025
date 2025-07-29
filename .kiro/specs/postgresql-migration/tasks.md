# Implementation Plan

- [x] 1. Create PostgreSQL Schema
  - Create database schema file with proper structure based on actual JSON data
  - Include all extensions, enums, and tables from design
  - Add indexes and constraints for performance and data integrity
  - _Requirements: 1.1, 1.2, 1.3_

- [-] 2. Create Data Import System
  - [x] 2.1 Create core data import functions
    - Write SQL functions for safe JSON extraction and validation
    - Create import functions for kanji, words, and grammar data
    - Test with sample data to ensure proper field mapping
    - _Requirements: 2.1, 2.2, 4.1, 6.1, 7.1_

  - [-] 2.2 Create JLPT questions import system
    - Write efficient import script for JLPT questions using jq and PostgreSQL COPY
    - Handle variable question structures (audio URLs, timing, HTML content)
    - Process all question types: grammar, listening, reading, word
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.3_

  - [ ] 2.3 Create book set and unit import
    - Import book sets as courses with proper metadata
    - Create hierarchical unit structure using ltree
    - Map word-unit relationships from book_set_unit_detail.json
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 3. Create Docker Infrastructure
  - [ ] 3.1 Create PostgreSQL Docker setup
    - Write Dockerfile with required extensions (pgcrypto, pg_trgm, ltree, vector)
    - Create docker-compose.yml with PostgreSQL and pgAdmin
    - Add health checks and proper volume management
    - _Requirements: 10.1, 10.3_

  - [ ] 3.2 Create automated import container
    - Create container that runs import scripts automatically
    - Include jq and all required tools for JSON processing
    - Add progress reporting and error handling
    - _Requirements: 4.2, 4.4, 10.2_

- [ ] 4. Update Go Backend
  - [ ] 4.1 Update database dependencies
    - Add gorm.io/driver/postgres to go.mod
    - Remove gorm.io/driver/sqlite dependency
    - Update import statements in database code
    - _Requirements: 8.1_

  - [ ] 4.2 Update database configuration
    - Modify internal/database/database.go to use PostgreSQL
    - Update connection string handling for PostgreSQL
    - Add connection pooling configuration
    - _Requirements: 8.2_

  - [ ] 4.3 Update GORM models
    - Enhance existing models to use PostgreSQL-specific features
    - Add new models for JLPT questions and enhanced features
    - Preserve existing model interfaces for backward compatibility
    - _Requirements: 8.3_

  - [ ] 4.4 Test existing API endpoints
    - Verify all current endpoints work with PostgreSQL
    - Test study sessions, word groups, and review functionality
    - Ensure no breaking changes to existing features
    - _Requirements: 3.1, 3.2, 3.3, 8.4_

- [ ] 5. Create Migration Scripts
  - [ ] 5.1 Create master import script
    - Write shell script that orchestrates complete import process
    - Include progress tracking and error reporting
    - Add data validation and statistics reporting
    - _Requirements: 4.4, 10.2, 10.4_

  - [ ] 5.2 Create data validation scripts
    - Write scripts to verify import completeness and accuracy
    - Check record counts, relationship integrity, and data quality
    - Generate import statistics and reports
    - _Requirements: 4.4_

- [ ] 6. Update Frontend Configuration
  - Update environment variables for PostgreSQL connection
  - Test frontend functionality with new database
  - Verify no breaking changes to user interface
  - _Requirements: 8.4_

- [ ] 7. Create Documentation
  - [ ] 7.1 Write migration guide
    - Document step-by-step migration process
    - Include troubleshooting guide and common issues
    - Provide rollback procedures if needed
    - _Requirements: 10.4_

  - [ ] 7.2 Update deployment documentation
    - Update Docker Compose configurations
    - Document new environment variables and settings
    - Provide production deployment guidelines
    - _Requirements: 10.1, 10.3_

- [ ] 8. Performance Testing and Optimization
  - [ ] 8.1 Test import performance
    - Measure import time for 507MB dataset
    - Identify bottlenecks and optimize as needed
    - Ensure import completes within reasonable time
    - _Requirements: 4.1, 4.2_

  - [ ] 8.2 Test query performance
    - Compare query performance vs SQLite
    - Optimize indexes based on actual usage patterns
    - Ensure better performance than current implementation
    - _Requirements: 1.3_