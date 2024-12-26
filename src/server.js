const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://kruthikadr.github.io', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
    supplierName: String,
    standardName: String
});

const Product = mongoose.model('Product', productSchema);

// API Routes
app.get('/api/search', async (req, res) => {
    try {
        console.log('Search request received for:', req.query.term);
        const searchTerm = req.query.term;
        
        if (!searchTerm) {
            console.log('Empty search term');
            return res.json({
                status: "Error",
                message: "Please enter a product name",
                found: false
            });
        }

        const products = await Product.find();
        console.log('Found products:', products.length);

        // Find best match
        let bestMatch = null;
        let bestMatchScore = 0;

        for (const product of products) {
            const score = calculateMatchScore(searchTerm, product.supplierName);
            if (score > bestMatchScore) {
                bestMatchScore = score;
                bestMatch = product;
            }
        }

        if (bestMatch && bestMatchScore >= 0.5) {
            console.log('Match found:', bestMatch);
            return res.json({
                status: "Found",
                message: "Product found",
                supplierName: bestMatch.supplierName,
                standardName: bestMatch.standardName,
                matchPercentage: Math.round(bestMatchScore * 100),
                found: true
            });
        }

        console.log('No match found');
        return res.json({
            status: "Not Found",
            message: "No matching product found",
            found: false
        });

    } catch (error) {
        console.error('Search error:', error);
        return res.json({
            status: "Error",
            message: error.message || "Error searching product",
            found: false
        });
    }
});

function calculateMatchScore(search, target) {
    const searchTerms = search.toLowerCase().split(/\s+/);
    const targetTerms = target.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const searchTerm of searchTerms) {
        for (const targetTerm of targetTerms) {
            if (targetTerm.includes(searchTerm) || searchTerm.includes(targetTerm)) {
                matches++;
                break;
            }
        }
    }
    
    return matches / searchTerms.length;
}

app.post('/api/mappings', async (req, res) => {
    try {
        const { supplierName, standardName } = req.body;
        const product = new Product({ supplierName, standardName });
        await product.save();
        res.json({
            status: "Success",
            message: "Product added successfully",
            product
        });
    } catch (error) {
        res.json({
            status: "Error",
            message: error.message || "Error adding product",
            found: false
        });
    }
});

app.get('/api/mappings', async (req, res) => {
    try {
        console.log('Fetching all mappings...');
        const mappings = await Product.find();
        console.log(`Found ${mappings.length} mappings`);
        res.json(mappings);
    } catch (error) {
        console.error('Error fetching mappings:', error);
        res.status(500).json({
            status: "Error",
            message: "Failed to fetch mappings",
            error: error.message
        });
    }
});

app.delete('/api/mappings/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({
            status: "Success",
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.json({
            status: "Error",
            message: error.message || "Error deleting product",
            found: false
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
