class Store {
  constructor() {
    this.restaurants = [];
    this.cuisines = [];
    this.deliveries = [];  
  }

  async loadData() {
    try {
      const response = await fetch('./data.json');
      const data = await response.json();
      this.restaurants = data.restaurants;
      this.cuisines = data.cuisines || [];
      this.deliveries = data.deliveries || [];
    } catch (error) {
      console.error("Error loading the restaurant data:", error);
    }
  }

  getRestaurants() {
    return this.restaurants;
  }
  getCuisines() {
    return this.cuisines;
  }
  getDeliveries() {
    return this.deliveries;
  }

  filterRestaurants(category, searchTerm = '') {
    return this.restaurants.filter(restaurant => {
      const matchesCategory = category === 'all' || restaurant.category === category;
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) 
      || restaurant.menu.some(food => food.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }

  toggleMealAvailability(restaurantId, mealId) {
    const restaurant = this.restaurants.find(res => String(res.id) === String(restaurantId));
    if (restaurant) {
      const meal = restaurant.menu.find(m => String(m.id) === String(mealId));
      if (meal) {
        meal.available = !meal.available; 

        console.log(`Updated ${meal.name} availability to: ${meal.available}`);
      }
    }
  }
}

class CustomerView {
  constructor(store, onCardClick) {
    this.store = store;
    this.onCardClick = onCardClick;
    this.gridContainer = document.getElementById('restuarants');
    this.searchInput = document.getElementById('search');
    this.restuarantCategory = document.querySelectorAll('input[name="restaurant"]');
    
    // FIX: Targeting the new wrapper so the Menu doesn't get hidden!
    this.homeScreen = document.getElementById('home-content');
  }

  init() {
    this.searchInput.addEventListener('input', () => this.handleFilterChange());

    this.restuarantCategory.forEach(radio => {
      radio.addEventListener('change', () => this.handleFilterChange());
    });

    this.gridContainer.addEventListener('click', (e) => {
      const card = e.target.closest('article');
      if (card) {
        const restaurantId = card.getAttribute('data-id');
        this.onCardClick(restaurantId); 
      }
    });
  }

  handleFilterChange() {
    const activeCategory = document.querySelector('input[name="restaurant"]:checked').value;
    const searchTerm = this.searchInput.value;
    const filteredData = this.store.filterRestaurants(activeCategory, searchTerm);
    this.render(filteredData);
  }

  render(restaurants) {
    if (restaurants.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
          <i class="fas fa-search text-4xl mb-3 opacity-50"></i>
          <p class="text-lg">No restaurants found.</p>
        </div>`;
      return;
    }
    
    const html = restaurants.map(res => `
      <article class="relative bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-300 group" data-id="${res.id}">
        <img src="${res.image}" alt="${res.name}" class="w-full h-48 object-cover rounded-md mb-4 group-hover:opacity-90 transition-opacity">
        <h5 class="text-lg font-semibold mb-2">${res.name}</h5>
        <p class="text-gray-700 mb-2 text-sm line-clamp-2">${res.description}</p>
        <span class="text-sm font-medium text-gray-600"><i class="fas fa-star text-[#DC143C]"></i> ${res.rating}/5</span>
        
      </article>
    `).join('');

    this.gridContainer.innerHTML = html;
  }
  
  renderFeaturedRestaurants(restaurants) {
    const container = document.getElementById('featured-vendors-container');
    if (!container || restaurants.length === 0) return;

    const featured = restaurants.slice(0, 6);

    const html = featured.map(res => `
      <div class="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl overflow-hidden snap-start shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group">
        
        <div class="relative h-48 overflow-hidden bg-gray-200">
          <img src="${res.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out">
          
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#DC143C] transition-colors shadow-sm cursor-pointer">
            <i class="fas fa-heart"></i>
          </div>
          
          <div class="absolute top-3 left-3 bg-[#DC143C] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            Top Rated
          </div>
        </div>

        <div class="p-5 flex flex-col gap-2">
          <div class="flex justify-between items-start">
            <h3 class="font-bold text-xl text-gray-900 truncate pr-2">${res.name}</h3>
            <div class="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-sm font-bold shrink-0">
              <i class="fas fa-star text-xs"></i> 4.8
            </div>
          </div>
          
          <div class="flex items-center gap-2 text-gray-500 text-sm font-medium mt-1">
            <span class="flex items-center gap-1"><i class="fas fa-motorcycle text-gray-400"></i> 15-25 min</span>
            <span class="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
            <span class="flex items-center gap-1"><i class="fas fa-tag text-gray-400"></i> Delivery: Free</span>
          </div>
        </div>
      </div>
    `).join('');

    // Inject the HTML plus a tiny spacer at the end so the last card doesn't touch the edge
    container.innerHTML = html + `<div class="min-w-[10px] md:min-w-[20px]"></div>`;
  }
}

// MENU PAGE
class MenuView {
  constructor(store, onBackClick, onAddToCart) {
    this.store = store;
    this.onBackClick = onBackClick; 
    this.onAddToCart = onAddToCart; // NEW: Save the cart logic
    
    this.menuViewEl = document.getElementById('menu');
    this.heroImg = document.getElementById('menu-hero-img');
    this.title = document.getElementById('menu-title');
    this.rating = document.getElementById('menu-rating');
    this.desc = document.getElementById('menu-desc');
    this.itemsContainer = document.getElementById('menu-items-container');
    this.backBtn = document.getElementById('back-btn');
  }

  init() {
    this.backBtn.addEventListener('click', () => {
      this.hide();
      this.onBackClick(); 
    });

    // NEW: Listen for clicks on the add-to-cart buttons
    this.itemsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (btn) {
        const mealId = btn.getAttribute('data-meal-id');
        this.onAddToCart(mealId); 
      }
    });
  }

  show(restaurantId) {
    const restaurants = this.store.getRestaurants();
    const restaurant = restaurants.find(res => String(res.id) === String(restaurantId));

    if (!restaurant) return;

    this.heroImg.src = restaurant.image;
    this.title.textContent = restaurant.name;
    this.rating.innerHTML = `<i class="fas fa-star text-[#DC143C]"></i> ${restaurant.rating}`;
    this.desc.textContent = restaurant.description;

    const menuHtml = restaurant.menu.map(meal => `
      <div class="flex justify-between items-center bg-white rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-shadow h-32 overflow-hidden"> 
        <div class="w-1/4 h-full shrink-0"> 
          <img class="w-full h-full object-cover object-center" src="${meal.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'}" alt="${meal.name}"> 
        </div> 
        <div class="p-4 flex-1 min-w-0"> 
          <h4 class="text-lg font-bold text-gray-800 mb-1 truncate">${meal.name}</h4> 
          <p class="text-sm text-gray-500 mb-2 line-clamp-2">Fresh ingredients.</p> 
          <span class="text-[#DC143C] font-extrabold text-lg">₦${meal.price.toLocaleString()}</span> 
        </div> 
        <div class="pr-4 shrink-0">
          <button data-meal-id="${meal.id}" class="add-to-cart-btn w-12 h-12 bg-gray-100 hover:bg-[#DC143C] text-gray-600 hover:text-white rounded-full flex items-center justify-center shadow-sm transition-all duration-300"> 
            <i class="fas fa-plus"></i> 
          </button> 
        </div>
      </div>
    `).join('');

    this.itemsContainer.innerHTML = menuHtml;
    this.menuViewEl.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  hide() {
    this.menuViewEl.classList.add('hidden');
  }
}

// ==========================================
// 4. THE CART LAYER (Upgraded)
// ==========================================
class Cart {
  constructor() {
    this.items = []; 
    
    // UI Elements
    this.cartBadge = document.getElementById('cart-badge');
    this.cartOverlay = document.getElementById('cart-overlay');
    this.cartPanel = document.getElementById('cart-panel');
    this.cartItemsContainer = document.getElementById('cart-items-container');
    this.cartTotalPrice = document.getElementById('cart-total-price');
    
    // Buttons
    this.openBtn = document.getElementById('open-cart-btn');
    this.closeBtn = document.getElementById('close-cart-btn');

    this.initListeners();
  }

  initListeners() {
    // Open Cart
    if(this.openBtn) {
      this.openBtn.addEventListener('click', () => this.openCart());
    }
    // Close Cart (by clicking X or the dark overlay)
    if(this.closeBtn && this.cartOverlay) {
      this.closeBtn.addEventListener('click', () => this.closeCart());
      this.cartOverlay.addEventListener('click', () => this.closeCart());
    }
  }

  openCart() {
    this.cartOverlay.classList.remove('hidden');
    // Using a tiny timeout to allow the display:block to register before animating opacity
    setTimeout(() => {
      this.cartPanel.classList.remove('translate-x-full');
    }, 10);
  }

  closeCart() {
    this.cartPanel.classList.add('translate-x-full');
    // Wait for the slide animation to finish before hiding the overlay completely
    setTimeout(() => {
      this.cartOverlay.classList.add('hidden');
    }, 300);
  }

  add(meal) {
    const existingItem = this.items.find(item => item.id === meal.id);
    if (existingItem) {
      existingItem.quantity += 1; 
    } else {
      this.items.push({ ...meal, quantity: 1 }); 
    }
    this.updateUI();
  }

  updateUI() {
    // 1. Update the little red badge
    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
      this.cartBadge.textContent = totalItems;
      this.cartBadge.classList.remove('hidden');
      this.cartBadge.classList.add('scale-125');
      setTimeout(() => this.cartBadge.classList.remove('scale-125'), 200);
    } else {
      this.cartBadge.classList.add('hidden');
    }

    // 2. Calculate total price
    const totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.cartTotalPrice.textContent = `₦${totalPrice.toFixed(2)}`;

    // 3. Draw the items inside the slide-out panel
    if (this.items.length === 0) {
      this.cartItemsContainer.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-gray-400">
          <i class="fas fa-shopping-basket text-5xl mb-4 opacity-50"></i>
          <p>Your cart is empty.</p>
        </div>`;
      return;
    }

    const html = this.items.map(item => `
      <div class="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <img src="${item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'}" class="w-16 h-16 object-cover rounded-lg">
        <div class="flex-1">
          <h4 class="font-bold text-gray-800 line-clamp-1">${item.name}</h4>
          <p class="text-[#DC143C] font-bold">₦${item.price.toFixed(2)}</p>
        </div>
        <div class="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
          <span class="font-bold text-gray-800">x${item.quantity}</span>
        </div>
      </div>
    `).join('');

    this.cartItemsContainer.innerHTML = html;
  }
}


// ==========================================
// 5. THE VENDOR VIEW 
class VendorView {
  constructor(store) {
    this.store = store;
    
    // UI Elements
    this.vendorViewEl = document.getElementById('vendor-view');
    this.vendorSelector = document.getElementById('vendor-selector');
    this.itemsContainer = document.getElementById('vendor-items-container');
    this.ordersContainer = document.getElementById('vendor-orders-container');
    this.queueCountEl = document.getElementById('vendor-queue-count');
    
    this.vendorId = null;
    this.activeOrders = []; 
  }

  init() {

    const menuBtn = document.getElementById('vendor-menu-btn');
    const closeBtn = document.getElementById('vendor-close-btn');
    const sidebar = document.getElementById('vendor-sidebar');

    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
      });
    }

    if (closeBtn && sidebar) {
      closeBtn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
      });
    }
    // Menu Toggles
    if (this.itemsContainer) {
      this.itemsContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('toggle-checkbox')) {
          const mealId = e.target.getAttribute('data-meal-id');
          this.toggleMealAvailability(this.vendorId, mealId);
          this.render(); 
        }
      });
    }

    //  Vendor Switch
    if (this.vendorSelector) {
      this.vendorSelector.addEventListener('change', (e) => {
        this.vendorId = e.target.value;
        this.generateSimulatedOrders();
        this.render(); 
      });
    }
  }

  toggleMealAvailability(restaurantId, mealId) {
    const restaurant = this.store.getRestaurants().find(r => String(r.id) === String(restaurantId));
    if (restaurant) {
      const meal = restaurant.menu.find(m => String(m.id) === String(mealId));
      if (meal) {
        meal.available = !meal.available; 
      }
    }
  }

  generateSimulatedOrders() {
    const restaurants = this.store.getRestaurants();
    const restaurant = restaurants.find(res => String(res.id) === String(this.vendorId));
    
    if (!restaurant || !restaurant.menu || restaurant.menu.length === 0) {
      this.activeOrders = [];
      return;
    }

    // Generate random orders using the current vendor's actual menu
    const getRandomMeal = () => restaurant.menu[Math.floor(Math.random() * restaurant.menu.length)];

    this.activeOrders = [
      {
        id: `BK-${Math.floor(Math.random() * 9000) + 1000}`,
        customer: "John D.",
        time: "8 mins ago",
        status: "Preparing",
        items: [
          { name: getRandomMeal().name, qty: 2 },
          { name: getRandomMeal().name, qty: 1 }
        ]
      },
      {
        id: `BK-${Math.floor(Math.random() * 9000) + 1000}`,
        customer: "Mike T.",
        time: "15 mins ago",
        status: "Ready",
        items: [
          { name: getRandomMeal().name, qty: 1 }
        ]
      }
    ];
  }

  render() {
    const restaurants = this.store.getRestaurants();

    if (!this.vendorId && restaurants.length > 0) {
      this.vendorId = String(restaurants[0].id);
      this.generateSimulatedOrders();
    }

    //  Dropdown
    if (this.vendorSelector) {
      this.vendorSelector.innerHTML = restaurants.map(res => `
        <option value="${res.id}" ${String(res.id) === String(this.vendorId) ? 'selected' : ''} class="text-base text-gray-900">
          ${res.name}
        </option>
      `).join('');
    }

    const restaurant = restaurants.find(res => String(res.id) === String(this.vendorId));
    if (!restaurant) return;

    // Quick Menu Toggles
    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = restaurant.menu.map(meal => `
        <div class="flex items-center justify-between p-3 rounded-2xl transition-all ${meal.available !== false ? 'bg-white/10' : 'bg-white/5 opacity-50'}">
          <div class="flex items-center gap-3 w-[70%]">
            <div class="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 shrink-0 shadow-inner">
              <img class="w-full h-full object-cover" src="${meal.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=60'}"/>
            </div>
            <div class="flex-1 truncate">
              <p class="text-sm font-bold text-white truncate">${meal.name}</p>
              <p class="text-[12px] font-semibold mt-0.5 ${meal.available !== false ? 'text-gray-400' : 'text-red-400'}">
                ${meal.available !== false ? `₦${meal.price.toLocaleString()}` : 'Out of Stock'}
              </p>
            </div>
          </div>
          
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" class="sr-only peer toggle-checkbox" data-meal-id="${meal.id}" ${meal.available !== false ? 'checked' : ''}>
            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DC143C]"></div>
          </label>
        </div>
      `).join('');
    }

    // Orders
    if (this.queueCountEl) this.queueCountEl.textContent = this.activeOrders.length;
    
    if (this.ordersContainer) {
      this.ordersContainer.innerHTML = this.activeOrders.map(order => {
        const isReady = order.status === 'Ready';
        return `
          <div class="${isReady ? 'bg-red-50 border-[#DC143C]/20' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-4">
                <div>
                  <p class="text-sm font-bold text-gray-400">${order.id}</p>
                  <p class="text-sm font-medium text-gray-900">${order.customer} • ${order.time}</p>
                </div>
                <span class="${isReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  ${order.status}
                </span>
              </div>
              <ul class="space-y-2 mb-6">
                ${order.items.map(item => `<li class="text-base text-gray-700 font-bold">${item.qty}x ${item.name}</li>`).join('')}
              </ul>
            </div>
            
            ${isReady ? `
              <div class="flex items-center text-[#DC143C] gap-2 font-bold mt-auto">
                <i class="fas fa-motorcycle"></i>
                <span>Waiting for Rider</span>
              </div>
            ` : `
              <div class="flex gap-2 mt-auto">
                <button class="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Details</button>
                <button class="flex-1 py-2 rounded-xl bg-[#DC143C] text-white font-bold shadow-md active:scale-95 transition-transform">Mark Ready</button>
              </div>
            `}
          </div>
        `;
      }).join('');
    }
  }

  show() {
    this.render(); 
    if (this.vendorViewEl) {
      this.vendorViewEl.classList.remove('hidden');
    }
  }

  hide() {
    if (this.vendorViewEl) {
      this.vendorViewEl.classList.add('hidden');
    }
  }
}

class CuisineView {
  constructor(store) {
    this.store = store;
    this.cuisinesContainer = document.getElementById('cuisines-container');
  }

  render() {
    const cuisines = this.store.getCuisines();
    const html = cuisines.map(cuisine => `
      <div class="relative min-w-[130px] md:min-w-[160px] hover:min-w-[180px] md:hover:min-w-[220px] h-36 md:h-44 rounded-2xl overflow-hidden snap-start group shadow-sm hover:shadow-xl transition-all duration-500 ease-out cursor-pointer" data-category="${cuisine.name.toLowerCase()}">
        <img src="${cuisine.image}" alt="${cuisine.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <span class="absolute bottom-3 left-3 text-white font-bold text-base md:text-lg">${cuisine.name}</span>
      </div>
    `).join('');


    this.cuisinesContainer.innerHTML = html + `<div class="min-w-[10px] md:min-w-[20px]"></div>`;
  }
}

// ==========================================
// 6. THE RIDER VIEW 
// ==========================================
class RiderView {
  constructor(store) {
    this.store = store;
    
    // UI Elements
    this.riderViewEl = document.getElementById('rider-view');
    this.availableContainer = document.getElementById('available-deliveries-container');
    this.activeTaskContainer = document.getElementById('active-task-container');
    this.availableCountEl = document.getElementById('available-count');
    this.toast = document.getElementById('rider-toast');
    
    // State
    this.availableDeliveries = [];
    this.activeDelivery = null;
  }

  init() {
    document.getElementById('rider-close-btn').addEventListener('click', () => {
    document.getElementById('rider-sidebar').classList.add('-translate-x-full');
    document.getElementById('rider-sidebar').classList.remove('translate-x-0');
});
    if (this.availableContainer) {
      this.availableContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.accept-btn');
        if (btn) {
          const deliveryId = btn.getAttribute('data-id');
          this.acceptDelivery(deliveryId);
        }
      });
    }

    if (this.activeTaskContainer) {
      this.activeTaskContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('#mark-delivered-btn');
        if (btn) {
          this.completeDelivery();
        }
      });
    }
    const header = this.riderViewEl.querySelector('header');
  if (!document.getElementById('rider-menu-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'rider-menu-toggle';
    btn.className = 'md:hidden text-2xl text-gray-900 mr-4';
    btn.innerHTML = '<i class="fas fa-bars"></i>';
    header.prepend(btn);
    btn.addEventListener('click', () => {
      document.getElementById('rider-sidebar').classList.remove('-translate-x-full');
      document.getElementById('rider-sidebar').classList.add('translate-x-0');
    });
  }
  
}
  

  loadDeliveriesFromStore() {
    // Fetch all deliveries from the JSON database that are still available
    this.availableDeliveries = this.store.getDeliveries().filter(d => d.status === 'available');
  }

  acceptDelivery(id) {
    // 1. Find the delivery in the Store's database
    const allDeliveries = this.store.getDeliveries();
    const index = allDeliveries.findIndex(d => String(d.id) === String(id));
    
    if (index !== -1) {
      // 2. Update the status in the database to 'active'
      allDeliveries[index].status = 'active';
      this.activeDelivery = allDeliveries[index];
      
      // 3. Refresh the UI list
      this.loadDeliveriesFromStore();
      this.render();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  completeDelivery() {
    const btn = document.getElementById('mark-delivered-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Processing...';
    
    setTimeout(() => {
      // Show Toast
      this.toast.classList.remove('opacity-0', 'translate-y-10');
      this.toast.classList.add('opacity-100', 'translate-y-0');
      
      setTimeout(() => {
        this.toast.classList.remove('opacity-100', 'translate-y-0');
        this.toast.classList.add('opacity-0', 'translate-y-10');
        
        // Mark the delivery as completed in the database
        if (this.activeDelivery) {
           this.activeDelivery.status = 'completed';
        }
        
        // Clear task and render
        this.activeDelivery = null;
        this.render();
      }, 3000);
    }, 1000);
  }

  render() {
    if (this.availableCountEl) {
      this.availableCountEl.textContent = `${this.availableDeliveries.length} Near You`;
    }

    if (this.availableContainer) {
      if (this.availableDeliveries.length === 0) {
        this.availableContainer.innerHTML = `
          <div class="text-center p-8 bg-white rounded-2xl border border-gray-100">
            <p class="text-gray-500 font-bold">No new requests right now.</p>
          </div>
        `;
      } else {
        // Map over the database entries
        this.availableContainer.innerHTML = this.availableDeliveries.map(del => {
          // Look up the specific restaurant name using the vendorId from the database
          const vendor = this.store.getRestaurants().find(r => String(r.id) === String(del.vendorId));
          const vendorName = vendor ? vendor.name : 'Unknown Vendor';

          return `
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-all">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <i class="fas fa-store text-[#DC143C] text-lg"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">${vendorName}</h3>
                  <p class="text-xs font-semibold text-gray-400 mt-0.5">${del.distance} away</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-lg font-extrabold text-[#DC143C]">₦${del.earnings.toLocaleString()}</span>
                <p class="text-[10px] font-bold text-gray-400 uppercase">Est. Earn</p>
              </div>
            </div>
            <div class="flex items-center gap-2 py-3 border-y border-gray-100">
              <i class="fas fa-map-marker-alt text-gray-400"></i>
              <p class="text-sm font-semibold text-gray-600 truncate">Drop-off: ${del.dropoff}</p>
            </div>
            <button data-id="${del.id}" class="accept-btn w-full py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-gray-800 active:scale-95 transition-all text-sm">
              Accept Delivery
            </button>
          </div>
        `}).join('');
      }
    }

    if (this.activeTaskContainer) {
      const wrapper = document.getElementById('active-task-wrapper');
      
      if (!this.activeDelivery) {
        if (wrapper) wrapper.classList.add('hidden', 'lg:flex'); 
        this.activeTaskContainer.innerHTML = `
          <div class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white rounded-3xl h-full min-h-[500px]">
            <i class="fas fa-motorcycle text-6xl mb-4 opacity-20"></i>
            <h3 class="text-xl font-bold text-gray-700">No Active Delivery</h3>
            <p class="mt-2 text-sm max-w-xs font-medium">Accept a delivery from the list to see route details.</p>
          </div>
        `;
      } else {
        if (wrapper) wrapper.classList.remove('hidden'); 
        // Look up the specific restaurant name using the vendorId from the database
        const vendor = this.store.getRestaurants().find(r => String(r.id) === String(this.activeDelivery.vendorId));
        const vendorName = vendor ? vendor.name : 'Unknown Vendor';

        this.activeTaskContainer.innerHTML = `
          <div class="relative h-48 md:h-64 w-full bg-gray-100 overflow-hidden shrink-0">
            <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <i class="fas fa-map-marked-alt text-6xl text-gray-300"></i>
            </div>
            <div class="absolute bottom-4 right-4 flex flex-col items-center animate-bounce">
              <div class="bg-[#DC143C] text-white p-3 rounded-full shadow-lg border-2 border-white">
                <i class="fas fa-motorcycle"></i>
              </div>
              <div class="h-4 w-1 bg-[#DC143C]/40"></div>
            </div>
          </div>
          
          <div class="p-6 md:p-8 flex flex-col flex-1">
            <div class="flex flex-col md:flex-row justify-between gap-6 mb-8">
              <div class="flex-1">
                <p class="text-[10px] font-extrabold text-[#DC143C] uppercase tracking-widest mb-2">Customer Details</p>
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full bg-red-100 text-[#DC143C] flex items-center justify-center text-xl font-bold shrink-0">
                    ${this.activeDelivery.customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 class="text-lg font-bold text-gray-900">${this.activeDelivery.customerName}</h4>
                    <p class="text-sm font-semibold text-gray-500 mt-0.5">${this.activeDelivery.dropoff}</p>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
                <button class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"><i class="fas fa-phone"></i></button>
                <button class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"><i class="fas fa-comment"></i></button>
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-auto">
              <div class="flex justify-between items-center mb-3">
                <span class="text-sm font-bold text-gray-900">Order #${this.activeDelivery.id}</span>
                <span class="text-sm font-bold text-[#DC143C]">Collect: ₦${this.activeDelivery.orderTotal.toLocaleString()}</span>
              </div>
              <p class="text-sm font-medium text-gray-500"><i class="fas fa-shopping-bag mr-2"></i> Pickup from: ${vendorName}</p>
            </div>
            
            <div class="mt-6 pt-6 border-t border-gray-100">
              <button id="mark-delivered-btn" class="w-full py-4 bg-[#DC143C] text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 hover:bg-[#b01030] active:scale-95 transition-all flex items-center justify-center gap-3">
                <i class="fas fa-check-circle text-xl"></i> Mark as Delivered
              </button>
              <p class="text-center text-sm font-bold text-gray-500 mt-4">Earn <span class="text-[#DC143C]">₦${this.activeDelivery.earnings.toLocaleString()}</span> for this trip</p>
            </div>
          </div>
        `;
      }
    }
  }

  show() {
    this.loadDeliveriesFromStore();
    this.render(); 
    if (this.riderViewEl) {
      this.riderViewEl.classList.remove('hidden');
    }
  }

  hide() {
    if (this.riderViewEl) {
      this.riderViewEl.classList.add('hidden');
    }
  }
}


// ==========================================
// THE MANAGER
// ==========================================
class App {
  constructor() {
    this.store = new Store();
    this.cart = new Cart();
    
    this.customerView = new CustomerView(this.store, (id) => this.showMenuScreen(id));
    this.menuView = new MenuView(this.store, () => this.showHomeScreen(), (mealId) => this.handleAddToCart(mealId));
    this.vendorView = new VendorView(this.store, (resId, mealId) => this.store.toggleMealAvailability(resId, mealId));
    
    // Pass the store to the RiderView
    this.riderView = new RiderView(this.store); 
    
    this.currentRestaurantId = null; 
    this.navBtns = document.querySelectorAll('nav a, header a');
  }

  async init() {
    try {
      await this.store.loadData();
      
      this.customerView.init();
      this.menuView.init();
      this.vendorView.init();
      this.riderView.init(); 
      
      this.cuisineView = new CuisineView(this.store);
      this.cuisineView.render();

      const initialData = this.store.filterRestaurants('all', '');
      this.customerView.render(initialData);

      // DOM Elements for Routing
      const landingPage = document.getElementById('landing-page');
      const appContainer = document.getElementById('dash'); // Or 'app-container' depending on your HTML
      const heroSearchForm = document.getElementById('hero-search');
      const getStartedBtn = document.getElementById('get-started-btn');
      const searchWhatInput = document.getElementById('search-what');
      const dashboardSearchInput = document.getElementById('search');

      // 1. Get Started Button Routing
      if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
          landingPage.classList.add('hidden');
          // landingPage.classList.remove('flex'); 
          if (appContainer) appContainer.classList.remove('hidden');
          if (heroSearchForm) heroSearchForm.classList.add('hidden');
          this.showHomeScreen();
        });
      }

      // 2. Search Form Routing
      if (heroSearchForm) {
        heroSearchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const searchTerm = searchWhatInput ? searchWhatInput.value.trim() : '';

          if (appContainer) appContainer.classList.remove('hidden');
          if (landingPage) {
            landingPage.classList.add('hidden');
            // landingPage.classList.remove('flex');
          }
          
          this.showHomeScreen();
          
          if (dashboardSearchInput) {
            dashboardSearchInput.value = searchTerm;
          }

          const filteredRestaurants = this.store.filterRestaurants('all', searchTerm);
          this.customerView.render(filteredRestaurants);
        });
      }

      // 3. Navigation Bar Routing
      this.navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = btn.getAttribute('href');
          
          if (['#home', '#order', '#vendor', '#rider'].includes(target)) {
            e.preventDefault();
            
            // Hide all views
            this.customerView.homeScreen.classList.add('hidden');
            this.menuView.hide();
            this.vendorView.hide();
            this.riderView.hide();

            // Show selected view
            if (target === '#home' || target === '#order') {
              this.showHomeScreen();
            } else if (target === '#vendor') { 
              this.vendorView.show();
            } else if (target === '#rider') {
              this.riderView.show();
            }
          }
        });
      });

      // 4. Render Featured Vendors on Landing Page
      const allRestaurants = this.store.getRestaurants();
      this.customerView.renderFeaturedRestaurants(allRestaurants);

      // 5. Direct Vendor Portal Routing (Buttons on Landing Page/Sidebar)
      const vendorLoginBtn = document.getElementById('vendor-login-btn'); 
      const vendorLogoutBtn = document.getElementById('vendor-logout-btn');

      if (vendorLoginBtn) {
        vendorLoginBtn.addEventListener('click', () => {
          if (landingPage) {
            landingPage.classList.add('hidden');
            // landingPage.classList.remove('flex');
          }
          this.vendorView.show();
        });
      }

      if (vendorLogoutBtn) {
        vendorLogoutBtn.addEventListener('click', () => {
          this.vendorView.hide();
          if (landingPage) {
            landingPage.classList.remove('hidden');
            // landingPage.classList.add('flex');
          }
        });
      }

      // 6. Direct Rider Portal Routing (Buttons on Landing Page/Sidebar)
      const riderLoginBtn = document.getElementById('rider-login-btn'); 
      const riderLogoutBtn = document.getElementById('rider-logout-btn');

      if (riderLoginBtn) {
        riderLoginBtn.addEventListener('click', () => {
          if (landingPage) {
            landingPage.classList.add('hidden');
            // landingPage.classList.remove('flex');
          }
          this.riderView.show();
        });
      }

      if (riderLogoutBtn) {
        riderLogoutBtn.addEventListener('click', () => {
          this.riderView.hide();
          if (landingPage) {
            landingPage.classList.remove('hidden');
            // landingPage.classList.add('flex');
          }
        });
      }
      
    } catch (error) {
      console.error("Error Loading Data:", error);
    }
  }

  showMenuScreen(restaurantId) {
    this.currentRestaurantId = restaurantId;
    if (this.customerView.homeScreen) {
      this.customerView.homeScreen.classList.add('hidden');
    }
    this.menuView.show(restaurantId);
  }

  showHomeScreen() {
    this.menuView.hide();
    if (this.customerView.homeScreen) {
      this.customerView.homeScreen.classList.remove('hidden');
    }
  }

  handleAddToCart(mealId) {
    const restaurants = this.store.getRestaurants();
    const currentRes = restaurants.find(res => String(res.id) === String(this.currentRestaurantId));
    
    if (currentRes) {
      const meal = currentRes.menu.find(m => String(m.id) === String(mealId));
      if (meal) {
        this.cart.add(meal);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const bukkaApp = new App();
  bukkaApp.init();
});
