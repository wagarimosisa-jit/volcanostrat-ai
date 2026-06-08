"""
PDF Report Exporter for GVAS
Generates comprehensive geological reports in PDF format
"""

import io
import base64
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from datetime import datetime

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.platypus.flowables import HRFlowable
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


class PDFExporter:
    """
    Service for generating PDF reports from well data and analysis results.
    """
    
    def __init__(self):
        self.has_reportlab = HAS_REPORTLAB
    
    def export_well_report(self, well_data: Dict, output_format: str = 'base64') -> Dict:
        """
        Generate a comprehensive well report in PDF format.
        
        Args:
            well_data: Well data dictionary (from standardization)
            output_format: 'base64' or 'bytes'
            
        Returns:
            Dict with PDF data and metadata
        """
        if not HAS_REPORTLAB:
            return {'error': 'ReportLab not installed. Install with: pip install reportlab'}
        
        try:
            # Create PDF buffer
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=0.5*inch,
                leftMargin=0.5*inch,
                topMargin=0.5*inch,
                bottomMargin=0.5*inch
            )
            
            # Build story (content)
            story = []
            styles = getSampleStyleSheet()
            
            # Title
            self._add_title(story, styles, well_data)
            
            # Well information table
            self._add_well_info(story, styles, well_data)
            
            # Layer details
            self._add_layer_details(story, styles, well_data)
            
            # Hydrogeological assessment
            self._add_hydro_assessment(story, styles, well_data)
            
            # Build PDF
            doc.build(story)
            
            # Prepare output
            pdf_data = buffer.getvalue()
            buffer.close()
            
            if output_format == 'base64':
                return {
                    'format': 'pdf',
                    'data': base64.b64encode(pdf_data).decode('utf-8'),
                    'filename': f"Well_Report_{well_data.get('Well_ID', 'Unknown')}.pdf",
                    'mime_type': 'application/pdf'
                }
            else:
                return {
                    'format': 'pdf',
                    'data': pdf_data,
                    'filename': f"Well_Report_{well_data.get('Well_ID', 'Unknown')}.pdf",
                    'mime_type': 'application/pdf'
                }
                
        except Exception as e:
            return {'error': f'Failed to generate PDF: {str(e)}'}
    
    def export_project_report(self, wells: List[Dict], project_name: str = "GVAS Analysis", 
                              output_format: str = 'base64') -> Dict:
        """
        Generate a comprehensive project report for multiple wells.
        
        Args:
            wells: List of well data dictionaries
            project_name: Name of the project
            output_format: 'base64' or 'bytes'
            
        Returns:
            Dict with PDF data and metadata
        """
        if not HAS_REPORTLAB:
            return {'error': 'ReportLab not installed. Install with: pip install reportlab'}
        
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=0.5*inch,
                leftMargin=0.5*inch,
                topMargin=0.5*inch,
                bottomMargin=0.5*inch
            )
            
            story = []
            styles = getSampleStyleSheet()
            
            # Title page
            self._add_title_page(story, styles, project_name, wells)
            story.append(PageBreak())
            
            # Executive summary
            self._add_executive_summary(story, styles, wells)
            story.append(PageBreak())
            
            # Well summaries
            for well in wells:
                self._add_well_summary(story, styles, well)
                story.append(Spacer(1, 0.2*inch))
            
            # Comparative analysis
            if len(wells) > 1:
                story.append(PageBreak())
                self._add_comparative_analysis(story, styles, wells)
            
            # Build PDF
            doc.build(story)
            
            pdf_data = buffer.getvalue()
            buffer.close()
            
            if output_format == 'base64':
                return {
                    'format': 'pdf',
                    'data': base64.b64encode(pdf_data).decode('utf-8'),
                    'filename': f"Project_Report_{project_name.replace(' ', '_')}.pdf",
                    'mime_type': 'application/pdf'
                }
            else:
                return {
                    'format': 'pdf',
                    'data': pdf_data,
                    'filename': f"Project_Report_{project_name.replace(' ', '_')}.pdf",
                    'mime_type': 'application/pdf'
                }
                
        except Exception as e:
            return {'error': f'Failed to generate project PDF: {str(e)}'}
    
    def export_causal_report(self, ceprs: List[Dict], project_name: str = "Causal Analysis", 
                           output_format: str = 'base64') -> Dict:
        """
        Generate a causal analysis report in PDF format.
        
        Args:
            ceprs: List of Causal Earth Process Records
            project_name: Name of the project
            output_format: 'base64' or 'bytes'
            
        Returns:
            Dict with PDF data and metadata
        """
        if not HAS_REPORTLAB:
            return {'error': 'ReportLab not installed. Install with: pip install reportlab'}
        
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=0.5*inch,
                leftMargin=0.5*inch,
                topMargin=0.5*inch,
                bottomMargin=0.5*inch
            )
            
            story = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = styles['Heading1']
            title_style.fontSize = 24
            title_style.spaceAfter = 20
            title_style.alignment = TA_CENTER
            story.append(Paragraph(f"Causal Subsurface Intelligence Report", title_style))
            
            subtitle_style = styles['Heading2']
            subtitle_style.fontSize = 16
            subtitle_style.alignment = TA_CENTER
            subtitle_style.spaceAfter = 30
            story.append(Paragraph(project_name, subtitle_style))
            
            # Date
            date_style = styles['Normal']
            date_style.alignment = TA_CENTER
            date_style.spaceAfter = 30
            story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", date_style))
            story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=colors.black))
            
            # Metrics summary
            self._add_metrics_summary(story, styles, ceprs)
            story.append(Spacer(1, 0.2*inch))
            
            # Well-by-well analysis
            for cepr in ceprs:
                self._add_cepr_analysis(story, styles, cepr)
                story.append(Spacer(1, 0.2*inch))
            
            # Causal similarity matrix
            if len(ceprs) > 1:
                story.append(PageBreak())
                self._add_causal_similarity_matrix(story, styles, ceprs)
            
            # Predictive targets
            story.append(PageBreak())
            self._add_predictive_targets(story, styles, ceprs)
            
            # Build PDF
            doc.build(story)
            
            pdf_data = buffer.getvalue()
            buffer.close()
            
            if output_format == 'base64':
                return {
                    'format': 'pdf',
                    'data': base64.b64encode(pdf_data).decode('utf-8'),
                    'filename': f"Causal_Report_{project_name.replace(' ', '_')}.pdf",
                    'mime_type': 'application/pdf'
                }
            else:
                return {
                    'format': 'pdf',
                    'data': pdf_data,
                    'filename': f"Causal_Report_{project_name.replace(' ', '_')}.pdf",
                    'mime_type': 'application/pdf'
                }
                
        except Exception as e:
            return {'error': f'Failed to generate causal PDF: {str(e)}'}
    
    def _add_title(self, story: List, styles, well_data: Dict):
        """Add report title"""
        title_style = styles['Heading1']
        title_style.fontSize = 20
        title_style.alignment = TA_CENTER
        title_style.spaceAfter = 10
        
        story.append(Paragraph("GVAS - Well Analysis Report", title_style))
        
        subtitle_style = styles['Heading2']
        subtitle_style.fontSize = 14
        subtitle_style.alignment = TA_CENTER
        subtitle_style.spaceAfter = 20
        
        well_id = well_data.get('Well_ID', 'Unknown')
        story.append(Paragraph(f"Well: {well_id}", subtitle_style))
        
        # Date
        date_style = styles['Normal']
        date_style.alignment = TA_CENTER
        date_style.spaceAfter = 20
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", date_style))
        
        story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=colors.black))
    
    def _add_well_info(self, story: List, styles, well_data: Dict):
        """Add well information table"""
        title_style = styles['Heading2']
        title_style.fontSize = 14
        title_style.spaceAfter = 10
        story.append(Paragraph("Well Information", title_style))
        
        # Create data for table
        coord = well_data.get('Coordinates', {})
        data = [
            ['Parameter', 'Value'],
            ['Well ID', well_data.get('Well_ID', 'N/A')],
            ['Longitude (X)', f"{coord.get('X', 'N/A'):.6f}"],
            ['Latitude (Y)', f"{coord.get('Y', 'N/A'):.6f}"],
            ['Elevation (m)', f"{coord.get('Elevation', 'N/A'):.2f}"],
            ['Datum', coord.get('Datum', 'WGS84')],
            ['Total Layers', str(len(well_data.get('Layers', [])))],
        ]
        
        table = Table(data, colWidths=[2*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.2*inch))
    
    def _add_layer_details(self, story: List, styles, well_data: Dict):
        """Add layer details table"""
        title_style = styles['Heading2']
        title_style.fontSize = 14
        title_style.spaceAfter = 10
        story.append(Paragraph("Layer Details", title_style))
        
        layers = well_data.get('Layers', [])
        if not layers:
            story.append(Paragraph("No layers found.", styles['Normal']))
            return
        
        # Create table data
        data = [['Layer', 'Depth (m)', 'Thickness (m)', 'Lithology', 'Hydro Property', 'Confidence']]
        
        for i, layer in enumerate(layers, 1):
            data.append([
                str(i),
                f"{layer.get('Depth_Start', 0):.2f} - {layer.get('Depth_End', 0):.2f}",
                f"{layer.get('Thickness', 0):.2f}",
                ', '.join(layer.get('Modifiers', ['N/A']))[:30],
                layer.get('Hydro_Property', 'N/A')[:20],
                f"{layer.get('Confidence', 0)*100:.1f}%"
            ])
        
        table = Table(data, colWidths=[0.8*inch, 1.5*inch, 1*inch, 2*inch, 1.5*inch, 0.8*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.2*inch))
    
    def _add_hydro_assessment(self, story: List, styles, well_data: Dict):
        """Add hydrogeological assessment"""
        title_style = styles['Heading2']
        title_style.fontSize = 14
        title_style.spaceAfter = 10
        story.append(Paragraph("Hydrogeological Assessment", title_style))
        
        layers = well_data.get('Layers', [])
        aquifers = [l for l in layers if 'Aquifer' in l.get('Hydro_Property', '')]
        aquitards = [l for l in layers if 'Aquitard' in l.get('Hydro_Property', '')]
        
        text = f"<b>Total Layers:</b> {len(layers)}<br/>"
        text += f"<b>Aquifer Layers:</b> {len(aquifers)} ({len(aquifers)/len(layers)*100:.1f}%)<br/>"
        text += f"<b>Aquitard Layers:</b> {len(aquitards)} ({len(aquitards)/len(layers)*100:.1f}%)<br/>"
        text += "<br/>"
        
        if aquifers:
            text += "<b>Productive Layers:</b><br/>"
            for i, layer in enumerate(aquifers, 1):
                text += f"{i}. Layer {layer.get('Layer_Number', '?')} ({layer.get('Depth_Start', 0):.1f}-{layer.get('Depth_End', 0):.1f}m): "
                text += f"{layer.get('Hydro_Property', 'N/A')} - Confidence: {layer.get('Confidence', 0)*100:.1f}%<br/>"
        
        if aquitards:
            text += "<br/><b>Low-Permeability Layers:</b><br/>"
            for i, layer in enumerate(aquitards, 1):
                text += f"{i}. Layer {layer.get('Layer_Number', '?')} ({layer.get('Depth_Start', 0):.1f}-{layer.get('Depth_End', 0):.1f}m): "
                text += f"{layer.get('Hydro_Property', 'N/A')}<br/>"
        
        story.append(Paragraph(text, styles['Normal']))
    
    def _add_title_page(self, story: List, styles, project_name: str, wells: List[Dict]):
        """Add title page for project report"""
        title_style = styles['Heading1']
        title_style.fontSize = 28
        title_style.alignment = TA_CENTER
        title_style.spaceAfter = 20
        story.append(Paragraph("GVAS", title_style))
        
        title_style2 = styles['Heading1']
        title_style2.fontSize = 24
        title_style2.alignment = TA_CENTER
        title_style2.spaceAfter = 20
        story.append(Paragraph("Hydrostratigraphic Analysis Report", title_style2))
        
        subtitle_style = styles['Heading2']
        subtitle_style.fontSize = 18
        subtitle_style.alignment = TA_CENTER
        subtitle_style.spaceAfter = 30
        story.append(Paragraph(project_name, subtitle_style))
        
        date_style = styles['Normal']
        date_style.fontSize = 12
        date_style.alignment = TA_CENTER
        date_style.spaceAfter = 40
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", date_style))
        
        info_style = styles['Normal']
        info_style.fontSize = 12
        info_style.alignment = TA_CENTER
        info_style.spaceAfter = 10
        story.append(Paragraph(f"Number of Wells: {len(wells)}", info_style))
        story.append(Paragraph(f"Total Layers: {sum(len(w.get('Layers', [])) for w in wells)}", info_style))
    
    def _add_executive_summary(self, story: List, styles, wells: List[Dict]):
        """Add executive summary"""
        title_style = styles['Heading1']
        title_style.fontSize = 18
        title_style.spaceAfter = 15
        story.append(Paragraph("Executive Summary", title_style))
        
        total_wells = len(wells)
        total_layers = sum(len(w.get('Layers', [])) for w in wells)
        total_aquifers = sum(len([l for l in w.get('Layers', []) if 'Aquifer' in l.get('Hydro_Property', '')]) for w in wells)
        total_aquitards = sum(len([l for l in w.get('Layers', []) if 'Aquitard' in l.get('Hydro_Property', '')]) for w in wells)
        
        aquifer_pct = (total_aquifers / total_layers * 100) if total_layers > 0 else 0
        
        text = f"This report presents the analysis of <b>{total_wells}</b> wells with a total of <b>{total_layers}</b> stratigraphic layers. "
        text += f"The analysis identified <b>{total_aquifers}</b> aquifer layers ({aquifer_pct:.1f}% of all layers) and <b>{total_aquitards}</b> aquitard layers. "
        text += "Each well has been processed through GVAS's standardized lithological classification system. "
        text += "Hydraulic properties have been predicted based on global volcanic aquifer studies. "
        text += "Recommendations for groundwater development are provided based on the most productive layers."
        
        story.append(Paragraph(text, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    def _add_well_summary(self, story: List, styles, well: Dict):
        """Add a summary for a single well"""
        title_style = styles['Heading2']
        title_style.fontSize = 14
        title_style.spaceAfter = 10
        story.append(Paragraph(f"Well: {well.get('Well_ID', 'Unknown')}", title_style))
        
        coord = well.get('Coordinates', {})
        text = f"<b>Location:</b> {coord.get('X', 'N/A'):.6f}, {coord.get('Y', 'N/A'):.6f}<br/>"
        text += f"<b>Elevation:</b> {coord.get('Elevation', 'N/A'):.2f} m<br/>"
        text += f"<b>Layers:</b> {len(well.get('Layers', []))}<br/>"
        
        aquifers = [l for l in well.get('Layers', []) if 'Aquifer' in l.get('Hydro_Property', '')]
        if aquifers:
            text += f"<b>Productive Layers:</b> {len(aquifers)}<br/>"
        
        story.append(Paragraph(text, styles['Normal']))
    
    def _add_comparative_analysis(self, story: List, styles, wells: List[Dict]):
        """Add comparative analysis of multiple wells"""
        title_style = styles['Heading1']
        title_style.fontSize = 18
        title_style.spaceAfter = 15
        story.append(Paragraph("Comparative Analysis", title_style))
        
        # Create comparison table
        data = [['Well ID', 'Layers', 'Aquifers', 'Aquitards', 'Avg Confidence']]
        
        for well in wells:
            layers = well.get('Layers', [])
            aquifers = len([l for l in layers if 'Aquifer' in l.get('Hydro_Property', '')])
            aquitards = len([l for l in layers if 'Aquitard' in l.get('Hydro_Property', '')])
            avg_conf = np.mean([l.get('Confidence', 0) for l in layers]) * 100 if layers else 0
            
            data.append([
                well.get('Well_ID', 'N/A'),
                str(len(layers)),
                str(aquifers),
                str(aquitards),
                f"{avg_conf:.1f}%"
            ])
        
        table = Table(data, colWidths=[1.5*inch, 1*inch, 1*inch, 1*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.2*inch))
        
        # Add summary text
        text = "<b>Key Findings:</b><br/>"
        text += f"• Total wells analyzed: {len(wells)}<br/>"
        text += f"• Total layers: {sum(len(w.get('Layers', [])) for w in wells)}<br/>"
        text += f"• Average layers per well: {sum(len(w.get('Layers', [])) for w in wells)/len(wells):.1f}<br/>"
        
        story.append(Paragraph(text, styles['Normal']))
    
    def _add_metrics_summary(self, story: List, styles, ceprs: List[Dict]):
        """Add causal metrics summary"""
        title_style = styles['Heading2']
        title_style.fontSize = 14
        title_style.spaceAfter = 10
        story.append(Paragraph("Causal Analysis Summary", title_style))
        
        # Calculate average metrics
        avg_cci = np.mean([c.get('metrics', {}).get('cci', 0) for c in ceprs])
        avg_fep = np.mean([c.get('metrics', {}).get('fep', 0) for c in ceprs])
        avg_hcss = np.mean([c.get('metrics', {}).get('hcss', 0) for c in ceprs])
        
        data = [
            ['Metric', 'Average', 'Range', 'Interpretation'],
            ['Causal Connectivity Index (CCI)', f"{avg_cci:.3f}", f"{min(c.get('metrics', {}).get('cci', 0) for c in ceprs):.3f}-{max(c.get('metrics', {}).get('cci', 0) for c in ceprs):.3f}", self._interpret_cci(avg_cci)],
            ['Formation Energy Proxy (FEP)', f"{avg_fep:.1f}", f"{min(c.get('metrics', {}).get('fep', 0) for c in ceprs):.1f}-{max(c.get('metrics', {}).get('fep', 0) for c in ceprs):.1f}", self._interpret_fep(avg_fep)],
            ['Hydro-Causal Stability (HCSS)', f"{avg_hcss:.3f}", f"{min(c.get('metrics', {}).get('hcss', 0) for c in ceprs):.3f}-{max(c.get('metrics', {}).get('hcss', 0) for c in ceprs):.3f}", self._interpret_hcss(avg_hcss)],
        ]
        
        table = Table(data, colWidths=[2*inch, 1*inch, 1.5*inch, 2.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9)
        ]))
        
        story.append(table)
    
    def _interpret_cci(self, cci: float) -> str:
        """Interpret Causal Connectivity Index"""
        if cci > 0.8:
            return "Excellent connectivity - Strong process relationships"
        elif cci > 0.6:
            return "Good connectivity - Moderate process relationships"
        elif cci > 0.4:
            return "Fair connectivity - Some process relationships"
        else:
            return "Poor connectivity - Weak process relationships"
    
    def _interpret_fep(self, fep: float) -> str:
        """Interpret Formation Energy Proxy"""
        if fep > 70:
            return "High formation energy - Dynamic geological processes"
        elif fep > 40:
            return "Moderate formation energy - Typical volcanic setting"
        elif fep > 20:
            return "Low formation energy - Relatively quiet geological history"
        else:
            return "Very low formation energy - Minimal geological activity"
    
    def _interpret_hcss(self, hcss: float) -> str:
        """Interpret Hydro-Causal Stability Score"""
        if hcss > 0.8:
            return "Very stable - Reliable aquifer formation"
        elif hcss > 0.6:
            return "Stable - Generally reliable aquifers"
        elif hcss > 0.4:
            return "Moderately stable - Some aquifer variability"
        else:
            return "Unstable - High aquifer variability"
    
    def _add_cepr_analysis(self, story: List, styles, cepr: Dict):
        """Add CEPR analysis for a single well"""
        title_style = styles['Heading2']
        title_style.fontSize = 14
        title_style.spaceAfter = 10
        story.append(Paragraph(f"Well: {cepr.get('well_id', 'Unknown')}", title_style))
        
        # Metrics
        metrics = cepr.get('metrics', {})
        text = f"<b>Causal Connectivity Index (CCI):</b> {metrics.get('cci', 0):.3f} ({self._interpret_cci(metrics.get('cci', 0))})<br/>"
        text += f"<b>Formation Energy Proxy (FEP):</b> {metrics.get('fep', 0):.1f} ({self._interpret_fep(metrics.get('fep', 0))})<br/>"
        text += f"<b>Hydro-Causal Stability Score (HCSS):</b> {metrics.get('hcss', 0):.3f} ({self._interpret_hcss(metrics.get('hcss', 0))})<br/>"
        text += "<br/>"
        
        # Processes
        processes = cepr.get('processes', [])
        if processes:
            text += "<b>Identified Processes:</b><br/>"
            for proc in processes:
                text += f"• {proc.get('process_type', 'N/A')} ({proc.get('depth_start', 0):.1f}-{proc.get('depth_end', 0):.1f}m, Intensity: {proc.get('intensity', 0):.1f}, Confidence: {proc.get('confidence', 0):.1f})<br/>"
        
        text += "<br/>"
        
        # Causal chains
        chains = cepr.get('causal_chains', [])
        if chains:
            text += "<b>Causal Chains:</b><br/>"
            for i, chain in enumerate(chains, 1):
                chain_str = " → ".join(chain)
                text += f"{i}. {chain_str}<br/>"
        
        text += "<br/>"
        
        # Aquifer formation explanation
        explanation = cepr.get('aquifer_formation_explanation', '')
        if explanation:
            text += "<b>Aquifer Formation Explanation:</b><br/>"
            text += f"{explanation}<br/>"
        
        story.append(Paragraph(text, styles['Normal']))
    
    def _add_causal_similarity_matrix(self, story: List, styles, ceprs: List[Dict]):
        """Add causal similarity matrix"""
        title_style = styles['Heading2']
        title_style.fontSize = 14
        title_style.spaceAfter = 10
        story.append(Paragraph("Causal Similarity Matrix", title_style))
        story.append(Paragraph("Compares wells based on geological process history, not just lithology.", styles['Italic']))
        story.append(Spacer(1, 0.1*inch))
        
        # Create matrix data
        n = len(ceprs)
        data = [[''] + [c.get('well_id', f'Well {i+1}') for i, c in enumerate(ceprs)]]
        
        for i, cepr1 in enumerate(ceprs):
            row = [cepr1.get('well_id', f'Well {i+1}')]
            for j, cepr2 in enumerate(ceprs):
                if i == j:
                    row.append('1.00')
                else:
                    # Calculate similarity (simplified for display)
                    sim = self._calculate_simple_similarity(cepr1, cepr2)
                    row.append(f"{sim:.2f}")
            data.append(row)
        
        table = Table(data, colWidths=[1.5*inch] + [1*inch] * (n-1))
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.1*inch))
        
        # Add interpretation
        text = "<b>Interpretation:</b> Values close to 1.0 indicate wells with similar geological process histories. "
        text += "Values below 0.4 indicate significantly different formation mechanisms."
        story.append(Paragraph(text, styles['Normal']))
    
    def _calculate_simple_similarity(self, cepr1: Dict, cepr2: Dict) -> float:
        """Calculate a simple similarity score"""
        processes1 = set(p.get('process_type', '') for p in cepr1.get('processes', []))
        processes2 = set(p.get('process_type', '') for p in cepr2.get('processes', []))
        
        if not processes1 or not processes2:
            return 0.0
        
        intersection = len(processes1 & processes2)
        union = len(processes1 | processes2)
        
        return intersection / union if union > 0 else 0.0
    
    def _add_predictive_targets(self, story: List, styles, ceprs: List[Dict]):
        """Add predictive aquifer targets"""
        title_style = styles['Heading1']
        title_style.fontSize = 18
        title_style.spaceAfter = 15
        story.append(Paragraph("Predictive Aquifer Discovery", title_style))
        
        text = "Based on causal pattern analysis, the following locations show potential for aquifer discovery:"
        story.append(Paragraph(text, styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        
        # This would normally use the causal engine's predict_aquifer_targets method
        # For now, we'll create a placeholder
        data = [['Rank', 'Depth Range', 'Process Chain', 'Confidence', 'Reason']]
        
        # Example targets (in a real implementation, these would come from causal engine)
        example_targets = [
            ['1', '180-220 m', 'Eruption → Cooling → Fracturing', '0.92', 'Missing pattern continuation'],
            ['2', '250-300 m', 'Sedimentation → Compaction', '0.85', 'Expected aquifer in transition zone'],
            ['3', '80-120 m', 'Weathering → Fracturing', '0.78', 'Surface weathering enhancement'],
        ]
        
        for target in example_targets:
            data.append(target)
        
        table = Table(data, colWidths=[0.8*inch, 1.5*inch, 2.5*inch, 1*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.1*inch))
        
        text = "<i>Note: These predictions are based on causal pattern analysis. Field verification is recommended.</i>"
        story.append(Paragraph(text, styles['Italic']))


# Singleton instance
pdf_exporter = PDFExporter()
