export const componentInventory = {
    shadcn: {
        foundation: [
            'button', 'card', 'input', 'label', 'textarea', 'select', 'checkbox',
            'badge', 'avatar', 'alert', 'dialog', 'separator', 'tabs'
        ],
        forms: [
            'radio-group', 'switch', 'combobox', 'input-otp', 'toggle-group',
            'context-menu', 'menubar', 'navigation-menu', 'slider', 'hover-card'
        ],
        data: [
            'data-table', 'pagination', 'progress', 'skeleton', 'scroll-area',
            'carousel', 'chart', 'spinner'
        ],
        layout: [
            'sheet', 'drawer', 'collapsible', 'accordion', 'alert-dialog', 'sonner'
        ],
        blocks: [
            'sidebar-08', 'sidebar-16', 'login-04', 'signup-01',
            'calendar-31', 'calendar-12', 'calendar-07'
        ]
    },
    magicui: [
        'animated-circular-progress-bar', 'ripple', 'scroll-progress', 'animated-shiny-text',
        'animated-list', 'progressive-blur', 'animated-theme-toggler', 'avatar-circles',
        'interactive-hover-button', 'pulsating-button', 'rainbow-button', 'ripple-button', 'shimmer-button', 'shiny-button',
        'border-beam', 'magic-card', 'shine-border',
        'morphing-text', 'sparkles-text', 'text-animate', 'typing-animation', 'video-text', 'animated-gradient-text',
        'animated-beam', 'aurora-text', 'bento-grid', 'confetti', 'dock', 'globe', 'highlighter', 'marquee', 'orbiting-circles', 'scroll-based-velocity', 'tweet-card', 'warp-background'
    ],
    cultui: [
        'expandable', 'expandable-screen', 'popover-form', 'popover',
        'feature-carousel', 'three-d-carousel', 'timer', 'canvas-fractal-grid',
        'texture-card', 'sortable-list', 'dock'
    ],
    reactbits: [
        'SplitText', 'ShinyText', 'GradientText', 'TrueFocus', 'RotatingText',
        'ElectricBorder', 'LaserFlow', 'GhostCursor', 'SplashCursor',
        'AnimatedList', 'ScrollStack', 'Stepper', 'Dock',
        'CircularGallery', 'TiltedCard', 'DomeGallery', 'ProfileCard', 'SpotlightCard', 'MagicBento', 'ChromaGrid', 'Lanyard',
        'Orb'
    ]
}

export function getComponentCount() {
    const shadcnCount = Object.values(componentInventory.shadcn).flat().length
    const magicuiCount = componentInventory.magicui.length
    const cultuiCount = componentInventory.cultui.length
    const reactbitsCount = componentInventory.reactbits.length

    return {
        total: shadcnCount + magicuiCount + cultuiCount + reactbitsCount,
        shadcn: shadcnCount,
        magicui: magicuiCount,
        cultui: cultuiCount,
        reactbits: reactbitsCount
    }
}
