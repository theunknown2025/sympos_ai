-- Store public PDF URL for certificate QR codes (PNG remains in certificate_image_url for preview)
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS certificate_pdf_url TEXT;

CREATE INDEX IF NOT EXISTS idx_certificates_pdf_url ON certificates(certificate_pdf_url)
  WHERE certificate_pdf_url IS NOT NULL;
