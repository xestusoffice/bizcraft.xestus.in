# Xestus BizCraft 💼⚡

> **100% Private, Client-Side Business Utilities & Document Studio**  
> Zero Cloud Database • Zero Telemetry Tracking • Instant Offline PWA

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA-indigo.svg)](https://biz.xestus.in)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20In--Browser-emerald.svg)](#privacy-guarantee)

Xestus BizCraft is an ultra-luxurious, zero-backend business document engine tailored for Indian small businesses, freelancers, landlords, and founders. Everything is processed directly in your browser.

---

## ✨ Features

- 🧾 **GST & Non-GST Invoices**: Proforma, Tax Invoices, Quotations, intra/inter-state tax splitting (CGST/SGST/IGST), currency formatting with automated Indian Number-to-Words.
- 📱 **Dynamic UPI QR Studio**: Custom amount, notes, merchant name, and instant generation of high-res PNG (1024x1024) and printable counter standees.
- 🏠 **HRA Rent Receipts**: Automated single month and 12-month financial year batch rent receipts with authentic revenue stamp simulation and landlord PAN validation.
- 💼 **Salary Payslips & Payment Vouchers**: Salary slip generation with Basic, HRA, PF, PT, TDS, Net Pay, and Payment Vouchers with revenue stamps.
- 🔒 **Encrypted Offline Vault**: Save drafts and documents locally using browser localStorage. Export and import JSON backups with zero telemetry.
- 🖨️ **Pixel-Perfect A4 Print & PDF**: Custom `@media print` CSS for pristine page fidelity and zero UI bleed.
- ⚡ **Offline-Ready PWA**: Fully functional offline through Service Worker caching.

---

## 🚀 Quick Start

To run BizCraft locally:

```bash
# Clone the repository
git clone https://github.com/xestusoffice/bizcraft.git

# Navigate to project directory
cd bizcraft

# Start local server
npm run dev
# or
npx -y serve . -l 3000
```

Open `http://localhost:3000` in your web browser.

---

## 🛡️ Privacy Guarantee

- **No Remote Servers**: Your invoice data, landlord PAN, customer names, and banking details never leave your device.
- **Client-Side Sanitization**: Comprehensive XSS defense and client-side input validation.
- **Zero Third-Party Trackers**: No Google Analytics, no session recordings, no cookies.

---

## 📜 License

Licensed under the [MIT License](LICENSE). Built by **Xestus Media LLP**.
