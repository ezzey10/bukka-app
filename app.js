class Store {
  constructor() {
    this.restaurants = [];
    this.cuisines = []; 
  }

  async loadData() {
    try {
      const response = await fetch('./data.json');
      const data = await response.json();
      this.restaurants = data.restaurants;
      this.cuisines = data.cuisines || [];
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
    this.cartTotalPrice.textContent = `$${totalPrice.toFixed(2)}`;

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
          <p class="text-[#DC143C] font-bold">$${item.price.toFixed(2)}</p>
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
// ==========================================
class VendorView {
  constructor(store, onToggleMeal) {
    this.store = store;
    this.onToggleMeal = onToggleMeal;
    
    this.vendorViewEl = document.getElementById('vendor-view');
    this.vendorSelector = document.getElementById('vendor-selector'); // Grab the new dropdown
    this.itemsContainer = document.getElementById('vendor-items-container');
    
    this.vendorId = null; 
  }

  init() {
    // 1. Listen for clicks on the toggle switches
    this.itemsContainer.addEventListener('change', (e) => {
      if (e.target.classList.contains('toggle-checkbox')) {
        const mealId = e.target.getAttribute('data-meal-id');
        this.onToggleMeal(this.vendorId, mealId);
        this.render(); 
      }
    });

    
    this.vendorSelector.addEventListener('change', (e) => {
      this.vendorId = e.target.value; 
      this.render(); 
    });
  }

  render() {
    const restaurants = this.store.getRestaurants();

    
    if (!this.vendorId && restaurants.length > 0) {
      this.vendorId = String(restaurants[0].id);
    }

    // 1. Build the dropdown options dynamically
    this.vendorSelector.innerHTML = restaurants.map(res => `
      <option value="${res.id}" ${String(res.id) === this.vendorId ? 'selected' : ''}>
        ${res.name}
      </option>
    `).join('');

    // 2. Find the menu for the currently selected restaurant
    const restaurant = restaurants.find(res => String(res.id) === this.vendorId);
    if (!restaurant) return;

    // 3. Build the menu toggle list
    const menuHtml = restaurant.menu.map(meal => `
      <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h4 class="text-lg font-bold text-gray-800">${meal.name}</h4>
          <p class="text-[#DC143C] font-bold mt-1">₦${meal.price.toLocaleString()}</p>
        </div>
        
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium ${meal.available ? 'text-green-600' : 'text-gray-400'}">
            ${meal.available ? 'Available' : 'Sold Out'}
          </span>
          
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer toggle-checkbox" data-meal-id="${meal.id}" ${meal.available ? 'checked' : ''}>
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DC143C]"></div>
          </label>
        </div>
      </div>
    `).join('');

    this.itemsContainer.innerHTML = menuHtml;
  }

  show() {
    this.render(); 
    this.vendorViewEl.classList.remove('hidden');
  }

  hide() {
    this.vendorViewEl.classList.add('hidden');
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
  constructor() {
    this.riderViewEl = document.getElementById('rider-view');
    this.statusBtn = document.getElementById('rider-status-btn');
    
    // We track what stage of the delivery the rider is on
    this.statusIndex = 0; 
    
    // The different states of our button
    this.statuses = [
      { text: "Accept Delivery", color: "bg-[#DC143C]" },
      { text: "Confirm Pickup", color: "bg-blue-500" },
      { text: "Mark as Delivered", color: "bg-green-500" },
      { text: "Waiting for orders...", color: "bg-gray-300" }
    ];
  }

  init() {
    this.statusBtn.addEventListener('click', () => {
      
      if (this.statusIndex < 3) {
        this.statusIndex++;
        this.updateBtnUI();
      }
    });
  }

  updateBtnUI() {
    const current = this.statuses[this.statusIndex];
    
    // Update the text
    this.statusBtn.textContent = current.text;
    
    
    this.statusBtn.className = `w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 shadow-lg active:scale-95 ${current.color}`;
    
    
    if (this.statusIndex === 3) {
      this.statusBtn.disabled = true;
      this.statusBtn.classList.remove('active:scale-95', 'shadow-lg');
    }
  }

  show() {
    this.riderViewEl.classList.remove('hidden');
  }

  hide() {
    this.riderViewEl.classList.add('hidden');
  }
}


// THE MANAGER
class App {
  constructor() {
    this.store = new Store();
    this.cart = new Cart();
    
    this.customerView = new CustomerView(this.store, (id) => this.showMenuScreen(id));
    this.menuView = new MenuView(this.store, () => this.showHomeScreen(), (mealId) => this.handleAddToCart(mealId));
    this.vendorView = new VendorView(this.store, (resId, mealId) => this.store.toggleMealAvailability(resId, mealId));
    this.riderView = new RiderView();
    
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

      const landingPage = document.getElementById('landing-page');
      const appContainer = document.getElementById('dash');
      const heroSearchForm = document.getElementById('hero-search');
      const getStartedBtn = document.getElementById('get-started-btn');
      const searchWhatInput = document.getElementById('search-what');
      const dashboardSearchInput = document.getElementById('search');

      // When the user clicks "Get Started"
      getStartedBtn.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        landingPage.classList.remove('flex'); 
        appContainer.classList.remove('hidden');
        heroSearchForm.classList.add('hidden');
        
        this.showHomeScreen();
      });
      heroSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchWhatInput.value.trim();

        appContainer.classList.remove('hidden');
        landingPage.classList.add('hidden');
        landingPage.classList.remove('flex');
        this.showHomeScreen();
        if (dashboardSearchInput) {
          dashboardSearchInput.value = searchTerm;
        }

        // the database using the search term and render only the results!
        const filteredRestaurants = this.store.filterRestaurants('all', searchTerm);
        this.customerView.render(filteredRestaurants);
      });

      // UPDATED NAVIGATION LOGIC
      this.navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = btn.getAttribute('href');
          
          
          if (['#home', '#order', '#vendor', '#rider'].includes(target)) {
            e.preventDefault();
            
            // 1. Hide every single screen to reset the view
            this.customerView.homeScreen.classList.add('hidden');
            this.menuView.hide();
            this.vendorView.hide();
            this.riderView.hide();

            // 2. Show only the screen they clicked
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

      // 3. Featured Vendors on the landing page!
      const allRestaurants = this.store.getRestaurants();
      this.customerView.renderFeaturedRestaurants(allRestaurants);
      
      
    } catch (error) {
      console.error("Error Loading Data:", error);
    }
  }
  

  showMenuScreen(restaurantId) {
    this.currentRestaurantId = restaurantId;
    this.customerView.homeScreen.classList.add('hidden');
    this.menuView.show(restaurantId);
  }

  showHomeScreen() {
    this.menuView.hide();
    this.customerView.homeScreen.classList.remove('hidden');
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