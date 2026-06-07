"""
Database Models for VolcanoStrat AI
SQLAlchemy models for data persistence

Supports: SQLite (default) and PostgreSQL
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from typing import Optional, Dict, List, Any

# SQLAlchemy base
Base = declarative_base()

# Database session management
class DatabaseSession:
    """Manages database sessions and connections"""
    
    def __init__(self, database_url: str = None):
        """
        Initialize database session.
        
        Args:
            database_url: SQLAlchemy database URL
                        Default: sqlite:///./volcanostrat.db
        """
        self.database_url = database_url or os.getenv('DATABASE_URL', 'sqlite:///./volcanostrat.db')
        self.engine = create_engine(self.database_url, echo=False)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    def get_db(self):
        """Get a new database session"""
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    def create_all(self):
        """Create all database tables"""
        Base.metadata.create_all(bind=self.engine)
    
    def drop_all(self):
        """Drop all database tables (use with caution!)"""
        Base.metadata.drop_all(bind=self.engine)


# Database models
class Well(Base):
    """Represents a well/borehole"""
    __tablename__ = "wells"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(String(100), unique=True, index=True, nullable=False)
    x_coordinate = Column(Float, nullable=False)
    y_coordinate = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    datum = Column(String(50), default="WGS84")
    location_description = Column(Text)
    drilled_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    layers = relationship("Layer", back_populates="well", cascade="all, delete-orphan")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'well_id': self.well_id,
            'x_coordinate': self.x_coordinate,
            'y_coordinate': self.y_coordinate,
            'elevation_m': self.elevation_m,
            'datum': self.datum,
            'location_description': self.location_description,
            'drilled_date': self.drilled_date.isoformat() if self.drilled_date else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Layer(Base):
    """Represents a stratigraphic layer in a well"""
    __tablename__ = "layers"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey('wells.id'), nullable=False, index=True)
    depth_start_m = Column(Float, nullable=False)
    depth_end_m = Column(Float, nullable=False)
    thickness_m = Column(Float)
    raw_lithology = Column(Text, nullable=False)
    standardized_lithology = Column(String(255))
    modifiers = Column(JSON)  # List of modifiers
    hydro_property = Column(String(100))
    confidence = Column(Float)  # 0-1 scale
    predicted_t = Column(Float)  # Transmissivity
    t_range = Column(String(100))
    layer_number = Column(Integer)
    
    # Metadata
    color = Column(String(20))
    description = Column(Text)
    
    # Relationships
    well = relationship("Well", back_populates="layers")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'well_id': self.well_id,
            'depth_start_m': self.depth_start_m,
            'depth_end_m': self.depth_end_m,
            'thickness_m': self.thickness_m,
            'raw_lithology': self.raw_lithology,
            'standardized_lithology': self.standardized_lithology,
            'modifiers': self.modifiers or [],
            'hydro_property': self.hydro_property,
            'confidence': self.confidence,
            'predicted_t': self.predicted_t,
            't_range': self.t_range,
            'layer_number': self.layer_number,
            'color': self.color,
            'description': self.description
        }


class Project(Base):
    """Represents a project containing multiple wells"""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(Text)
    study_area_polygon = Column(JSON)  # GeoJSON polygon
    coordinate_system = Column(String(50), default="EPSG:4326")
    
    # Metadata
    created_by = Column(String(100))
    organization = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    well_projects = relationship("WellProject", back_populates="project", cascade="all, delete-orphan")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'location': self.location,
            'study_area_polygon': self.study_area_polygon,
            'coordinate_system': self.coordinate_system,
            'created_by': self.created_by,
            'organization': self.organization,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class WellProject(Base):
    """Associates wells with projects"""
    __tablename__ = "well_projects"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey('wells.id'), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    well = relationship("Well")
    project = relationship("Project")


class CausalAnalysis(Base):
    """Stores causal analysis results (CEPR)"""
    __tablename__ = "causal_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey('wells.id'), nullable=False, index=True)
    cepr_data = Column(JSON)  # Causal Earth Process Record data
    cci = Column(Float)  # Causal Connectivity Index
    fep = Column(Float)  # Formation Energy Proxy
    hcss = Column(Float)  # Hydro-Causal Stability Score
    aquifer_explanation = Column(Text)
    causal_chains = Column(JSON)  # List of causal chains
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    well = relationship("Well")


class ExportLog(Base):
    """Logs export operations"""
    __tablename__ = "export_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100))
    export_type = Column(String(50))  # wells, layers, 2d, 3d, pdf, cepr
    export_format = Column(String(50))  # csv, json, shp, pdf, etc.
    file_name = Column(String(255))
    file_size_bytes = Column(Integer)
    file_path = Column(Text)  # Path to exported file (if saved on server)
    download_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)


class UploadLog(Base):
    """Logs file upload operations"""
    __tablename__ = "upload_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100))
    original_filename = Column(String(255))
    file_type = Column(String(50))  # csv, excel, las, geojson, shapefile
    file_size_bytes = Column(Integer)
    well_count = Column(Integer)
    layer_count = Column(Integer)
    status = Column(String(50), default="success")  # success, failed, processing
    error_message = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)


# Database CRUD operations
class WellCRUD:
    """CRUD operations for Well model"""
    
    @staticmethod
    def create(db, well_data: Dict[str, Any]) -> Well:
        """Create a new well"""
        well = Well(
            well_id=well_data.get('Well_ID', 'Unknown'),
            x_coordinate=well_data.get('X_Coordinate', 0),
            y_coordinate=well_data.get('Y_Coordinate', 0),
            elevation_m=well_data.get('Elevation_m', 0),
            datum=well_data.get('Datum', 'WGS84'),
            location_description=well_data.get('Location_Description'),
            drilled_date=well_data.get('Drilled_Date')
        )
        db.add(well)
        db.commit()
        db.refresh(well)
        return well
    
    @staticmethod
    def get(db, well_id: str) -> Optional[Well]:
        """Get a well by ID"""
        return db.query(Well).filter(Well.well_id == well_id).first()
    
    @staticmethod
    def get_by_id(db, id: int) -> Optional[Well]:
        """Get a well by database ID"""
        return db.query(Well).filter(Well.id == id).first()
    
    @staticmethod
    def get_all(db) -> List[Well]:
        """Get all wells"""
        return db.query(Well).all()
    
    @staticmethod
    def update(db, well_id: int, well_data: Dict[str, Any]) -> Optional[Well]:
        """Update a well"""
        well = db.query(Well).filter(Well.id == well_id).first()
        if well:
            for key, value in well_data.items():
                if hasattr(well, key):
                    setattr(well, key, value)
            well.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(well)
        return well
    
    @staticmethod
    def delete(db, well_id: int) -> bool:
        """Delete a well"""
        well = db.query(Well).filter(Well.id == well_id).first()
        if well:
            db.delete(well)
            db.commit()
            return True
        return False


class LayerCRUD:
    """CRUD operations for Layer model"""
    
    @staticmethod
    def create(db, well_id: int, layer_data: Dict[str, Any]) -> Layer:
        """Create a new layer for a well"""
        layer = Layer(
            well_id=well_id,
            depth_start_m=layer_data.get('Depth_Start', layer_data.get('depth_start', 0)),
            depth_end_m=layer_data.get('Depth_End', layer_data.get('depth_end', 0)),
            thickness_m=layer_data.get('Thickness', layer_data.get('thickness', 0)),
            raw_lithology=layer_data.get('Raw_Lithology_Description', layer_data.get('raw_lithology', 'Unknown')),
            standardized_lithology=layer_data.get('Standardized_Lithology', layer_data.get('standardized_lithology')),
            modifiers=layer_data.get('Modifiers', layer_data.get('modifiers', [])),
            hydro_property=layer_data.get('Hydro_Property', layer_data.get('hydro_property')),
            confidence=layer_data.get('Confidence', layer_data.get('confidence')),
            predicted_t=layer_data.get('Predicted_T', layer_data.get('predicted_t')),
            t_range=layer_data.get('T_Range', layer_data.get('t_range')),
            layer_number=layer_data.get('Layer_Number', layer_data.get('layer_number')),
            color=layer_data.get('Color', layer_data.get('color')),
            description=layer_data.get('Description', layer_data.get('description'))
        )
        db.add(layer)
        db.commit()
        db.refresh(layer)
        return layer
    
    @staticmethod
    def get_by_well(db, well_id: int) -> List[Layer]:
        """Get all layers for a well"""
        return db.query(Layer).filter(Layer.well_id == well_id).order_by(Layer.depth_start_m).all()
    
    @staticmethod
    def get_all(db) -> List[Layer]:
        """Get all layers"""
        return db.query(Layer).all()
    
    @staticmethod
    def delete_by_well(db, well_id: int) -> int:
        """Delete all layers for a well"""
        layers = db.query(Layer).filter(Layer.well_id == well_id).all()
        count = len(layers)
        for layer in layers:
            db.delete(layer)
        db.commit()
        return count


# Initialize database
# Create a global database session instance
db_session = DatabaseSession()

# Create all tables on import (for development)
# In production, you might want to control this more carefully
try:
    db_session.create_all()
except Exception as e:
    # If using SQLite and the database is locked, that's okay
    pass

# Utility functions
def save_standardized_data(db, well_data: Dict[str, Any]) -> Optional[Well]:
    """
    Save standardized well data to the database.
    
    Args:
        db: Database session
        well_data: Standardized well data from the API
        
    Returns:
        The created/updated Well object
    """
    well_id = well_data.get('Well_ID', 'Unknown')
    coordinates = well_data.get('Coordinates', {})
    
    # Get or create well
    existing_well = WellCRUD.get(db, well_id)
    
    if existing_well:
        # Update existing well
        WellCRUD.update(db, existing_well.id, {
            'x_coordinate': coordinates.get('X', 0),
            'y_coordinate': coordinates.get('Y', 0),
            'elevation_m': coordinates.get('Elevation', 0),
            'updated_at': datetime.utcnow()
        })
        well = existing_well
        # Delete old layers
        LayerCRUD.delete_by_well(db, well.id)
    else:
        # Create new well
        well = WellCRUD.create(db, {
            'Well_ID': well_id,
            'X_Coordinate': coordinates.get('X', 0),
            'Y_Coordinate': coordinates.get('Y', 0),
            'Elevation_m': coordinates.get('Elevation', 0)
        })
    
    # Save layers
    layers = well_data.get('Layers', [])
    for layer in layers:
        LayerCRUD.create(db, well.id, layer)
    
    db.commit()
    return well


def get_all_wells_with_layers(db) -> List[Dict[str, Any]]:
    """
    Get all wells with their layers from the database.
    
    Args:
        db: Database session
        
    Returns:
        List of well data with layers
    """
    wells = WellCRUD.get_all(db)
    result = []
    
    for well in wells:
        layers = LayerCRUD.get_by_well(db, well.id)
        result.append({
            'Well_ID': well.well_id,
            'X_Coordinate': well.x_coordinate,
            'Y_Coordinate': well.y_coordinate,
            'Elevation_m': well.elevation_m,
            'Coordinates': {
                'X': well.x_coordinate,
                'Y': well.y_coordinate,
                'Elevation': well.elevation_m,
                'Datum': well.datum
            },
            'Layers': [layer.to_dict() for layer in layers]
        })
    
    return result


# Export functions for use in API endpoints
def get_db_session():
    """Get a database session (for dependency injection)"""
    return db_session.get_db()


# Create a new session for testing or other purposes
def create_new_session():
    """Create a new database session"""
    return db_session.SessionLocal()
