from decimal import Decimal

from django.http import HttpResponse

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    Paragraph,
)


def generate_invoice_pdf(invoice):
    response = HttpResponse(content_type="application/pdf")

    response["Content-Disposition"] = (
        f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
    )

    document = SimpleDocTemplate(
        response,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=24,
        leading=28,
        alignment=TA_RIGHT,
        spaceAfter=8,
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading3"],
        fontSize=10,
        leading=12,
        spaceAfter=5,
    )

    normal_style = ParagraphStyle(
        "InvoiceNormal",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
    )

    right_style = ParagraphStyle(
        "InvoiceRight",
        parent=normal_style,
        alignment=TA_RIGHT,
    )

    story = []

    # --------------------------------------------------
    # Header
    # --------------------------------------------------

    header_data = [
        [
            Paragraph(
                "<b>FreelancerFlow</b>",
                styles["Heading2"],
            ),
            Paragraph(
                "INVOICE",
                title_style,
            ),
        ]
    ]

    header_table = Table(
        header_data,
        colWidths=[90 * mm, 70 * mm],
    )

    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )

    story.append(header_table)
    story.append(Spacer(1, 8 * mm))

    # --------------------------------------------------
    # Invoice information
    # --------------------------------------------------

    invoice_info = [
        [
            Paragraph(
                f"<b>Invoice #</b><br/>{invoice.invoice_number}",
                normal_style,
            ),
            Paragraph(
                f"<b>Invoice Date</b><br/>{invoice.invoice_date}",
                normal_style,
            ),
            Paragraph(
                f"<b>Due Date</b><br/>{invoice.due_date}",
                normal_style,
            ),
        ]
    ]

    info_table = Table(
        invoice_info,
        colWidths=[60 * mm, 60 * mm, 40 * mm],
    )

    info_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    story.append(info_table)
    story.append(Spacer(1, 10 * mm))

    # --------------------------------------------------
    # From / Bill To
    # --------------------------------------------------

    client = invoice.client

    bill_to = (
        f"<b>{client.name}</b><br/>"
        f"{client.company or ''}<br/>"
        f"{client.email}"
    )

    party_data = [
        [
            Paragraph(
                "<b>FROM</b><br/>"
                "FreelancerFlow",
                normal_style,
            ),
            Paragraph(
                f"<b>BILL TO</b><br/>{bill_to}",
                normal_style,
            ),
        ]
    ]

    party_table = Table(
        party_data,
        colWidths=[80 * mm, 80 * mm],
    )

    party_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    story.append(party_table)
    story.append(Spacer(1, 10 * mm))

    # --------------------------------------------------
    # Invoice Items
    # --------------------------------------------------

    item_data = [
        [
            Paragraph("<b>Description</b>", normal_style),
            Paragraph("<b>Qty</b>", right_style),
            Paragraph("<b>Rate</b>", right_style),
            Paragraph("<b>Amount</b>", right_style),
        ]
    ]

    subtotal = Decimal("0")

    for item in invoice.items.all():
        amount = item.quantity * item.rate
        subtotal += amount

        item_data.append(
            [
                Paragraph(
                    item.description,
                    normal_style,
                ),
                Paragraph(
                    str(item.quantity),
                    right_style,
                ),
                Paragraph(
                    f"{item.rate:.2f}",
                    right_style,
                ),
                Paragraph(
                    f"{amount:.2f}",
                    right_style,
                ),
            ]
        )

    item_table = Table(
        item_data,
        colWidths=[80 * mm, 20 * mm, 30 * mm, 30 * mm],
        repeatRows=1,
    )

    item_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#F8FAFC"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#0F172A"),
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#E2E8F0"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(item_table)
    story.append(Spacer(1, 8 * mm))

    # --------------------------------------------------
    # Totals
    # --------------------------------------------------

    tax_amount = (
        subtotal
        * invoice.tax_rate
        / Decimal("100")
    )

    total = subtotal + tax_amount

    totals_data = [
        ["Subtotal", f"{subtotal:.2f}"],
        [
            f"Tax ({invoice.tax_rate:.2f}%)",
            f"{tax_amount:.2f}",
        ],
        ["Total", f"{total:.2f}"],
    ]

    totals_table = Table(
        totals_data,
        colWidths=[50 * mm, 30 * mm],
        hAlign="RIGHT",
    )

    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story.append(totals_table)

    # --------------------------------------------------
    # Notes
    # --------------------------------------------------

    if invoice.notes:
        story.append(Spacer(1, 10 * mm))

        story.append(
            Paragraph(
                "<b>Notes</b>",
                heading_style,
            )
        )

        story.append(
            Paragraph(
                invoice.notes,
                normal_style,
            )
        )

    document.build(story)

    return response