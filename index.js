<script>
    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBdSX7qkOpnMSzgGbWvFYKza4SEtboW4Wk",
        authDomain: "easy-foods-2f7b7.firebaseapp.com",
        databaseURL: "https://easy-foods-2f7b7-default-rtdb.firebaseio.com",
        projectId: "easy-foods-2f7b7",
        storageBucket: "easy-foods-2f7b7.firebasestorage.app",
        messagingSenderId: "571857699423",
        appId: "1:571857699423:web:633c6acf7749658c7391ea",
        measurementId: "G-MHFRD518T2"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // Global State
    let currentFoods = [];
    let currentOrders = [];
    let editModeId = null;

    // DOM Elements
    const addTab = document.getElementById('addTab');
    const manageTab = document.getElementById('manageTab');
    const ordersTab = document.getElementById('ordersTab');
    const tabAddBtn = document.getElementById('tabAddBtn');
    const tabManageBtn = document.getElementById('tabManageBtn');
    const tabOrdersBtn = document.getElementById('tabOrdersBtn');
    const adminFoodList = document.getElementById('adminFoodList');
    const ordersListAdmin = document.getElementById('ordersListAdmin');
    const totalFoodsEl = document.getElementById('totalFoods');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');

    // Helper Functions
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function switchTab(tab) {
        addTab.style.display = 'none';
        manageTab.style.display = 'none';
        ordersTab.style.display = 'none';
        tabAddBtn.classList.remove('active');
        tabManageBtn.classList.remove('active');
        tabOrdersBtn.classList.remove('active');
        
        if (tab === 'add') {
            addTab.style.display = 'block';
            tabAddBtn.classList.add('active');
        } else if (tab === 'manage') {
            manageTab.style.display = 'block';
            tabManageBtn.classList.add('active');
            renderAdminFoodList();
        } else if (tab === 'orders') {
            ordersTab.style.display = 'block';
            tabOrdersBtn.classList.add('active');
            renderOrdersList();
        }
    }

    // Add New Food
    async function addNewFood() {
        const name = document.getElementById('foodName').value.trim();
        const imageUrl = document.getElementById('foodImage').value.trim();
        const description = document.getElementById('foodDesc').value.trim();
        const price = parseFloat(document.getElementById('foodPrice').value);
        
        if (!name || !price) {
            showNotification('Please fill Food Name and Price', true);
            return;
        }
        
        if (isNaN(price) || price <= 0) {
            showNotification('Please enter a valid price', true);
            return;
        }
        
        try {
            const newRef = db.ref('foods').push();
            await newRef.set({
                name: name,
                imageUrl: imageUrl || 'https://picsum.photos/300/200',
                description: description || 'Delicious food item',
                price: price,
                createdAt: Date.now()
            });
            
            showNotification('✅ Food added successfully!');
            clearAddForm();
            fetchFoods();
        } catch (error) {
            console.error(error);
            showNotification('Error adding food', true);
        }
    }

    function clearAddForm() {
        document.getElementById('foodName').value = '';
        document.getElementById('foodImage').value = 'https://picsum.photos/300/200';
        document.getElementById('foodDesc').value = '';
        document.getElementById('foodPrice').value = '';
        editModeId = null;
    }

    // Update Food
    async function updateFoodItem(id) {
        const name = document.getElementById('foodName').value.trim();
        const imageUrl = document.getElementById('foodImage').value.trim();
        const description = document.getElementById('foodDesc').value.trim();
        const price = parseFloat(document.getElementById('foodPrice').value);
        
        if (!name || !price) {
            showNotification('Please fill Food Name and Price', true);
            return;
        }
        
        try {
            await db.ref('foods/' + id).update({
                name: name,
                imageUrl: imageUrl || 'https://picsum.photos/300/200',
                description: description || 'Delicious food item',
                price: price
            });
            
            showNotification('✅ Food updated successfully!');
            clearAddForm();
            fetchFoods();
            switchTab('manage');
        } catch (error) {
            console.error(error);
            showNotification('Error updating food', true);
        }
    }

    // Delete Food
    async function deleteFoodItem(id) {
        if (confirm('Are you sure you want to delete this food item?')) {
            try {
                await db.ref('foods/' + id).remove();
                showNotification('🗑️ Food deleted successfully!');
                fetchFoods();
            } catch (error) {
                console.error(error);
                showNotification('Error deleting food', true);
            }
        }
    }

    // Delete Order
    async function deleteOrder(orderId) {
        if (confirm('Are you sure you want to delete this order?')) {
            try {
                await db.ref('orders/' + orderId).remove();
                showNotification('Order deleted successfully!');
                fetchOrders();
            } catch (error) {
                console.error(error);
                showNotification('Error deleting order', true);
            }
        }
    }

    // Edit Food (load into form)
    function editFoodItem(food) {
        document.getElementById('foodName').value = food.name;
        document.getElementById('foodImage').value = food.imageUrl || '';
        document.getElementById('foodDesc').value = food.description || '';
        document.getElementById('foodPrice').value = food.price;
        editModeId = food.id;
        
        const addBtn = document.getElementById('addFoodBtn');
        addBtn.innerHTML = '<i class="fas fa-save"></i> Update Food';
        addBtn.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        
        switchTab('add');
        
        // Scroll to form
        document.getElementById('addTab').scrollIntoView({ behavior: 'smooth' });
    }

    // Reset add button
    function resetAddButton() {
        const addBtn = document.getElementById('addFoodBtn');
        addBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Food';
        addBtn.style.background = '';
        editModeId = null;
    }

    // Render Admin Food List
    function renderAdminFoodList() {
        if (!adminFoodList) return;
        
        if (!currentFoods || currentFoods.length === 0) {
            adminFoodList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>No food items available</p>
                    <p style="font-size: 0.85rem;">Click "Add New Food" to get started</p>
                </div>
            `;
            return;
        }
        
        adminFoodList.innerHTML = currentFoods.map(food => `
            <div class="food-item">
                <div class="food-info">
                    <img src="${food.imageUrl || 'https://picsum.photos/60/60'}" onerror="this.src='https://via.placeholder.com/60x60?text=Food'">
                    <div>
                        <strong style="font-size: 1.1rem;">${escapeHtml(food.name)}</strong>
                        <p style="font-size: 0.85rem; opacity: 0.8;">₹${food.price}</p>
                        <p style="font-size: 0.75rem; opacity: 0.6;">${escapeHtml(food.description?.substring(0, 60) || 'No description')}</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button onclick="editFoodItemById('${food.id}')" style="background: #f39c12; color: white;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteFoodItemById('${food.id}')" style="background: #ff4757; color: white;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render Orders List
    function renderOrdersList() {
        if (!ordersListAdmin) return;
        
        if (!currentOrders || currentOrders.length === 0) {
            ordersListAdmin.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No orders placed yet</p>
                    <p style="font-size: 0.85rem;">Orders will appear here when customers place them</p>
                </div>
            `;
            return;
        }
        
        ordersListAdmin.innerHTML = currentOrders.map(order => `
            <div class="order-card">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        <h4 style="color: #bf4eff; margin-bottom: 0.5rem;">
                            <i class="fas fa-user"></i> ${escapeHtml(order.customerName)}
                        </h4>
                        <p><i class="fas fa-phone"></i> ${escapeHtml(order.mobile)}</p>
                        <p><i class="fas fa-utensils"></i> ${escapeHtml(order.foodName)}</p>
                        <p><i class="fas fa-rupee-sign"></i> ₹${order.totalPrice}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.address)}</p>
                        <p style="font-size: 0.75rem; opacity: 0.6;">
                            <i class="far fa-clock"></i> ${new Date(order.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button onclick="deleteOrderById('${order.id}')" class="btn-danger" style="padding: 6px 16px; border-radius: 40px; border: none;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update Stats
    function updateStats() {
        totalFoodsEl.textContent = currentFoods.length;
        totalOrdersEl.textContent = currentOrders.length;
        const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        totalRevenueEl.textContent = totalRevenue;
    }

    // Fetch Foods from Firebase
    function fetchFoods() {
        db.ref('foods').on('value', (snapshot) => {
            const data = snapshot.val();
            const foodsArray = [];
            
            if (data) {
                for (let id in data) {
                    foodsArray.push({ id, ...data[id] });
                }
            }
            
            currentFoods = foodsArray;
            if (manageTab.style.display !== 'none') {
                renderAdminFoodList();
            }
            updateStats();
        });
    }

    // Fetch Orders from Firebase
    function fetchOrders() {
        db.ref('orders').on('value', (snapshot) => {
            const data = snapshot.val();
            const ordersArray = [];
            
            if (data) {
                for (let id in data) {
                    ordersArray.push({ id, ...data[id] });
                }
                // Sort by newest first
                ordersArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            
            currentOrders = ordersArray;
            if (ordersTab.style.display !== 'none') {
                renderOrdersList();
            }
            updateStats();
        });
    }

    // Global functions for onclick
    window.editFoodItemById = function(id) {
        const food = currentFoods.find(f => f.id === id);
        if (food) editFoodItem(food);
    };
    
    window.deleteFoodItemById = function(id) {
        deleteFoodItem(id);
    };
    
    window.deleteOrderById = function(id) {
        deleteOrder(id);
    };

    // Tab Event Listeners
    tabAddBtn.addEventListener('click', () => {
        resetAddButton();
        switchTab('add');
    });
    
    tabManageBtn.addEventListener('click', () => {
        resetAddButton();
        switchTab('manage');
        renderAdminFoodList();
    });
    
    tabOrdersBtn.addEventListener('click', () => {
        resetAddButton();
        switchTab('orders');
        renderOrdersList();
    });

    // Add/Update Button Logic
    document.getElementById('addFoodBtn').addEventListener('click', () => {
        if (editModeId) {
            updateFoodItem(editModeId);
            resetAddButton();
        } else {
            addNewFood();
        }
    });

    // Initialize
    fetchFoods();
    fetchOrders();
    
    // Set initial tab
    switchTab('add');
</script>
