import os
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.db.models import Quotation, QuotationLineItem

def generate_quotation_pdf(quotation: Quotation) -> bytes:
    """Generates a professional B2B quotation PDF using ReportLab."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'CompanyHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'CompanySub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#0F172A')
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )

    tb_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#1E293B')
    )

    # 1. Header Section
    story.append(Paragraph("VERTEX INDUSTRIAL SUPPLIES PVT. LTD.", title_style))
    story.append(Paragraph("Authorized Industrial Flow Controls & Valves Distributor | Pune, MH, India", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=15))

    # 2. Quotation Metadata Table
    meta_data = [
        [
            Paragraph("<b>FORMAL QUOTATION</b>", ParagraphStyle('QHead', fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#2563EB'))),
            Paragraph(f"<b>Quote No:</b> {quotation.quotation_number}", meta_label)
        ],
        [
            Paragraph(f"<b>Customer:</b> {quotation.customer_name}", meta_val),
            Paragraph(f"<b>Date:</b> {quotation.created_at.strftime('%Y-%m-%d') if quotation.created_at else '2026-09-26'}", meta_val)
        ],
        [
            Paragraph("<b>RFQ Reference:</b> Customer RFQ Requirement", meta_val),
            Paragraph("<b>Validity:</b> 30 Days from Issue", meta_val)
        ]
    ]

    t_meta = Table(meta_data, colWidths=[300, 240])
    t_meta.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))

    # 3. Line Items Table
    headers = [
        Paragraph("Code", th_style),
        Paragraph("Product Description", th_style),
        Paragraph("Material", th_style),
        Paragraph("Qty", th_style),
        Paragraph("Unit Price (INR)", th_style),
        Paragraph("Total (INR)", th_style)
    ]

    table_data = [headers]

    for item in quotation.line_items:
        table_data.append([
            Paragraph(item.product_code, tb_style),
            Paragraph(item.product_name, tb_style),
            Paragraph(item.material_grade or "SS304", tb_style),
            Paragraph(str(item.quantity), tb_style),
            Paragraph(f"₹{item.unit_price:,.2f}" if item.unit_price else "N/A", tb_style),
            Paragraph(f"₹{item.total_price:,.2f}" if item.total_price else "N/A", tb_style),
        ])

    t_items = Table(table_data, colWidths=[70, 180, 80, 40, 85, 85])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 15))

    # 4. Totals Summary Table
    totals_data = [
        [Paragraph("<b>Subtotal:</b>", meta_label), Paragraph(f"₹{quotation.subtotal:,.2f}", meta_val)],
        [Paragraph("<b>GST (18%):</b>", meta_label), Paragraph(f"₹{quotation.tax_amount:,.2f}", meta_val)],
        [Paragraph("<b>Total Amount:</b>", ParagraphStyle('TotL', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor('#2563EB'))), 
         Paragraph(f"<b>₹{quotation.total_amount:,.2f}</b>", ParagraphStyle('TotV', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor('#2563EB')))]
    ]

    t_totals = Table(totals_data, colWidths=[400, 140])
    t_totals.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_totals)
    story.append(Spacer(1, 20))

    # 5. Terms & Policy
    story.append(Paragraph("<b>Standard Commercial & Delivery Terms:</b>", meta_label))
    terms_text = (
        "1. Delivery: Ex-works Pune warehouse. Dispatch lead time 5-7 business days.<br/>"
        "2. Payment Terms: Net 30 Days for approved credit accounts.<br/>"
        "3. Warranty: 24 Months standard manufacturer warranty against casting & machining defects.<br/>"
        "4. Quote Validity: 30 Calendar Days."
    )
    story.append(Paragraph(terms_text, ParagraphStyle('TermsBody', fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#475569'), leading=12)))
    
    story.append(Spacer(1, 25))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=10))
    story.append(Paragraph("<i>This formal quotation is generated by QuoteGuard AI Source-Grounded Agentic System and verified by Authorized Commercial Approver.</i>", ParagraphStyle('Foot', fontName='Helvetica-Oblique', fontSize=7, textColor=colors.HexColor('#94A3B8'), alignment=1)))

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
