# Luke Baffait Animation Guide
## Complete Implementation for Custom Web Animations

---

## 1. SETUP & INSTALLATION

### Required Libraries
```bash
npm install gsap lenis barba.js
# Or include via CDN:
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lenis@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@barba/core"></script>
```

### Initial Setup (JavaScript)
```javascript
// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)
```

---

## 2. ANIMATION PATTERNS

### PATTERN 1: Hero Text Entrance
**What it does:** Text fades in and slides up on page load

**HTML:**
```html
<h1 class="hero-title">Luke Baffait — Creative Developer</h1>
<p class="hero-subtitle">Créatif discret, je donne vie aux idées</p>
```

**CSS:**
```css
.hero-title {
  opacity: 0;
  transform: translateY(30px);
}

.hero-subtitle {
  opacity: 0;
  transform: translateY(30px);
}
```

**JavaScript (GSAP):**
```javascript
gsap.timeline()
  .from('.hero-title', {
    duration: 0.8,
    opacity: 0,
    y: 30,
    ease: 'power2.out'
  })
  .from('.hero-subtitle', {
    duration: 0.8,
    opacity: 0,
    y: 30,
    ease: 'power2.out'
  }, '-=0.4') // Start before previous animation ends
```

**Animation Details:**
- Duration: 800ms (0.8s)
- Easing: power2.out (smooth deceleration)
- Y-movement: 30px upward
- Stagger: 400ms between elements

---

### PATTERN 2: Scroll Reveal (Fade-in on Scroll)
**What it does:** Elements fade in as user scrolls to them

**HTML:**
```html
<section class="skill-card">
  <h3>Frontend Development</h3>
  <p>HTML, CSS, JavaScript, React...</p>
</section>
```

**CSS:**
```css
.skill-card {
  opacity: 0;
  transform: translateY(40px);
}
```

**JavaScript:**
```javascript
gsap.utils.toArray('.skill-card').forEach((card) => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: 'top 80%',      // Start when element is 80% down viewport
      end: 'top 50%',        // End when element reaches 50% viewport
      scrub: false,          // Smooth but not linked to scroll
      markers: false         // Set true for debugging
    },
    duration: 0.8,
    opacity: 0,
    y: 40,
    ease: 'power2.out'
  })
})
```

**Animation Details:**
- Triggers when element enters viewport
- Smooth fade + slide up motion
- Each element animates independently

---

### PATTERN 3: Project Card Hover
**What it does:** Image scales and content appears on hover

**HTML:**
```html
<div class="project-card">
  <div class="project-image">
    <img src="project.jpg" alt="Project">
  </div>
  <div class="project-content">
    <h3>CyberDiag</h3>
  </div>
</div>
```

**CSS:**
```css
.project-image {
  overflow: hidden;
  border-radius: 8px;
}

.project-image img {
  transform: scale(1);
  transition: transform 0.6s ease;
}

.project-card:hover .project-image img {
  transform: scale(1.05);
}

.project-content {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease;
}

.project-card:hover .project-content {
  opacity: 1;
  transform: translateY(0);
}
```

**JavaScript (Optional GSAP Enhancement):**
```javascript
document.querySelectorAll('.project-card').forEach((card) => {
  const image = card.querySelector('.project-image img')
  const content = card.querySelector('.project-content')
  
  card.addEventListener('mouseenter', () => {
    gsap.to(image, { scale: 1.08, duration: 0.6, ease: 'power2.out' })
    gsap.to(content, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
  })
  
  card.addEventListener('mouseleave', () => {
    gsap.to(image, { scale: 1, duration: 0.6, ease: 'power2.out' })
    gsap.to(content, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
  })
})
```

**Animation Details:**
- Image zoom: 1 → 1.08 scale
- Content fade + slide: 0 to 1 opacity, -20px to 0 position
- Duration: 600ms
- Easing: power2.out (smooth deceleration)

---

### PATTERN 4: Page Transitions (Barba.js)
**What it does:** Smooth fade between page changes

**HTML (Keep same across pages):**
```html
<div id="barba-wrapper">
  <div class="barba-container">
    <!-- Page content here -->
  </div>
</div>
```

**JavaScript:**
```javascript
barba.init({
  prevent: {
    all: () => false
  }
})

barba.hooks.before((data) => {
  console.log('Transition starting...')
})

barba.hooks.after((data) => {
  console.log('Transition complete')
  // Reinitialize animations on new page
  initializeAnimations()
})

// Transition animation
barba.transitions.create({
  name: 'fade',
  leave(data) {
    return gsap.to(data.current.container, {
      duration: 0.6,
      opacity: 0,
      ease: 'power2.inOut'
    })
  },
  enter(data) {
    return gsap.from(data.next.container, {
      duration: 0.6,
      opacity: 0,
      ease: 'power2.inOut'
    })
  }
})
```

**Animation Details:**
- Fade out current page: 600ms
- Fade in new page: 600ms
- Opacity: 1 → 0 → 1
- Easing: power2.inOut (smooth both directions)

---

### PATTERN 5: Staggered List Animation
**What it does:** List items animate in sequence

**HTML:**
```html
<ul class="skills-list">
  <li class="skill-item">HTML</li>
  <li class="skill-item">CSS</li>
  <li class="skill-item">JavaScript</li>
  <li class="skill-item">React</li>
</ul>
```

**CSS:**
```css
.skill-item {
  opacity: 0;
  transform: translateX(-20px);
}
```

**JavaScript:**
```javascript
gsap.from('.skill-item', {
  duration: 0.6,
  opacity: 0,
  x: -20,
  stagger: 0.1,  // 100ms delay between each item
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '.skills-list',
    start: 'top 80%'
  }
})
```

**Animation Details:**
- Each item slides in from left
- Staggered: 100ms between each
- Total duration for full list: 600ms + (3 × 100ms) = 900ms

---

### PATTERN 6: Number Counter Animation
**What it does:** Numbers count up from 0

**HTML:**
```html
<div class="stat">
  <span class="counter" data-target="150">0</span>
  <p>Projects Completed</p>
</div>
```

**JavaScript:**
```javascript
gsap.utils.toArray('.counter').forEach((counter) => {
  const target = parseInt(counter.dataset.target)
  
  gsap.to(counter, {
    scrollTrigger: {
      trigger: counter,
      start: 'top 80%'
    },
    duration: 2,
    innerText: target,
    snap: { innerText: 1 },  // Snap to integers
    ease: 'power2.out'
  })
})
```

**Animation Details:**
- Duration: 2 seconds
- Easing: power2.out
- Triggers on scroll

---

### PATTERN 7: Parallax Scroll Effect
**What it does:** Background moves slower than foreground

**HTML:**
```html
<section class="parallax-section">
  <div class="parallax-bg" style="background-image: url('bg.jpg')"></div>
  <div class="parallax-content">
    <h2>Content Here</h2>
  </div>
</section>
```

**CSS:**
```css
.parallax-section {
  position: relative;
  overflow: hidden;
  height: 600px;
}

.parallax-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  background-size: cover;
  background-position: center;
}

.parallax-content {
  position: relative;
  z-index: 1;
  padding: 100px 20px;
}
```

**JavaScript:**
```javascript
gsap.to('.parallax-bg', {
  scrollTrigger: {
    trigger: '.parallax-section',
    start: 'top top',
    end: 'bottom top',
    scrub: 1  // Smoothly link to scrollbar
  },
  y: 100,
  ease: 'none'
})
```

**Animation Details:**
- Background moves 100px down
- Linked to scroll position (scrub: 1)
- Creates depth effect

---

## 3. ACCESSIBILITY CONSIDERATIONS

### Respect prefers-reduced-motion
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0)  // Disable all animations
  // OR set all durations to 0.1
}
```

### Ensure Focus States
```css
a:focus-visible,
button:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```

### Color Contrast
- Text: #ffffff on #000000 = 21:1 contrast ✓
- Secondary: #f0f0f0 on #0a0a0a = 18:1 contrast ✓

---

## 4. RESPONSIVE ANIMATIONS

```javascript
// Adjust animations for mobile
const isDesktop = window.innerWidth > 768

if (!isDesktop) {
  // Reduce animation complexity on mobile
  gsap.to('.element', {
    duration: 0.4,  // Faster on mobile
    // ... other props
  })
}

// Resize handling
window.addEventListener('resize', () => {
  ScrollTrigger.refresh()
})
```

---

## 5. PERFORMANCE OPTIMIZATION

### Use will-change for animations
```css
.animated-element {
  will-change: transform, opacity;
}

/* Remove after animation */
.animated-element.done {
  will-change: auto;
}
```

### GPU Acceleration
```javascript
gsap.to('.element', {
  duration: 1,
  x: 100,
  force3D: true  // Use GPU when possible
})
```

### Limit simultaneous animations
```javascript
// Use timeline to manage many animations
const timeline = gsap.timeline()

timeline
  .from('.item1', { opacity: 0, duration: 0.5 })
  .from('.item2', { opacity: 0, duration: 0.5 }, '-=0.3')
  .from('.item3', { opacity: 0, duration: 0.5 }, '-=0.3')
```

---

## 6. TESTING CHECKLIST

### Functional Tests
- [ ] All animations trigger on correct events
- [ ] Animations complete smoothly without jumps
- [ ] No animation lag on page scroll
- [ ] Page transitions work without visual glitches

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Animations respect prefers-reduced-motion
- [ ] Text contrast meets WCAG AA

### Performance Tests
- [ ] Animations at 60fps (Chrome DevTools → Performance)
- [ ] No memory leaks on repeated animations
- [ ] Mobile performance acceptable (60fps)
- [ ] No layout shifts during animations

### Browser Tests
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (iOS/macOS)
- [ ] Mobile browsers

---

## 7. COMMON EASING FUNCTIONS

```javascript
// Recommended easings for different animations
'power1.out'    // Subtle, natural feel
'power2.out'    // Smooth deceleration (most used)
'power3.out'    // More dramatic deceleration
'elastic.out'   // Bouncy effect
'back.out'      // Slight overshoot
'sine.inOut'    // Very smooth, subtle
'circ.out'      // Fast start, smooth end
```

---

## 8. ANIMATION TIMING RECOMMENDATIONS

```javascript
// Based on Luke Baffait's style

// Page Load
Hero text: 0.8s (power2.out)
Stagger between elements: 0.4s

// Scroll Reveal
Fade-in distance: 40px
Duration: 0.8s
Trigger: 80% down viewport

// Hover Effects
Duration: 0.6s
Scale amount: 1.05-1.08x
Transform distance: 20px

// Page Transitions
Fade duration: 0.6s
Transition timing: sequential (out → in)

// Smooth Scroll
Lenis duration: 1.2s
Easing: custom ease function
```

---

## 9. COMMON MISTAKES TO AVOID

❌ **Don't:**
- Use animations longer than 1 second for interactions
- Forget to register GSAP plugins (ScrollTrigger)
- Animate without considering mobile performance
- Skip accessibility considerations
- Use transform: all (specify exact properties)
- Trigger too many animations simultaneously

✅ **Do:**
- Keep animations under 1 second for interactions
- Test on multiple browsers and devices
- Use transform/opacity for smooth animations
- Always test with keyboard navigation
- Refresh ScrollTrigger on resize
- Use will-change sparingly

---

## 10. QUICK START CODE TEMPLATE

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background: #000000;
      color: #ffffff;
      font-family: 'Breton', sans-serif;
      font-size: 16.64px;
      line-height: 36.608px;
    }
    
    .fade-in {
      opacity: 0;
      transform: translateY(30px);
    }
  </style>
</head>
<body>
  <h1 class="fade-in">Welcome</h1>
  <p class="fade-in">Your content here</p>
  
  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@latest"></script>
  
  <script>
    gsap.registerPlugin(ScrollTrigger)
    
    const lenis = new Lenis()
    
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    
    gsap.from('.fade-in', {
      duration: 0.8,
      opacity: 0,
      y: 30,
      stagger: 0.2,
      ease: 'power2.out'
    })
  </script>
</body>
</html>
```

---

## SUMMARY

**Your animation toolkit:**
- GSAP: Precise, performant animations
- Lenis: Smooth scrolling
- ScrollTrigger: Scroll-based animations
- Barba.js: Page transitions
- CSS: Basic hover/transitions

**Key principles:**
- Keep animations under 1 second
- Use power2.out easing for natural feel
- Always consider accessibility
- Test on mobile devices
- Optimize for 60fps performance

Start with Pattern 1 & 2, then add others as needed!
