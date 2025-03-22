# Styling Architecture Documentation

This document outlines the styling architecture used in the CoreProject application. Following this structure will help maintain consistency and scalability across the project.

## Directory Structure

```
src/
├── styles/
│   ├── _variables.scss   # Global variables (colors, spacing, etc.)
│   ├── _mixins.scss      # Reusable SCSS functions and mixins
│   ├── _utilities.scss   # Utility classes
│   └── README.md         # This documentation file
├── styles.scss           # Main styles entry point
```

## How to Use

### In Component SCSS Files

Import only what you need in each component:

```scss
// Import variables and mixins
@import 'variables';
@import 'mixins';

// Component-specific styles
.my-component {
  background-color: $primary-color;
  padding: $spacer;

  .title {
    @include heading-2;
  }

  .button {
    @include button-primary;
  }

  @include respond-to('mobile') {
    padding: $spacer-2;
  }
}
```

### Using Utility Classes in Templates

Utility classes are imported in the global styles.scss file and can be used directly in your HTML templates:

```html

My Component
Action

```

## Design System Overview

### Colors

Primary colors:
- `$primary-color`: #4a90e2 - Main brand color
- `$secondary-color`: #2c3e50 - Secondary brand color
- `$accent-color`: #e74c3c - Accent color for CTAs

Semantic colors:
- `$success-color`: #2ecc71 - Success states and positive actions
- `$warning-color`: #f39c12 - Warning states and cautions
- `$danger-color`: #e74c3c - Error states and destructive actions
- `$info-color`: #3498db - Informational states and actions

Neutral colors:
- `$light-color`: #f8f9fa - Light backgrounds
- `$dark-color`: #343a40 - Dark text and backgrounds
- `$text-color`: #333 - Default text color
- `$border-color`: #dee2e6 - Border colors

### Typography

- Base font: System font stack
- Base size: 16px
- Line height: 1.5
- Headings: 1.2 line height

### Spacing

Spacing follows a consistent scale:
- `$spacer-1`: 0.25rem (4px)
- `$spacer-2`: 0.5rem (8px)
- `$spacer-3`: 1rem (16px)
- `$spacer-4`: 1.5rem (24px)
- `$spacer-5`: 3rem (48px)

### Breakpoints

- Mobile: up to 576px
- Tablet: 577px to 768px
- Medium: 769px to 992px
- Large: 993px to 1200px
- Extra Large: 1201px and above

### Components

Common UI components use predefined mixins:
- Buttons: `@include button-primary` or `@include button-secondary`
- Cards: `@include card`
- Typography: `@include heading-1` through `@include heading-3`

## Best Practices

1. **Use variables for consistency**: Always use the defined variables for colors, spacing, and typography instead of hardcoded values.

2. **Component encapsulation**: Keep component-specific styles within their respective SCSS files.

3. **Import only what you need**: Only import the variables and mixins you actually use in each component.

4. **Mobile-first approach**: Design for mobile first, then enhance for larger screens using media queries.

5. **Semantic naming**: Use meaningful names for classes that describe their purpose, not their appearance.

6. **Avoid deep nesting**: Try to limit SCSS nesting to 3 levels deep to maintain readability and prevent specificity issues.

7. **Document complex styles**: Add comments to explain complex styling logic or workarounds.

8. **Limit utility classes**: While utility classes are convenient, excessive use can make HTML less readable and harder to maintain.

9. **Keep mixins focused**: Create mixins for reusable patterns, but keep them focused on a specific purpose.

10. **Maintain the documentation**: Update this documentation when adding new variables, mixins, or patterns.

## Extending the System

### Adding New Variables

When adding new variables, consider:
- Is this a one-off value or will it be reused?
- Does it fit within the existing design system?
- Can it be derived from existing variables?

Add new variables to `_variables.scss` in the appropriate section.

### Adding New Mixins

When creating new mixins:
- Keep them focused on a specific purpose
- Document parameters and usage
- Place them in `_mixins.scss` in a relevant section

### Adding New Utility Classes

When adding utility classes:
- Follow the naming pattern of existing utilities
- Consider if the utility will be used frequently
- Add them to `_utilities.scss` in the appropriate section

### Theming

For theme variations:
- Create a new file like `_theme-dark.scss` that overrides base variables
- Import the theme after variables but before other imports in specific components

## Troubleshooting

### "Variable not found" Errors

If you see an error about undefined variables:
1. Make sure you've imported `variables` at the top of your SCSS file
2. Check that the variable name is spelled correctly
3. Verify that the variable is defined in `_variables.scss`
4. Ensure that `angular.json` has the correct `includePaths` configuration

### Style Encapsulation Issues

If styles aren't being applied as expected due to Angular's view encapsulation:
1. Use the `:host` selector to target the component itself
2. Consider using `::ng-deep` for specific cases (use sparingly)
3. For truly global styles, add them to `styles.scss`
