const API_BASE_URL = 'YOUR_DEPLOYED_BACKEND_URL'; // Replace with your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResult = document.getElementById('searchResult');
    const newProductForm = document.getElementById('newProductForm');
    const supplierNameInput = document.getElementById('supplierName');
    const standardNameInput = document.getElementById('standardName');
    const addMappingBtn = document.getElementById('addMapping');
    const toggleAdminBtn = document.getElementById('toggleAdmin');
    const adminPanel = document.getElementById('adminPanel');
    const mappingsList = document.getElementById('mappingsList');

    searchButton.addEventListener('click', searchProduct);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchProduct();
    });
    
    toggleAdminBtn.addEventListener('click', () => {
        adminPanel.classList.toggle('hidden');
        toggleAdminBtn.textContent = adminPanel.classList.contains('hidden') 
            ? 'Show All Mappings' 
            : 'Hide Mappings';
        if (!adminPanel.classList.contains('hidden')) {
            loadMappings();
        }
    });

    addMappingBtn.addEventListener('click', addMapping);

    async function searchProduct() {
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            showResult({
                status: "Error",
                message: "Please enter a product name"
            });
            return;
        }

        try {
            showResult({ status: "Loading", message: "Searching..." });
            
            const response = await fetch(`${API_BASE_URL}/api/search?term=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            
            showResult(data, searchTerm);
        } catch (error) {
            console.error('Error:', error);
            showResult({
                status: "Error",
                message: "Failed to search product. Please try again."
            });
        }
    }

    function showResult(data, searchTerm = '') {
        newProductForm.classList.add('hidden');
        
        let html = '<div class="';
        
        switch (data.status) {
            case "Found":
                html += 'match-found">';
                html += `<span class="status-badge success">${data.status}</span>`;
                html += `<p>${data.message}</p>`;
                if (data.supplierName) {
                    html += '<div class="match-details">';
                    html += `<p><strong>Supplier Name:</strong> ${data.supplierName}</p>`;
                    html += `<p><strong>Standard Name:</strong> ${data.standardName}</p>`;
                    if (data.matchPercentage) {
                        html += `<p><strong>Match:</strong> ${data.matchPercentage}%</p>`;
                    }
                    html += '</div>';
                }
                break;

            case "Not Found":
                html += 'no-match">';
                html += `<span class="status-badge error">${data.status}</span>`;
                html += `<p>${data.message}</p>`;
                if (searchTerm) {
                    newProductForm.classList.remove('hidden');
                    supplierNameInput.value = searchTerm;
                    standardNameInput.value = '';
                    standardNameInput.focus();
                }
                break;

            case "Loading":
                html += 'loading">';
                html += '<span class="status-badge">Searching...</span>';
                html += '<p>Please wait...</p>';
                break;

            default:
                html += 'no-match">';
                html += '<span class="status-badge error">Error</span>';
                html += `<p>${data.message || 'An unexpected error occurred'}</p>`;
        }
        
        html += '</div>';
        searchResult.innerHTML = html;
    }

    async function addMapping() {
        const supplierName = supplierNameInput.value.trim();
        const standardName = standardNameInput.value.trim();

        if (!supplierName || !standardName) {
            alert('Please enter both supplier name and standard name');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/mappings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supplierName, standardName })
            });

            const data = await response.json();
            
            if (data.status === "Success") {
                showResult({
                    status: "Found",
                    message: "Product added successfully",
                    supplierName,
                    standardName
                });
                searchInput.value = '';
                loadMappings();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            showResult({
                status: "Error",
                message: error.message || "Failed to add product"
            });
        }
    }

    async function loadMappings() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/mappings`);
            const mappings = await response.json();
            
            if (Array.isArray(mappings)) {
                mappingsList.innerHTML = mappings.map(mapping => `
                    <div class="mapping-item">
                        <div>
                            <strong>Supplier Name:</strong> ${mapping.supplierName}<br>
                            <strong>Standard Name:</strong> ${mapping.standardName}
                        </div>
                        <button class="delete-btn" onclick="deleteMapping('${mapping._id}')">Delete</button>
                    </div>
                `).join('');
            } else {
                mappingsList.innerHTML = '<p>No mappings found</p>';
            }
        } catch (error) {
            console.error('Error:', error);
            mappingsList.innerHTML = '<p>Error loading mappings</p>';
        }
    }
});

async function deleteMapping(id) {
    if (!confirm('Are you sure you want to delete this mapping?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/mappings/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === "Success") {
            // Refresh the mappings list
            const mappingsList = document.getElementById('mappingsList');
            const response = await fetch(`${API_BASE_URL}/api/mappings`);
            const mappings = await response.json();
            
            if (Array.isArray(mappings)) {
                mappingsList.innerHTML = mappings.map(mapping => `
                    <div class="mapping-item">
                        <div>
                            <strong>Supplier Name:</strong> ${mapping.supplierName}<br>
                            <strong>Standard Name:</strong> ${mapping.standardName}
                        </div>
                        <button class="delete-btn" onclick="deleteMapping('${mapping._id}')">Delete</button>
                    </div>
                `).join('');
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete mapping: ' + error.message);
    }
}
