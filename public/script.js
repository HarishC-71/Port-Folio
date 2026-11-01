// Scroll reveal animation and active navigation highlight
document.addEventListener('DOMContentLoaded', () => {

    /* ========= THEME TOGGLE (Light / Dark Mode) ========= */
    const themeInput = document.getElementById('themeToggleInput');
    const root = document.documentElement;

    // Apply saved theme (default = light mode)
    const savedTheme = localStorage.getItem('portfolioTheme') || 'light';
    if (savedTheme === 'light') {
        root.classList.add('light-mode');
        themeInput.checked = true;
    } else {
        root.classList.remove('light-mode');
        themeInput.checked = false;
    }

    themeInput.addEventListener('change', () => {
        if (themeInput.checked) {
            root.classList.add('light-mode');
            localStorage.setItem('portfolioTheme', 'light');
        } else {
            root.classList.remove('light-mode');
            localStorage.setItem('portfolioTheme', 'dark');
        }
    });

    /* ======================================================= */

    // Header styling on scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('bx-menu');
            icon.classList.add('bx-x');
        } else {
            icon.classList.remove('bx-x');
            icon.classList.add('bx-menu');
        }
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.remove('bx-x');
            icon.classList.add('bx-menu');
        });
    });

    // Add reveal class to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(sec => sec.classList.add('reveal'));

    // Intersection Observer for scroll animations
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add('active');
            // Stop observing once revealed
            observer.unobserve(entry.target);
        });
    }, revealOptions);

    sections.forEach(section => {
        revealOnScroll.observe(section);
    });

    // Update active link on scroll
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Add an offset to highlight links earlier
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    /* --- Interactive Extravaganza --- */

    // 1. Scroll Progress Bar
    const scrollProgress = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const totalScroll = document.documentElement.scrollTop;
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollData = `${totalScroll / windowHeight * 100}%`;
        scrollProgress.style.width = scrollData;
    });

    // 2. Custom Cursor
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    window.addEventListener('mousemove', function (e) {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Slight delay on the outline for a smooth trailing effect
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Cursor hover animations for links and buttons
    const hoverElements = document.querySelectorAll('a, button, .menu-toggle');
    hoverElements.forEach(elem => {
        elem.addEventListener('mouseenter', () => {
            cursorOutline.style.width = '50px';
            cursorOutline.style.height = '50px';
            cursorOutline.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
        });
        elem.addEventListener('mouseleave', () => {
            cursorOutline.style.width = '30px';
            cursorOutline.style.height = '30px';
            cursorOutline.style.backgroundColor = 'transparent';
        });
    });

    // 3. Typing Effect
    const typedTextSpan = document.querySelector(".typed-text");
    const cursorSpan = document.querySelector(".cursor-blink");

    const textArray = ["AI & Data Science Student", "Machine Learning Enthusiast", "Innovative Developer", "Problem Solver"];
    const typingDelay = 100;
    const erasingDelay = 50;
    const newTextDelay = 2000; // Delay between current and next text
    let textArrayIndex = 0;
    let charIndex = 0;

    function type() {
        if (charIndex < textArray[textArrayIndex].length) {
            if (!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
            typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingDelay);
        } else {
            cursorSpan.classList.remove("typing");
            setTimeout(erase, newTextDelay);
        }
    }

    function erase() {
        if (charIndex > 0) {
            if (!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
            typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, erasingDelay);
        } else {
            cursorSpan.classList.remove("typing");
            textArrayIndex++;
            if (textArrayIndex >= textArray.length) textArrayIndex = 0;
            setTimeout(type, typingDelay + 1100);
        }
    }

    // Start the typing effect on load
    if (textArray.length) setTimeout(type, newTextDelay + 250);

    // Contact form backend logic
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            submitBtn.innerHTML = 'Sending... <i class="bx bx-loader-alt bx-spin"></i>';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const result = await response.json();

                if (response.ok) {
                    if (result.emailSent === false) {
                        // Excel saved but email failed — show a distinct warning
                        alert('⚠️ ' + (result.message || 'Your message was saved, but the email notification could not be sent. The owner will check records manually.'));
                    } else {
                        alert('✅ ' + (result.message || 'Message sent successfully!'));
                    }
                    contactForm.reset();
                } else {
                    alert(result.error || 'Failed to send message.');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                
                // If it's a fetch error, it usually means the server is down or unreachable
                const helpMsg = window.location.protocol === 'file:' 
                    ? '\n\nTip: You opened index.html as a file. Access it through http://localhost:3000 instead.' 
                    : '\n\nMake sure "node server.js" is running in your terminal.';
                
                alert('Connection error! Could not reach the server.' + helpMsg);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    /* --- Advanced Project Slider & Interactive Controls --- */
    const sliderContainer = document.querySelector('.slider-container');
    const slidesContainer = document.querySelector('.slides');
    const slideCards = document.querySelectorAll('.slide-card');
    const nextBtn = document.querySelector('.slider-btn.next');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const dotsContainer = document.querySelector('.slider-dots');
    
    let currentSlide = 0;
    let autoSlideInterval;

    function getVisibleCards() {
        if (window.innerWidth > 1024) return 3;
        if (window.innerWidth > 600) return 2;
        return 1;
    }

    function getMaxSlides() {
        return Math.max(0, slideCards.length - getVisibleCards());
    }

    function rebuildDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const maxSlides = getMaxSlides();
        const totalDots = maxSlides + 1;
        
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === currentSlide) dot.classList.add('active');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    function updateSlider() {
        if (!slideCards.length || !slidesContainer) return;
        const maxSlides = getMaxSlides();
        if (currentSlide > maxSlides) {
            currentSlide = maxSlides;
        }
        const cardWidth = slideCards[0].offsetWidth + 30; // width + gap
        slidesContainer.style.transform = `translateX(${-currentSlide * cardWidth}px)`;
        
        // Update dots
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }

        // Adjust button opacity when sliding is not possible
        if (nextBtn && prevBtn) {
            if (maxSlides === 0) {
                nextBtn.style.opacity = '0.5';
                prevBtn.style.opacity = '0.5';
            } else {
                nextBtn.style.opacity = '1';
                prevBtn.style.opacity = '1';
            }
        }
    }

    function goToSlide(index) {
        const maxIndex = getMaxSlides();
        if (maxIndex === 0) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = maxIndex;
        } else if (index > maxIndex) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }
        
        updateSlider();
        resetAutoSlide();
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
        });
    }

    // Touch swipe support for mobile and tablets
    if (slidesContainer) {
        let touchStartX = 0;
        let touchEndX = 0;

        slidesContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            clearInterval(autoSlideInterval);
        }, { passive: true });

        slidesContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 40) {
                if (diff > 0) {
                    goToSlide(currentSlide + 1);
                } else {
                    goToSlide(currentSlide - 1);
                }
            } else {
                resetAutoSlide();
            }
        }, { passive: true });
    }

    function startAutoSlide() {
        if (getMaxSlides() === 0) return;
        autoSlideInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        sliderContainer.addEventListener('mouseleave', () => resetAutoSlide());
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            rebuildDots();
            updateSlider();
        }, 100);
    });
    
    // Initialize slider
    rebuildDots();
    updateSlider();
    startAutoSlide();

    /* --- Image Fallback & Smooth Display --- */
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            console.warn('Image failed to load:', this.src);
            const parentCardImg = this.closest('.card-img');
            if (parentCardImg && !parentCardImg.querySelector('.img-fallback')) {
                this.style.display = 'none';
                const picture = this.closest('picture');
                if (picture) picture.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'img-fallback';
                fallback.innerHTML = `<i class='bx bx-image-alt'></i><span>${this.alt || 'Project Preview'}</span>`;
                parentCardImg.appendChild(fallback);
            }
        });
    });

    /* --- Toast Notification for In-Progress Demos --- */
    function showToast(message) {
        let toast = document.querySelector('.toast-notice');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notice';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class='bx bx-info-circle'></i><span>${message}</span>`;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }

    /* --- Prevent empty '#' demo links from scrolling page --- */
    document.querySelectorAll('.view-link').forEach(link => {
        if (link.getAttribute('href') === '#') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Live demo coming soon! Check out the GitHub repository in the meantime.');
            });
        }
    });
});