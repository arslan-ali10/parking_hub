const STORE_KEYS = {
    FAVORITES: 'ph_favorites',
    BOOKINGS: 'ph_bookings'
};

class Store {
    static getFavorites() {
        const favs = localStorage.getItem(STORE_KEYS.FAVORITES);
        return favs ? JSON.parse(favs) : [];
    }

    static toggleFavorite(id) {
        const favs = this.getFavorites();
        const index = favs.indexOf(id);
        if (index > -1) {
            favs.splice(index, 1);
        } else {
            favs.push(id);
        }
        localStorage.setItem(STORE_KEYS.FAVORITES, JSON.stringify(favs));
        return favs;
    }

    static isFavorite(id) {
        return this.getFavorites().includes(id);
    }

    static getBookings() {
        const bookings = localStorage.getItem(STORE_KEYS.BOOKINGS);
        return bookings ? JSON.parse(bookings) : [];
    }

    static addBooking(bookingData) {
        const bookings = this.getBookings();
        bookings.push({
            ...bookingData,
            id: 'bk_' + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString()
        });
        localStorage.setItem(STORE_KEYS.BOOKINGS, JSON.stringify(bookings));
        return bookings;
    }

    static cancelBooking(bookingId) {
        let bookings = this.getBookings();
        bookings = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem(STORE_KEYS.BOOKINGS, JSON.stringify(bookings));
        return bookings;
    }

}

window.appStore = Store;
