# -*- coding: utf-8 -*-
import pdfplumber
p = "GC5G1(C4F7N)全氟异丁腈传感器V2.2.pdf"
with pdfplumber.open(p) as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"===== PAGE {i+1} =====")
        t = page.extract_text() or ""
        print(t)