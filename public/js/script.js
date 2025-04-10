document.addEventListener('DOMContentLoaded', event => {

    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        // Uncomment Below to persist sidebar toggle between refreshes
        // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        //     document.body.classList.toggle('sb-sidenav-toggled');
        // }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.getElementById('wrapper').classList.toggle('toggled');
            // Uncomment Below to persist sidebar toggle between refreshes
            // localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }

    // Bootstrap form validation
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation');

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }

            form.classList.add('was-validated');
        }, false);
    });

    // Confirmation Modal Logic
    const confirmDeleteModalElement = document.getElementById('confirmDeleteModal');
    if (confirmDeleteModalElement) {
        const confirmDeleteModal = new bootstrap.Modal(confirmDeleteModalElement);
        const confirmDeleteButton = document.getElementById('confirmDeleteButton');
        let formToSubmit = null;

        // Find all delete forms and attach listener to their submit buttons
        document.querySelectorAll('form.delete-form').forEach(form => {
            form.addEventListener('submit', function(event) {
                event.preventDefault(); // Prevent default form submission
                formToSubmit = this; // Store the form that triggered the modal
                confirmDeleteModal.show(); // Show the modal
            });
        });

        // When the modal's delete button is clicked, submit the stored form
        confirmDeleteButton.addEventListener('click', function() {
            if (formToSubmit) {
                formToSubmit.submit(); // Submit the original form
            }
        });
    }

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const moonIcon = darkModeToggle ? darkModeToggle.querySelector('.fa-moon') : null;
    const sunIcon = document.createElement('i'); // Create sun icon dynamically
    sunIcon.className = 'fas fa-sun';

    // Function to set mode
    const setMode = (isDark) => {
        if (isDark) {
            body.classList.add('dark-mode');
            if (moonIcon) darkModeToggle.replaceChild(sunIcon, moonIcon); // Swap icon
            localStorage.setItem('darkMode', 'enabled');
        } else {
            body.classList.remove('dark-mode');
             if (darkModeToggle && sunIcon.parentNode === darkModeToggle) { // Check if sun icon is active
                darkModeToggle.replaceChild(moonIcon, sunIcon); // Swap icon back
             }
            localStorage.setItem('darkMode', 'disabled');
        }
    };

    // Check localStorage on load
    if (localStorage.getItem('darkMode') === 'enabled') {
        setMode(true);
    } else {
        // Ensure moon icon is present initially if not dark mode
         if (darkModeToggle && !body.classList.contains('dark-mode') && sunIcon.parentNode === darkModeToggle) {
             darkModeToggle.replaceChild(moonIcon, sunIcon);
         }
    }

    // Add event listener
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            setMode(!body.classList.contains('dark-mode'));
        });
    }

}); 