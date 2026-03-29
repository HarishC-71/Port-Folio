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

// Email transporter (SECURE - Updated for better compatibility)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter
transporter.verify((err, success) => {
    if (err) {
        console.error("Email configuration error:", err);
        console.log("TIP: Ensure you have 2-Step Verification ON and are using a 16-character App Password.");
    } else {
        console.log("Email server is ready to send messages!");
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
            await new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) reject(error);
                    else resolve(info);
                });
            });
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error("Email failed but data was saved:", emailError.message);
            // We still return 200 because the data is saved to Excel
            return res.status(200).json({
                success: true,
                message: 'Recorded in Excel, but email notification failed. I will check records manually!'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message sent successfully and saved to records!'
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