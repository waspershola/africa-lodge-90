import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				inter: ['Inter', 'sans-serif'],
				playfair: ['Playfair Display', 'serif'],
				sans: ['Inter', 'system-ui', 'sans-serif'],
				serif: ['Playfair Display', 'Georgia', 'serif'],
				// Luxury Hotel Fonts - Using high-quality Google Fonts alternatives
				'giveny': ['Crimson Text', 'Georgia', 'serif'], // Elegant serif similar to Giveny
				'didot': ['EB Garamond', 'Times New Roman', 'serif'], // High-fashion serif
				'bodoni': ['Bodoni Moda', 'Times New Roman', 'serif'], // Classic Italian serif
				'cormorant': ['Cormorant Garamond', 'Georgia', 'serif'], // Royal serif
				'playfair': ['Playfair Display', 'Georgia', 'serif'], // Modern chic serif
				'zabatana': ['Cinzel', 'Arial Black', 'sans-serif'], // Bold geometric display
				'coldiac': ['Libre Baskerville', 'Times New Roman', 'serif'], // Luxury serif
				'malligoe': ['Dancing Script', 'Brush Script MT', 'cursive'], // Script branding font
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					light: 'hsl(var(--accent-light))',
					muted: 'hsl(var(--accent-muted))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				danger: {
					DEFAULT: 'hsl(var(--danger))',
					foreground: 'hsl(var(--danger-foreground))'
				},
				'room-available': {
					DEFAULT: 'hsl(var(--room-available))',
					foreground: 'hsl(var(--room-available-foreground))'
				},
				'room-occupied': {
					DEFAULT: 'hsl(var(--room-occupied))',
					foreground: 'hsl(var(--room-occupied-foreground))'
				},
				'room-reserved': {
					DEFAULT: 'hsl(var(--room-reserved))',
					foreground: 'hsl(var(--room-reserved-foreground))'
				},
				'room-overstay': {
					DEFAULT: 'hsl(var(--room-overstay))',
					foreground: 'hsl(var(--room-overstay-foreground))'
				},
				'room-oos': {
					DEFAULT: 'hsl(var(--room-oos))',
					foreground: 'hsl(var(--room-oos-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-accent': 'var(--gradient-accent)', 
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'luxury': 'var(--shadow-luxury)',
				'card': 'var(--shadow-card)',
				'accent': 'var(--shadow-accent)',
				'subtle': 'var(--shadow-subtle)',
				'hover': 'var(--shadow-hover)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
