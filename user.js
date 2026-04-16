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

    // DOM Elements
    const welcomeDiv = document.getElementById('welcomeScreen');
    const mainAppDiv = document.getElementById('mainApp');
    const foodContainer = document.getElementById('foodItemsContainer');
    const suggestedRow = document.getElementById('suggestedRow');

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

    function showMainApp() {
        welcomeDiv.style.opacity = "0";
        setTimeout(() => {
            welcomeDiv.style.display = "none";
            mainAppDiv.style.display = "block";
            setTimeout(() => { mainAppDiv.style.opacity = "1"; }, 50);
        }, 600);
    }

    // Open Order Modal with Food Details
    function openOrderModal(foodItem) {
        let modal = document.getElementById('orderModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'orderModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.8rem;"><i class="fas fa-shopping-cart"></i> Complete Order</h2>
                    <button id="closeModalBtn" style="background: none; border: none; font-size: 32px; color: white; cursor: pointer;">&times;</button>
                </div>
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: rgba(191,78,255,0.1); border-radius: 1rem;">
                    <img src="${foodItem.imageUrl || 'https://picsum.photos/80/80'}" width="80" height="80" style="border-radius: 1rem; object-fit: cover;">
                    <div>
                        <h3 style="font-size: 1.3rem;">${escapeHtml(foodItem.name)}</h3>
                        <p style="opacity: 0.8; font-size: 0.85rem;">${escapeHtml(foodItem.description?.substring(0, 80) || 'Delicious meal')}</p>
                        <strong style="color: #bf4eff; font-size: 1.2rem;">₹${foodItem.price}</strong>
                    </div>
                </div>
                <input type="text" id="custName" placeholder="Full Name *" autocomplete="off">
                <input type="tel" id="custPhone" placeholder="Mobile Number *" autocomplete="off">
                <textarea id="custAddress" rows="3" placeholder="Delivery Address *"></textarea>
                <button id="confirmOrderBtn" class="btn-primary" style="width: 100%; margin-top: 0.5rem;">✅ Confirm Order</button>
            </div>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        document.getElementById('confirmOrderBtn').addEventListener('click', async () => {
            const name = document.getElementById('custName').value.trim();
            const phone = document.getElementById('custPhone').value.trim();
            const address = document.getElementById('custAddress').value.trim();
            
            if (!name || !phone || !address) {
                alert("❌ Please fill all fields (Name, Phone, Address)");
                return;
            }
            
            const orderObj = {
                foodId: foodItem.id,
                foodName: foodItem.name,
                totalPrice: foodItem.price,
                customerName: name,
                mobile: phone,
                address: address,
                timestamp: Date.now(),
                status: "Pending"
            };
            
            try {
                await db.ref('orders').push(orderObj);
                alert(`✅ Order Placed Successfully!\n\n🍔 ${foodItem.name}\n💰 ₹${foodItem.price}\n📦 Delivery to: ${address.substring(0, 50)}`);
                modal.classList.remove('active');
            } catch (error) {
                alert("❌ Error placing order. Please try again.");
                console.error(error);
            }
        });
    }

    // Render Food Cards
    function renderUserFoods(foods) {
        if (!foodContainer) return;
        
        if (!foods || foods.length === 0) {
            foodContainer.innerHTML = `
                <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-info-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>No Items Available Yet</h3>
                    <p style="opacity: 0.8;">Admin will upload delicious food items soon! 🍕✨</p>
                </div>
            `;
            return;
        }
        
        foodContainer.innerHTML = foods.map(food => `
            <div class="food-card" data-id="${food.id}">
                <div style="height: 200px; overflow: hidden; position: relative;">
                    <img src="${food.imageUrl || 'https://picsum.photos/300/200?random=' + food.id}" 
                         style="width: 100%; height: 100%; object-fit: cover;" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=Yummy+Food'">
                    <div class="price-tag">
                        ₹${food.price}
                    </div>
                </div>
                <div style="padding: 1.2rem;">
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">${escapeHtml(food.name)}</h3>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 1rem; line-height: 1.4;">
                        ${escapeHtml(food.description?.substring(0, 100) || 'Freshly prepared with love ❤️')}
                    </p>
                    <button class="order-now-btn btn-primary" style="width: 100%; padding: 12px;" data-id="${food.id}">
                        <i class="fas fa-shopping-cart"></i> Order Now 🛵
                    </button>
                </div>
            </div>
        `).join('');
        
        // Attach order events
        document.querySelectorAll('.order-now-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const foodItem = currentFoods.find(f => f.id === id);
                if (foodItem) openOrderModal(foodItem);
            });
        });
        
        // Card click for quick order
        document.querySelectorAll('.food-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('order-now-btn')) return;
                const id = card.getAttribute('data-id');
                const foodItem = currentFoods.find(f => f.id === id);
                if (foodItem) openOrderModal(foodItem);
            });
        });
    }

    // Render Suggested Foods (2 random items)
    function renderSuggestedFoods() {
        if (!suggestedRow) return;
        
        if (!currentFoods.length) {
            suggestedRow.innerHTML = '<div class="glass-card" style="padding: 1rem; text-align: center;">No suggestions available</div>';
            return;
        }
        
        let suggestedItems = [...currentFoods];
        if (suggestedItems.length > 2) {
            suggestedItems = suggestedItems.sort(() => 0.5 - Math.random()).slice(0, 2);
        }
        
        suggestedRow.innerHTML = suggestedItems.map(food => `
            <div class="suggestion-item" data-id="${food.id}">
                <img src="${food.imageUrl || 'https://picsum.photos/240/150?random=' + food.id}" 
                     style="width: 100%; height: 140px; border-radius: 1rem; object-fit: cover; margin-bottom: 0.5rem;"
                     onerror="this.src='https://via.placeholder.com/240x140?text=Food'">
                <p style="font-weight: 600;">${escapeHtml(food.name)}</p>
                <p style="color: #bf4eff; font-weight: bold;">₹${food.price}</p>
                <small style="opacity: 0.7;">Click to order</small>
            </div>
        `).join('');
        
        document.querySelectorAll('.suggestion-item').forEach(el => {
            el.addEventListener('click', () => {
                const fid = el.getAttribute('data-id');
                const found = currentFoods.find(f => f.id === fid);
                if (found) openOrderModal(found);
            });
        });
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
            renderUserFoods(currentFoods);
            renderSuggestedFoods();
        });
    }

    // Get Started Button
    document.getElementById('getStartedBtn')?.addEventListener('click', () => {
        showMainApp();
        fetchFoods();
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('orderModal');
        if (modal && modal.classList.contains('active') && e.target === modal) {
            modal.classList.remove('active');
        }
    });
