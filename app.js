

class Store {
  constructor() {
    this.restaurants = [];
  }

  async loadData() {
    try {
      const response = await fetch('./data.json');
      const data = await response.json();
      this.restaurants = data.restaurants;
    
    } catch (error) {
      console.error("Error loading the restaurant data:", error);
    }
  }


  getRestaurants() {
    return this.restaurants;
  }

  filterRestaurants(category, searchTerm = '') {
    return this.restaurants.filter(restaurant => {
      const matchesCategory = category === 'all' || restaurant.category === category;
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) 
      || restaurant.menu.some(food => food.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }
}







class CustomerView {
  constructor(store, onCardClick) {
    this.store = store;
    this.onCardClick = onCardClick;
    
    this.gridContainer = document.getElementById('restuarants');
    this.searchInput = document.getElementById('search');
    this.restuarantCategory = document.querySelectorAll('input[name="restaurant"]');
    this.homeScreen = document.getElementById('home-client');
    console.log(this.restuarantCategory);
    console.log(this.gridContainer);
  }

  init() {
    this.searchInput.addEventListener('input', () => {
      this.handleFilterChange();
    });

    // 2. Listen for clicks on the category radio buttons
    this.restuarantCategory.forEach(radio => {
      radio.addEventListener('change', () => {
        this.handleFilterChange();
      });
    });
    this.gridContainer.addEventListener('click', (e) => {
      // Look for the closest <article> tag to where the user clicked
      const card = e.target.closest('article');
      if (card) {
        // Grab the ID and send it back to the App Manager
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

  // Take an array of restaurants and paint them onto the screen
  render(restaurants) {
    // If no restaurants match the search/category, show a clean empty state
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
        <span class="absolute top-6 right-6 text-sm font-bold bg-[#DC143C] text-white px-2 py-1 rounded-md opacity-90 shadow-sm">
          Min $${res.minimumOrder.toFixed(2)}
        </span> 
      </article>
    `).join('');

    this.gridContainer.innerHTML = html;
  }
}



// MENU PAGE

class MenuView {
  constructor(store, onBackClick) {
    this.store = store;
    this.onBackClick = onBackClick; 

    
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
  }

  show(restaurantId) {
    const restaurants = this.store.getRestaurants();
    const restaurant = restaurants.find(res => res.id === restaurantId);

    if (!restaurant) return;

    
    this.heroImg.src = restaurant.image;
    this.title.textContent = restaurant.name;
    this.rating.innerHTML = `<i class="fas fa-star text-[#DC143C]"></i> ${restaurant.rating}`;
    this.desc.textContent = restaurant.description;

    // 3. Loop through the menu and generate the food cards
    const menuHtml = restaurant.menu.map(meal => `<div class="flex justify-between items-center bg-white rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-shadow h-32 overflow-hidden"> 
  <div class="w-1/4 h-full shrink-0"> 
    <img class="w-full h-full object-cover object-center" src="${meal.img}" alt="${meal.name}"> 
  </div> 

  <div class="p-4 flex-1 min-w-0"> 
    <h4 class="text-lg font-bold text-gray-800 mb-1 truncate">${meal.name}</h4> 
    <p class="text-sm text-gray-500 mb-2 line-clamp-2">Fresh mozzarella, sweet tomato sauce, and basil.</p> 
    <span class="text-[#DC143C] font-extrabold text-lg">$${meal.price.toFixed(2)}</span> 
  </div> 
  
  <div class="pr-4 shrink-0">
    <button class="w-12 h-12 bg-gray-100 hover:bg-[#DC143C] text-gray-600 hover:text-white rounded-full flex items-center justify-center shadow-sm transition-all duration-300"> 
      <i class="fas fa-plus"></i> 
    </button> 
  </div>
</div>`).join('');

    this.itemsContainer.innerHTML = menuHtml;

    
    this.menuViewEl.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  hide() {
    this.menuViewEl.classList.add('hidden');
  }
}



//Load the App
class App {
  constructor() {
    this.store = new Store();
    this.customerView = new CustomerView(this.store, (id) => this.showMenuScreen(id));
    this.menuView = new MenuView(this.store, () => this.showHomeScreen());
  }

  async init() {
    try {
      await this.store.loadData();
      this.customerView.init();
      this.menuView.init();

      
      const initialData = this.store.filterRestaurants('all', '');
      this.customerView.render(initialData);
      
    } catch (error) {
      console.error("Error Loading Data:", error);
    }
  }


  showMenuScreen(restaurantId) {
    // Hide the welcome text and grid
    this.customerView.homeScreen.classList.add('hidden');
    // Show the menu for the specific restaurant
    this.menuView.show(restaurantId);
  }

  showHomeScreen() {
    // Hide the menu
    this.menuView.hide();
    // Reveal the welcome text and grid
    this.customerView.homeScreen.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const bukkaApp = new App();
  bukkaApp.init();
});