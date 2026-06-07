# VolcanoStrat AI Tests

This directory contains unit tests for the VolcanoStrat AI platform.

## Running Tests

To run all tests:

```bash
cd backend
python -m pytest tests/ -v
```

To run specific test files:

```bash
# Run causal engine tests
python -m pytest tests/test_causal_engine.py -v

# Run file importers tests
python -m pytest tests/test_file_importers.py -v
```

## Test Coverage

- **Causal Engine**: Tests for CSIE functionality including:
  - Causal Knowledge Graph initialization
  - Process identification
  - Intensity and confidence estimation
  - CEPR transformation
  - What-If scenarios
  - Causal similarity comparison
  - Metrics calculations (CCI, FEP, HCSS)
  - Predictive aquifer targets

- **File Importers**: Tests for multi-format support:
  - Excel importer
  - LAS importer
  - GeoJSON importer
  - File importer factory

## Dependencies

- pytest
- pytest-cov (for coverage reports)

## Writing New Tests

When adding new functionality, please add corresponding tests in the appropriate test file. Test files should follow the naming convention `test_<module>.py`.

## Coverage Report

To generate a coverage report:

```bash
cd backend
python -m pytest tests/ --cov=app --cov-report=html
```

This will create an `htmlcov` directory with detailed coverage information.
