class AnimFlow {
    constructor(options = {}) {
        this.options = {
            offset: options.offset || 100,
            delay: options.delay || 0,
            duration: options.duration || 1000,
            easing: options.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
            once: false,
            mirror: true,
            stagger: options.stagger || 200,
            threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3],
            drawDuration: options.drawDuration || 1500
        };

        this.animatedElements = new Map();
        this.groups = new Map();
        this.init();
    }

    init() {
        console.log('Initializing AnimFlow...');
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    console.log(`Observing element: ${entry.target.getAttribute('data-anim')}, isIntersecting: ${entry.isIntersecting}, ratio: ${entry.intersectionRatio}`);
                    this.handleIntersection(entry);
                });
            },
            {
                threshold: this.options.threshold,
                rootMargin: '100px 0px'
            }
        );

        // Initialize all elements
        document.querySelectorAll('[data-anim]').forEach(element => {
            const effect = element.getAttribute('data-anim');
            const groupName = element.getAttribute('data-anim-group');

            // Setup delay and duration
            if (element.hasAttribute('data-anim-delay')) {
                element.style.setProperty('--anim-delay', `${element.getAttribute('data-anim-delay')}ms`);
            }
            if (element.hasAttribute('data-anim-duration')) {
                element.style.setProperty('--anim-duration', `${element.getAttribute('data-anim-duration')}ms`);
            }

            // Setup groups
            if (groupName) {
                if (!this.groups.has(groupName)) {
                    this.groups.set(groupName, []);
                }
                this.groups.get(groupName).push(element);
            }

            // Setup elements based on type
            if (effect === 'draw-path') {
                this.setupSVGPath(element);
            } else {
                this.setupElement(element, effect);
            }
        });

        // Monitor scroll for parallax
        if (document.querySelector('[data-anim="parallax"]')) {
            window.addEventListener('scroll', () => this.handleScroll());
        }

        console.log('AnimFlow initialization complete!');
    }

    setupElement(element, effect) {
        // Set initial state
        element.style.opacity = '0';
        
        // Add transition
        const duration = element.getAttribute('data-anim-duration') || this.options.duration;
        element.style.transition = `transform ${duration}ms ${this.options.easing}, opacity ${duration}ms ${this.options.easing}`;

        // Set initial transform based on effect
        switch (effect) {
            case 'scale-bounce':
                element.style.transform = 'scale(0.8)';
                break;
            case 'slide-in':
                element.style.transform = 'translateY(50px)';
                break;
            case 'fade-in':
                element.style.transform = 'translateY(20px)';
                break;
            default:
                element.style.transform = 'translateY(20px)';
        }

        // Store element info
        this.animatedElements.set(element, {
            animated: false,
            effect: effect
        });

        // Start observation
        this.observer.observe(element);
        console.log(`Element initialized: ${effect}`);
    }

    setupSVGPath(path) {
        if (!path) return;

        try {
            const length = path.getTotalLength ? path.getTotalLength() : 1000;
            
            // Set initial state
            path.style.strokeDasharray = `${length}`;
            path.style.strokeDashoffset = `${length}`;
            path.style.opacity = '1';
            
            // Add transition
            const duration = path.getAttribute('data-anim-duration') || this.options.drawDuration;
            path.style.transition = `stroke-dashoffset ${duration}ms ${this.options.easing}`;

            // Store path info
            this.animatedElements.set(path, {
                animated: false,
                effect: 'draw-path',
                length: length
            });

            // Start observation
            this.observer.observe(path);
            console.log('SVG path initialized');
        } catch (error) {
            console.error('Error initializing SVG path:', error);
        }
    }

    handleIntersection(entry) {
        const element = entry.target;
        const elementData = this.animatedElements.get(element);
        
        if (!elementData) return;

        const effect = elementData.effect;
        const groupName = element.getAttribute('data-anim-group');

        if (entry.isIntersecting) {
            // Apply effect
            requestAnimationFrame(() => {
                switch (effect) {
                    case 'draw-path':
                        element.style.strokeDashoffset = '0';
                        break;
                    case 'scale-bounce':
                        element.style.transform = 'scale(1)';
                        element.style.opacity = '1';
                        break;
                    case 'slide-in':
                        element.style.transform = 'translateY(0)';
                        element.style.opacity = '1';
                        break;
                    case 'fade-in':
                        element.style.opacity = '1';
                        element.style.transform = 'none';
                        break;
                    default:
                        element.style.opacity = '1';
                        element.style.transform = 'none';
                }

                // Apply group delay
                if (groupName && this.groups.has(groupName)) {
                    const groupElements = this.groups.get(groupName);
                    const index = groupElements.indexOf(element);
                    if (index !== -1) {
                        element.style.transitionDelay = `${index * this.options.stagger}ms`;
                    }
                }
            });

            elementData.animated = true;
            console.log(`Effect activated: ${effect}`);
        } else {
            // Reset effect
            requestAnimationFrame(() => {
                switch (effect) {
                    case 'draw-path':
                        element.style.strokeDashoffset = `${elementData.length}`;
                        break;
                    case 'scale-bounce':
                        element.style.transform = 'scale(0.8)';
                        element.style.opacity = '0';
                        break;
                    case 'slide-in':
                        element.style.transform = 'translateY(50px)';
                        element.style.opacity = '0';
                        break;
                    case 'fade-in':
                        element.style.opacity = '0';
                        element.style.transform = 'translateY(20px)';
                        break;
                    default:
                        element.style.opacity = '0';
                        element.style.transform = 'translateY(20px)';
                }
            });

            elementData.animated = false;
            console.log(`Effect reset: ${effect}`);
        }
    }

    handleScroll() {
        document.querySelectorAll('[data-anim="parallax"]').forEach(element => {
            const rect = element.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            
            if (rect.top < viewHeight && rect.bottom > 0) {
                const scrolled = (viewHeight - rect.top) / (viewHeight + rect.height);
                const translateY = scrolled * this.options.offset;
                element.style.transform = `translateY(${translateY}px)`;
            }
        });
    }
}

// Initialize on load if window exists (browser environment)
if (typeof window !== 'undefined') {
    window.AnimFlow = AnimFlow;
}