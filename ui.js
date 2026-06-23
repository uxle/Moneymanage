const UI = (() => {
    let toastTimeout;
    const dom = {};

    const init = () => {
        dom.html = document.documentElement;
        dom.themeIcon = document.querySelector('#theme-toggle i');
        dom.toast = document.getElementById('toast');
        dom.toastMsg = document.getElementById('toast-msg');
        dom.toastIcon = document.getElementById('toast-icon');

        // Accessibility & UX: Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) activeModal.classList.remove('active');
            }
        });
    };

    const toggleTheme = () => {
        const current = dom.html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        dom.html.setAttribute('data-theme', next);
        
        if (dom.themeIcon) {
            dom.themeIcon.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
            if (window.lucide) window.lucide.createIcons();
        }
        
        const data = Storage.get();
        if (!data.settings) data.settings = {};
        data.settings.theme = next;
        Storage.save(data);
    };

    const applySavedTheme = () => {
        const data = Storage.get();
        const theme = data.settings?.theme || 'light';
        dom.html.setAttribute('data-theme', theme);
        if (dom.themeIcon) {
            dom.themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
        }
    };

    const showToast = (msg, type = 'success') => {
        if (!dom.toast) return;
        
        dom.toastMsg.textContent = msg;
        if (dom.toastIcon) {
            dom.toastIcon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle');
            if (window.lucide) window.lucide.createIcons({ root: dom.toast });
        }
        
        // Force reflow for reliable animation restart
        dom.toast.classList.remove('show');
        void dom.toast.offsetWidth; 
        dom.toast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            dom.toast.classList.remove('show');
        }, 3000);
    };

    const openModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            // Ensure first input is focused for a11y (safely)
            const firstInput = modal.querySelector('input:not([type="hidden"])');
            if (firstInput) setTimeout(() => firstInput.focus(), 100);
        }
    };

    const closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    };

    return { init, toggleTheme, applySavedTheme, showToast, openModal, closeModal };
})();