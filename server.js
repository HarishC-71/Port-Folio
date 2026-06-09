require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_PATH = path.join(__dirname, 'public');
const DATA_PATH = path.join(__dirname, 'data');
const EXCEL_FILE_PATH = path.join(DATA_PATH, 'messages.xlsx');

// Ensure data directory exists
if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_PATH));

// Debug: confirm .env values are loaded correctly
console.log("📧 EMAIL_USER loaded:", process.env.EMAIL_USER ? process.env.EMAIL_USER : "⚠️ NOT SET");
console.log("🔑 EMAIL_PASS loaded:", process.env.EMAIL_PASS ? `**** (length: ${process.env.EMAIL_PASS.length})` : "⚠️ NOT SET");

// Email transporter using port 587 + STARTTLS (most reliable for Gmail App Passwords)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,       // false = STARTTLS upgrade (required for port 587)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false  // allow self-signed certs on corporate/home networks
    }
});

// Verify transporter on startup
transporter.verify((err, success) => {
    if (err) {
        console.error("\n❌ Email configuration FAILED:", err.message);
        console.error("   Code   :", err.code);
        console.error("   Response:", err.response || 'N/A');
        console.log("\n   ─── HOW TO FIX ───────────────────────────────────────────────");
        console.log("   1. Go to: https://myaccount.google.com/security");
        console.log("   2. Enable '2-Step Verification' if not already ON");
        console.log("   3. Go to: https://myaccount.google.com/apppasswords");
        console.log("   4. Create App Password → Select app: Mail, device: Windows");
        console.log("   5. Copy the 16-char password (no spaces) → paste into .env as EMAIL_PASS");
        console.log("   6. Restart the server\n");
    } else {
        console.log("✅ Email server is ready — connected to smtp.gmail.com:587");
    }
});

/**
 * Saves contact form data to an Excel file in the data folder.
 */
async function saveToExcel(data) {
    const workbook = new ExcelJS.Workbook();
    let worksheet;

    try {
        if (fs.existsSync(EXCEL_FILE_PATH)) {
            await workbook.xlsx.readFile(EXCEL_FILE_PATH);
            worksheet = workbook.getWorksheet('Messages');
        }
        
        if (!worksheet) {
            worksheet = workbook.addWorksheet('Messages');
        }

        // Always define columns to ensure key mapping works correctly
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Subject', key: 'subject', width: 30 },
            { header: 'Message', key: 'message', width: 50 },
            { header: 'Date', key: 'date', width: 25 }
        ];

        // Format header if it's a new sheet
        if (worksheet.rowCount <= 1) {
            worksheet.getRow(1).font = { bold: true };
        }

        worksheet.addRow({
            name: data.name,
            email: data.email,
            subject: data.subject || 'N/A',
            message: data.message,
            date: new Date().toLocaleString()
        });

        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        console.log(`Contact saved to Excel: ${EXCEL_FILE_PATH}`);
    } catch (error) {
        if (error.code === 'EBUSY') {
            console.error("Error: messages.xlsx is open in another program (Excel). Close it to save new messages!");
            throw new Error("The target Excel file is currently open and cannot be updated. Please close Excel and try again.");
        }
        console.error("Error saving to Excel:", error);
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
});

// API Endpoint for Contact Form
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All required fields (name, email, message) are missing' });
    }

    try {
        // 1. Save to Excel (Priority)
        await saveToExcel({ name, email, subject, message });

        // 2. Send via Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `Portfolio: ${subject || "New Message"}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nSent at: ${new Date().toLocaleString()}`
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully. MessageId:', info.messageId);
        } catch (emailError) {
            // Log full error details for debugging
            console.error("\n❌ Email sending FAILED (data WAS saved to Excel):");
            console.error("   Message:", emailError.message);
            console.error("   Code:", emailError.code);
            console.error("   Response:", emailError.response || 'N/A');
            console.log("   ➡ Fix: Regenerate your Gmail App Password at https://myaccount.google.com/apppasswords\n");

            // Return 200 because Excel record was saved, but flag the email failure
            return res.status(200).json({
                success: true,
                emailSent: false,
                message: 'Your message was saved! (Email notification could not be sent — the owner will check records manually.)'
            });
        }

        res.status(200).json({
            success: true,
            emailSent: true,
            message: 'Message sent successfully! You will receive a confirmation shortly.'
        });

    } catch (error) {
        console.error("Workflow error:", error);
        res.status(500).json({ 
            error: 'Failed to save message',
            details: error.message 
        });
    }
});

// Endpoint to check messages (Excel download)
app.get('/api/messages/download', (req, res) => {
    if (fs.existsSync(EXCEL_FILE_PATH)) {
        res.download(EXCEL_FILE_PATH);
    } else {
        res.status(404).json({ error: 'No messages file found yet.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Excel file location: ${EXCEL_FILE_PATH}`);
});