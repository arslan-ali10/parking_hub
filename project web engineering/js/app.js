document.addEventListener('DOMContentLoaded', () => {
    const { locations } = window.appData;
    const Store = window.appStore;

    const gridContainer = document.getElementById('grid-container');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const navBtns = document.querySelectorAll('.nav-btn');
    const viewHeader = document.getElementById('view-header');
    const viewTitle = document.getElementById('view-title');
    const hero = document.getElementById('hero');

    const favCount = document.getElementById('fav-count');
    const bookCount = document.getElementById('book-count');
    const toastContainer = document.getElementById('toast-container');
    
    const bookingModal = document.getElementById('booking-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBookingBtn = document.getElementById('cancel-booking');
    const confirmBookingBtn = document.getElementById('confirm-booking');
    const modalBody = document.getElementById('modal-body');

    let currentView = 'home';
    let currentFilter = 'all';
    let searchQuery = '';
    let selectedLocationForBooking = null;
    let localLocations = JSON.parse(JSON.stringify(locations));

    updateBadges();
    renderCards();
    setupEventListeners();

    const testimonialsSection = document.getElementById('testimonials-section');
    const faqContainer = document.getElementById('faq-container');
    const contactContainer = document.getElementById('contact-container');

    function setupEventListeners() {
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                navBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentView = e.currentTarget.dataset.view;
                
                if (currentView === 'home') {
                    hero.classList.remove('hidden');
                    viewHeader.classList.add('hidden');
                    testimonialsSection.classList.remove('hidden');
                } else {
                    hero.classList.add('hidden');
                    testimonialsSection.classList.add('hidden');
                    if (currentView === 'faq' || currentView === 'contact') {
                        viewHeader.classList.add('hidden');
                    } else {
                        viewHeader.classList.remove('hidden');
                        const label = currentView.charAt(0).toUpperCase() + currentView.slice(1);
                        viewTitle.textContent = label;
                    }
                }

                faqContainer.classList.add('hidden');
                contactContainer.classList.add('hidden');
                if (currentView === 'faq') faqContainer.classList.remove('hidden');
                if (currentView === 'contact') contactContainer.classList.remove('hidden');
                
                renderCards();
            });
        });

        const footerLinks = document.querySelectorAll('.footer-links a');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.footerView;
                const correspondingNavBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
                if (correspondingNavBtn) {
                    correspondingNavBtn.click();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderCards();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentFilter = e.currentTarget.dataset.filter;
                renderCards();
            });
        });

        closeModalBtn.addEventListener('click', closeModal);
        cancelBookingBtn.addEventListener('click', closeModal);
        confirmBookingBtn.addEventListener('click', handleBookingConfirm);

        document.addEventListener('click', (e) => {
            const header = e.target.closest('.accordion-header');
            if (!header) return;
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.accordion-item.open').forEach(el => el.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'contact-form') {
                e.preventDefault();
                const name = document.getElementById('contact-name').value.trim();
                const email = document.getElementById('contact-email').value.trim();
                if (!name || !email) {
                    showToast('Please fill in all required fields.', 'error');
                    return;
                }
                showToast('Message sent! We will reply within 24 hours.', 'success');
                e.target.reset();
            }
        });

        gridContainer.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.fav-btn');
            if (favBtn) {
                handleFavoriteToggle(favBtn.dataset.id, favBtn);
                return;
            }

            const bookBtn = e.target.closest('.book-btn');
            if (bookBtn) {
                openBookingModal(bookBtn.dataset.id);
                return;
            }

            const cancelBtn = e.target.closest('.cancel-booking-btn');
            if (cancelBtn) {
                handleBookingCancel(cancelBtn.dataset.id);
                return;
            }
        });
    }

    function renderCards() {
        gridContainer.innerHTML = '';

        if (currentView === 'faq' || currentView === 'contact') {
            gridContainer.classList.add('hidden');
            emptyState.classList.add('hidden');
            return;
        }

        gridContainer.classList.remove('hidden');
        let displayData = [];

        if (currentView === 'home') {
            displayData = localLocations.filter(loc => {
                const matchesFilter = currentFilter === 'all' || loc.type === currentFilter;
                const matchesSearch = loc.name.toLowerCase().includes(searchQuery) || 
                                      loc.address.toLowerCase().includes(searchQuery);
                return matchesFilter && matchesSearch;
            });
            displayData.forEach(loc => gridContainer.appendChild(createLocationCard(loc)));
        } 
        else if (currentView === 'favorites') {
            const favIds = Store.getFavorites();
            displayData = localLocations.filter(loc => favIds.includes(loc.id));
            displayData.forEach(loc => gridContainer.appendChild(createLocationCard(loc)));
        } 
        else if (currentView === 'bookings') {
            const bookings = Store.getBookings();
            displayData = bookings;
            bookings.forEach(booking => gridContainer.appendChild(createBookingCard(booking)));
        }

        if (displayData.length === 0) {
            emptyState.classList.remove('hidden');
            document.getElementById('empty-title').textContent = currentView === 'home' ? 'No locations found' : `No ${currentView} yet`;
            document.getElementById('empty-desc').textContent = currentView === 'home' ? 'Try adjusting your search or filters.' : `Your saved ${currentView} will appear here.`;
        } else {
            emptyState.classList.add('hidden');
        }
    }

    function createLocationCard(loc) {
        const isFav = Store.isFavorite(loc.id);
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.innerHTML = `
            <div class="card-img-container">
                <span class="card-type">${loc.type}</span>
                <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${loc.id}" aria-label="Favorite">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <img src="${loc.image}" alt="${loc.name}" class="card-img" loading="lazy">
            </div>
            <div class="card-content">
                <h3 class="card-title">${loc.name}</h3>
                <div class="card-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>${loc.distance} • ${loc.address}</span>
                </div>
                <div class="card-stats">
                    <div class="stat">
                        <span class="stat-label">Price</span>
                        <span class="stat-value">Rs. ${loc.pricePerHour.toFixed(2)}/hr</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Available</span>
                        <span class="stat-value ${loc.availableSpots > 0 ? 'available' : 'full'}">${loc.availableSpots}/${loc.totalSpots}</span>
                    </div>
                </div>
                <button class="btn primary book-btn" data-id="${loc.id}" ${loc.availableSpots === 0 ? 'disabled' : ''}>
                    ${loc.availableSpots === 0 ? 'Full' : 'Book Now'}
                </button>
            </div>
        `;
        return card;
    }

    function createBookingCard(booking) {
        const card = document.createElement('div');
        const loc = localLocations.find(l => l.id === booking.locationId);
        card.className = 'card fade-in';
        card.innerHTML = `
            <div class="card-content" style="padding-top: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <span style="font-size: 0.8rem; color: var(--accent-color); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Active Booking</span>
                        <h3 class="card-title" style="margin-top: 0.25rem;">${loc.name}</h3>
                    </div>
                    <span style="background: rgba(59, 130, 246, 0.1); color: var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 8px; font-weight: 600;">${booking.duration} hr</span>
                </div>
                
                <div class="card-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>${new Date(booking.date).toLocaleString()}</span>
                </div>
                ${booking.customerDetails ? `
                <div class="card-location" style="margin-top: -0.5rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>${booking.customerDetails.name} • ${booking.customerDetails.phone}</span>
                </div>
                ` : ''}
                <div class="card-stats" style="margin-bottom: 1rem;">
                    <div class="stat">
                        <span class="stat-label">Total Paid</span>
                        <span class="stat-value">Rs. ${booking.totalPrice.toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Booking ID</span>
                        <span class="stat-value" style="font-family: monospace;">#${booking.id.split('_')[1].toUpperCase()}</span>
                    </div>
                </div>
                <button class="btn danger cancel-booking-btn" data-id="${booking.id}">
                    Cancel Booking
                </button>
            </div>
        `;
        return card;
    }

    function handleFavoriteToggle(id, btn) {
        const favs = Store.toggleFavorite(id);
        const isFav = favs.includes(id);
        
        const svg = btn.querySelector('svg');
        if (isFav) {
            btn.classList.add('active');
            svg.setAttribute('fill', 'currentColor');
            showToast('Added to Favorites', 'success');
        } else {
            btn.classList.remove('active');
            svg.setAttribute('fill', 'none');
            showToast('Removed from Favorites', 'info');
        }
        
        updateBadges();
        
        if (currentView === 'favorites') {
            renderCards();
        }
    }

    function openBookingModal(locationId) {
        selectedLocationForBooking = localLocations.find(l => l.id === locationId);
        if (!selectedLocationForBooking) return;

        modalBody.innerHTML = `
            <div class="booking-details">
                <div class="detail-row">
                    <span class="label">Location</span>
                    <span class="value">${selectedLocationForBooking.name}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Rate</span>
                    <span class="value">Rs. ${selectedLocationForBooking.pricePerHour.toFixed(2)} / hour</span>
                </div>
                <div class="detail-row" style="margin-top: 0.5rem;">
                    <span class="label" style="align-self: center;">Duration (hours)</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="icon-btn" id="dur-minus" style="background: var(--border-color); width: 30px; height: 30px;">-</button>
                        <span id="dur-value" style="font-weight: 600; width: 20px; text-align: center;">2</span>
                        <button class="icon-btn" id="dur-plus" style="background: var(--border-color); width: 30px; height: 30px;">+</button>
                    </div>
                </div>
                <div class="detail-row total-row">
                    <span class="label">Total</span>
                    <span class="value" id="total-price">Rs. ${(selectedLocationForBooking.pricePerHour * 2).toFixed(2)}</span>
                </div>

                <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                    <h4 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-primary);">Your Details</h4>
                    <div class="form-group">
                        <label for="book-name">Name</label>
                        <input type="text" id="book-name" class="form-control" placeholder="John Doe" required>
                    </div>
                    <div class="form-group">
                        <label for="book-phone">Phone Number</label>
                        <input type="tel" id="book-phone" class="form-control" placeholder="+1 (555) 000-0000" required>
                    </div>
                    <div class="form-group">
                        <label for="book-email">Email</label>
                        <input type="email" id="book-email" class="form-control" placeholder="john@example.com" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="book-address">Address</label>
                        <input type="text" id="book-address" class="form-control" placeholder="123 Main St, City" required>
                    </div>
                </div>
            </div>
        `;

        let duration = 2;
        const durVal = document.getElementById('dur-value');
        const totPrice = document.getElementById('total-price');
        
        document.getElementById('dur-minus').addEventListener('click', () => {
            if (duration > 1) {
                duration--;
                updateModalPrice(duration);
            }
        });
        
        document.getElementById('dur-plus').addEventListener('click', () => {
            if (duration < 24) {
                duration++;
                updateModalPrice(duration);
            }
        });

        function updateModalPrice(dur) {
            durVal.textContent = dur;
            totPrice.textContent = `Rs. ${(selectedLocationForBooking.pricePerHour * dur).toFixed(2)}`;
        }

        bookingModal.classList.remove('hidden');
    }

    function closeModal() {
        bookingModal.classList.add('hidden');
        selectedLocationForBooking = null;
    }

    function handleBookingConfirm() {
        if (!selectedLocationForBooking) return;
        
        const nameInput = document.getElementById('book-name');
        const phoneInput = document.getElementById('book-phone');
        const emailInput = document.getElementById('book-email');
        const addressInput = document.getElementById('book-address');

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const address = addressInput.value.trim();

        if (!name || !phone || !email || !address) {
            showToast('Please fill in all details.', 'error');
            return;
        }

        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        if (!nameRegex.test(name)) {
            showToast('Please enter a valid name (letters only, min 2 characters).', 'error');
            return;
        }

        const phoneRegex = /^((\+92)|(0092)|0)?3\d{2}[- ]?\d{7}$/;
        if (!phoneRegex.test(phone)) {
            showToast('Please enter a valid Pakistani mobile number.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        if (address.length < 5) {
            showToast('Please enter a valid address (min 5 characters).', 'error');
            return;
        }

        const duration = parseInt(document.getElementById('dur-value').textContent);
        const totalPrice = selectedLocationForBooking.pricePerHour * duration;

        Store.addBooking({
            locationId: selectedLocationForBooking.id,
            duration,
            totalPrice,
            customerDetails: {
                name,
                phone,
                email,
                address
            }
        });

        const locIndex = localLocations.findIndex(l => l.id === selectedLocationForBooking.id);
        if (locIndex > -1 && localLocations[locIndex].availableSpots > 0) {
            localLocations[locIndex].availableSpots--;
        }

        closeModal();
        showToast('Parking slot booked successfully!', 'success');
        updateBadges();
        
        if (currentView === 'home' || currentView === 'favorites') {
            renderCards();
        }
    }

    function handleBookingCancel(bookingId) {
        const booking = Store.getBookings().find(b => b.id === bookingId);
        if (booking) {
            const locIndex = localLocations.findIndex(l => l.id === booking.locationId);
            if (locIndex > -1) {
                localLocations[locIndex].availableSpots++;
            }
        }

        Store.cancelBooking(bookingId);
        showToast('Booking cancelled.', 'info');
        updateBadges();
        renderCards();
    }

    function updateBadges() {
        const favs = Store.getFavorites().length;
        const books = Store.getBookings().length;

        if (favs > 0) {
            favCount.textContent = favs;
            favCount.classList.remove('hidden');
        } else {
            favCount.classList.add('hidden');
        }

        if (books > 0) {
            bookCount.textContent = books;
            bookCount.classList.remove('hidden');
        } else {
            bookCount.classList.add('hidden');
        }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        } else if (type === 'error') {
            icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${icon} <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

});
